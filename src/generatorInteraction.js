import * as THREE from 'three';
import { ComponentManager, FACILITY_REGISTRY, classifyFacilityComponent } from './componentManager.js';

/**
 * GeneratorInteractionManager
 * Handles cover opening animations and component group selection via raycasting
 */
export class GeneratorInteractionManager {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-999, -999);
    this.pointerActive = false;

    // Generators data structure
    this.generators = [];
    this.raycastTargets = [];
    this.meshToGeneratorMap = new Map();

    this.hoveredGenerator = null;
    this.activeInspectionRoot = null;
    this.lockedInspectionRoot = null;
    this.controllerBrowseRoot = null;
    this.controllerBrowseMotion = null;
    this.assemblyNames = new Map();
    this.objectMap = new Map();
    this.lastRaycastAt = 0;
    this.cachedIntersection = null;
    this.lastValidIntersectionTime = 0;
    this.hoverGracePeriodMs = 250; // Grace period hysteresis window (ms)

    this.componentManager = new ComponentManager(scene);

    // Bind event listeners
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    
    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerleave', this.onPointerLeave);
    this.domElement.addEventListener('click', this.onClick);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('digital-twin-select-name', (event) => this.selectByName(event.detail?.name));
  }

  onPointerMove(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointerActive = true;
  }

  onPointerLeave() {
    this.pointerActive = false;
    this.pointer.set(-999, -999);
    this.activeInspectionRoot = null;
  }

  getIntersection(force = false) {
    if (!this.pointerActive) return null;
    const now = performance.now();
    // A dense CAD export has millions of triangles. Sampling at 20fps is visually smooth,
    // but avoids stalling the renderer by raycasting every pointer event.
    if (!force && now - this.lastRaycastAt < 50) return this.cachedIntersection;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.cachedIntersection = this.raycaster.intersectObjects(this.raycastTargets, false)[0] || null;
    this.lastRaycastAt = now;
    return this.cachedIntersection;
  }

  onClick() {
    const intersection = this.getIntersection(true);
    this.selectIntersection(intersection);
  }

  selectIntersection(intersection) {
    if (!intersection) return;
    const root = intersection.object.userData?.componentRoot;
    const generator = this.meshToGeneratorMap.get(intersection.object);
    if (generator?.cover && root === generator.cover) {
      generator.shellOpenLocked = true;
      generator.cover.visible = false;
      this.lockedInspectionRoot = null;
      window.dispatchEvent(new CustomEvent('digital-twin-selection', { detail: { component: null, locked: false } }));
      return;
    }
    const selection = root || generator?.components.find(component => component.name.startsWith('EngineCore')) || null;
    if (!selection) return;

    this.clearControllerBrowse();
    this.lockedInspectionRoot = this.lockedInspectionRoot === selection ? null : selection;
    window.dispatchEvent(new CustomEvent('digital-twin-selection', {
      detail: { component: this.lockedInspectionRoot, locked: Boolean(this.lockedInspectionRoot) }
    }));
  }

  selectCentreTarget() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    this.selectIntersection(this.raycaster.intersectObjects(this.raycastTargets, false)[0] || null);
  }

  clearSelection() {
    this.clearControllerBrowse();
    this.lockedInspectionRoot = null;
    this.generators.forEach((gen) => { gen.shellOpenLocked = false; if (gen.cover) gen.cover.visible = true; });
    window.dispatchEvent(new CustomEvent('digital-twin-selection', { detail: { component: null, locked: false } }));
  }

  /**
   * Controller/keyboard browse mode. It previews a real 3D asset without entering the
   * expensive inspection state; confirmation is deliberately a separate action.
   */
  browseByName(name) {
    const root = this.objectMap.get(name);
    if (!root || root === this.controllerBrowseRoot) return;
    this.clearControllerBrowse();

    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const lift = Math.max(0.35, bounds.getSize(new THREE.Vector3()).length() * 0.055);
    const basePosition = root.position.clone();
    const baseWorldPosition = root.getWorldPosition(new THREE.Vector3());
    const raisedLocalPosition = root.parent.worldToLocal(baseWorldPosition.clone().add(new THREE.Vector3(0, lift, 0)));
    const baseScale = root.scale.clone();

    this.controllerBrowseRoot = root;
    this.controllerBrowseMotion = {
      root,
      basePosition,
      raisedPosition: raisedLocalPosition,
      baseScale,
      raisedScale: baseScale.clone().multiplyScalar(1.025),
      progress: 0
    };
    this.domElement.style.cursor = 'pointer';
  }

  clearControllerBrowse() {
    if (this.controllerBrowseMotion) {
      const { root, basePosition, baseScale } = this.controllerBrowseMotion;
      root.position.copy(basePosition);
      root.scale.copy(baseScale);
    }
    this.controllerBrowseRoot = null;
    this.controllerBrowseMotion = null;
  }

  onKeyDown(event) {
    if (event.key !== 'Escape') return;
    const hadOpenShell = this.generators.some((gen) => gen.shellOpenLocked);
    if (!this.lockedInspectionRoot && !hadOpenShell) return;
    this.clearSelection();
  }

  /**
   * Register generators & component sets from loaded model
   * @param {THREE.Object3D} model 
   */
  initGenerators(model) {
    this.generators = [];
    this.raycastTargets = [];
    this.meshToGeneratorMap.clear();

    // Initialize Component Registry, mesh tagging, and colored materials
    this.componentManager.initRegistry(model);

    // Map object nodes from model
    const objectMap = new Map();
    model.traverse((child) => {
      if (child.name) {
        objectMap.set(child.name, child);
      }
    });
    this.objectMap = objectMap;

    // Define generator component sets
    const generatorDefs = [
      {
        id: 'gen1',
        name: 'Generator 1',
        genNum: 1,
        coverName: 'GeneratorBox2', // GeneratorBox2 covers Generator 1
        componentNames: [
          'Frame', 'EngineCore', 'BearingSystem', 'LubricationSystem',
          'CoolingSystem', 'GeneratorSystem', 'FuelSystem', 'IntakeSystem',
          'ExhaustSystem', 'ControlSystem', 'ProtectiveFrame'
        ]
      },
      {
        id: 'gen2',
        name: 'Generator 2',
        genNum: 2,
        coverName: null, // Uncovered in OBJ model
        componentNames: [
          'Frame1', 'EngineCore1', 'BearingSystem1', 'LubricationSystem1',
          'CoolingSystem1', 'GeneratorSystem1', 'FuelSystem1', 'IntakeSystem1',
          'ExhaustSystem1', 'ControlSystem1', 'ProtectiveFrame1'
        ]
      },
      {
        id: 'gen3',
        name: 'Generator 3',
        genNum: 3,
        coverName: 'GeneratorBox1', // GeneratorBox1 covers Generator 3
        componentNames: [
          'Frame2', 'EngineCore2', 'BearingSystem2', 'LubricationSystem2',
          'CoolingSystem2', 'GeneratorSystem2', 'FuelSystem2', 'IntakeSystem2',
          'ExhaustSystem2', 'ControlSystem2', 'ProtectiveFrame2'
        ]
      }
    ];

    generatorDefs.forEach((def) => {
      const genObj = {
        id: def.id,
        name: def.name,
        genNum: def.genNum,
        cover: null,
        components: [],
        originalPosition: null,
        openPosition: null,
        currentProgress: 0.0,
        targetProgress: 0.0,
        isHovered: false
      };

      // Find cover object
      if (def.coverName && objectMap.has(def.coverName)) {
        const coverObj = objectMap.get(def.coverName);
        genObj.cover = coverObj;

        // Save original position in local space
        genObj.originalPosition = coverObj.position.clone();
        
        // Calculate opened position: lift cover straight UP along local Z axis (+5.5 units)
        genObj.openPosition = coverObj.position.clone().add(new THREE.Vector3(0, 0, 5.5));
      }

      // Collect component objects
      def.componentNames.forEach((cName) => {
        if (objectMap.has(cName)) {
          const compNode = objectMap.get(cName);
          genObj.components.push(compNode);
        }
      });

      // Pick proxies replace expensive per-triangle raycasts against dense CAD geometry.
      if (genObj.cover) this.registerPickProxy(genObj.cover, genObj);
      genObj.components.forEach((comp) => this.registerPickProxy(comp, genObj));

      this.generators.push(genObj);
    });

    // Register remaining plant equipment after generator meshes, so each mesh has one
    // stable raycast registration and its most specific subsystem identity.
    this.registerFacilityAssemblies(model);
    console.log(`✓ GeneratorInteractionManager initialized cleanly.`);
  }

  registerPickProxy(root, generator = null) {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    if (bounds.isEmpty()) return;
    const size = bounds.getSize(new THREE.Vector3()).max(new THREE.Vector3(0.08, 0.08, 0.08));
    const proxy = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    proxy.name = `${root.name}__pick_proxy`;
    proxy.position.copy(bounds.getCenter(new THREE.Vector3()));
    proxy.userData.componentRoot = root;
    proxy.userData.isPickProxy = true;
    root.attach(proxy); // retains world location and makes the proxy follow an exploded part
    this.raycastTargets.push(proxy);
    if (generator) this.meshToGeneratorMap.set(proxy, generator);
  }

  registerFacilityAssemblies(model) {
    const selectableNames = new Set(Object.keys(FACILITY_REGISTRY));
    const roots = new Set();
    model.traverse((child) => {
      if (selectableNames.has(child.name)) roots.add(child);
    });
    roots.forEach((root) => {
      this.assemblyNames.set(root, root.name);
      this.registerPickProxy(root);
    });
  }

  /**
   * Frame update called in main requestAnimationFrame loop
   * Handles generator cover hover opening and stable locked component inspection
   * @param {number} delta - Delta time in seconds
   */
  update(delta) {
    if (this.raycastTargets.length === 0) return;

    let newlyHoveredGen = null;
    let hitComponentRoot = null;
    const now = performance.now();

    if (this.pointerActive) {
      const intersection = this.getIntersection();
      const intersects = intersection ? [intersection] : [];

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        newlyHoveredGen = this.meshToGeneratorMap.get(hitMesh) || null;

        if (hitMesh.userData && hitMesh.userData.componentRoot) {
          hitComponentRoot = hitMesh.userData.componentRoot;
          this.lastValidIntersectionTime = now;

          // Lock onto newly intersected component
          if (this.activeInspectionRoot !== hitComponentRoot) {
            this.activeInspectionRoot = hitComponentRoot;
          }
        }
      } else {
        // Hysteresis window: Keep inspection target locked briefly if pointer remains on canvas
        if (this.activeInspectionRoot && (now - this.lastValidIntersectionTime < this.hoverGracePeriodMs)) {
          hitComponentRoot = this.activeInspectionRoot;
        } else {
          this.activeInspectionRoot = null;
          hitComponentRoot = null;
        }
      }
    } else {
      this.activeInspectionRoot = null;
      hitComponentRoot = null;
    }

    if (this.hoveredGenerator !== newlyHoveredGen) {
      this.hoveredGenerator = newlyHoveredGen;
      this.domElement.style.cursor = this.hoveredGenerator ? 'pointer' : 'default';
    }

    // Pass locked componentRoot to ComponentManager for 3D focus + 2D backdrop presentation
    // Preview is hover-only; the expensive explode/focus state is click-only. This removes
    // the flicker caused by raycasting across adjacent CAD triangles while orbiting.
    const inspectionRoot = this.lockedInspectionRoot;
    const previewRoot = !inspectionRoot && (this.controllerBrowseRoot || hitComponentRoot);
    this.componentManager.setFocusedComponent(inspectionRoot);
    if (!inspectionRoot && previewRoot && FACILITY_REGISTRY[previewRoot.name]) {
      this.componentManager.previewFacilityComponent(previewRoot);
    } else if (!inspectionRoot) {
      this.componentManager.clearFacilityPreview();
    }
    this.updateHoverLabel(inspectionRoot || previewRoot, Boolean(this.lockedInspectionRoot), intersection?.object);

    if (this.controllerBrowseMotion) {
      const motion = this.controllerBrowseMotion;
      motion.progress = Math.min(1, motion.progress + delta * 5.5);
      const eased = 1 - Math.pow(1 - motion.progress, 3);
      motion.root.position.lerpVectors(motion.basePosition, motion.raisedPosition, eased);
      motion.root.scale.lerpVectors(motion.baseScale, motion.raisedScale, eased);
    }

    // Animate cover positions
    this.generators.forEach((gen) => {
      const lockedGenerator = this.lockedInspectionRoot ? this.findGeneratorForRoot(this.lockedInspectionRoot) : null;
      gen.targetProgress = (gen.shellOpenLocked || gen === (lockedGenerator || this.hoveredGenerator)) ? 1.0 : 0.0;

      if (Math.abs(gen.currentProgress - gen.targetProgress) > 0.0001) {
        const speed = 6.0;
        gen.currentProgress += (gen.targetProgress - gen.currentProgress) * Math.min(1.0, delta * speed);

        if (Math.abs(gen.currentProgress - gen.targetProgress) < 0.001) {
          gen.currentProgress = gen.targetProgress;
        }

        if (gen.cover && gen.originalPosition && gen.openPosition) {
          if (gen.currentProgress === 0.0) {
            gen.cover.position.copy(gen.originalPosition);
          } else if (gen.currentProgress === 1.0) {
            gen.cover.position.copy(gen.openPosition);
          } else {
            gen.cover.position.lerpVectors(gen.originalPosition, gen.openPosition, gen.currentProgress);
          }
        }
      }
    });

    // Update component manager animation loop
    this.componentManager.update(delta);
  }

  findGeneratorForRoot(root) {
    return this.generators.find(gen => gen.components.includes(root)) || null;
  }

  selectByName(name) {
    const root = this.objectMap.get(name);
    if (!root) return;
    this.clearControllerBrowse();
    this.lockedInspectionRoot = root;
    window.dispatchEvent(new CustomEvent('digital-twin-selection', { detail: { component: root, locked: true } }));
  }

  updateHoverLabel(root, locked, hitMesh = null) {
    const label = document.getElementById('hover-label');
    if (!label) return;
    if (!root && !hitMesh) {
      label.classList.add('hidden');
      return;
    }
    const rawName = root?.userData?.componentName || root?.name || this.assemblyNames.get(hitMesh) || 'Facility Assembly';
    const registryEntry = FACILITY_REGISTRY[rawName];
    let title;
    if (registryEntry) {
      title = `${registryEntry.component} \u2014 ${registryEntry.machine}`;
    } else if (rawName === 'Facility Assembly') {
      title = rawName;
    } else {
      title = classifyFacilityComponent(rawName).title;
    }
    document.getElementById('hover-label-title').textContent = title;
    document.getElementById('hover-label-state').textContent = locked
      ? 'INSPECTION LOCKED'
      : (root === this.controllerBrowseRoot ? 'A / ENTER TO INSPECT' : 'CLICK TO INSPECT');
    label.classList.remove('hidden');
  }

  dispose() {
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerleave', this.onPointerLeave);
    this.domElement.removeEventListener('click', this.onClick);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}

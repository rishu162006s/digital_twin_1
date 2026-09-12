import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GeneratorInteractionManager } from './generatorInteraction.js';
import 'animejs/adapters/three';
import { engine } from 'animejs';

// Configure Anime.js engine loop to synchronize with Three.js requestAnimationFrame loop
try {
  engine.useDefaultMainLoop = false;
} catch (e) {}

// DOM Elements
const container = document.getElementById('app');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingStatus = document.getElementById('loading-status');
const progressBar = document.getElementById('progress-bar');
const errorOverlay = document.getElementById('error-overlay');
const errorMessage = document.getElementById('error-message');

document.querySelectorAll('[data-asset]').forEach((button) => {
  button.addEventListener('click', () => window.dispatchEvent(new CustomEvent('digital-twin-select-name', {
    detail: { name: button.dataset.asset }
  })));
});

// 1. Scene Setup - Premium Dark Industrial Digital Twin Atmosphere (#0B1120)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1120);
scene.fog = new THREE.FogExp2(0x0b1120, 0.0008);

// 2. Camera Setup
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(50, 50, 50);

// 3. Renderer Setup - Industrial High Quality & Shadow Mapping
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
// A full Fusion export is geometry-heavy. Cap supersampling modestly; visual quality stays
// crisp while avoiding an unnecessary 4× fragment workload on high-DPI laptop displays.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
// The CAD export has millions of triangles. Shadow-map submission multiplies that work
// and can leave some GPUs with a blank WebGL frame, so light the model cinematically
// without rendering every triangle again into a shadow texture.
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// 4. Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going below floor plane
controls.minDistance = 1;
controls.maxDistance = 5000;

// 5. Premium Industrial Digital Twin Lighting Setup
// Cool Blue Atmospheric Ambient & Hemisphere Lighting
const ambientLight = new THREE.AmbientLight(0x1e293b, 0.6);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.7);
hemiLight.position.set(0, 500, 0);
scene.add(hemiLight);

// Primary Directional Key Light (Soft Shadows & Surface Specular)
const mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
mainLight.position.set(300, 500, 400);
mainLight.castShadow = false;
scene.add(mainLight);

// Broad studio fill keeps selected metal/plastic surfaces dimensional during blueprint focus.
const inspectionFill = new THREE.DirectionalLight(0xffd6b0, 0.55);
inspectionFill.position.set(-180, 220, 120);
scene.add(inspectionFill);

// Deep Blue Rim & Accent Lighting (Creates crisp edge reflections on machine structure)
const rimLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
rimLight1.position.set(-300, 300, -300);
scene.add(rimLight1);

const rimLight2 = new THREE.DirectionalLight(0x0284c7, 0.9);
rimLight2.position.set(-200, -100, 300);
scene.add(rimLight2);

// Warm Industrial Facility Practical Lights (Warm/Cool Lighting Contrast)
const warmLight1 = new THREE.PointLight(0xfde047, 0.8, 400);
warmLight1.position.set(150, 100, -150);
scene.add(warmLight1);

const warmLight2 = new THREE.PointLight(0xf59e0b, 0.7, 400);
warmLight2.position.set(-150, 120, 150);
scene.add(warmLight2);

// Clock for smooth animations
const clock = new THREE.Clock();
let generatorInteractionManager = null;
let cameraFocus = null;
let homeCameraState = null;
let controllerConnected = false;
let controllerActionLatch = false;
let controllerNavigationLatch = false;
const controllerHint = document.getElementById('controller-hint');
const assetButtons = [...document.querySelectorAll('[data-asset]')];
let assetCursor = -1;

function setAssetCursor(index) {
  if (!assetButtons.length) return;
  assetCursor = (index + assetButtons.length) % assetButtons.length;
  assetButtons.forEach((button, buttonIndex) => button.classList.toggle('is-controller-active', buttonIndex === assetCursor));
  const activeButton = assetButtons[assetCursor];
  const assetGroup = activeButton.closest('details');
  if (assetGroup) assetGroup.open = true;
  activeButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  generatorInteractionManager?.browseByName(activeButton.dataset.asset);
}

function deadzone(value, zone = 0.16) {
  return Math.abs(value) < zone ? 0 : (value - Math.sign(value) * zone) / (1 - zone);
}

function updateGamepad(delta) {
  const gamepad = [...navigator.getGamepads()].find(Boolean);
  if (!gamepad) {
    if (controllerConnected) { controllerConnected = false; controllerHint.textContent = 'CONTROLLER: disconnected'; controllerHint.classList.remove('is-active'); }
    return;
  }
  if (!controllerConnected) { controllerConnected = true; controllerHint.textContent = 'CONTROLLER ACTIVE · D-PAD BROWSE · A INSPECT · B HOME'; controllerHint.classList.add('is-active'); }

  const leftX = deadzone(gamepad.axes[0] || 0), leftY = deadzone(gamepad.axes[1] || 0);
  const rightX = deadzone(gamepad.axes[2] || 0), rightY = deadzone(gamepad.axes[3] || 0);
  const target = controls.target;
  const offset = camera.position.clone().sub(target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  spherical.theta -= rightX * delta * 1.9;
  spherical.phi = THREE.MathUtils.clamp(spherical.phi - rightY * delta * 1.45, 0.08, Math.PI / 2 - 0.02);
  const zoomIn = gamepad.buttons[7]?.value || 0, zoomOut = gamepad.buttons[6]?.value || 0;
  spherical.radius = THREE.MathUtils.clamp(spherical.radius * (1 + (zoomOut - zoomIn) * delta * 2.2), controls.minDistance, controls.maxDistance);
  camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));

  // Pan moves along the view-aligned ground plane to keep facility navigation intuitive.
  if (leftX || leftY) {
    const forward = new THREE.Vector3().subVectors(target, camera.position).setY(0).normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const speed = Math.max(2, spherical.radius * 0.22) * delta;
    target.addScaledVector(right, leftX * speed).addScaledVector(forward, -leftY * speed);
    camera.position.addScaledVector(right, leftX * speed).addScaledVector(forward, -leftY * speed);
  }

  const dPadUp = gamepad.buttons[12]?.pressed;
  const dPadDown = gamepad.buttons[13]?.pressed;
  if ((dPadUp || dPadDown) && !controllerNavigationLatch) {
    setAssetCursor(assetCursor + (dPadDown ? 1 : -1));
  }
  controllerNavigationLatch = Boolean(dPadUp || dPadDown);

  const actionPressed = gamepad.buttons[0]?.pressed || gamepad.buttons[1]?.pressed || gamepad.buttons[9]?.pressed;
  if (actionPressed && !controllerActionLatch) {
    if (gamepad.buttons[0]?.pressed) {
      if (assetCursor >= 0) assetButtons[assetCursor]?.click();
      else generatorInteractionManager?.selectCentreTarget();
    }
    else generatorInteractionManager?.clearSelection();
  }
  controllerActionLatch = Boolean(actionPressed);
}

window.addEventListener('keydown', (event) => {
  if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) return;
  if (document.activeElement?.matches?.('input, textarea, select')) return;
  if (event.key === 'ArrowDown') setAssetCursor(assetCursor + 1);
  if (event.key === 'ArrowUp') setAssetCursor(assetCursor - 1);
  if (event.key === 'Enter' && assetCursor >= 0) assetButtons[assetCursor]?.click();
  event.preventDefault();
});

window.addEventListener('digital-twin-selection', (event) => {
  const chip = document.getElementById('selection-chip');
  const chipText = document.getElementById('selection-text');
  const { component, locked } = event.detail;
  if (!component || !locked) {
    chip.classList.remove('is-locked');
    chipText.textContent = 'INTERACTIVE MODEL READY';
    if (homeCameraState) {
      cameraFocus = {
        startPosition: camera.position.clone(),
        startTarget: controls.target.clone(),
        targetPosition: homeCameraState.position.clone(),
        target: homeCameraState.target.clone(),
        progress: 0
      };
    } else {
      cameraFocus = null;
    }
    return;
  }
  const title = component.userData?.componentName || component.name;
  chip.classList.add('is-locked');
  chipText.textContent = `${title.toUpperCase()} / INSPECTION LOCKED`;
  const box = new THREE.Box3().setFromObject(component);
  const target = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length() || 8;
  const direction = camera.position.clone().sub(controls.target).normalize();
  cameraFocus = {
    startPosition: camera.position.clone(), startTarget: controls.target.clone(), target,
    targetPosition: target.clone().add(direction.multiplyScalar(Math.max(size * 2.2, 12))), progress: 0
  };
});

// Helper to update progress UI
function updateProgress(percent, text) {
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (loadingStatus) loadingStatus.textContent = text;
}

// Helper to report error UI
function showError(msg, details) {
  console.error(`[CHP Digital Twin Error] ${msg}`, details || '');
  if (loadingOverlay) loadingOverlay.classList.add('hidden');
  if (errorOverlay) {
    errorOverlay.classList.remove('hidden');
    if (errorMessage) errorMessage.textContent = msg;
  }
}

// 6. Model Loading Pipeline
const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);
updateProgress(10, 'Loading compressed digital-twin model...');

gltfLoader.load(
  '/assets/models/DIGITAL_TWIN.glb',
  (gltf) => {
        const object = gltf.scene;
        console.log('✓ Compressed DIGITAL_TWIN scene loaded successfully.');
        updateProgress(90, 'Verifying model structure & scene graph...');

        // Orient model container so CAD Z-up matches Three.js Y-up
        object.rotation.x = -Math.PI / 2;

        // CAD exports are already triangulated. Render only their solid surfaces: a wireframe
        // overlay or double-sided rendering exposes every internal triangle and looks like a sketch.
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            // Let Three.js skip equipment outside the camera view. The old forced-off setting
            // drew the entire facility even during a close component inspection.
            child.frustumCulled = true;

            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => {
                  // Solid CAD presentation with GPU back-face culling; this approximately
                  // halves raster work compared with rendering both faces of every triangle.
                  m.side = THREE.FrontSide;
                  m.flatShading = false;
                  m.needsUpdate = true;
                });
              } else {
                child.material.side = THREE.FrontSide;
                child.material.flatShading = false;
                child.material.needsUpdate = true;
              }
            }

            // Dark metallic facility floor material for all 3 room structures. Fusion's export names
            // them inconsistently: "CHP" (water-treatment room), "CHP (1)" (generator room), and
            // "Body210" (antenna/data-center room - left as an anonymous body instead of a named part).
            if ((child.name === 'CHP' || child.name === 'CHP (1)' || child.name === 'Body210') && child.material) {
              const mat = child.material.clone ? child.material.clone() : child.material;
              mat.color = new THREE.Color(0x1e293b);
              mat.roughness = 0.38;
              mat.metalness = 0.45;
              child.material = mat;
            }

            // Glowing Blue Pipe Visual Style Upgrade
            if (child.name.startsWith('BluePipe') && child.material) {
              const mat = child.material.clone ? child.material.clone() : child.material;
              mat.color = new THREE.Color(0x1d4ed8);
              mat.emissive = new THREE.Color(0x1e40af);
              mat.emissiveIntensity = 0.30;
              mat.metalness = 0.65;
              mat.roughness = 0.25;
              child.material = mat;
            }

            // Red Pipe Style Upgrade
            if (child.name.startsWith('RedPipe') && child.material) {
              const mat = child.material.clone ? child.material.clone() : child.material;
              mat.color = new THREE.Color(0xef4444);
              mat.emissive = new THREE.Color(0x991b1b);
              mat.emissiveIntensity = 0.20;
              mat.metalness = 0.60;
              mat.roughness = 0.30;
              child.material = mat;
            }

            // Yellow / Bronze Pressurized Pipe Style Upgrade
            if (child.name.startsWith('BronzePipe') && child.material) {
              const mat = child.material.clone ? child.material.clone() : child.material;
              mat.color = new THREE.Color(0xf59e0b);
              mat.emissive = new THREE.Color(0xb45309);
              mat.emissiveIntensity = 0.20;
              mat.metalness = 0.65;
              mat.roughness = 0.25;
              child.material = mat;
            }

          }
        });

        // Add model to scene without altering component hierarchy or geometry
        scene.add(object);

        // 7. Industrial Wall-Mounted Practical Light Fixtures (Reference Warm/Amber Floor Pools & Wall Washing)
        const wallLightGroup = new THREE.Group();
        wallLightGroup.name = 'IndustrialWallLights';

        // Horizontal rectangular industrial fixture casing
        const casingGeo = new THREE.BoxGeometry(0.90, 0.45, 0.20);
        const casingMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          metalness: 0.85,
          roughness: 0.25
        });

        // Bright warm golden/amber luminous front panel
        const lensGeo = new THREE.BoxGeometry(0.78, 0.32, 0.10);
        const lensMat = new THREE.MeshStandardMaterial({
          color: 0xffb703,
          emissive: new THREE.Color(0xff9e00),
          emissiveIntensity: 5.0,
          metalness: 0.10,
          roughness: 0.15
        });

        const createWallFixture = (x, y, z, rotY, outVector) => {
          const fixture = new THREE.Group();
          fixture.position.set(x, y, z);
          fixture.rotation.y = rotY;

          const casing = new THREE.Mesh(casingGeo, casingMat);
          const lens = new THREE.Mesh(lensGeo, lensMat);
          lens.position.z = 0.08;
          fixture.add(casing);
          fixture.add(lens);

          // 1. Localized wall wash PointLight right at the fixture face
          const wallWashLight = new THREE.PointLight(0xffb703, 4.0, 16.0);
          wallWashLight.position.set(0, 0, 0.25);
          wallWashLight.castShadow = false;
          fixture.add(wallWashLight);

          // 2. High-intensity SpotLight positioned in front of fixture, targeted downward & inward onto the floor plane
          const spotLight = new THREE.SpotLight(0xffa200, 16.0, 48.0, Math.PI / 2.3, 0.65, 1.0);
          // Position light source 0.65 units out from the wall face
          const lightPosX = x + outVector.x * 0.65;
          const lightPosZ = z + outVector.z * 0.65;
          spotLight.position.set(lightPosX, y - 0.2, lightPosZ);

          // Target point on the floor plane 1.80 units into the room from the wall
          const targetPosX = x + outVector.x * 1.80;
          const targetPosZ = z + outVector.z * 1.80;
          spotLight.target.position.set(targetPosX, 0, targetPosZ);
          spotLight.castShadow = false; // Performance friendly

          scene.add(spotLight.target);
          scene.add(spotLight);

          return fixture;
        };

        // Regularly spaced wall-mounted practical light fixtures along enclosure walls (Matching Reference Layout)
        const fixturePositions = [
          // Rear Wall (X = -24.2, facing +X into room)
          { x: -24.2, y: 4.2, z: -9.0, rotY: Math.PI / 2, outVec: { x: 1, z: 0 } },
          { x: -24.2, y: 4.2, z: 0.0, rotY: Math.PI / 2, outVec: { x: 1, z: 0 } },
          { x: -24.2, y: 4.2, z: 9.0, rotY: Math.PI / 2, outVec: { x: 1, z: 0 } },

          // Left Wall (Z = -14.2, facing +Z into room)
          { x: -18.0, y: 4.2, z: -14.2, rotY: 0, outVec: { x: 0, z: 1 } },
          { x: -10.0, y: 4.2, z: -14.2, rotY: 0, outVec: { x: 0, z: 1 } },
          { x: -2.0, y: 4.2, z: -14.2, rotY: 0, outVec: { x: 0, z: 1 } },

          // Right Wall (Z = 14.2, facing -Z into room)
          { x: -18.0, y: 4.2, z: 14.2, rotY: Math.PI, outVec: { x: 0, z: -1 } },
          { x: -10.0, y: 4.2, z: 14.2, rotY: Math.PI, outVec: { x: 0, z: -1 } },
          { x: -2.0, y: 4.2, z: 14.2, rotY: Math.PI, outVec: { x: 0, z: -1 } },

          // Front Wall (X = 4.2, facing -X into room)
          { x: 4.2, y: 4.2, z: 0.0, rotY: -Math.PI / 2, outVec: { x: -1, z: 0 } }
        ];

        fixturePositions.forEach(pos => {
          const fix = createWallFixture(pos.x, pos.y, pos.z, pos.rotY, pos.outVec);
          wallLightGroup.add(fix);
        });

        scene.add(wallLightGroup);

        // Update matrix world to calculate accurate world bounding box after rotation
        object.updateMatrixWorld(true);

        // 7b. Extend the generator room's warm wall-wash lighting into the other two facility rooms.
        // Fusion's room shells: "CHP (1)" is the generator room (already lit by the hand-placed
        // fixtures above); "CHP" is the water-treatment room and "Body210" is the antenna/data-center
        // room (left as an anonymous body name instead of a proper component) - both were dark.
        // Fixtures are spaced around each shell's actual bounding box rather than hand-placed
        // coordinates, since we don't have hand-tuned positions for these rooms.
        const extraWallLightGroup = new THREE.Group();
        extraWallLightGroup.name = 'IndustrialWallLightsExtended';

        ['CHP', 'Body210'].forEach((shellName) => {
          const roomShell = object.getObjectByName(shellName);
          if (!roomShell) return;

          const roomBox = new THREE.Box3().setFromObject(roomShell);
          const minX = roomBox.min.x, maxX = roomBox.max.x;
          const minZ = roomBox.min.z, maxZ = roomBox.max.z;
          const fixtureY = roomBox.min.y + 4.2; // Same fixture height above floor as the CHP room
          const spacing = 8.0;                  // Match CHP room fixture spacing
          const inset = 0.8;                    // Pull fixtures slightly in from the exact wall edge

          const addFixturesAlongWall = (fixedIsX, fixedValue, rangeStart, rangeEnd, rotY, outVec) => {
            const span = Math.max(0.001, rangeEnd - rangeStart);
            const count = Math.max(1, Math.round(span / spacing) + 1);
            for (let i = 0; i < count; i++) {
              const t = count === 1 ? 0.5 : i / (count - 1);
              const along = rangeStart + t * span;
              const x = fixedIsX ? fixedValue : along;
              const z = fixedIsX ? along : fixedValue;
              const fix = createWallFixture(x, fixtureY, z, rotY, outVec);
              extraWallLightGroup.add(fix);
            }
          };

          addFixturesAlongWall(true, minX + inset, minZ, maxZ, Math.PI / 2, { x: 1, z: 0 });    // West wall
          addFixturesAlongWall(true, maxX - inset, minZ, maxZ, -Math.PI / 2, { x: -1, z: 0 });  // East wall
          addFixturesAlongWall(false, minZ + inset, minX, maxX, 0, { x: 0, z: 1 });             // South wall
          addFixturesAlongWall(false, maxZ - inset, minX, maxX, Math.PI, { x: 0, z: -1 });      // North wall
        });

        scene.add(extraWallLightGroup);

        // Initialize Generator Interaction Manager & Component System
        generatorInteractionManager = new GeneratorInteractionManager(scene, camera, renderer.domElement);
        generatorInteractionManager.initGenerators(object);

        // Elevated top-down / isometric engineering perspective framing
        const boundingBox = new THREE.Box3().setFromObject(object);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.08;

        // Position camera at ~55 degree downward elevated isometric viewing angle
        camera.position.set(
          center.x + cameraDistance * 0.58,
          center.y + cameraDistance * 0.72,
          center.z + cameraDistance * 0.58
        );
        camera.near = maxDim / 1000;
        camera.far = maxDim * 100;
        camera.updateProjectionMatrix();

        controls.target.copy(center);
        controls.update();
        homeCameraState = { position: camera.position.clone(), target: controls.target.clone() };


        updateProgress(100, 'Render complete!');

        // Hide loading overlay after short fade
        setTimeout(() => {
          if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }, 500);
      },
      (xhr) => {
        if (xhr.lengthComputable && xhr.total > 0) {
          const percent = Math.min(90, Math.round(10 + (xhr.loaded / xhr.total) * 80));
          const loadedMB = (xhr.loaded / (1024 * 1024)).toFixed(1);
          const totalMB = (xhr.total / (1024 * 1024)).toFixed(1);
          updateProgress(percent, `Loading compressed model (${loadedMB} MB / ${totalMB} MB)...`);
        }
      },
      (error) => {
        showError('Failed to load the compressed DIGITAL_TWIN.glb file.', error);
      }
);

// 7. Window Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 8. Animation Loop
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Interaction must never be able to stop the renderer. CAD meshes can have missing
  // descendants while they are first registered, so isolate its update from the frame draw.
  if (generatorInteractionManager) {
    try {
      generatorInteractionManager.update(delta);
    } catch (error) {
      console.warn('Digital-twin interaction update paused for this frame.', error);
    }
  }

  updateGamepad(delta);

  controls.update();

  if (cameraFocus) {
    cameraFocus.progress = Math.min(1, cameraFocus.progress + delta * 1.8);
    const eased = 1 - Math.pow(1 - cameraFocus.progress, 3);
    camera.position.lerpVectors(cameraFocus.startPosition, cameraFocus.targetPosition, eased);
    controls.target.lerpVectors(cameraFocus.startTarget, cameraFocus.target, eased);
    if (cameraFocus.progress === 1) cameraFocus = null;
  }

  // Synchronize Anime.js engine frame update before rendering
  try {
    engine.update();
  } catch (e) {}

  renderer.render(scene, camera);
}

animate();

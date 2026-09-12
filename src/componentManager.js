import * as THREE from 'three';
import { SensorManager } from './sensorData.js';
import { ConditionAnalyzer } from './conditionAnalyzer.js';
import { AnimationManager } from './animationManager.js';
import { AnimeAnimationManager } from './animeAnimations.js';

export const COMPONENT_GROUPS = {
  generator1: [
    'Frame', 'EngineCore', 'BearingSystem', 'LubricationSystem', 'CoolingSystem',
    'GeneratorSystem', 'FuelSystem', 'IntakeSystem', 'ExhaustSystem', 'ControlSystem', 'ProtectiveFrame'
  ],
  generator2: [
    'Frame1', 'EngineCore1', 'BearingSystem1', 'LubricationSystem1', 'CoolingSystem1',
    'GeneratorSystem1', 'FuelSystem1', 'IntakeSystem1', 'ExhaustSystem1', 'ControlSystem1', 'ProtectiveFrame1'
  ],
  generator3: [
    'Frame2', 'EngineCore2', 'BearingSystem2', 'LubricationSystem2', 'CoolingSystem2',
    'GeneratorSystem2', 'FuelSystem2', 'IntakeSystem2', 'ExhaustSystem2', 'ControlSystem2', 'ProtectiveFrame2'
  ]
};

export const COMPONENT_BASE_COLORS = {
  'Engine Core':        { color: 0x3b82f6, metalness: 0.25, roughness: 0.35, emissive: 0x1d4ed8, emissiveIntensity: 0.10 }, // Bright Blue
  'Bearing System':     { color: 0xf97316, metalness: 0.35, roughness: 0.30, emissive: 0xc2410c, emissiveIntensity: 0.10 }, // Bright Copper / Orange
  'Lubrication System': { color: 0x10b981, metalness: 0.25, roughness: 0.35, emissive: 0x047857, emissiveIntensity: 0.10 }, // Bright Green
  'Cooling System':     { color: 0x06b6d4, metalness: 0.25, roughness: 0.35, emissive: 0x0e7490, emissiveIntensity: 0.10 }, // Bright Cyan / Teal
  'Generator System':   { color: 0xef4444, metalness: 0.25, roughness: 0.35, emissive: 0xb91c1c, emissiveIntensity: 0.10 }, // Bright Red
  'Fuel System':        { color: 0xf59e0b, metalness: 0.25, roughness: 0.35, emissive: 0xb45309, emissiveIntensity: 0.10 }, // Bright Yellow / Orange
  'Intake System':      { color: 0x8b5cf6, metalness: 0.25, roughness: 0.35, emissive: 0x6d28d9, emissiveIntensity: 0.10 }, // Bright Purple
  'Exhaust System':     { color: 0x6b7280, metalness: 0.40, roughness: 0.40, emissive: 0x374151, emissiveIntensity: 0.08 }, // Medium / Dark Gray
  'Control System':     { color: 0xe5e7eb, metalness: 0.50, roughness: 0.30, emissive: 0x9ca3af, emissiveIntensity: 0.08 }, // Light Silver
  'Frame':              { color: 0x4b5563, metalness: 0.50, roughness: 0.40, emissive: 0x1f2937, emissiveIntensity: 0.08 }, // Dark Steel
  'Protective Frame':   { color: 0x64748b, metalness: 0.40, roughness: 0.40, emissive: 0x334155, emissiveIntensity: 0.08 }  // Medium-Dark Gray
};

export const COMPONENT_DESCRIPTIONS = {
  'Engine Core':        'Drives the primary mechanical operation of the generator and provides the core power-producing motion.',
  'Bearing System':     'Supports rotating shafts and reduces friction, enabling smooth and reliable mechanical operation.',
  'Lubrication System': 'Supplies oil to critical moving components to reduce friction, wear, and operating temperature.',
  'Cooling System':     'Removes excess heat from the generator assembly to maintain safe and efficient operating temperatures.',
  'Generator System':   'Converts mechanical rotation into electrical power for the connected generation system.',
  'Fuel System':        'Controls fuel delivery to the engine to maintain stable and efficient generator operation.',
  'Intake System':      'Supplies the engine with the required air for efficient combustion and continuous operation.',
  'Exhaust System':     'Routes combustion gases away from the engine while supporting controlled exhaust flow.',
  'Control System':     'Monitors and regulates generator operation through control, electrical, and operating parameters.',
  'Frame':              'Provides the primary structural support for the generator assembly and its mounted components.',
  'Protective Frame':   'Provides external protection for critical generator components while maintaining structural support.'
};

// --- Explicit asset registry (matches the "Water & Life Support" / "Logistics & Mechanical Drives"
// tables) ---  Generic name-guessing can't recover this taxonomy since the CAD export doesn't use
// these words, so every part below is mapped by its real Fusion group name.
export const FACILITY_REGISTRY = {
  // 2. Water & Life Support
  'WaterPump':                   { machine: 'Freshwater Lake Pump',        component: 'Pump' },
  'ElectricMotor':               { machine: 'Freshwater Lake Pump',        component: 'Motor' },
  'FlexibleCoupling':            { machine: 'Freshwater Lake Pump',        component: 'Bearing' },
  'HighPressureFeedPump':        { machine: 'RO Filtration System',        component: 'Feed Pump' },
  'FeedPumpAndMotor':            { machine: 'RO Filtration System',        component: 'Feed Pump' },
  'ROMembraneBank':              { machine: 'RO Filtration System',        component: 'RO Membrane' },
  'ROMembraneBank (1)':          { machine: 'RO Filtration System',        component: 'RO Membrane' },
  'MembraneEndFittings':         { machine: 'RO Filtration System',        component: 'RO Membrane' },
  'PreFilterBank':               { machine: 'RO Filtration System',        component: 'Pre-filter' },
  'PrimaryFilter':               { machine: 'RO Filtration System',        component: 'Pre-filter' },
  'FeedSuctionPiping':           { machine: 'RO Filtration System',        component: 'Valves' },
  'FilterPiping':                { machine: 'RO Filtration System',        component: 'Valves' },
  'PermeateProductLoop':         { machine: 'RO Filtration System',        component: 'Valves' },
  'CIPChemicalLoop':             { machine: 'RO Filtration System',        component: 'Valves' },
  'ConnectedPiping':             { machine: 'RO Filtration System',        component: 'Valves' },
  'FittingsAndInstrumentation':  { machine: 'RO Filtration System',        component: 'Valves' },
  'SkidFrame':                   { machine: 'RO Filtration System',        component: 'Valves' },
  'SkidFrame (1)':               { machine: 'RO Filtration System',        component: 'Valves' },
  'BaseFrame':                   { machine: 'RO Filtration System',        component: 'Valves' },
  'ProcessDischargeLoop':        { machine: 'Wastewater Recycling System', component: 'Feed Pump' },
  'RejectConcentrateLoop':       { machine: 'Wastewater Recycling System', component: 'Filter' },
  'InstrumentationAndDrain':     { machine: 'Wastewater Recycling System', component: 'Valves' },
  'InstrumentationDrainNetwork': { machine: 'Wastewater Recycling System', component: 'Valves' },

  // 3. Data & Communications
  'Data+Center.obj':             { machine: 'Data & Communications Room',  component: 'Data Center Rack' },
  'Data+Center.obj (1)':         { machine: 'Data & Communications Room',  component: 'Data Center Rack' },
  'Box01':                       { machine: 'Data & Communications Room',  component: 'Network Cabinet' },
  'Box02':                       { machine: 'Data & Communications Room',  component: 'Network Cabinet' },
  'LNB':                         { machine: 'Satellite Communications',    component: 'Low Noise Block' },
  'GeoSphere02':                 { machine: 'Satellite Communications',    component: 'Antenna Reflector' },
  'Sphere01':                    { machine: 'Satellite Communications',    component: 'Antenna Pedestal' },
  'Sphere02':                    { machine: 'Satellite Communications',    component: 'Antenna Pedestal' },
  'Cylinder01':                  { machine: 'Satellite Communications',    component: 'Antenna Pedestal' },
  'Cylinder03':                  { machine: 'Satellite Communications',    component: 'Communications Module' },
  'Cylinder04':                  { machine: 'Satellite Communications',    component: 'Communications Module' },
  'Hedra01':                     { machine: 'Satellite Communications',    component: 'RF Module' },
  'Hedra02':                     { machine: 'Satellite Communications',    component: 'RF Module' },
  'ControlCabinet':              { machine: 'Data & Communications Room',  component: 'Control Cabinet' },
  'ControlCabinet (1)':          { machine: 'Data & Communications Room',  component: 'Control Cabinet' },

  // 4. Logistics / Mechanical Drives
  'AzimuthDrive':     { machine: 'Antenna Positioning System', component: 'Azimuth Drive' },
  'ElevationDrive':   { machine: 'Antenna Positioning System', component: 'Elevation Drive' },
  'Gearbox':          { machine: 'Antenna Positioning System', component: 'Gearbox' },
  'DriveMotor':       { machine: 'Antenna Positioning System', component: 'Drive Motor' },
  'EBox (1)':         { machine: 'Antenna Positioning System', component: 'Control Cabinet' }
};

// Sensor telemetry template each registry component role should use (see SENSOR_TEMPLATES in sensorData.js)
export const FACILITY_SENSOR_TEMPLATE_BY_COMPONENT = {
  'Pump': 'Pump System',
  'Motor': 'Pump System',
  'Bearing': 'Pump System',
  'Feed Pump': 'Pump System',
  'RO Membrane': 'Filtration System',
  'Pre-filter': 'Filtration System',
  'Filter': 'Filtration System',
  'Valves': 'Piping / Valve Network',
  'Azimuth Drive': 'Positioning Drive',
  'Elevation Drive': 'Positioning Drive',
  'Gearbox': 'Positioning Drive',
  'Drive Motor': 'Positioning Drive'
};

export const FACILITY_COMPONENT_DESCRIPTIONS = {
  'Pump': 'Draws raw water from the freshwater lake source into the facility water system.',
  'Feed Pump': 'Pressurizes and delivers incoming water to the next treatment stage.',
  'RO Membrane': 'Removes dissolved salts and impurities from feed water through reverse osmosis.',
  'Pre-filter': 'Removes sediment and larger particulates before water reaches the finer treatment stages.',
  'Filter': 'Removes solids and contaminants from the wastewater stream before recycling.',
  'Valves': 'Regulates and directs fluid flow through the connected piping loop.',
  'Motor': 'Provides rotational power to keep the freshwater pump operating at its required flow and pressure.',
  'Bearing': 'Supports the pump shaft and reduces friction between rotating mechanical assemblies.',
  'Data Center Rack': 'Houses network, compute, and communications equipment for the facility control environment.',
  'Network Cabinet': 'Provides protected mounting and distribution for data-network equipment and field connections.',
  'Control Cabinet': 'Provides protected local control, distribution, and monitoring for the connected room equipment.',
  'Low Noise Block': 'Amplifies and frequency-converts the received satellite signal for reliable communications.',
  'Antenna Reflector': 'Focuses the RF signal between the satellite link and the communications feed assembly.',
  'Antenna Pedestal': 'Provides the structural pivot and support for the satellite communications assembly.',
  'Communications Module': 'Supports signal routing and equipment interfacing within the satellite communications system.',
  'RF Module': 'Processes the facility radio-frequency communications signal path.',
  'Azimuth Drive': 'Rotates the antenna assembly horizontally for positioning and tracking.',
  'Elevation Drive': 'Tilts the antenna assembly vertically for positioning and tracking.',
  'Gearbox': 'Transmits and reduces motor speed into precise antenna positioning torque.',
  'Drive Motor': 'Provides the rotational power for antenna positioning drives.'
};

// --- Facility / auxiliary equipment classification (everything outside the 3 generator subsystems) ---
// Turns a raw OBJ group name (e.g. "BluePipe1", "ROMembraneBank", "Body110") into a readable
// title + category so every part in the model gets a sensible hover/inspection label.
function humanizeRawName(rawName) {
  let clean = rawName
    .replace(/\s*\(\d+\)/g, '')      // strip Fusion duplicate-export suffixes: "(1)", "(2)"...
    .replace(/\.obj$/i, '')
    .replace(/[+_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d+)$/, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length ? clean : rawName;
}

export function classifyFacilityComponent(rawName) {
  const title = humanizeRawName(rawName);
  if (/Pipe|Piping|Loop$/i.test(rawName)) return { title, category: 'Piping System' };
  if (/^(EBox|ControlCabinet)/i.test(rawName) || /Control/i.test(rawName)) return { title, category: 'Electrical & Control' };
  if (/^GeneratorBox/i.test(rawName)) return { title, category: 'Protective Enclosure' };
  if (/(Drive|Motor|Gearbox|Coupling)/i.test(rawName)) return { title, category: 'Positioning / Drive System' };
  if (/(Membrane|Filter|Pump|Chemical|Feed|Discharge|Concentrate|Permeate)/i.test(rawName)) return { title, category: 'Water Treatment Equipment' };
  if (/LNB|Dish|Sphere|Hedra|Cylinder/i.test(rawName)) return { title, category: 'Antenna / Sensor Assembly' };
  if (/^(Support|SkidFrame|BaseFrame)/i.test(rawName) || /^Body\d+$/i.test(rawName)) return { title, category: 'Structural Support' };
  return { title, category: 'Facility Component' };
}

export const FACILITY_DESCRIPTIONS = {
  'Piping System': 'Carries fluid or gas between connected equipment as part of the facility\u2019s process piping network.',
  'Electrical & Control': 'Houses electrical distribution or control equipment supporting facility operations.',
  'Protective Enclosure': 'Encloses and protects the generator assembly from the surrounding environment.',
  'Positioning / Drive System': 'Drives mechanical positioning or rotational motion for the connected assembly.',
  'Water Treatment Equipment': 'Part of the facility\u2019s water treatment / reverse-osmosis processing skid.',
  'Antenna / Sensor Assembly': 'Component of the facility\u2019s antenna or sensor assembly.',
  'Structural Support': 'Provides structural support for adjacent equipment and piping runs.',
  'Facility Component': 'General facility equipment supporting overall plant operation.'
};

export class ComponentManager {
  constructor(scene) {
    this.scene = scene;

    this.componentRegistry = {
      generator1: new Map(),
      generator2: new Map(),
      generator3: new Map()
    };

    this.componentsData = new Map(); // rawName -> compData
    this.allComponentMeshes = [];
    this.sceneMeshes = [];
    this.focusedComponentData = null;
    this.facilityHighlightRoot = null; // currently hover/click-highlighted non-generator part
    this.facilitySelectedRoot = null;
    this.animationManager = new AnimationManager();
    this.animeAnimationManager = new AnimeAnimationManager();
    this.sensorManager = new SensorManager();
    this.conditionAnalyzer = new ConditionAnalyzer(this.sensorManager);

    // DOM Elements for Sensor Panel & HUD
    this.sensorPanel = document.getElementById('sensor-panel');
    this.sensorTitle = document.getElementById('sensor-title');
    this.sensorSubtitle = document.getElementById('sensor-subtitle');
    this.sensorStatusText = document.getElementById('sensor-status-text');
    this.statusDot = document.getElementById('status-dot');
    this.sensorMetrics = document.getElementById('sensor-metrics');

    // Phase 6 Predictive Maintenance HUD Elements
    this.systemHealthText = document.getElementById('system-health-text');
    this.systemHealthDot = document.getElementById('system-health-dot');
    this.healthScoreVal = document.getElementById('health-score-val');
    this.healthBarFill = document.getElementById('health-bar-fill');
    this.conditionStateVal = document.getElementById('condition-state-val');
    this.rulVal = document.getElementById('rul-val');
    this.insightText = document.getElementById('insight-text');

    // Floating Bottom-Left Description Card HUD Elements
    this.descriptionCard = document.getElementById('description-card');
    this.descriptionTitle = document.getElementById('description-title');
    this.descriptionSubtitle = document.getElementById('description-subtitle');
    this.descriptionText = document.getElementById('description-text');

    // Global developer helper function for anomaly injection testing (AC-24, AC-25)
    window.triggerTestAnomaly = (target, level = 'WARNING') => {
      const rawName = (typeof target === 'string') ? target : (target?.userData?.rawName || target?.name || 'EngineCore');
      this.conditionAnalyzer.injectTestAnomaly(rawName, level);
      console.log(`[Phase 6 Test Anomaly] Injected '${level}' on component '${rawName}'`);
    };
  }

  static getCanonicalName(rawName) {
    if (!rawName) return 'Unknown Component';
    if (rawName.startsWith('EngineCore')) return 'Engine Core';
    if (rawName.startsWith('BearingSystem')) return 'Bearing System';
    if (rawName.startsWith('CoolingSystem')) return 'Cooling System';
    if (rawName.startsWith('LubricationSystem')) return 'Lubrication System';
    if (rawName.startsWith('GeneratorSystem')) return 'Generator System';
    if (rawName.startsWith('FuelSystem')) return 'Fuel System';
    if (rawName.startsWith('IntakeSystem')) return 'Intake System';
    if (rawName.startsWith('ExhaustSystem')) return 'Exhaust System';
    if (rawName.startsWith('ControlSystem')) return 'Control System';
    if (rawName.startsWith('ProtectiveFrame')) return 'Protective Frame';
    if (rawName.startsWith('Frame')) return 'Frame';
    return rawName;
  }

  static getGeneratorNumber(rawName) {
    if (!rawName) return 1;
    if (rawName.endsWith('2')) return 3;
    if (rawName.endsWith('1')) return 2;
    return 1;
  }

  /**
   * Traverse loaded OBJ model ONCE after loading:
   * 1. Register exact component group Object3Ds
   * 2. Set up pivot groups for centered component rotation & movement
   * 3. Tag every descendant mesh with userData references
   * 4. Apply dedicated independent MeshStandardMaterial per component mesh
   * @param {THREE.Object3D} model 
   */
  initRegistry(model) {
    this.componentRegistry.generator1.clear();
    this.componentRegistry.generator2.clear();
    this.componentRegistry.generator3.clear();
    this.componentsData.clear();
    this.allComponentMeshes = [];
    this.sceneMeshes = [];
    this.focusedComponentData = null;

    const objectMap = new Map();
    model.traverse((child) => {
      if (child.name) {
        objectMap.set(child.name, child);
      }
    });

    const registerGen = (genKey, genNum, groupNames) => {
      groupNames.forEach((rawName) => {
        if (objectMap.has(rawName)) {
          const groupObj = objectMap.get(rawName);
          const canonicalName = ComponentManager.getCanonicalName(rawName);
          const colorConfig = COMPONENT_BASE_COLORS[canonicalName];

          this.componentRegistry[genKey].set(rawName, groupObj);

          // Calculate bounding box center for pivot setup
          groupObj.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(groupObj);
          const center = box.getCenter(new THREE.Vector3());

          // Create the pivot at the component's world-space centre, expressed in the
          // parent's local space. The imported CAD model is rotated Z-up -> Y-up before
          // this runs; copying the world coordinate directly into a local position moves
          // the whole assembly off-scene and makes the camera frame empty space.
          const parent = groupObj.parent || model;
          const pivot = new THREE.Group();
          pivot.name = `${rawName}_pivot`;
          pivot.position.copy(parent.worldToLocal(center.clone()));
          parent.add(pivot);

          // Re-parent while preserving its world transform (including the CAD axis rotation).
          pivot.attach(groupObj);

          // Original position and elevated target position (+1.0 along local Z axis)
          const origPos = pivot.position.clone();
          const openPos = origPos.clone().add(new THREE.Vector3(0, 0, 1.0));

          const compData = {
            group: groupObj,
            pivot,
            rawName,
            canonicalName,
            generatorNumber: genNum,
            generatorName: `Generator ${genNum}`,
            originalPosition: origPos,
            openPosition: openPos,
            currentProgress: 0.0,
            targetProgress: 0.0
          };

          this.componentsData.set(rawName, compData);

          // Bind metadata directly to descendant meshes & apply dedicated MeshStandardMaterial
          groupObj.traverse((child) => {
            if (child.isMesh) {
              child.userData.componentRoot = groupObj;
              child.userData.componentName = canonicalName;
              child.userData.generatorNumber = genNum;
              child.userData.rawName = rawName;

              // Instantiate dedicated, independent MeshStandardMaterial per component mesh
              if (colorConfig) {
                const compMat = new THREE.MeshStandardMaterial({
                  color: new THREE.Color(colorConfig.color),
                  metalness: colorConfig.metalness,
                  roughness: colorConfig.roughness,
                  emissive: new THREE.Color(colorConfig.emissive),
                  emissiveIntensity: colorConfig.emissiveIntensity,
                  side: THREE.DoubleSide
                });
                child.material = compMat;
                child.userData.baseColor = colorConfig.color;
                child.userData.baseMetalness = colorConfig.metalness;
                child.userData.baseRoughness = colorConfig.roughness;
                child.userData.baseEmissive = colorConfig.emissive;
                child.userData.baseEmissiveIntensity = colorConfig.emissiveIntensity;
                child.userData.componentMaterialFixed = true;
              }

              this.allComponentMeshes.push(child);
            }
          });
        }
      });
    };

    registerGen('generator1', 1, COMPONENT_GROUPS.generator1);
    registerGen('generator2', 2, COMPONENT_GROUPS.generator2);
    registerGen('generator3', 3, COMPONENT_GROUPS.generator3);

    // Give named water-treatment and data/communications assets their own industrial palette.
    // This is deliberately applied only to documented assemblies, never anonymous Body### CAD pieces.
    Object.entries(FACILITY_REGISTRY).forEach(([rawName, info]) => {
      const root = objectMap.get(rawName);
      if (!root) return;
      const tone = this.getFacilityTone(info.machine, info.component);
      root.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const base = Array.isArray(child.material) ? child.material[0] : child.material;
        const material = new THREE.MeshStandardMaterial({
          color: tone.color, emissive: tone.emissive, emissiveIntensity: tone.intensity,
          metalness: tone.metalness, roughness: tone.roughness, side: THREE.DoubleSide
        });
        child.material = material;
        child.userData.facilityStyledMaterial = material;
        child.userData.componentRoot = root;
        child.userData.componentName = info.component;
        child.userData.rawName = rawName;
      });
    });

    // Pre-seed telemetry for the explicit Water/Life-Support & Drive asset registry so their
    // sensor panel shows sensible metrics (flow, pressure, torque, etc.) instead of generic defaults.
    const facilityEntries = Object.entries(FACILITY_REGISTRY).map(([rawName, info]) => ({
      rawName,
      canonicalName: FACILITY_SENSOR_TEMPLATE_BY_COMPONENT[info.component] || 'Frame'
    }));
    this.sensorManager.registerNamedInstances(facilityEntries);

    // Preserve the cinematic material state once. Click inspection can then put the whole
    // facility into a clean blue drafting context without permanently mutating CAD materials.
    model.traverse((mesh) => {
      if (!mesh.isMesh || mesh.userData.isPickProxy) return;
      this.sceneMeshes.push(mesh);
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mesh.userData.cinematicMaterialState = materials.map((material) => ({
        material,
        color: material?.color?.clone(), emissive: material?.emissive?.clone(),
        emissiveIntensity: material?.emissiveIntensity, opacity: material?.opacity,
        transparent: material?.transparent, metalness: material?.metalness, roughness: material?.roughness
      }));
    });
  }

  setBlueprintContext(activeRoot) {
    this.sceneMeshes.forEach((mesh) => {
      if (mesh.userData.isPickProxy || activeRoot === mesh || activeRoot?.children?.includes(mesh)) return;
      let ancestor = mesh.parent;
      let belongsToActive = false;
      while (ancestor) { if (ancestor === activeRoot) { belongsToActive = true; break; } ancestor = ancestor.parent; }
      if (belongsToActive) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (!material) return;
        if (material.color) material.color.setHex(0x16405f);
        if (material.emissive) { material.emissive.setHex(0x071b2e); material.emissiveIntensity = 0.18; }
        material.transparent = true;
        material.opacity = 0.24;
        if ('metalness' in material) material.metalness = 0.15;
        if ('roughness' in material) material.roughness = 0.78;
        material.needsUpdate = true;
      });
    });
  }

  restoreCinematicContext() {
    this.sceneMeshes.forEach((mesh) => {
      (mesh.userData.cinematicMaterialState || []).forEach((state) => {
        const material = state.material;
        if (!material) return;
        if (state.color && material.color) material.color.copy(state.color);
        if (state.emissive && material.emissive) material.emissive.copy(state.emissive);
        if (state.emissiveIntensity !== undefined) material.emissiveIntensity = state.emissiveIntensity;
        material.opacity = state.opacity;
        material.transparent = state.transparent;
        if (state.metalness !== undefined) material.metalness = state.metalness;
        if (state.roughness !== undefined) material.roughness = state.roughness;
        material.needsUpdate = true;
      });
    });
  }

  getFacilityTone(machine, component) {
    if (machine.includes('Water') || machine.includes('RO') || machine.includes('Wastewater')) {
      if (/Membrane|Filter/.test(component)) return { color: 0x14b8a6, emissive: 0x075985, intensity: 0.15, metalness: 0.55, roughness: 0.28 };
      if (/Pump|Motor|Bearing/.test(component)) return { color: 0x0ea5e9, emissive: 0x0c4a6e, intensity: 0.14, metalness: 0.62, roughness: 0.25 };
      return { color: 0x38bdf8, emissive: 0x075985, intensity: 0.10, metalness: 0.45, roughness: 0.32 };
    }
    if (machine.includes('Data') || machine.includes('Satellite')) {
      if (/Antenna|LNB|RF/.test(component)) return { color: 0xa78bfa, emissive: 0x4c1d95, intensity: 0.16, metalness: 0.70, roughness: 0.22 };
      return { color: 0x6366f1, emissive: 0x312e81, intensity: 0.14, metalness: 0.62, roughness: 0.25 };
    }
    return { color: 0xf59e0b, emissive: 0x78350f, intensity: 0.10, metalness: 0.55, roughness: 0.3 };
  }

  /**
   * Apply a cyan inspection glow to every mesh under a facility part root.
   * Clones each mesh's material on first touch so shared MTL materials
   * (many parts reuse the same "Steel - Satin" etc. material) are never mutated globally.
   */
  highlightFacilityRoot(root) {
    if (this.facilityHighlightRoot === root) return;
    this.clearFacilityHighlight();
    if (!root) return;

    root.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (!child.userData.originalMaterial) child.userData.originalMaterial = child.material;

      const registryEntry = FACILITY_REGISTRY[root.name];
      const finish = this.getInspectionFinish(registryEntry?.machine, registryEntry?.component);
      const applyGlow = (mat) => {
        const glow = mat.clone();
        // Preserve a solid, real material finish. A selection should read as illuminated
        // machinery—not as a translucent cyan CAD ghost.
        if (glow.color) glow.color.setHex(finish.color);
        if (glow.emissive) { glow.emissive.setHex(finish.emissive); glow.emissiveIntensity = 0.22; }
        if ('metalness' in glow) glow.metalness = finish.metalness;
        if ('roughness' in glow) glow.roughness = finish.roughness;
        glow.transparent = false;
        glow.opacity = 1;
        glow.needsUpdate = true;
        return glow;
      };

      child.material = Array.isArray(child.userData.originalMaterial)
        ? child.userData.originalMaterial.map(applyGlow)
        : applyGlow(child.userData.originalMaterial);
    });

    this.facilityHighlightRoot = root;
    this.setInspectionLight(root);
  }

  getInspectionFinish(machine = '', component = '') {
    if (/Water|RO|Wastewater/.test(machine)) {
      if (/Membrane|Filter/.test(component)) return { color: 0xd8e6e8, emissive: 0x0b5260, metalness: 0.76, roughness: 0.22 };
      return { color: 0x8db9c5, emissive: 0x123b46, metalness: 0.72, roughness: 0.24 };
    }
    if (/Data|Satellite/.test(machine)) return { color: 0xa9a7c8, emissive: 0x30225f, metalness: 0.74, roughness: 0.20 };
    return { color: 0xc6a562, emissive: 0x513314, metalness: 0.72, roughness: 0.25 };
  }

  setInspectionLight(root) {
    if (this.inspectionLight) this.scene.remove(this.inspectionLight);
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(4, box.getSize(new THREE.Vector3()).length() * 1.4);
    this.inspectionLight = new THREE.PointLight(0xffd3a1, 3.2, radius * 3, 2);
    this.inspectionLight.position.copy(center).add(new THREE.Vector3(radius * .45, radius * .7, radius * .55));
    this.scene.add(this.inspectionLight);
  }

  clearFacilityHighlight() {
    if (!this.facilityHighlightRoot) return;
    this.facilityHighlightRoot.traverse((child) => {
      if (child.isMesh && child.userData.originalMaterial) {
        child.material = child.userData.originalMaterial;
      }
    });
    this.facilityHighlightRoot = null;
    if (this.inspectionLight) { this.scene.remove(this.inspectionLight); this.inspectionLight = null; }
  }

  previewFacilityComponent(root) {
    if (!root || !FACILITY_REGISTRY[root.name] || this.focusedComponentData || this.facilitySelectedRoot) return;
    this.highlightFacilityRoot(root);
  }

  clearFacilityPreview() {
    if (!this.focusedComponentData && !this.facilitySelectedRoot && this.facilityHighlightRoot) this.clearFacilityHighlight();
  }

  /**
   * Set currently focused component group based on raycast target hit.
   * Handles two kinds of targets:
   *  - a registered generator subsystem (Engine Core, Bearing System, etc.) -> full explode/inspect animation
   *  - any other named facility part (pipes, boxes, supports, RO skid, antenna drive...) -> highlight + info panel only
   * @param {THREE.Object3D|null} componentRoot 
   */
  setFocusedComponent(componentRoot) {
    let targetCompData = null;

    if (componentRoot && componentRoot.userData && componentRoot.userData.rawName) {
      targetCompData = this.componentsData.get(componentRoot.userData.rawName) || null;
    } else if (componentRoot && componentRoot.name) {
      targetCompData = this.componentsData.get(componentRoot.name) || null;
    }

    // Facility part (not a registered generator subsystem): highlight + show info panel, skip explode animation
    if (componentRoot && !targetCompData && componentRoot.name) {
      // Hover glow and a click selection are separate states: a preview must not suppress
      // the first click's telemetry panel.
      if (this.facilitySelectedRoot === componentRoot) return;

      // Leaving a generator subsystem inspection to look at a facility part: restore it first
      if (this.focusedComponentData) {
        this.setFocusedComponent(null);
      }

      this.highlightFacilityRoot(componentRoot);
      this.facilitySelectedRoot = componentRoot;
      this.setBlueprintContext(componentRoot);

      const registryEntry = FACILITY_REGISTRY[componentRoot.name];
      if (registryEntry) {
        const desc = FACILITY_COMPONENT_DESCRIPTIONS[registryEntry.component] || FACILITY_DESCRIPTIONS['Facility Component'];
        this.showSensorPanel(registryEntry.component, registryEntry.machine, componentRoot.name, desc);
      } else {
        const info = classifyFacilityComponent(componentRoot.name);
        this.showSensorPanel(info.title, info.category, componentRoot.name, FACILITY_DESCRIPTIONS[info.category]);
      }
      return;
    }

    // Deselecting a facility part
    if (!componentRoot && this.facilityHighlightRoot) {
      this.clearFacilityHighlight();
      this.facilitySelectedRoot = null;
      this.restoreCinematicContext();
      this.hideSensorPanel();
      return;
    }

    if (this.focusedComponentData === targetCompData) return;

    // Switching from a facility part to a generator subsystem: clear the facility highlight first
    if (targetCompData && this.facilityHighlightRoot) {
      this.clearFacilityHighlight();
    }

    const prevFocusedData = this.focusedComponentData;
    this.focusedComponentData = targetCompData;

    // Build active generator component map for Inspection Mode move-aside calculations
    let activeGenNum = 1;
    if (this.focusedComponentData) {
      activeGenNum = this.focusedComponentData.generatorNumber;
    } else if (prevFocusedData) {
      activeGenNum = prevFocusedData.generatorNumber;
    }
    const genKey = `generator${activeGenNum}`;
    const genGroupNames = COMPONENT_GROUPS[genKey] || [];
    const genCompMap = new Map();
    genGroupNames.forEach((rawName) => {
      if (this.componentsData.has(rawName)) {
        genCompMap.set(rawName, this.componentsData.get(rawName));
      }
    });

    // Notify AnimationManager of active component selection change
    this.animationManager.setActiveComponent(this.focusedComponentData);

    // Keep the facility cinematic and solid. Focus adds illumination; it must never expose
    // the source OBJ triangulation or turn the rest of the plant into a sketch.
    if (this.focusedComponentData) {
      const activeRoot = this.focusedComponentData.group;
      this.setBlueprintContext(activeRoot);

      // Enter Interactive Inspection Mode with Anime.js (selected component moves forward, others move aside)
      this.animeAnimationManager.enterInspectionMode(
        activeRoot,
        this.focusedComponentData,
        genCompMap
      );

      this.allComponentMeshes.forEach((mesh) => {
        if (!mesh.material) return;

        if (mesh.userData.componentRoot === activeRoot) {
          // Focused component: opaque, polished original finish under cinematic key lighting.
          mesh.material.transparent = false;
          mesh.material.opacity = 1.0;
          mesh.material.wireframe = false;
          if (mesh.userData.baseColor !== undefined) {
            mesh.material.color.setHex(mesh.userData.baseColor);
          }
          if (mesh.userData.baseMetalness !== undefined) {
            mesh.material.metalness = mesh.userData.baseMetalness;
          }
          if (mesh.userData.baseRoughness !== undefined) {
            mesh.material.roughness = mesh.userData.baseRoughness;
          }
          if (mesh.material.emissive) {
            mesh.material.emissive.setHex(mesh.userData.baseEmissive ?? 0x1d4ed8);
            mesh.material.emissiveIntensity = 0.28;
          }
        } else {
          // Non-focused machine components: gently desaturated solid context.
          mesh.material.transparent = false;
          mesh.material.opacity = 1.0;
          mesh.material.wireframe = false;
          mesh.material.color.setHex(0x3b4b60);
          mesh.material.roughness = 0.58;
          mesh.material.metalness = 0.30;
          if (mesh.material.emissive) {
            mesh.material.emissive.setHex(0x000000);
            mesh.material.emissiveIntensity = 0.05;
          }
        }
      });

      this.showSensorPanel(
        this.focusedComponentData.canonicalName,
        this.focusedComponentData.generatorName,
        this.focusedComponentData.rawName
      );
      this.setInspectionLight(activeRoot);
    } else {
      // Exit Inspection Mode: return all components smoothly to original machine layout
      this.animeAnimationManager.exitInspectionMode(genCompMap);
      this.restoreCinematicContext();
      if (this.inspectionLight) { this.scene.remove(this.inspectionLight); this.inspectionLight = null; }

      // Restore all meshes to full 3D base materials
      this.allComponentMeshes.forEach((mesh) => {
        if (!mesh.material) return;
        mesh.material.transparent = false;
        mesh.material.opacity = 1.0;
        mesh.material.wireframe = false;
        if (mesh.userData.baseColor !== undefined) {
          mesh.material.color.setHex(mesh.userData.baseColor);
        }
        if (mesh.userData.baseMetalness !== undefined) {
          mesh.material.metalness = mesh.userData.baseMetalness;
        }
        if (mesh.userData.baseRoughness !== undefined) {
          mesh.material.roughness = mesh.userData.baseRoughness;
        }
        if (mesh.material.emissive && mesh.userData.baseEmissive !== undefined) {
          mesh.material.emissive.setHex(mesh.userData.baseEmissive);
          mesh.material.emissiveIntensity = mesh.userData.baseEmissiveIntensity;
        }
      });

      this.hideSensorPanel();
    }
  }

  showSensorPanel(canonicalName, generatorName, rawName, descriptionOverride) {
    if (this.sensorPanel) {
      const data = this.sensorManager.getSensorData(rawName);

      if (this.sensorTitle) this.sensorTitle.textContent = canonicalName;
      if (this.sensorSubtitle) this.sensorSubtitle.textContent = generatorName;

      if (this.sensorMetrics) {
        this.sensorMetrics.innerHTML = data.metrics.map(m => `
          <div class="metric-row" data-metric-label="${m.label}">
            <span class="metric-label">${m.label}</span>
            <span class="metric-value">${m.value}</span>
          </div>
        `).join('');
      }

      this.updateSensorPanelUI();
      this.sensorPanel.classList.remove('hidden');
    }

    // Update & display bottom-left component description card
    if (this.descriptionCard) {
      if (this.descriptionTitle) this.descriptionTitle.textContent = canonicalName;
      if (this.descriptionSubtitle) this.descriptionSubtitle.textContent = generatorName;
      const desc = descriptionOverride || COMPONENT_DESCRIPTIONS[canonicalName] || 'Industrial CHP digital-twin system component.';
      if (this.descriptionText) this.descriptionText.textContent = desc;
      this.descriptionCard.classList.remove('hidden');
    }
  }

  hideSensorPanel() {
    if (this.sensorPanel) {
      this.sensorPanel.classList.add('hidden');
    }
    if (this.descriptionCard) {
      this.descriptionCard.classList.add('hidden');
    }
  }

  updateSensorPanelUI() {
    if (!this.sensorPanel || this.sensorPanel.classList.contains('hidden')) return;
    if (!this.focusedComponentData && !this.facilityHighlightRoot) return;

    const rawName = this.focusedComponentData ? this.focusedComponentData.rawName : this.facilityHighlightRoot.name;
    const data = this.sensorManager.getSensorData(rawName);
    const analysis = this.conditionAnalyzer.analyzeComponent(rawName);

    // Status text & dot indicator
    const displayStatus = analysis.anomalyLevel !== 'NORMAL' ? analysis.anomalyLevel : data.status;
    if (this.sensorStatusText && this.sensorStatusText.textContent !== displayStatus) {
      this.sensorStatusText.textContent = displayStatus;
    }

    if (this.statusDot) {
      if (analysis.anomalyLevel === 'CRITICAL') {
        this.statusDot.style.backgroundColor = '#ef4444';
        this.statusDot.style.boxShadow = '0 0 8px #ef4444';
      } else if (analysis.anomalyLevel === 'WARNING') {
        this.statusDot.style.backgroundColor = '#f59e0b';
        this.statusDot.style.boxShadow = '0 0 8px #f59e0b';
      } else if (analysis.anomalyLevel === 'WATCH') {
        this.statusDot.style.backgroundColor = '#38bdf8';
        this.statusDot.style.boxShadow = '0 0 8px #38bdf8';
      } else {
        this.statusDot.style.backgroundColor = '#10b981';
        this.statusDot.style.boxShadow = '0 0 8px #10b981';
      }
    }

    // Telemetry metric rows
    if (this.sensorMetrics) {
      data.metrics.forEach(m => {
        const row = this.sensorMetrics.querySelector(`.metric-row[data-metric-label="${CSS.escape(m.label)}"]`);
        if (row) {
          const valElem = row.querySelector('.metric-value');
          if (valElem && valElem.textContent !== m.value) {
            valElem.textContent = m.value;
          }
        }
      });
    }

    // Phase 6 Predictive Maintenance HUD elements
    if (this.healthScoreVal) this.healthScoreVal.textContent = `${analysis.healthScore}%`;
    if (this.healthBarFill) {
      this.healthBarFill.style.width = `${analysis.healthScore}%`;
      if (analysis.healthScore < 40) {
        this.healthBarFill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
      } else if (analysis.healthScore < 65) {
        this.healthBarFill.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
      } else if (analysis.healthScore < 85) {
        this.healthBarFill.style.background = 'linear-gradient(90deg, #38bdf8, #818cf8)';
      } else {
        this.healthBarFill.style.background = 'linear-gradient(90deg, #10b981, #38bdf8)';
      }
    }

    if (this.conditionStateVal) {
      this.conditionStateVal.textContent = analysis.conditionState;
      if (analysis.anomalyLevel === 'CRITICAL') this.conditionStateVal.style.color = '#ef4444';
      else if (analysis.anomalyLevel === 'WARNING') this.conditionStateVal.style.color = '#f59e0b';
      else if (analysis.anomalyLevel === 'WATCH') this.conditionStateVal.style.color = '#38bdf8';
      else this.conditionStateVal.style.color = '#10b981';
    }

    if (this.rulVal) this.rulVal.textContent = analysis.simulatedRUL;
    if (this.insightText) this.insightText.textContent = analysis.recommendation;
  }

  updateSystemHealthUI() {
    if (!this.systemHealthText) return;

    const globalHealth = this.conditionAnalyzer.getGlobalSystemHealth();
    const statusText = globalHealth.systemStatus;

    this.systemHealthText.innerHTML = `SYSTEM HEALTH ${globalHealth.systemHealthScore}% &bull; ${statusText}`;

    if (this.systemHealthDot) {
      if (statusText === 'CRITICAL') {
        this.systemHealthDot.style.backgroundColor = '#ef4444';
        this.systemHealthDot.style.boxShadow = '0 0 6px #ef4444';
      } else if (statusText === 'WARNING') {
        this.systemHealthDot.style.backgroundColor = '#f59e0b';
        this.systemHealthDot.style.boxShadow = '0 0 6px #f59e0b';
      } else if (statusText === 'WATCH') {
        this.systemHealthDot.style.backgroundColor = '#38bdf8';
        this.systemHealthDot.style.boxShadow = '0 0 6px #38bdf8';
      } else {
        this.systemHealthDot.style.backgroundColor = '#10b981';
        this.systemHealthDot.style.boxShadow = '0 0 6px #10b981';
      }
    }
  }

  // --- Public Phase 5 & Phase 6 API ---
  getSensorData(target) {
    const rawName = (typeof target === 'string') ? target : (target?.userData?.rawName || target?.name);
    return this.sensorManager.getSensorData(rawName);
  }

  getSensorValue(target, metricLabel) {
    const rawName = (typeof target === 'string') ? target : (target?.userData?.rawName || target?.name);
    return this.sensorManager.getSensorValue(rawName, metricLabel);
  }

  getComponentStatus(target) {
    const rawName = (typeof target === 'string') ? target : (target?.userData?.rawName || target?.name);
    return this.sensorManager.getComponentStatus(rawName);
  }

  analyzeComponent(target) {
    const rawName = (typeof target === 'string') ? target : (target?.userData?.rawName || target?.name);
    return this.conditionAnalyzer.analyzeComponent(rawName);
  }

  getGlobalSystemHealth() {
    return this.conditionAnalyzer.getGlobalSystemHealth();
  }

  /**
   * Smoothly interpolate component group positions, drive mechanical animations, tick live telemetry, and update condition analysis
   * @param {number} delta 
   */
  update(delta) {
    const speed = 8.0;

    this.componentsData.forEach((comp) => {
      if (Math.abs(comp.currentProgress - comp.targetProgress) > 0.0001) {
        comp.currentProgress += (comp.targetProgress - comp.currentProgress) * Math.min(1.0, delta * speed);

        if (Math.abs(comp.currentProgress - comp.targetProgress) < 0.001) {
          comp.currentProgress = comp.targetProgress;
        }

        if (comp.originalPosition && comp.openPosition && comp.pivot) {
          if (comp.currentProgress === 0.0) {
            comp.pivot.position.copy(comp.originalPosition);
          } else if (comp.currentProgress === 1.0) {
            comp.pivot.position.copy(comp.openPosition);
          } else {
            comp.pivot.position.lerpVectors(comp.originalPosition, comp.openPosition, comp.currentProgress);
          }
        }
      }
    });

    // Drive functional component animations
    this.animationManager.update(delta);

    // Drive live sensor telemetry simulation
    this.sensorManager.update(delta);

    // Drive Phase 6 UI panel updates & global system health calculation
    this.updateSensorPanelUI();
    this.updateSystemHealthUI();
  }
}

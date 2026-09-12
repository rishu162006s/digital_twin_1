import { createTimeline, animate } from 'animejs';

/**
 * AnimeAnimationManager
 * Centralized Anime.js animation architecture for CHP 3D Digital Twin inspection mode & functional animations.
 * Provides substantial subsystem extraction (2.5x-3x distance), 3-level spatial priority (Inspection Cavity),
 * two-stage mechanical focus motion, and smooth component-to-component transitions.
 * 
 * Structural Rule: Base Frame and Protective Frame remain 100% mechanically and visually STATIC when not selected.
 */
export class AnimeAnimationManager {
  constructor() {
    // Registry mapping componentRoot (Object3D) -> functional animation record
    this.animationRegistry = new Map();
    // Active inspection transition animations (pivot -> Anime animation/timeline instance)
    this.inspectionAnimations = new Map();
    this.currentInspectionRoot = null;
  }

  /**
   * Helper to normalize canonical component names
   * @param {string} rawName 
   * @returns {string}
   */
  static getCanonicalName(rawName) {
    if (!rawName) return 'Unknown';
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

  /**
   * Enter Interactive Inspection Mode for a selected component in a generator.
   * - SELECTED COMPONENT: Pulled out substantially (2.5x-3x farther, ~2.8 units forward/outward) in a two-stage mechanical motion.
   * - NEARBY COMPONENTS: Retreat outward/aside (~0.8-1.2 units) to create a distinct inspection cavity around the selected component.
   * - DISTANT COMPONENTS: Minimal displacement (~0.2-0.35 units) maintaining generator machine structure.
   * - Frame and Protective Frame participate in interactive inspection positioning when selected, but run ZERO continuous animation.
   * @param {THREE.Object3D} selectedRoot 
   * @param {Object} selectedCompData 
   * @param {Map} allGenComponents 
   */
  enterInspectionMode(selectedRoot, selectedCompData, allGenComponents) {
    if (!selectedRoot || !selectedCompData || !allGenComponents) return;

    if (this.currentInspectionRoot === selectedRoot) return;
    this.currentInspectionRoot = selectedRoot;

    // Pause/clean up running inspection transitions cleanly before applying new targets
    this.stopInspectionAnimations();

    const selectedOrig = selectedCompData.originalPosition;
    if (!selectedOrig) return;

    // 1. Calculate Generator Center to determine true outward vector
    let genCount = 0;
    let genCenterX = 0, genCenterY = 0, genCenterZ = 0;
    allGenComponents.forEach((comp) => {
      if (comp.originalPosition) {
        genCenterX += comp.originalPosition.x;
        genCenterY += comp.originalPosition.y;
        genCenterZ += comp.originalPosition.z;
        genCount++;
      }
    });
    if (genCount > 0) {
      genCenterX /= genCount;
      genCenterY /= genCount;
      genCenterZ /= genCount;
    }

    // 2. Outward direction vector for selected component relative to generator center
    let outX = selectedOrig.x - genCenterX;
    let outY = selectedOrig.y - genCenterY;
    let outZ = selectedOrig.z - genCenterZ;
    let outLen = Math.sqrt(outX * outX + outY * outY + outZ * outZ) || 1.0;
    let normOutX = outX / outLen;
    let normOutY = outY / outLen;
    let normOutZ = outZ / outLen;

    // 3. Calculate inspection target positions for all components in the generator
    allGenComponents.forEach((compData) => {
      const pivot = compData.pivot;
      const orig = compData.originalPosition;
      if (!pivot || !orig) return;

      if (compData.group === selectedRoot) {
        // --- LEVEL 1: SELECTED COMPONENT (Substantial 2.5x-3x Extraction) ---
        const extractionForwardZ = 2.80; // Strong extraction forward toward viewer
        const extractionOutwardX = normOutX * 0.85;
        const extractionLiftY = 0.65 + Math.max(0, normOutY * 0.40);

        // Stage 1 Intermediate Target (Initial Pull-Out & Lift)
        const stage1Pos = {
          x: orig.x + extractionOutwardX * 0.45,
          y: orig.y + extractionLiftY * 0.50,
          z: orig.z + extractionForwardZ * 0.45
        };

        // Final Inspection Stance Target (Full Extraction Focus Position)
        const finalPos = {
          x: orig.x + extractionOutwardX,
          y: orig.y + extractionLiftY,
          z: orig.z + extractionForwardZ
        };

        const tl = createTimeline({
          autoplay: true
        });

        // Stage 1: Initial Pull-Out & Separation
        tl.add(pivot.position, {
          x: stage1Pos.x,
          y: stage1Pos.y,
          z: stage1Pos.z,
          duration: 220,
          ease: 'outQuad'
        });

        // Stage 2: Strong extraction & settling into engineering focus stance
        tl.add(pivot.position, {
          x: finalPos.x,
          y: finalPos.y,
          z: finalPos.z,
          duration: 480,
          ease: 'outExpo'
        });

        this.inspectionAnimations.set(pivot, tl);
      } else {
        // --- SURROUNDING COMPONENTS: 3-Level Spatial Priority ---
        const dx = orig.x - selectedOrig.x;
        const dy = orig.y - selectedOrig.y;
        const dz = orig.z - selectedOrig.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        let targetX = orig.x;
        let targetY = orig.y;
        let targetZ = orig.z;

        if (dist > 0.001) {
          const dirX = dx / dist;
          const dirY = dy / dist;
          const dirZ = dz / dist;

          if (dist <= 4.2) {
            // LEVEL 2: NEARBY COMPONENTS (Retreat outward/aside to form inspection cavity around selected component)
            const cavityFactor = Math.min(1.15, 2.2 / (dist + 0.8));
            targetX = orig.x + dirX * cavityFactor * 0.95;
            targetY = orig.y + dirY * cavityFactor * 0.50 - 0.20; // Retreat slightly downward/sideways
            targetZ = orig.z + dirZ * cavityFactor * 0.70 - 0.40; // Push slightly backward to deepen cavity
          } else {
            // LEVEL 3: DISTANT COMPONENTS (Minimal displacement maintaining machine recognizability)
            const subtleFactor = 0.25;
            targetX = orig.x + dirX * subtleFactor;
            targetY = orig.y + dirY * subtleFactor * 0.5;
            targetZ = orig.z + dirZ * subtleFactor * 0.5;
          }
        } else {
          targetX = orig.x + 0.40;
        }

        // Animate surrounding component pivot smoothly from its current position to target
        const anim = animate(pivot.position, {
          x: targetX,
          y: targetY,
          z: targetZ,
          duration: 620,
          ease: 'outCubic'
        });

        this.inspectionAnimations.set(pivot, anim);
      }
    });

    // Start functional animation for selected component
    this.startFunctionalAnimation(selectedCompData);
  }

  /**
   * Exit Inspection Mode and return all generator components smoothly to original machine layout.
   * @param {Map} allGenComponents 
   */
  exitInspectionMode(allGenComponents) {
    this.currentInspectionRoot = null;
    this.stopInspectionAnimations();

    if (allGenComponents) {
      allGenComponents.forEach((compData) => {
        const pivot = compData.pivot;
        const orig = compData.originalPosition;
        if (pivot && orig) {
          const anim = animate(pivot.position, {
            x: orig.x,
            y: orig.y,
            z: orig.z,
            duration: 650,
            ease: 'inOutCubic'
          });
          this.inspectionAnimations.set(pivot, anim);
        }
      });
    }

    this.stopAllFunctionalAnimations();
  }

  /**
   * Stop active inspection transition animations cleanly without position jumps
   */
  stopInspectionAnimations() {
    this.inspectionAnimations.forEach((anim) => {
      try {
        if (anim && anim.pause) anim.pause();
      } catch (e) {}
    });
    this.inspectionAnimations.clear();
  }

  /**
   * Start functional mechanical animation for a component group.
   * Cleans up previous animation instance for this component root before starting.
   * Frame and Protective Frame do NOT run any continuous animation.
   * @param {Object} compData 
   */
  startFunctionalAnimation(compData) {
    if (!compData) return;
    const componentRoot = compData.group;
    const normName = compData.canonicalName || AnimeAnimationManager.getCanonicalName(componentRoot.name);

    if (this.animationRegistry.has(componentRoot)) {
      this.stopComponentAnimation(componentRoot, normName);
    }

    const timeline = this.createTimelineForComponent(componentRoot, normName);

    // If component is static (e.g. Frame or Protective Frame), do not register continuous animation
    if (!timeline) {
      console.log(`[AnimeAnimationManager] ${normName} is structural/static (No continuous animation registered).`);
      return;
    }

    const record = {
      componentRoot,
      canonicalName: normName,
      timeline,
      isRunning: true,
      isPaused: false,
      startTime: Date.now()
    };

    this.animationRegistry.set(componentRoot, record);
    console.log(`[AnimeAnimationManager] Functional animation active for: ${normName}`);
  }

  /**
   * Stop functional animation for a component group.
   * @param {THREE.Object3D} componentRoot 
   * @param {string} canonicalName 
   */
  stopComponentAnimation(componentRoot, canonicalName) {
    if (!componentRoot) return;

    const record = this.animationRegistry.get(componentRoot);
    if (record) {
      if (record.timeline) {
        try {
          record.timeline.pause();
        } catch (e) {}
      }
      record.isRunning = false;
      record.isPaused = false;
      this.animationRegistry.delete(componentRoot);
      console.log(`[AnimeAnimationManager] Stopped functional animation for: ${record.canonicalName}`);
    }
  }

  /**
   * Stop all active functional animations.
   */
  stopAllComponentAnimations() {
    this.animationRegistry.forEach((record) => {
      if (record.timeline) {
        try {
          record.timeline.pause();
        } catch (e) {}
      }
    });
    this.animationRegistry.clear();
  }

  stopAllFunctionalAnimations() {
    this.stopAllComponentAnimations();
  }

  /**
   * Factory method to create Anime.js timeline per canonical component type.
   * Returns null for Frame and Protective Frame so they remain completely static.
   * @param {THREE.Object3D} componentRoot 
   * @param {string} canonicalName 
   * @returns {Object|null} Anime.js timeline instance or null for static structural components
   */
  createTimelineForComponent(componentRoot, canonicalName) {
    switch (canonicalName) {
      case 'Bearing System':
        return this.createBearingSystemAnimation(componentRoot);
      case 'Engine Core':
        return this.createEngineCoreAnimation(componentRoot);
      case 'Cooling System':
        return this.createCoolingSystemAnimation(componentRoot);
      case 'Generator System':
        return this.createGeneratorSystemAnimation(componentRoot);
      case 'Lubrication System':
        return this.createLubricationSystemAnimation(componentRoot);
      case 'Fuel System':
        return this.createFuelSystemAnimation(componentRoot);
      case 'Intake System':
        return this.createIntakeSystemAnimation(componentRoot);
      case 'Exhaust System':
        return this.createExhaustSystemAnimation(componentRoot);
      case 'Control System':
        return this.createControlSystemAnimation(componentRoot);
      case 'Frame':
      case 'Protective Frame':
        // Base Frame and Protective Frame must remain mechanically and visually STATIC when not selected
        return null;
      default:
        return this.createGenericStubAnimation(componentRoot);
    }
  }

  // --- Functional Timeline Creators ---

  /**
   * Bearing System Functional Animation Hook.
   * Geometry note: Loaded CHP.obj represents BearingSystem as a single composite THREE.Mesh.
   * In strict compliance with Phase 4 rules, we do NOT rotate the composite mesh to avoid rotating stationary housing.
   */
  createBearingSystemAnimation(componentRoot) {
    return this.createGenericStubAnimation(componentRoot);
  }

  createEngineCoreAnimation(componentRoot) {
    return this.createGenericStubAnimation(componentRoot);
  }

  createCoolingSystemAnimation(componentRoot) {
    return this.createGenericStubAnimation(componentRoot);
  }

  createGeneratorSystemAnimation(componentRoot) {
    return this.createGenericStubAnimation(componentRoot);
  }

  createLubricationSystemAnimation(componentRoot) {
    return this.createGenericStubAnimation(componentRoot);
  }

  createFuelSystemAnimation(componentRoot) {
    return this.createGenericStubAnimation(componentRoot);
  }

  createIntakeSystemAnimation(componentRoot) {
    return this.createGenericStubAnimation(componentRoot);
  }

  createExhaustSystemAnimation(componentRoot) {
    return this.createGenericStubAnimation(componentRoot);
  }

  createControlSystemAnimation(componentRoot) {
    return this.createGenericStubAnimation(componentRoot);
  }

  /**
   * Safe stub timeline animating a dummy state object
   */
  createGenericStubAnimation(componentRoot) {
    const dummyState = { progress: 0 };
    const tl = createTimeline({
      loop: true,
      autoplay: true
    });
    tl.add(dummyState, {
      progress: 1,
      duration: 1000,
      ease: 'linear'
    });
    return tl;
  }
}

import * as THREE from 'three';

/**
 * Centralized AnimationManager for Phase 4 Functional Component Animations
 */
export class AnimationManager {
  constructor() {
    this.activeComponentData = null;
    this.animationTime = 0;
  }

  /**
   * Set currently active component for functional animation
   * @param {Object|null} compData 
   */
  setActiveComponent(compData) {
    if (this.activeComponentData === compData) return;

    // Reset previous component animation state & transforms
    if (this.activeComponentData) {
      const prevComp = this.activeComponentData;
      if (prevComp.pivot) {
        prevComp.pivot.rotation.set(0, 0, 0);
        if (prevComp.originalPivotPosition) {
          prevComp.pivot.position.copy(prevComp.originalPivotPosition);
        }
      }
    }

    this.activeComponentData = compData;
    this.animationTime = 0;

    if (this.activeComponentData && this.activeComponentData.pivot) {
      this.activeComponentData.originalPivotPosition = this.activeComponentData.pivot.position.clone();
    }
  }

  /**
   * Frame update called from main render loop
   * @param {number} delta 
   */
  update(delta) {
    if (!this.activeComponentData) return;

    this.animationTime += delta;
    const comp = this.activeComponentData;
    const name = comp.canonicalName;
    const pivot = comp.pivot;
    const time = this.animationTime;

    if (!pivot) return;

    // Reset pivot rotation to zero before applying current frame animation angle
    pivot.rotation.set(0, 0, 0);
    if (comp.originalPivotPosition) {
      pivot.position.copy(comp.originalPivotPosition);
    }

    // Phase 4.1 Architecture Preparation: Keep component pivots stationary until sub-mesh targets are defined in future phases
    pivot.rotation.set(0, 0, 0);
    if (comp.originalPivotPosition) {
      pivot.position.copy(comp.originalPivotPosition);
    }
  }
}

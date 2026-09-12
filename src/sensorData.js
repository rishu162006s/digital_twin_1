/**
 * Centralized Live Industrial Sensor & Telemetry Simulation Architecture
 * CHP 3D Digital Twin - Phase 5 Condition Monitoring System
 */

// Baseline component sensor templates (realistic engineering values)
export const SENSOR_TEMPLATES = {
  'Engine Core': {
    metrics: [
      { label: 'Temperature', base: 78.0, min: 65.0, max: 95.0, unit: '°C', decimals: 1, noise: 0.4, drift: 2.0 },
      { label: 'RPM', base: 1500, min: 1480, max: 1520, unit: 'RPM', decimals: 0, noise: 3, drift: 3.0 },
      { label: 'Vibration', base: 2.1, min: 1.5, max: 3.5, unit: 'mm/s', decimals: 2, noise: 0.08, drift: 1.5 },
      { label: 'Oil Pressure', base: 4.2, min: 3.8, max: 4.8, unit: 'bar', decimals: 2, noise: 0.04, drift: 1.5 },
      { label: 'Load', base: 72.0, min: 60.0, max: 85.0, unit: '%', decimals: 1, noise: 0.5, drift: 2.0 }
    ]
  },
  'Bearing System': {
    metrics: [
      { label: 'Bearing Temp', base: 64.0, min: 55.0, max: 80.0, unit: '°C', decimals: 1, noise: 0.3, drift: 1.8 },
      { label: 'RPM', base: 1500, min: 1480, max: 1520, unit: 'RPM', decimals: 0, noise: 3, drift: 3.0 },
      { label: 'Vibration', base: 1.8, min: 1.2, max: 3.0, unit: 'mm/s', decimals: 2, noise: 0.06, drift: 1.5 },
      { label: 'Lubrication', isText: true, textValue: 'NORMAL' }
    ]
  },
  'Lubrication System': {
    metrics: [
      { label: 'Oil Temp', base: 62.0, min: 50.0, max: 75.0, unit: '°C', decimals: 1, noise: 0.3, drift: 1.8 },
      { label: 'Oil Pressure', base: 4.1, min: 3.6, max: 4.6, unit: 'bar', decimals: 2, noise: 0.04, drift: 1.5 },
      { label: 'Flow Rate', base: 18.5, min: 15.0, max: 22.0, unit: 'L/min', decimals: 1, noise: 0.2, drift: 2.0 },
      { label: 'Lubrication Status', isText: true, textValue: 'NORMAL' }
    ]
  },
  'Cooling System': {
    metrics: [
      { label: 'Coolant Temp', base: 68.0, min: 58.0, max: 82.0, unit: '°C', decimals: 1, noise: 0.3, drift: 1.8 },
      { label: 'Flow Rate', base: 42.0, min: 35.0, max: 50.0, unit: 'L/min', decimals: 1, noise: 0.4, drift: 2.0 },
      { label: 'Fan RPM', base: 920, min: 890, max: 950, unit: 'RPM', decimals: 0, noise: 4, drift: 2.5 },
      { label: 'Cooling Efficiency', base: 94.5, min: 88.0, max: 99.0, unit: '%', decimals: 1, noise: 0.2, drift: 1.2 }
    ]
  },
  'Generator System': {
    metrics: [
      { label: 'Generator RPM', base: 1500, min: 1485, max: 1515, unit: 'RPM', decimals: 0, noise: 2, drift: 3.0 },
      { label: 'Output Power', base: 420.0, min: 380.0, max: 450.0, unit: 'kW', decimals: 1, noise: 0.8, drift: 2.5 },
      { label: 'Voltage', base: 415.0, min: 410.0, max: 420.0, unit: 'V', decimals: 1, noise: 0.3, drift: 2.0 },
      { label: 'Current', base: 584.0, min: 550.0, max: 620.0, unit: 'A', decimals: 1, noise: 1.2, drift: 2.0 }
    ]
  },
  'Fuel System': {
    metrics: [
      { label: 'Fuel Pressure', base: 3.5, min: 3.1, max: 3.9, unit: 'bar', decimals: 2, noise: 0.03, drift: 1.5 },
      { label: 'Flow Rate', base: 24.0, min: 20.0, max: 28.0, unit: 'L/min', decimals: 1, noise: 0.3, drift: 2.0 },
      { label: 'Fuel Temp', base: 41.0, min: 35.0, max: 48.0, unit: '°C', decimals: 1, noise: 0.2, drift: 1.5 },
      { label: 'Fuel Level', base: 86.0, min: 70.0, max: 100.0, unit: '%', decimals: 1, noise: 0.1, drift: 0.5 }
    ]
  },
  'Intake System': {
    metrics: [
      { label: 'Intake Pressure', base: 1.40, min: 1.25, max: 1.55, unit: 'bar', decimals: 2, noise: 0.02, drift: 1.8 },
      { label: 'Air Flow', base: 3.20, min: 2.80, max: 3.60, unit: 'kg/s', decimals: 2, noise: 0.03, drift: 2.0 },
      { label: 'Air Temp', base: 31.0, min: 25.0, max: 38.0, unit: '°C', decimals: 1, noise: 0.2, drift: 1.2 },
      { label: 'Intake Status', isText: true, textValue: 'CLEAN' }
    ]
  },
  'Exhaust System': {
    metrics: [
      { label: 'Exhaust Temp', base: 385.0, min: 350.0, max: 420.0, unit: '°C', decimals: 1, noise: 1.2, drift: 2.2 },
      { label: 'Exhaust Pressure', base: 1.20, min: 1.05, max: 1.35, unit: 'bar', decimals: 2, noise: 0.02, drift: 1.8 },
      { label: 'Gas Flow', base: 2.80, min: 2.40, max: 3.20, unit: 'kg/s', decimals: 2, noise: 0.03, drift: 2.0 },
      { label: 'Back Pressure', base: 0.18, min: 0.12, max: 0.25, unit: 'bar', decimals: 2, noise: 0.01, drift: 1.5 }
    ]
  },
  'Control System': {
    metrics: [
      { label: 'Controller Temp', base: 42.0, min: 35.0, max: 50.0, unit: '°C', decimals: 1, noise: 0.2, drift: 1.2 },
      { label: 'Voltage', base: 24.1, min: 23.8, max: 24.4, unit: 'V', decimals: 1, noise: 0.05, drift: 2.0 },
      { label: 'Current', base: 12.4, min: 11.0, max: 14.0, unit: 'A', decimals: 1, noise: 0.1, drift: 2.0 },
      { label: 'System Status', isText: true, textValue: 'ACTIVE' }
    ]
  },
  'Frame': {
    metrics: [
      { label: 'Structural Load', base: 64.0, min: 55.0, max: 75.0, unit: '%', decimals: 1, noise: 0.3, drift: 1.5 },
      { label: 'Vibration', base: 1.1, min: 0.8, max: 1.5, unit: 'mm/s', decimals: 2, noise: 0.03, drift: 1.2 },
      { label: 'Temperature', base: 38.0, min: 32.0, max: 45.0, unit: '°C', decimals: 1, noise: 0.2, drift: 1.0 },
      { label: 'Structural Integrity', base: 99.8, min: 99.0, max: 100.0, unit: '%', decimals: 1, noise: 0.02, drift: 0.5 }
    ]
  },
  'Protective Frame': {
    metrics: [
      { label: 'Structural Load', base: 42.0, min: 35.0, max: 50.0, unit: '%', decimals: 1, noise: 0.2, drift: 1.2 },
      { label: 'Vibration', base: 0.7, min: 0.4, max: 1.0, unit: 'mm/s', decimals: 2, noise: 0.02, drift: 1.0 },
      { label: 'Temperature', base: 36.0, min: 30.0, max: 42.0, unit: '°C', decimals: 1, noise: 0.2, drift: 1.0 },
      { label: 'Protection Status', isText: true, textValue: 'SECURE' }
    ]
  },

  // --- Water & Life Support / Logistics-Drive templates ---
  'Pump System': {
    metrics: [
      { label: 'Flow Rate', base: 120.0, min: 100.0, max: 140.0, unit: 'm³/h', decimals: 1, noise: 1.0, drift: 2.0 },
      { label: 'Discharge Pressure', base: 4.5, min: 3.8, max: 5.2, unit: 'bar', decimals: 2, noise: 0.05, drift: 1.5 },
      { label: 'Motor Temp', base: 58.0, min: 45.0, max: 75.0, unit: '°C', decimals: 1, noise: 0.3, drift: 1.8 },
      { label: 'Vibration', base: 1.6, min: 1.0, max: 2.8, unit: 'mm/s', decimals: 2, noise: 0.05, drift: 1.5 }
    ]
  },
  'Filtration System': {
    metrics: [
      { label: 'Differential Pressure', base: 0.6, min: 0.3, max: 1.4, unit: 'bar', decimals: 2, noise: 0.02, drift: 1.2 },
      { label: 'Permeate Flow', base: 18.0, min: 14.0, max: 22.0, unit: 'm³/h', decimals: 1, noise: 0.3, drift: 1.8 },
      { label: 'Rejection Rate', base: 98.5, min: 95.0, max: 99.5, unit: '%', decimals: 1, noise: 0.1, drift: 0.8 },
      { label: 'Filter Status', isText: true, textValue: 'NORMAL' }
    ]
  },
  'Piping / Valve Network': {
    metrics: [
      { label: 'Line Pressure', base: 3.2, min: 2.5, max: 4.0, unit: 'bar', decimals: 2, noise: 0.03, drift: 1.5 },
      { label: 'Flow Rate', base: 22.0, min: 16.0, max: 28.0, unit: 'm³/h', decimals: 1, noise: 0.3, drift: 1.8 },
      { label: 'Valve Position', isText: true, textValue: 'OPEN' }
    ]
  },
  'Positioning Drive': {
    metrics: [
      { label: 'Drive Torque', base: 145.0, min: 100.0, max: 190.0, unit: 'N·m', decimals: 1, noise: 1.5, drift: 2.0 },
      { label: 'Position Accuracy', base: 0.05, min: 0.01, max: 0.12, unit: '°', decimals: 2, noise: 0.01, drift: 1.0 },
      { label: 'Motor Temp', base: 48.0, min: 38.0, max: 65.0, unit: '°C', decimals: 1, noise: 0.3, drift: 1.5 },
      { label: 'Drive Status', isText: true, textValue: 'TRACKING' }
    ]
  }
};

/**
 * SensorManager
 * Centralized Live Sensor Telemetry Engine for CHP 3D Digital Twin
 */
export class SensorManager {
  constructor() {
    // Map storing live telemetry states for every unique generator-component instance: rawName -> telemetryState
    this.sensorState = new Map();

    // Generator operational states: genNum -> 'NORMAL' | 'IDLE' | 'ACTIVE'
    this.generatorOperatingStates = new Map([
      [1, 'NORMAL'],
      [2, 'NORMAL'],
      [3, 'NORMAL']
    ]);

    this.initAllComponents();
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

    // Facility / auxiliary parts outside the 3 generator subsystems: map to the closest template
    if (/Pipe|Piping|Loop$/i.test(rawName)) return 'Cooling System';
    if (/^(EBox|ControlCabinet)/i.test(rawName) || /Control/i.test(rawName)) return 'Control System';
    if (/^GeneratorBox/i.test(rawName)) return 'Protective Frame';
    if (/(Drive|Motor|Gearbox|Coupling)/i.test(rawName)) return 'Generator System';
    if (/(Membrane|Filter|Pump|Chemical|Feed|Discharge|Concentrate|Permeate)/i.test(rawName)) return 'Fuel System';
    if (/^(Support|SkidFrame|BaseFrame)/i.test(rawName) || /^Body\d+$/i.test(rawName)) return 'Frame';

    return rawName;
  }

  static getGeneratorNumber(rawName) {
    if (!rawName) return 1;
    if (rawName.endsWith('2')) return 3;
    if (rawName.endsWith('1')) return 2;
    return 1;
  }

  /**
   * Initialize independent sensor state for all components across all 3 generators
   */
  initAllComponents() {
    const componentGroups = {
      1: ['Frame', 'EngineCore', 'BearingSystem', 'LubricationSystem', 'CoolingSystem', 'GeneratorSystem', 'FuelSystem', 'IntakeSystem', 'ExhaustSystem', 'ControlSystem', 'ProtectiveFrame'],
      2: ['Frame1', 'EngineCore1', 'BearingSystem1', 'LubricationSystem1', 'CoolingSystem1', 'GeneratorSystem1', 'FuelSystem1', 'IntakeSystem1', 'ExhaustSystem1', 'ControlSystem1', 'ProtectiveFrame1'],
      3: ['Frame2', 'EngineCore2', 'BearingSystem2', 'LubricationSystem2', 'CoolingSystem2', 'GeneratorSystem2', 'FuelSystem2', 'IntakeSystem2', 'ExhaustSystem2', 'ControlSystem2', 'ProtectiveFrame2']
    };

    Object.entries(componentGroups).forEach(([genNumStr, rawNames]) => {
      const genNum = parseInt(genNumStr, 10);
      rawNames.forEach((rawName) => {
        this.createSensorInstance(rawName, genNum);
      });
    });
  }

  /**
   * Instantiate individual component telemetry instance
   * @param {string} rawName 
   * @param {number} genNum 
   * @param {string} [canonicalOverride] - Use this exact template instead of deriving one from rawName
   */
  createSensorInstance(rawName, genNum, canonicalOverride) {
    const canonicalName = canonicalOverride || SensorManager.getCanonicalName(rawName);
    const template = SENSOR_TEMPLATES[canonicalName] || SENSOR_TEMPLATES['Engine Core'];

    // Seed small unique offset per generator so values aren't identical across Gen 1, 2, 3
    const genSeedOffset = (genNum - 1) * 0.05;

    const metricsState = template.metrics.map((m) => {
      if (m.isText) {
        return {
          label: m.label,
          isText: true,
          value: m.textValue
        };
      }

      const seedBase = m.base * (1.0 + (Math.sin(genNum * 3.7) * 0.03));
      return {
        label: m.label,
        isText: false,
        base: seedBase,
        currentValue: seedBase,
        targetValue: seedBase,
        min: m.min,
        max: m.max,
        unit: m.unit,
        decimals: m.decimals,
        noise: m.noise,
        drift: m.drift,
        targetTimer: Math.random() * 1.5
      };
    });

    this.sensorState.set(rawName, {
      rawName,
      canonicalName,
      generatorNumber: genNum,
      generatorName: genNum ? `Generator ${genNum}` : 'Facility System',
      status: 'NORMAL',
      metrics: metricsState
    });
  }

  /**
   * Bulk pre-register telemetry instances for facility assets with an explicit template each,
   * e.g. Water & Life-Support / Logistics-Drive registry entries. Skips names already registered.
   * @param {{rawName: string, canonicalName: string}[]} entries
   */
  registerNamedInstances(entries) {
    entries.forEach(({ rawName, canonicalName }) => {
      if (!this.sensorState.has(rawName)) {
        this.createSensorInstance(rawName, 0, canonicalName);
      }
    });
  }

  /**
   * Set operating state for a specific generator ('NORMAL' | 'IDLE' | 'ACTIVE')
   * @param {number} genNum 
   * @param {string} state 
   */
  setOperatingState(genNum, state) {
    if (this.generatorOperatingStates.has(genNum)) {
      this.generatorOperatingStates.set(genNum, state);
    }
  }

  /**
   * Retrieve component status
   * @param {string} rawName 
   * @returns {string}
   */
  getComponentStatus(rawName) {
    const compState = this.sensorState.get(rawName);
    if (!compState) return 'NORMAL';
    const genNum = compState.generatorNumber;
    return this.generatorOperatingStates.get(genNum) || 'NORMAL';
  }

  /**
   * Retrieve single formatted sensor metric value
   * @param {string} rawName 
   * @param {string} metricLabel 
   * @returns {string}
   */
  getSensorValue(rawName, metricLabel) {
    const compState = this.sensorState.get(rawName);
    if (!compState) return 'N/A';
    const m = compState.metrics.find(x => x.label === metricLabel);
    if (!m) return 'N/A';
    if (m.isText) return m.value;
    return `${m.currentValue.toFixed(m.decimals)} ${m.unit}`;
  }

  /**
   * Retrieve full sensor telemetry object for UI binding
   * @param {string} rawName 
   * @returns {Object}
   */
  getSensorData(rawName) {
    if (!rawName) {
      return {
        canonicalName: 'Unknown Component',
        generatorName: 'Generator 1',
        status: 'NORMAL',
        metrics: [{ label: 'Status', value: 'Sensor data unavailable' }]
      };
    }

    let compState = this.sensorState.get(rawName);
    if (!compState) {
      const canonicalName = SensorManager.getCanonicalName(rawName);
      const genNum = SensorManager.getGeneratorNumber(rawName);
      this.createSensorInstance(rawName, genNum);
      compState = this.sensorState.get(rawName);
    }

    const opState = this.generatorOperatingStates.get(compState.generatorNumber) || 'NORMAL';

    const formattedMetrics = compState.metrics.map((m) => {
      if (m.isText) {
        return { label: m.label, value: m.value };
      }
      return {
        label: m.label,
        value: `${m.currentValue.toFixed(m.decimals)} ${m.unit}`
      };
    });

    return {
      canonicalName: compState.canonicalName,
      generatorName: compState.generatorName,
      status: opState,
      metrics: formattedMetrics
    };
  }

  /**
   * Continuous smooth simulation update loop
   * Interpolates current values smoothly towards target baselines with controlled noise and drift
   * @param {number} delta - Seconds elapsed
   */
  update(delta) {
    const clampedDelta = Math.min(0.1, delta);

    this.sensorState.forEach((compState) => {
      const genNum = compState.generatorNumber;
      const opState = this.generatorOperatingStates.get(genNum) || 'NORMAL';

      // Operating state multipliers
      let multiplier = 1.0;
      if (opState === 'ACTIVE') {
        multiplier = 1.06;
      } else if (opState === 'IDLE') {
        multiplier = 0.65;
      }

      compState.metrics.forEach((m) => {
        if (m.isText) return;

        // Tick target value timer (pick new target around operating baseline every ~1.5 - 3.0s)
        m.targetTimer -= clampedDelta;
        if (m.targetTimer <= 0) {
          const targetBase = m.base * multiplier;
          const randomWalk = (Math.random() - 0.5) * 2.0 * m.noise;
          m.targetValue = Math.max(m.min, Math.min(m.max, targetBase + randomWalk));
          m.targetTimer = 1.5 + Math.random() * 1.5;
        }

        // Smoothly lerp currentValue toward targetValue
        const lerpSpeed = m.drift;
        m.currentValue += (m.targetValue - m.currentValue) * Math.min(1.0, clampedDelta * lerpSpeed);

        // Add micro-noise jitter for authentic real-time sensor feel
        const jitter = (Math.random() - 0.5) * 0.05 * m.noise;
        m.currentValue = Math.max(m.min, Math.min(m.max, m.currentValue + jitter));
      });
    });
  }
}

// Backwards compatible SENSOR_DATA export fallback
export const SENSOR_DATA = {
  'Bearing System': { status: 'NORMAL', metrics: [{ label: 'RPM', value: '1480' }, { label: 'Temperature', value: '62 °C' }, { label: 'Vibration', value: '2.4 mm/s' }] },
  'Engine Core': { status: 'NORMAL', metrics: [{ label: 'RPM', value: '1480' }, { label: 'Temperature', value: '78 °C' }, { label: 'Oil Pressure', value: '4.2 bar' }] }
};

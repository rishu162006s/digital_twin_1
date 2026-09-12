/**
 * Centralized Predictive Maintenance & Intelligent Condition Analysis Engine
 * CHP 3D Digital Twin - Phase 6
 */

export class ConditionAnalyzer {
  constructor(sensorManager) {
    this.sensorManager = sensorManager;

    // History buffer map: rawName -> Map(label -> array of samples)
    this.historyMap = new Map();
    this.maxHistorySamples = 40; // Rolling window size

    // Health state cache per component: rawName -> healthState
    this.analysisCache = new Map();

    // Controlled Test Anomaly Injection Map: rawName -> anomalyConfig { metricLabel, offset, factor, active }
    this.testAnomalyMap = new Map();

    this.initHistory();
  }

  initHistory() {
    this.sensorManager.sensorState.forEach((compState, rawName) => {
      const labelMap = new Map();
      compState.metrics.forEach((m) => {
        if (!m.isText) {
          labelMap.set(m.label, [m.currentValue]);
        }
      });
      this.historyMap.set(rawName, labelMap);
    });
  }

  /**
   * Controlled Anomaly Injection Test Helper (AC-24, AC-25)
   * Inject or recover controlled anomaly without modifying baseline code
   * @param {string} rawName 
   * @param {'NORMAL'|'WATCH'|'WARNING'|'CRITICAL'} level 
   */
  injectTestAnomaly(rawName, level = 'WARNING') {
    if (!rawName) return;
    if (level === 'NORMAL') {
      this.testAnomalyMap.delete(rawName);
      return;
    }

    const factorMap = {
      'WATCH': { tempFactor: 1.12, vibFactor: 1.4, pressFactor: 0.85 },
      'WARNING': { tempFactor: 1.25, vibFactor: 2.1, pressFactor: 0.70 },
      'CRITICAL': { tempFactor: 1.40, vibFactor: 3.2, pressFactor: 0.50 }
    };

    this.testAnomalyMap.set(rawName, {
      level,
      factors: factorMap[level] || factorMap['WARNING']
    });
  }

  /**
   * Update rolling sample buffers and compute trend direction & slope
   * @param {string} rawName 
   * @param {string} label 
   * @param {number} currentValue 
   * @returns {{ trend: 'STABLE'|'INCREASING'|'DECREASING'|'FLUCTUATING', slope: number, persistenceRatio: number }}
   */
  analyzeTrend(rawName, label, currentValue) {
    let labelMap = this.historyMap.get(rawName);
    if (!labelMap) {
      labelMap = new Map();
      this.historyMap.set(rawName, labelMap);
    }

    let samples = labelMap.get(label);
    if (!samples) {
      samples = [];
      labelMap.set(label, samples);
    }

    samples.push(currentValue);
    if (samples.length > this.maxHistorySamples) {
      samples.shift();
    }

    if (samples.length < 5) {
      return { trend: 'STABLE', slope: 0, persistenceRatio: 0 };
    }

    // Linear regression slope over recent window
    const n = samples.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += samples[i];
      sumXY += i * samples[i];
      sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Calculate variance / noise fluctuation ratio
    const mean = sumY / n;
    let variance = 0;
    for (let i = 0; i < n; i++) {
      variance += Math.pow(samples[i] - mean, 2);
    }
    const stdDev = Math.sqrt(variance / n);

    let trend = 'STABLE';
    if (Math.abs(slope) > 0.02 && stdDev < 1.5 * Math.abs(slope * n)) {
      trend = slope > 0 ? 'INCREASING' : 'DECREASING';
    } else if (stdDev > 0.8) {
      trend = 'FLUCTUATING';
    }

    // Persistence check: proportion of recent samples above mean
    const recentWindow = samples.slice(-10);
    const elevatedCount = recentWindow.filter(v => v > mean + 0.2 * stdDev).length;
    const persistenceRatio = elevatedCount / recentWindow.length;

    return { trend, slope, persistenceRatio };
  }

  /**
   * Core Condition & Health Analysis per Component
   * @param {string} rawName 
   * @returns {Object} Comprehensive Health & Maintenance Analysis State
   */
  analyzeComponent(rawName) {
    const rawData = this.sensorManager.getSensorData(rawName);
    const compState = this.sensorManager.sensorState.get(rawName);

    if (!compState || !rawData) {
      return {
        healthScore: 100,
        healthCategory: 'Excellent',
        anomalyLevel: 'NORMAL',
        conditionState: 'HEALTHY',
        priority: 'LOW',
        simulatedRUL: '> 2500 hrs',
        recommendation: 'No action required.',
        metricsAnalysis: []
      };
    }

    const canonicalName = compState.canonicalName;
    const testAnomaly = this.testAnomalyMap.get(rawName);

    let totalPenalty = 0;
    let maxMetricSeverity = 0; // 0: Normal, 1: Watch, 2: Warning, 3: Critical
    const metricsAnalysis = [];

    // Temporary storage for multi-sensor interaction checks
    const metricValues = {};

    compState.metrics.forEach((m) => {
      if (m.isText) {
        metricsAnalysis.push({ label: m.label, value: m.value, status: 'NORMAL' });
        return;
      }

      let effValue = m.currentValue;

      // Apply test anomaly injection if active
      if (testAnomaly) {
        const f = testAnomaly.factors;
        if (m.label.includes('Temp')) effValue *= f.tempFactor;
        else if (m.label.includes('Vib')) effValue *= f.vibFactor;
        else if (m.label.includes('Press') || m.label.includes('Flow')) effValue *= f.pressFactor;
      }

      metricValues[m.label] = effValue;

      const { trend, slope, persistenceRatio } = this.analyzeTrend(rawName, m.label, effValue);

      // Normal upper operating threshold (82% of max range)
      const normalUpper = m.min + (m.max - m.min) * 0.82;
      const normalLower = m.min + (m.max - m.min) * 0.18;

      let metricPenalty = 0;
      let metricSev = 0; // 0: Normal, 1: Watch, 2: Warning, 3: Critical

      if (effValue > normalUpper) {
        const excess = (effValue - normalUpper) / (m.max - normalUpper);
        metricPenalty += excess * 35.0;

        if (excess > 0.65 && persistenceRatio > 0.6) metricSev = 3; // Critical
        else if (excess > 0.35 && persistenceRatio > 0.5) metricSev = 2; // Warning
        else if (excess > 0.10) metricSev = 1; // Watch
      } else if (effValue < normalLower && m.label.includes('Press')) {
        const deficit = (normalLower - effValue) / (normalLower - m.min);
        metricPenalty += deficit * 30.0;
        if (deficit > 0.6) metricSev = 3;
        else if (deficit > 0.3) metricSev = 2;
        else metricSev = 1;
      }

      // Rising trend penalty (sustained slope increases anomaly score)
      if (trend === 'INCREASING' && persistenceRatio > 0.7) {
        metricPenalty += Math.min(15.0, Math.abs(slope) * 20.0);
        if (metricSev === 0) metricSev = 1;
      }

      totalPenalty += metricPenalty;
      maxMetricSeverity = Math.max(maxMetricSeverity, metricSev);

      metricsAnalysis.push({
        label: m.label,
        value: `${effValue.toFixed(m.decimals)} ${m.unit}`,
        trend,
        severity: metricSev
      });
    });

    // --- Multi-Sensor Interaction Rules (Component-Specific Engineering Correlation) ---
    let correlationPenalty = 0;

    if (canonicalName === 'Bearing System' || canonicalName === 'Engine Core') {
      const temp = metricValues['Bearing Temp'] || metricValues['Temperature'] || 65;
      const vib = metricValues['Vibration'] || 1.5;
      if (temp > 75 && vib > 2.6) {
        correlationPenalty += 20; // Compound thermal + mechanical stress
        maxMetricSeverity = Math.max(maxMetricSeverity, 2);
      }
    } else if (canonicalName === 'Cooling System') {
      const temp = metricValues['Coolant Temp'] || 65;
      const flow = metricValues['Flow Rate'] || 40;
      if (temp > 76 && flow < 36) {
        correlationPenalty += 22; // Low flow thermal bottleneck
        maxMetricSeverity = Math.max(maxMetricSeverity, 2);
      }
    } else if (canonicalName === 'Generator System') {
      const rpm = metricValues['Generator RPM'] || 1500;
      const power = metricValues['Output Power'] || 420;
      if (Math.abs(rpm - 1500) > 25 && power > 440) {
        correlationPenalty += 18;
        maxMetricSeverity = Math.max(maxMetricSeverity, 1);
      }
    }

    totalPenalty += correlationPenalty;

    // Smooth Health Score calculation (bounded 0 - 100)
    const rawHealth = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));
    
    // Retrieve cached health for smooth lerping
    let cached = this.analysisCache.get(rawName);
    let smoothHealth = rawHealth;
    if (cached && cached.healthScore !== undefined) {
      smoothHealth = Math.round(cached.healthScore + (rawHealth - cached.healthScore) * 0.15);
    }

    // Determine Anomaly Level
    let anomalyLevel = 'NORMAL';
    if (maxMetricSeverity === 3 || smoothHealth < 40) anomalyLevel = 'CRITICAL';
    else if (maxMetricSeverity === 2 || smoothHealth < 65) anomalyLevel = 'WARNING';
    else if (maxMetricSeverity === 1 || smoothHealth < 85) anomalyLevel = 'WATCH';

    // Health Category & Condition State
    let healthCategory = 'Excellent';
    let conditionState = 'HEALTHY';
    let priority = 'LOW';

    if (smoothHealth >= 90) {
      healthCategory = 'Excellent';
      conditionState = 'HEALTHY';
      priority = 'LOW';
    } else if (smoothHealth >= 75) {
      healthCategory = 'Healthy';
      conditionState = 'STABLE';
      priority = 'LOW';
    } else if (smoothHealth >= 50) {
      healthCategory = 'Attention';
      conditionState = 'TRENDING ABNORMAL';
      priority = 'MEDIUM';
    } else if (smoothHealth >= 25) {
      healthCategory = 'Degrading';
      conditionState = 'DEGRADING';
      priority = 'HIGH';
    } else {
      healthCategory = 'Critical';
      conditionState = 'ATTENTION REQUIRED';
      priority = 'CRITICAL';
    }

    // Simulated Remaining Useful Life (Derived deterministically from health score & trend)
    let simulatedRUL = '> 2500 hrs';
    if (smoothHealth < 95) {
      const hours = Math.round(Math.max(24, (smoothHealth / 100) * 2200));
      simulatedRUL = `~ ${hours} hrs (SIMULATED RUL)`;
    }

    // Component-Tailored Maintenance Insights
    const recommendation = this.generateRecommendation(canonicalName, anomalyLevel, metricValues);

    const result = {
      rawName,
      canonicalName,
      generatorName: compState.generatorName,
      healthScore: smoothHealth,
      healthCategory,
      anomalyLevel,
      conditionState,
      priority,
      simulatedRUL,
      recommendation,
      metricsAnalysis
    };

    this.analysisCache.set(rawName, result);
    return result;
  }

  /**
   * Component-Specific Predictive Maintenance Insight Generator
   */
  generateRecommendation(canonicalName, anomalyLevel, values) {
    if (anomalyLevel === 'NORMAL') {
      return 'Component operating within nominal parameters. No maintenance action required.';
    }

    switch (canonicalName) {
      case 'Engine Core':
        return 'Inspect thermal load distribution, oil pressure, and engine core lubrication.';
      case 'Bearing System':
        return 'Inspect bearing lubrication condition, alignment, and mechanical vibration levels.';
      case 'Lubrication System':
        return 'Inspect oil filter cleanliness, pump pressure, and oil heat exchanger.';
      case 'Cooling System':
        return 'Inspect coolant flow rate, radiator clearance, and fan motor performance.';
      case 'Generator System':
        return 'Inspect generator stator temperature, output voltage stability, and bearing vibration.';
      case 'Fuel System':
        return 'Inspect fuel delivery pressure, injector line filters, and fuel temperature.';
      case 'Intake System':
        return 'Inspect intake air filter restriction and manifold pressure differential.';
      case 'Exhaust System':
        return 'Inspect exhaust manifold backpressure, gas flow velocity, and thermal seals.';
      case 'Control System':
        return 'Inspect control module thermal dissipation, voltage regulators, and signal wiring.';
      case 'Frame':
        return 'Inspect structural mounting bolt torque, frame vibration damping, and base load distribution.';
      case 'Protective Frame':
        return 'Inspect enclosure panel latching, mounting dampeners, and protective shielding.';
      default:
        return 'Perform routine inspection of operational component parameters.';
    }
  }

  /**
   * Global System Health Calculation across all 33 component instances
   * Weighted average with priority given to core subsystems
   * @returns {{ systemHealthScore: number, systemStatus: string, activeCount: number, attentionCount: number, criticalCount: number }}
   */
  getGlobalSystemHealth() {
    let weightedSum = 0;
    let totalWeight = 0;

    let activeCount = 0;
    let attentionCount = 0;
    let criticalCount = 0;

    this.sensorManager.sensorState.forEach((compState, rawName) => {
      const analysis = this.analyzeComponent(rawName);
      
      let weight = 1.0;
      if (compState.canonicalName === 'Engine Core' || compState.canonicalName === 'Bearing System' || compState.canonicalName === 'Generator System') {
        weight = 1.8;
      }

      weightedSum += analysis.healthScore * weight;
      totalWeight += weight;

      if (analysis.anomalyLevel === 'CRITICAL') {
        criticalCount++;
      } else if (analysis.anomalyLevel === 'WARNING' || analysis.anomalyLevel === 'WATCH') {
        attentionCount++;
      } else {
        activeCount++;
      }
    });

    const systemHealthScore = Math.round(totalWeight > 0 ? weightedSum / totalWeight : 100);

    let systemStatus = 'NORMAL';
    if (criticalCount > 0 || systemHealthScore < 50) systemStatus = 'CRITICAL';
    else if (attentionCount > 2 || systemHealthScore < 75) systemStatus = 'WARNING';
    else if (attentionCount > 0 || systemHealthScore < 88) systemStatus = 'WATCH';

    return {
      systemHealthScore,
      systemStatus,
      activeCount,
      attentionCount,
      criticalCount
    };
  }
}

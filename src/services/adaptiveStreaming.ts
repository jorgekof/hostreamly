/**
 * Adaptive Streaming System
 * ML-powered bitrate optimization with real-time network analysis
 */

interface NetworkConditions {
  bandwidth: number; // Mbps
  latency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  signalStrength?: number; // for cellular/wifi
  timestamp: number;
}

interface QualityLevel {
  id: string;
  width: number;
  height: number;
  bitrate: number; // kbps
  framerate: number;
  codec: string;
  profile: string;
  bufferTarget: number; // seconds
}

interface StreamingMetrics {
  currentBitrate: number;
  averageBitrate: number;
  bufferLevel: number;
  droppedFrames: number;
  stallEvents: number;
  qualitySwitches: number;
  startupTime: number;
  rebufferingTime: number;
  playbackQuality: number; // 0-1 score
}

interface DeviceCapabilities {
  maxResolution: { width: number; height: number };
  supportedCodecs: string[];
  hardwareDecoding: boolean;
  maxBitrate: number;
  cpuCores: number;
  memoryGB: number;
  gpuAcceleration: boolean;
}

interface UserPreferences {
  preferredQuality: 'auto' | '4K' | '1080p' | '720p' | '480p' | '360p';
  dataSaving: boolean;
  autoQuality: boolean;
  maxBandwidthUsage?: number; // Mbps
  batteryOptimization: boolean;
}

interface AdaptationDecision {
  targetQuality: QualityLevel;
  reason: string;
  confidence: number;
  expectedBufferTime: number;
  riskLevel: 'low' | 'medium' | 'high';
}

class NetworkAnalyzer {
  private measurements: NetworkConditions[] = [];
  private measurementInterval: NodeJS.Timeout | null = null;
  private bandwidthHistory: number[] = [];
  private latencyHistory: number[] = [];
  private readonly maxHistorySize = 100;

  constructor() {
    this.startContinuousMonitoring();
  }

  async getCurrentConditions(): Promise<NetworkConditions> {
    const bandwidth = await this.measureBandwidth();
    const latency = await this.measureLatency();
    const packetLoss = await this.measurePacketLoss();
    const jitter = await this.measureJitter();
    const connectionType = await this.detectConnectionType();
    
    const conditions: NetworkConditions = {
      bandwidth,
      latency,
      packetLoss,
      jitter,
      connectionType,
      timestamp: Date.now()
    };

    this.addMeasurement(conditions);
    return conditions;
  }

  getPredictedBandwidth(lookAheadSeconds: number = 10): number {
    if (this.bandwidthHistory.length < 3) {
      return this.bandwidthHistory[this.bandwidthHistory.length - 1] || 1;
    }

    // Simple linear regression for bandwidth prediction
    const recentMeasurements = this.bandwidthHistory.slice(-20);
    const n = recentMeasurements.length;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += recentMeasurements[i];
      sumXY += i * recentMeasurements[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predictedBandwidth = slope * (n + lookAheadSeconds) + intercept;
    
    // Apply smoothing and bounds
    const currentBandwidth = recentMeasurements[n - 1];
    const smoothedPrediction = currentBandwidth * 0.7 + predictedBandwidth * 0.3;
    
    return Math.max(0.1, Math.min(smoothedPrediction, currentBandwidth * 2));
  }

  getNetworkStability(): number {
    if (this.bandwidthHistory.length < 5) return 0.5;
    
    const recent = this.bandwidthHistory.slice(-10);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / recent.length;
    const stdDev = Math.sqrt(variance);
    
    // Stability score: lower coefficient of variation = higher stability
    const coefficientOfVariation = stdDev / mean;
    return Math.max(0, 1 - coefficientOfVariation);
  }

  private async measureBandwidth(): Promise<number> {
    try {
      // Simulate bandwidth measurement (in real implementation, use actual network tests)
      const connection = (navigator as any).connection;
      if (connection && connection.downlink) {
        return connection.downlink;
      }
      
      // Fallback: measure download speed of small test file
      const testUrl = '/api/bandwidth-test';
      const startTime = performance.now();
      const response = await fetch(testUrl);
      const data = await response.arrayBuffer();
      const endTime = performance.now();
      
      const durationSeconds = (endTime - startTime) / 1000;
      const sizeBytes = data.byteLength;
      const sizeMbits = (sizeBytes * 8) / (1024 * 1024);
      
      return sizeMbits / durationSeconds;
    } catch (error) {
      console.warn('Bandwidth measurement failed:', error);
      return this.bandwidthHistory[this.bandwidthHistory.length - 1] || 5; // Default 5 Mbps
    }
  }

  private async measureLatency(): Promise<number> {
    try {
      const startTime = performance.now();
      await fetch('/api/ping', { method: 'HEAD' });
      const endTime = performance.now();
      return endTime - startTime;
    } catch (error) {
      return 100; // Default 100ms
    }
  }

  private async measurePacketLoss(): Promise<number> {
    // Simplified packet loss estimation
    const connection = (navigator as any).connection;
    if (connection && connection.rtt) {
      // Estimate packet loss based on RTT variability
      const rttVariability = this.latencyHistory.length > 1 ? 
        Math.abs(connection.rtt - this.latencyHistory[this.latencyHistory.length - 1]) : 0;
      return Math.min(rttVariability / 1000, 0.1); // Max 10% estimated loss
    }
    return 0;
  }

  private async measureJitter(): Promise<number> {
    if (this.latencyHistory.length < 2) return 0;
    
    const recent = this.latencyHistory.slice(-5);
    let jitterSum = 0;
    
    for (let i = 1; i < recent.length; i++) {
      jitterSum += Math.abs(recent[i] - recent[i - 1]);
    }
    
    return jitterSum / (recent.length - 1);
  }

  private async detectConnectionType(): Promise<NetworkConditions['connectionType']> {
    const connection = (navigator as any).connection;
    if (connection) {
      if (connection.type === 'wifi') return 'wifi';
      if (connection.type === 'cellular') return 'cellular';
      if (connection.type === 'ethernet') return 'ethernet';
    }
    return 'unknown';
  }

  private addMeasurement(conditions: NetworkConditions): void {
    this.measurements.push(conditions);
    this.bandwidthHistory.push(conditions.bandwidth);
    this.latencyHistory.push(conditions.latency);
    
    // Keep history size manageable
    if (this.measurements.length > this.maxHistorySize) {
      this.measurements.shift();
    }
    if (this.bandwidthHistory.length > this.maxHistorySize) {
      this.bandwidthHistory.shift();
    }
    if (this.latencyHistory.length > this.maxHistorySize) {
      this.latencyHistory.shift();
    }
  }

  private startContinuousMonitoring(): void {
    this.measurementInterval = setInterval(async () => {
      try {
        await this.getCurrentConditions();
      } catch (error) {
        console.warn('Network monitoring error:', error);
      }
    }, 5000); // Measure every 5 seconds
  }

  destroy(): void {
    if (this.measurementInterval) {
      clearInterval(this.measurementInterval);
    }
  }
}

class MLBitrateOptimizer {
  private decisionHistory: AdaptationDecision[] = [];
  private performanceHistory: { decision: AdaptationDecision; actualPerformance: StreamingMetrics }[] = [];
  private weights = {
    bandwidth: 0.4,
    buffer: 0.3,
    stability: 0.2,
    device: 0.1
  };

  optimizeQuality(
    availableQualities: QualityLevel[],
    networkConditions: NetworkConditions,
    currentMetrics: StreamingMetrics,
    deviceCapabilities: DeviceCapabilities,
    userPreferences: UserPreferences,
    bufferLevel: number
  ): AdaptationDecision {
    const candidates = this.filterQualitiesByConstraints(
      availableQualities,
      deviceCapabilities,
      userPreferences
    );

    let bestCandidate: QualityLevel | null = null;
    let bestScore = -1;
    let bestReason = '';
    let bestConfidence = 0;

    for (const quality of candidates) {
      const score = this.calculateQualityScore(
        quality,
        networkConditions,
        currentMetrics,
        deviceCapabilities,
        userPreferences,
        bufferLevel
      );

      if (score.total > bestScore) {
        bestScore = score.total;
        bestCandidate = quality;
        bestReason = score.reason;
        bestConfidence = score.confidence;
      }
    }

    if (!bestCandidate) {
      bestCandidate = candidates[0] || availableQualities[0];
      bestReason = 'Fallback to lowest quality';
      bestConfidence = 0.5;
    }

    const decision: AdaptationDecision = {
      targetQuality: bestCandidate,
      reason: bestReason,
      confidence: bestConfidence,
      expectedBufferTime: this.estimateBufferTime(bestCandidate, networkConditions),
      riskLevel: this.assessRiskLevel(bestCandidate, networkConditions, bufferLevel)
    };

    this.recordDecision(decision);
    return decision;
  }

  updatePerformanceFeedback(decision: AdaptationDecision, actualMetrics: StreamingMetrics): void {
    this.performanceHistory.push({ decision, actualPerformance: actualMetrics });
    
    // Keep history manageable
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }

    // Update ML weights based on performance
    this.updateWeights(decision, actualMetrics);
  }

  private filterQualitiesByConstraints(
    qualities: QualityLevel[],
    device: DeviceCapabilities,
    preferences: UserPreferences
  ): QualityLevel[] {
    return qualities.filter(quality => {
      // Device capability constraints
      if (quality.width > device.maxResolution.width || 
          quality.height > device.maxResolution.height) {
        return false;
      }

      if (quality.bitrate > device.maxBitrate) {
        return false;
      }

      if (!device.supportedCodecs.includes(quality.codec)) {
        return false;
      }

      // User preference constraints
      if (preferences.preferredQuality !== 'auto') {
        const maxHeight = this.getMaxHeightForPreference(preferences.preferredQuality);
        if (quality.height > maxHeight) {
          return false;
        }
      }

      if (preferences.maxBandwidthUsage && 
          quality.bitrate / 1000 > preferences.maxBandwidthUsage) {
        return false;
      }

      return true;
    });
  }

  private calculateQualityScore(
    quality: QualityLevel,
    network: NetworkConditions,
    metrics: StreamingMetrics,
    device: DeviceCapabilities,
    preferences: UserPreferences,
    bufferLevel: number
  ): { total: number; reason: string; confidence: number } {
    const bandwidthScore = this.calculateBandwidthScore(quality, network);
    const bufferScore = this.calculateBufferScore(quality, bufferLevel, network);
    const stabilityScore = this.calculateStabilityScore(quality, network);
    const deviceScore = this.calculateDeviceScore(quality, device);
    const preferenceScore = this.calculatePreferenceScore(quality, preferences);

    const totalScore = 
      bandwidthScore.score * this.weights.bandwidth +
      bufferScore.score * this.weights.buffer +
      stabilityScore.score * this.weights.stability +
      deviceScore.score * this.weights.device;

    // Determine primary reason
    const scores = [
      { name: 'bandwidth', score: bandwidthScore.score, reason: bandwidthScore.reason },
      { name: 'buffer', score: bufferScore.score, reason: bufferScore.reason },
      { name: 'stability', score: stabilityScore.score, reason: stabilityScore.reason },
      { name: 'device', score: deviceScore.score, reason: deviceScore.reason }
    ];

    const primaryFactor = scores.reduce((max, current) => 
      current.score > max.score ? current : max
    );

    const confidence = Math.min(totalScore, 1);

    return {
      total: totalScore,
      reason: primaryFactor.reason,
      confidence
    };
  }

  private calculateBandwidthScore(quality: QualityLevel, network: NetworkConditions): { score: number; reason: string } {
    const requiredBandwidth = quality.bitrate / 1000; // Convert to Mbps
    const availableBandwidth = network.bandwidth;
    const utilizationRatio = requiredBandwidth / availableBandwidth;

    let score: number;
    let reason: string;

    if (utilizationRatio <= 0.7) {
      score = 1.0;
      reason = `Excellent bandwidth utilization (${(utilizationRatio * 100).toFixed(1)}%)`;
    } else if (utilizationRatio <= 0.85) {
      score = 0.8;
      reason = `Good bandwidth utilization (${(utilizationRatio * 100).toFixed(1)}%)`;
    } else if (utilizationRatio <= 1.0) {
      score = 0.5;
      reason = `High bandwidth utilization (${(utilizationRatio * 100).toFixed(1)}%)`;
    } else {
      score = 0.1;
      reason = `Insufficient bandwidth (needs ${requiredBandwidth.toFixed(1)}Mbps, available ${availableBandwidth.toFixed(1)}Mbps)`;
    }

    return { score, reason };
  }

  private calculateBufferScore(quality: QualityLevel, bufferLevel: number, network: NetworkConditions): { score: number; reason: string } {
    const targetBuffer = quality.bufferTarget;
    const bufferRatio = bufferLevel / targetBuffer;

    let score: number;
    let reason: string;

    if (bufferRatio >= 1.0) {
      score = 1.0;
      reason = `Buffer level healthy (${bufferLevel.toFixed(1)}s)`;
    } else if (bufferRatio >= 0.7) {
      score = 0.8;
      reason = `Buffer level adequate (${bufferLevel.toFixed(1)}s)`;
    } else if (bufferRatio >= 0.3) {
      score = 0.5;
      reason = `Buffer level low (${bufferLevel.toFixed(1)}s)`;
    } else {
      score = 0.2;
      reason = `Buffer level critical (${bufferLevel.toFixed(1)}s)`;
    }

    // Adjust score based on network stability
    if (network.packetLoss > 0.05) {
      score *= 0.8;
      reason += ', unstable network detected';
    }

    return { score, reason };
  }

  private calculateStabilityScore(quality: QualityLevel, network: NetworkConditions): { score: number; reason: string } {
    let score = 1.0;
    let reason = 'Network conditions stable';

    // Penalize for high latency
    if (network.latency > 200) {
      score *= 0.7;
      reason = `High latency (${network.latency.toFixed(0)}ms)`;
    } else if (network.latency > 100) {
      score *= 0.9;
      reason = `Moderate latency (${network.latency.toFixed(0)}ms)`;
    }

    // Penalize for packet loss
    if (network.packetLoss > 0.05) {
      score *= 0.6;
      reason += `, packet loss (${(network.packetLoss * 100).toFixed(1)}%)`;
    } else if (network.packetLoss > 0.01) {
      score *= 0.8;
      reason += `, minor packet loss (${(network.packetLoss * 100).toFixed(1)}%)`;
    }

    // Penalize for high jitter
    if (network.jitter > 50) {
      score *= 0.7;
      reason += `, high jitter (${network.jitter.toFixed(0)}ms)`;
    }

    return { score, reason };
  }

  private calculateDeviceScore(quality: QualityLevel, device: DeviceCapabilities): { score: number; reason: string } {
    let score = 1.0;
    let reason = 'Device capable';

    // Check resolution capability
    const resolutionRatio = (quality.width * quality.height) / 
                           (device.maxResolution.width * device.maxResolution.height);
    
    if (resolutionRatio > 0.8) {
      score *= 0.9;
      reason = 'High resolution load on device';
    }

    // Check hardware decoding
    if (!device.hardwareDecoding && quality.bitrate > 5000) {
      score *= 0.7;
      reason += ', software decoding required';
    }

    // Check CPU capability
    if (device.cpuCores < 4 && quality.height > 1080) {
      score *= 0.8;
      reason += ', limited CPU for high resolution';
    }

    return { score, reason };
  }

  private calculatePreferenceScore(quality: QualityLevel, preferences: UserPreferences): number {
    if (preferences.preferredQuality === 'auto') {
      return 1.0;
    }

    const preferredHeight = this.getMaxHeightForPreference(preferences.preferredQuality);
    const heightDiff = Math.abs(quality.height - preferredHeight);
    
    return Math.max(0.1, 1 - (heightDiff / preferredHeight));
  }

  private getMaxHeightForPreference(preference: string): number {
    const heights = {
      '4K': 2160,
      '1080p': 1080,
      '720p': 720,
      '480p': 480,
      '360p': 360
    };
    return heights[preference as keyof typeof heights] || 1080;
  }

  private estimateBufferTime(quality: QualityLevel, network: NetworkConditions): number {
    const downloadRate = network.bandwidth * 1000; // Convert to kbps
    const segmentDuration = 10; // Assume 10-second segments
    const segmentSize = (quality.bitrate * segmentDuration) / 8; // Convert to bytes
    
    return (segmentSize / downloadRate) * 8; // Time to download one segment
  }

  private assessRiskLevel(
    quality: QualityLevel, 
    network: NetworkConditions, 
    bufferLevel: number
  ): 'low' | 'medium' | 'high' {
    const bandwidthUtilization = (quality.bitrate / 1000) / network.bandwidth;
    
    if (bufferLevel < 5 && bandwidthUtilization > 0.9) {
      return 'high';
    }
    
    if (bufferLevel < 10 && bandwidthUtilization > 0.8) {
      return 'medium';
    }
    
    if (network.packetLoss > 0.05 || network.latency > 200) {
      return 'medium';
    }
    
    return 'low';
  }

  private recordDecision(decision: AdaptationDecision): void {
    this.decisionHistory.push(decision);
    
    if (this.decisionHistory.length > 50) {
      this.decisionHistory.shift();
    }
  }

  private updateWeights(decision: AdaptationDecision, metrics: StreamingMetrics): void {
    // Simple reinforcement learning: adjust weights based on performance
    const performanceScore = this.calculatePerformanceScore(metrics);
    const learningRate = 0.01;
    
    if (performanceScore > 0.8) {
      // Good performance, reinforce current weights
      // No change needed
    } else if (performanceScore < 0.5) {
      // Poor performance, adjust weights
      if (metrics.stallEvents > 0) {
        this.weights.bandwidth += learningRate;
        this.weights.buffer += learningRate;
      }
      
      if (metrics.droppedFrames > 10) {
        this.weights.device += learningRate;
      }
      
      // Normalize weights
      const total = Object.values(this.weights).reduce((a, b) => a + b, 0);
      Object.keys(this.weights).forEach(key => {
        this.weights[key as keyof typeof this.weights] /= total;
      });
    }
  }

  private calculatePerformanceScore(metrics: StreamingMetrics): number {
    let score = 1.0;
    
    // Penalize for stalls
    score -= metrics.stallEvents * 0.2;
    
    // Penalize for dropped frames
    score -= (metrics.droppedFrames / 100) * 0.1;
    
    // Penalize for excessive quality switches
    score -= (metrics.qualitySwitches / 10) * 0.1;
    
    // Penalize for long startup time
    if (metrics.startupTime > 3000) {
      score -= 0.1;
    }
    
    return Math.max(0, score);
  }
}

export class AdaptiveStreamingSystem {
  private networkAnalyzer: NetworkAnalyzer;
  private bitrateOptimizer: MLBitrateOptimizer;
  private currentQuality: QualityLevel | null = null;
  private metrics: StreamingMetrics;
  private isActive = false;
  private optimizationInterval: NodeJS.Timeout | null = null;

  constructor(
    private availableQualities: QualityLevel[],
    private deviceCapabilities: DeviceCapabilities,
    private userPreferences: UserPreferences
  ) {
    this.networkAnalyzer = new NetworkAnalyzer();
    this.bitrateOptimizer = new MLBitrateOptimizer();
    
    this.metrics = {
      currentBitrate: 0,
      averageBitrate: 0,
      bufferLevel: 0,
      droppedFrames: 0,
      stallEvents: 0,
      qualitySwitches: 0,
      startupTime: 0,
      rebufferingTime: 0,
      playbackQuality: 0
    };
  }

  async start(): Promise<void> {
    this.isActive = true;
    
    // Initial quality selection
    const networkConditions = await this.networkAnalyzer.getCurrentConditions();
    const decision = this.bitrateOptimizer.optimizeQuality(
      this.availableQualities,
      networkConditions,
      this.metrics,
      this.deviceCapabilities,
      this.userPreferences,
      0 // Initial buffer level
    );
    
    this.currentQuality = decision.targetQuality;
    this.metrics.currentBitrate = decision.targetQuality.bitrate;
    
    // Start continuous optimization
    this.startOptimizationLoop();
    

  }

  async optimizeQuality(bufferLevel: number): Promise<AdaptationDecision | null> {
    if (!this.isActive || !this.currentQuality) {
      return null;
    }

    const networkConditions = await this.networkAnalyzer.getCurrentConditions();
    const decision = this.bitrateOptimizer.optimizeQuality(
      this.availableQualities,
      networkConditions,
      this.metrics,
      this.deviceCapabilities,
      this.userPreferences,
      bufferLevel
    );

    // Only switch if there's a significant benefit or risk
    const shouldSwitch = this.shouldSwitchQuality(decision, bufferLevel);
    
    if (shouldSwitch) {
      const previousQuality = this.currentQuality;
      this.currentQuality = decision.targetQuality;
      this.metrics.qualitySwitches++;
      this.metrics.currentBitrate = decision.targetQuality.bitrate;
      

      
      return decision;
    }

    return null;
  }

  updateMetrics(newMetrics: Partial<StreamingMetrics>): void {
    Object.assign(this.metrics, newMetrics);
    
    // Update average bitrate
    if (this.currentQuality) {
      const currentBitrate = this.currentQuality.bitrate;
      this.metrics.averageBitrate = 
        (this.metrics.averageBitrate * 0.9) + (currentBitrate * 0.1);
    }
    
    // Provide feedback to ML optimizer
    if (this.currentQuality) {
      const lastDecision: AdaptationDecision = {
        targetQuality: this.currentQuality,
        reason: 'Current quality',
        confidence: 1,
        expectedBufferTime: 0,
        riskLevel: 'low'
      };
      
      this.bitrateOptimizer.updatePerformanceFeedback(lastDecision, this.metrics);
    }
  }

  getCurrentQuality(): QualityLevel | null {
    return this.currentQuality;
  }

  getMetrics(): StreamingMetrics {
    return { ...this.metrics };
  }

  getNetworkConditions(): Promise<NetworkConditions> {
    return this.networkAnalyzer.getCurrentConditions();
  }

  getPredictedBandwidth(lookAheadSeconds?: number): number {
    return this.networkAnalyzer.getPredictedBandwidth(lookAheadSeconds);
  }

  getNetworkStability(): number {
    return this.networkAnalyzer.getNetworkStability();
  }

  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    Object.assign(this.userPreferences, preferences);
  }

  stop(): void {
    this.isActive = false;
    
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
  }

  destroy(): void {
    this.stop();
    this.networkAnalyzer.destroy();
  }

  private shouldSwitchQuality(decision: AdaptationDecision, bufferLevel: number): boolean {
    if (!this.currentQuality) {
      return true;
    }

    const currentBitrate = this.currentQuality.bitrate;
    const targetBitrate = decision.targetQuality.bitrate;
    const bitrateChange = Math.abs(targetBitrate - currentBitrate) / currentBitrate;

    // Don't switch for small changes unless confidence is very high
    if (bitrateChange < 0.2 && decision.confidence < 0.8) {
      return false;
    }

    // Always switch if risk is high and we're switching to lower quality
    if (decision.riskLevel === 'high' && targetBitrate < currentBitrate) {
      return true;
    }

    // Switch if buffer is healthy and we can upgrade significantly
    if (bufferLevel > 15 && targetBitrate > currentBitrate && bitrateChange > 0.3) {
      return true;
    }

    // Switch if buffer is low and we need to downgrade
    if (bufferLevel < 5 && targetBitrate < currentBitrate) {
      return true;
    }

    // Switch if confidence is very high
    if (decision.confidence > 0.9) {
      return true;
    }

    return false;
  }

  private startOptimizationLoop(): void {
    this.optimizationInterval = setInterval(async () => {
      if (!this.isActive) return;
      
      try {
        // Simulate buffer level (in real implementation, get from video player)
        const bufferLevel = Math.random() * 20 + 5; // 5-25 seconds
        await this.optimizeQuality(bufferLevel);
      } catch (error) {
        console.error('Optimization loop error:', error);
      }
    }, 3000); // Optimize every 3 seconds
  }
}

export default AdaptiveStreamingSystem;
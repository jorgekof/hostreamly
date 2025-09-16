import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { useHostreamly } from '../../sdk/react-native/HostreamlySDK';
import type {
  VideoMetadata,
  PlaybackOptions,
  DownloadOptions,
  DownloadProgress,
  PlaybackState,
  HostreamlyConfig
} from '../../sdk/react-native/HostreamlySDK';
import type { BunnyResolution } from '../../config/bunnyConfig';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface HostreamlyPlayerProps {
  videoId: string;
  config: HostreamlyConfig;
  autoplay?: boolean;
  enableOffline?: boolean;
  enableAnalytics?: boolean;
  onVideoLoad?: (metadata: VideoMetadata) => void;
  onPlaybackStateChange?: (state: PlaybackState) => void;
  onDownloadProgress?: (progress: DownloadProgress) => void;
  onError?: (error: string) => void;
}

const HostreamlyPlayer: React.FC<HostreamlyPlayerProps> = ({
  videoId,
  config,
  autoplay = false,
  enableOffline = true,
  enableAnalytics = true,
  onVideoLoad,
  onPlaybackStateChange,
  onDownloadProgress,
  onError
}) => {
  const hostreamly = useHostreamly();
  
  // Estados del componente
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<BunnyResolution>('720p');
  const [volume, setVolume] = useState(1.0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(hostreamly.getNetworkInfo());
  
  // Referencias
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressUpdateRef = useRef<NodeJS.Timeout | null>(null);
  
  // Inicialización del SDK
  useEffect(() => {
    initializeSDK();
    
    return () => {
      cleanup();
    };
  }, []);
  
  // Monitoreo de red
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkInfo(hostreamly.getNetworkInfo());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Actualización de progreso de descarga
  useEffect(() => {
    if (enableOffline) {
      const interval = setInterval(() => {
        const progress = hostreamly.getDownloadProgress(videoId);
        if (progress) {
          setDownloadProgress(progress);
          onDownloadProgress?.(progress);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [videoId, enableOffline]);
  
  // Actualización de estado de reproducción
  useEffect(() => {
    if (isInitialized) {
      progressUpdateRef.current = setInterval(() => {
        const state = hostreamly.getPlaybackState(videoId);
        if (state) {
          setPlaybackState(state);
          onPlaybackStateChange?.(state);
        }
      }, 500);
      
      return () => {
        if (progressUpdateRef.current) {
          clearInterval(progressUpdateRef.current);
        }
      };
    }
  }, [isInitialized, videoId]);
  
  // Ocultar controles automáticamente
  useEffect(() => {
    if (showControls && playbackState?.isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, playbackState?.isPlaying]);
  
  const initializeSDK = async () => {
    try {
      setIsLoading(true);
      
      const success = await hostreamly.initialize({
        ...config,
        enableOfflineMode: enableOffline,
        enableAnalytics
      });
      
      if (success) {
        setIsInitialized(true);
        await loadVideo();
      } else {
        throw new Error('Failed to initialize Hostreamly SDK');
      }
    } catch (error) {
      console.error('SDK initialization error:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
      Alert.alert('Error', 'Failed to initialize video player');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadVideo = async () => {
    try {
      setIsLoading(true);
      
      const playbackOptions: PlaybackOptions = {
        autoplay,
        enableAdaptiveStreaming: true,
        enableOfflinePlayback: isOfflineMode,
        enablePictureInPicture: Platform.OS === 'ios',
        enableBackgroundPlayback: true,
        quality: selectedQuality,
        volume,
        playbackRate
      };
      
      const metadata = await hostreamly.loadVideo(videoId, playbackOptions);
      setVideoMetadata(metadata);
      onVideoLoad?.(metadata);
      
      // Configurar calidad inicial
      if (metadata.resolutions.length > 0) {
        const defaultQuality = metadata.resolutions.find(r => r === '720p') || metadata.resolutions[0];
        setSelectedQuality(defaultQuality);
        await hostreamly.setQuality(videoId, defaultQuality);
      }
    } catch (error) {
      console.error('Video loading error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to load video');
      Alert.alert('Error', 'Failed to load video');
    } finally {
      setIsLoading(false);
    }
  };
  
  const cleanup = async () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (progressUpdateRef.current) {
      clearInterval(progressUpdateRef.current);
    }
    
    if (isInitialized) {
      await hostreamly.cleanup();
    }
  };
  
  // Controles de reproducción
  const handlePlayPause = useCallback(async () => {
    try {
      if (playbackState?.isPlaying) {
        await hostreamly.pause(videoId);
      } else {
        await hostreamly.play(videoId);
      }
    } catch (error) {
      console.error('Play/pause error:', error);
      onError?.(error instanceof Error ? error.message : 'Playback error');
    }
  }, [videoId, playbackState?.isPlaying]);
  
  const handleSeek = useCallback(async (time: number) => {
    try {
      await hostreamly.seek(videoId, time);
    } catch (error) {
      console.error('Seek error:', error);
      onError?.(error instanceof Error ? error.message : 'Seek error');
    }
  }, [videoId]);
  
  const handleQualityChange = useCallback(async (quality: BunnyResolution) => {
    try {
      await hostreamly.setQuality(videoId, quality);
      setSelectedQuality(quality);
      setShowQualitySelector(false);
    } catch (error) {
      console.error('Quality change error:', error);
      onError?.(error instanceof Error ? error.message : 'Quality change error');
    }
  }, [videoId]);
  
  const handleVolumeChange = useCallback(async (newVolume: number) => {
    try {
      await hostreamly.setVolume(videoId, newVolume);
      setVolume(newVolume);
    } catch (error) {
      console.error('Volume change error:', error);
    }
  }, [videoId]);
  
  const handlePlaybackRateChange = useCallback(async (rate: number) => {
    try {
      await hostreamly.setPlaybackRate(videoId, rate);
      setPlaybackRate(rate);
    } catch (error) {
      console.error('Playback rate change error:', error);
    }
  }, [videoId]);
  
  const handleFullscreen = useCallback(async () => {
    try {
      if (isFullscreen) {
        await hostreamly.exitFullscreen(videoId);
        setIsFullscreen(false);
        StatusBar.setHidden(false);
      } else {
        await hostreamly.enterFullscreen(videoId);
        setIsFullscreen(true);
        StatusBar.setHidden(true);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, [videoId, isFullscreen]);
  
  // Controles de descarga
  const handleDownload = useCallback(async (quality: BunnyResolution) => {
    if (!enableOffline) return;
    
    try {
      const downloadOptions: DownloadOptions = {
        quality,
        includeSubtitles: true,
        priority: 'medium',
        wifiOnly: true,
        deleteAfterDays: 30
      };
      
      const success = await hostreamly.downloadVideo(videoId, downloadOptions);
      if (success) {
        Alert.alert('Download Started', `Video download started in ${quality} quality`);
        setShowDownloadOptions(false);
      } else {
        Alert.alert('Download Failed', 'Failed to start video download');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Error', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [videoId, enableOffline]);
  
  const handlePauseDownload = useCallback(async () => {
    try {
      await hostreamly.pauseDownload(videoId);
    } catch (error) {
      console.error('Pause download error:', error);
    }
  }, [videoId]);
  
  const handleResumeDownload = useCallback(async () => {
    try {
      await hostreamly.resumeDownload(videoId);
    } catch (error) {
      console.error('Resume download error:', error);
    }
  }, [videoId]);
  
  const handleCancelDownload = useCallback(async () => {
    try {
      await hostreamly.cancelDownload(videoId);
      setDownloadProgress(null);
    } catch (error) {
      console.error('Cancel download error:', error);
    }
  }, [videoId]);
  
  const toggleOfflineMode = useCallback(() => {
    setIsOfflineMode(!isOfflineMode);
    loadVideo(); // Recargar video en el nuevo modo
  }, [isOfflineMode]);
  
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  }, []);
  
  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Renderizado de carga
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }
  
  // Renderizado principal
  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      {/* Área de video */}
      <TouchableOpacity
        style={[styles.videoContainer, isFullscreen && styles.fullscreenVideo]}
        onPress={showControlsTemporarily}
        activeOpacity={1}
      >
        {/* Aquí iría el componente de video nativo */}
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoTitle}>{videoMetadata?.title || 'Video Player'}</Text>
          {!networkInfo.isConnected && (
            <Text style={styles.offlineIndicator}>📱 Offline Mode</Text>
          )}
        </View>
        
        {/* Controles de reproducción */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Controles superiores */}
            <View style={styles.topControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowQualitySelector(true)}
              >
                <Text style={styles.controlButtonText}>{selectedQuality}</Text>
              </TouchableOpacity>
              
              {enableOffline && (
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowDownloadOptions(true)}
                >
                  <Text style={styles.controlButtonText}>⬇️</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleOfflineMode}
              >
                <Text style={styles.controlButtonText}>
                  {isOfflineMode ? '📱' : '🌐'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Controles centrales */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={handlePlayPause}
              >
                <Text style={styles.playPauseText}>
                  {playbackState?.isPlaying ? '⏸️' : '▶️'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Controles inferiores */}
            <View style={styles.bottomControls}>
              {/* Barra de progreso */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>
                  {formatTime(playbackState?.currentTime || 0)}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((playbackState?.currentTime || 0) / (playbackState?.duration || 1)) * 100}%`
                      }
                    ]}
                  />
                </View>
                <Text style={styles.timeText}>
                  {formatTime(playbackState?.duration || 0)}
                </Text>
                
                <TouchableOpacity
                  style={styles.fullscreenButton}
                  onPress={handleFullscreen}
                >
                  <Text style={styles.controlButtonText}>
                    {isFullscreen ? '⤡' : '⤢'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Información de descarga */}
      {downloadProgress && downloadProgress.status !== 'completed' && (
        <View style={styles.downloadInfo}>
          <Text style={styles.downloadText}>
            Download: {downloadProgress.progress.toFixed(1)}% ({downloadProgress.status})
          </Text>
          <View style={styles.downloadControls}>
            {downloadProgress.status === 'downloading' && (
              <TouchableOpacity onPress={handlePauseDownload}>
                <Text style={styles.downloadControlText}>Pause</Text>
              </TouchableOpacity>
            )}
            {downloadProgress.status === 'paused' && (
              <TouchableOpacity onPress={handleResumeDownload}>
                <Text style={styles.downloadControlText}>Resume</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleCancelDownload}>
              <Text style={styles.downloadControlText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Información de red */}
      {!isFullscreen && (
        <View style={styles.networkInfo}>
          <Text style={styles.networkText}>
            {networkInfo.isConnected ? 
              `📶 ${networkInfo.type} ${networkInfo.isWiFi ? '(WiFi)' : ''}` : 
              '📵 Offline'
            }
          </Text>
        </View>
      )}
      
      {/* Modal de selección de calidad */}
      <Modal
        visible={showQualitySelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQualitySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Quality</Text>
            <ScrollView>
              {videoMetadata?.resolutions.map((quality) => (
                <TouchableOpacity
                  key={quality}
                  style={[
                    styles.qualityOption,
                    selectedQuality === quality && styles.selectedQuality
                  ]}
                  onPress={() => handleQualityChange(quality)}
                >
                  <Text style={styles.qualityText}>{quality}</Text>
                  {selectedQuality === quality && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQualitySelector(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Modal de opciones de descarga */}
      <Modal
        visible={showDownloadOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDownloadOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Download Options</Text>
            <ScrollView>
              {videoMetadata?.resolutions.map((quality) => (
                <TouchableOpacity
                  key={quality}
                  style={styles.downloadOption}
                  onPress={() => handleDownload(quality)}
                >
                  <Text style={styles.downloadOptionText}>Download in {quality}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDownloadOptions(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16
  },
  videoContainer: {
    flex: 1,
    position: 'relative'
  },
  fullscreenVideo: {
    width: screenWidth,
    height: screenHeight
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a'
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  offlineIndicator: {
    color: '#ff9500',
    fontSize: 14
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomControls: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  playPauseButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  playPauseText: {
    fontSize: 32
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    minWidth: 40,
    textAlign: 'center'
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginHorizontal: 12
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2
  },
  fullscreenButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8
  },
  downloadInfo: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  downloadText: {
    color: '#fff',
    fontSize: 14
  },
  downloadControls: {
    flexDirection: 'row'
  },
  downloadControlText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 16
  },
  networkInfo: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    alignItems: 'center'
  },
  networkText: {
    color: '#fff',
    fontSize: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16
  },
  qualityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  selectedQuality: {
    backgroundColor: '#f0f8ff'
  },
  qualityText: {
    fontSize: 16
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  downloadOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  downloadOptionText: {
    fontSize: 16,
    color: '#007AFF'
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default HostreamlyPlayer;
export type { HostreamlyPlayerProps };
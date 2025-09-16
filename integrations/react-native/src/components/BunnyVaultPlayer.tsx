/**
 * BunnyVaultPlayer Component
 * Main video player component for React Native
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import KeepAwake from 'react-native-keep-awake';

import { useBunnyVault } from '../hooks/useBunnyVault';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { useVideoAnalytics } from '../hooks/useVideoAnalytics';
import { PlayerControls } from './PlayerControls';
import { QualitySelector } from './QualitySelector';
import { SubtitleSelector } from './SubtitleSelector';
import { LoadingOverlay } from './LoadingOverlay';
import { ErrorOverlay } from './ErrorOverlay';

import {
  BunnyVaultPlayerProps,
  VideoProgress,
  VideoError,
  VideoQuality,
  BunnyVaultVideo,
} from '../types';
import {
  PLAYER_DEFAULTS,
  COLORS,
  ANIMATION_DURATION,
  ERROR_CODES,
} from '../constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const BunnyVaultPlayer: React.FC<BunnyVaultPlayerProps> = ({
  videoId,
  config = {},
  events = {},
  style,
  resizeMode = PLAYER_DEFAULTS.RESIZE_MODE,
  showControls = true,
  showProgress = true,
  showTitle = true,
  customControls,
  analyticsEnabled = true,
  offlineEnabled = false,
  cachingEnabled = true,
}) => {
  // Hooks
  const { api, isOnline } = useBunnyVault();
  const { trackEvent } = useVideoAnalytics();
  const {
    progress,
    isPlaying,
    isPaused,
    isEnded,
    isBuffering,
    error,
    play,
    pause,
    seek,
    setVolume,
    setPlaybackRate,
    toggleFullscreen,
  } = useVideoProgress();

  // State
  const [video, setVideo] = useState<BunnyVaultVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>(
    config.quality || PLAYER_DEFAULTS.QUALITY
  );
  const [volume, setVolumeState] = useState(config.volume || PLAYER_DEFAULTS.VOLUME);
  const [playbackRate, setPlaybackRateState] = useState(
    config.playbackRate || PLAYER_DEFAULTS.PLAYBACK_RATE
  );
  const [muted, setMuted] = useState(config.muted || PLAYER_DEFAULTS.MUTED);

  // Refs
  const videoRef = useRef<Video>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Merged config with defaults
  const playerConfig = useMemo(() => ({
    ...PLAYER_DEFAULTS,
    ...config,
  }), [config]);

  // Load video data
  useEffect(() => {
    const loadVideo = async () => {
      try {
        setIsLoading(true);
        const videoData = await api.getVideo(videoId);
        
        if (!videoData) {
          throw new Error('Video not found');
        }
        
        setVideo(videoData);
        
        // Track video start event
        if (analyticsEnabled) {
          trackEvent({
            type: 'video_start',
            videoId,
            data: {
              title: videoData.title,
              duration: videoData.duration,
              quality: currentQuality,
            },
          });
        }
      } catch (err) {
        console.error('Failed to load video:', err);
        events.onError?.({
          code: ERROR_CODES.VIDEO_NOT_FOUND,
          message: 'Failed to load video',
          details: err,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (videoId) {
      loadVideo();
    }
  }, [videoId, api, analyticsEnabled, trackEvent, events, currentQuality]);

  // Handle video events
  const handleLoad = useCallback((data: any) => {
    events.onReady?.();
    setIsLoading(false);
  }, [events]);

  const handlePlay = useCallback(() => {
    events.onPlay?.();
    if (analyticsEnabled) {
      trackEvent({
        type: 'video_play',
        videoId,
        data: { currentTime: progress?.currentTime || 0 },
      });
    }
  }, [events, analyticsEnabled, trackEvent, videoId, progress]);

  const handlePause = useCallback(() => {
    events.onPause?.();
    if (analyticsEnabled) {
      trackEvent({
        type: 'video_pause',
        videoId,
        data: { currentTime: progress?.currentTime || 0 },
      });
    }
  }, [events, analyticsEnabled, trackEvent, videoId, progress]);

  const handleEnd = useCallback(() => {
    events.onEnd?.();
    if (analyticsEnabled) {
      trackEvent({
        type: 'video_end',
        videoId,
        data: { 
          duration: progress?.duration || 0,
          completionRate: 100,
        },
      });
    }
  }, [events, analyticsEnabled, trackEvent, videoId, progress]);

  const handleProgress = useCallback((data: any) => {
    const progressData: VideoProgress = {
      currentTime: data.currentTime,
      duration: data.seekableDuration || data.duration,
      percentage: (data.currentTime / (data.seekableDuration || data.duration)) * 100,
      buffered: data.playableDuration,
      played: data.currentTime,
    };
    
    events.onProgress?.(progressData);
    
    // Track progress milestones
    if (analyticsEnabled) {
      const percentage = progressData.percentage;
      const milestones = [25, 50, 75, 90];
      
      milestones.forEach(milestone => {
        if (percentage >= milestone && percentage < milestone + 1) {
          trackEvent({
            type: 'video_progress',
            videoId,
            data: { 
              milestone,
              currentTime: progressData.currentTime,
              duration: progressData.duration,
            },
          });
        }
      });
    }
  }, [events, analyticsEnabled, trackEvent, videoId]);

  const handleError = useCallback((error: any) => {
    const videoError: VideoError = {
      code: ERROR_CODES.PLAYBACK_ERROR,
      message: error.error?.localizedDescription || 'Playback error',
      details: error,
    };
    
    events.onError?.(videoError);
    
    if (analyticsEnabled) {
      trackEvent({
        type: 'video_error',
        videoId,
        data: videoError,
      });
    }
  }, [events, analyticsEnabled, trackEvent, videoId]);

  const handleSeek = useCallback((time: number) => {
    videoRef.current?.seek(time);
    events.onSeek?.(time);
    
    if (analyticsEnabled) {
      trackEvent({
        type: 'video_seek',
        videoId,
        data: { seekTo: time, seekFrom: progress?.currentTime || 0 },
      });
    }
  }, [events, analyticsEnabled, trackEvent, videoId, progress]);

  const handleQualityChange = useCallback((quality: VideoQuality) => {
    setCurrentQuality(quality);
    events.onQualityChange?.(quality);
    
    if (analyticsEnabled) {
      trackEvent({
        type: 'video_quality_change',
        videoId,
        data: { quality, previousQuality: currentQuality },
      });
    }
  }, [events, analyticsEnabled, trackEvent, videoId, currentQuality]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    setVolume(newVolume);
    events.onVolumeChange?.(newVolume);
  }, [events, setVolume]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    setPlaybackRate(rate);
    events.onPlaybackRateChange?.(rate);
  }, [events, setPlaybackRate]);

  const handleFullscreenToggle = useCallback(() => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    if (newFullscreenState) {
      Orientation.lockToLandscape();
      StatusBar.setHidden(true, 'fade');
      KeepAwake.activate();
      events.onFullscreenEnter?.();
    } else {
      Orientation.lockToPortrait();
      StatusBar.setHidden(false, 'fade');
      KeepAwake.deactivate();
      events.onFullscreenExit?.();
    }
    
    if (analyticsEnabled) {
      trackEvent({
        type: 'video_fullscreen',
        videoId,
        data: { isFullscreen: newFullscreenState },
      });
    }
  }, [isFullscreen, events, analyticsEnabled, trackEvent, videoId]);

  // Controls visibility management
  const showControls = useCallback(() => {
    setShowControlsOverlay(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControlsOverlay(false);
      }
    }, 3000);
  }, [isPlaying]);

  const hideControls = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControlsOverlay(false);
  }, []);

  // Touch handlers
  const handlePlayerTouch = useCallback(() => {
    if (showControlsOverlay) {
      hideControls();
    } else {
      showControls();
    }
  }, [showControlsOverlay, showControls, hideControls]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      KeepAwake.deactivate();
      Orientation.unlockAllOrientations();
    };
  }, []);

  // Get video URL based on quality and availability
  const getVideoUrl = useCallback(() => {
    if (!video) return '';
    
    // Check if offline version is available
    if (offlineEnabled && !isOnline) {
      // Return offline URL if available
      // This would be implemented with offline storage
      return video.url;
    }
    
    // Return appropriate URL based on quality
    if (currentQuality === 'auto') {
      return video.hlsUrl || video.url;
    }
    
    // Return quality-specific URL
    return video.url;
  }, [video, currentQuality, offlineEnabled, isOnline]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <LoadingOverlay />
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <ErrorOverlay 
          error={error}
          onRetry={() => window.location.reload()}
        />
      </View>
    );
  }

  // Render video not found
  if (!video) {
    return (
      <View style={[styles.container, style]}>
        <ErrorOverlay 
          error={{
            code: ERROR_CODES.VIDEO_NOT_FOUND,
            message: 'Video not found',
          }}
          onRetry={() => window.location.reload()}
        />
      </View>
    );
  }

  const containerStyle = isFullscreen 
    ? [styles.container, styles.fullscreenContainer]
    : [styles.container, style];

  return (
    <View style={containerStyle}>
      <TouchableOpacity 
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={handlePlayerTouch}
      >
        <Video
          ref={videoRef}
          source={{ uri: getVideoUrl() }}
          style={styles.video}
          resizeMode={resizeMode}
          paused={!isPlaying}
          volume={volume}
          rate={playbackRate}
          muted={muted}
          repeat={playerConfig.loop}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={handleEnd}
          onError={handleError}
          onBuffer={({ isBuffering }) => {
            if (analyticsEnabled && isBuffering !== isBuffering) {
              trackEvent({
                type: 'video_buffer',
                videoId,
                data: { isBuffering },
              });
            }
          }}
        />
        
        {/* Loading Overlay */}
        {isBuffering && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.WHITE} />
          </View>
        )}
        
        {/* Controls Overlay */}
        {showControls && showControlsOverlay && (
          <View style={styles.controlsOverlay}>
            {customControls || (
              <PlayerControls
                isPlaying={isPlaying}
                isPaused={isPaused}
                isEnded={isEnded}
                progress={progress}
                volume={volume}
                playbackRate={playbackRate}
                muted={muted}
                isFullscreen={isFullscreen}
                onPlay={play}
                onPause={pause}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                onPlaybackRateChange={handlePlaybackRateChange}
                onMuteToggle={() => setMuted(!muted)}
                onFullscreenToggle={handleFullscreenToggle}
                showProgress={showProgress}
              />
            )}
          </View>
        )}
        
        {/* Video Title */}
        {showTitle && video.title && (
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {video.title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BLACK,
    aspectRatio: 16 / 9,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
    zIndex: 1000,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  titleContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  title: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default BunnyVaultPlayer;
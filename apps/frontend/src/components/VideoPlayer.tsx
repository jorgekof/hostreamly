import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings,
  Download,
  Share2,
  RotateCcw,
  RotateCw,
  Loader2,
  Eye,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  videoId: string;
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  showWatermark?: boolean;
  watermarkText?: string;
  showAnalytics?: boolean;
  brandColor?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onAnalytics?: (event: string, data?: any) => void;
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
  quality: string;
  playbackRate: number;
  viewCount: number;
  watchTime: number;
  isBuffering: boolean;
  showControls: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  title,
  autoplay = false,
  controls = true,
  width = '100%',
  height = 'auto',
  className = '',
  showWatermark = true,
  watermarkText = 'Hostreamly Media',
  showAnalytics = true,
  brandColor = '#8B5CF6',
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onAnalytics
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    isLoading: true,
    quality: 'auto',
    playbackRate: 1,
    viewCount: 0,
    watchTime: 0,
    isBuffering: false,
    showControls: false
  });
  const { toast } = useToast();
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // URL del video de Video CDN
  const videoUrl = `https://${import.meta.env.VITE_BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
  const posterUrl = `https://${import.meta.env.VITE_BUNNY_CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;

  // Analytics helper
  const trackEvent = (event: string, data?: any) => {
    if (showAnalytics && onAnalytics) {
      onAnalytics(event, { videoId, ...data });
    }
  };

  // Controls visibility management
  const showControlsTemporarily = () => {
    setVideoState(prev => ({ ...prev, showControls: true }));
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      setVideoState(prev => ({ ...prev, showControls: false }));
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setVideoState(prev => ({
        ...prev,
        duration: video.duration,
        isLoading: false
      }));
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      setVideoState(prev => ({
        ...prev,
        currentTime
      }));
      
      onTimeUpdate?.(currentTime, duration);
    };

    const handlePlay = () => {
      setVideoState(prev => ({ ...prev, isPlaying: true, isBuffering: false }));
      trackEvent('video_play', { currentTime: video.currentTime });
      onPlay?.();
    };

    const handlePause = () => {
      setVideoState(prev => ({ ...prev, isPlaying: false }));
      trackEvent('video_pause', { currentTime: video.currentTime });
      onPause?.();
    };

    const handleEnded = () => {
      setVideoState(prev => ({ ...prev, isPlaying: false }));
      trackEvent('video_ended', { duration: video.duration });
      onEnded?.();
    };

    const handleVolumeChange = () => {
      setVideoState(prev => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted
      }));
    };

    const handleLoadStart = () => {
      setVideoState(prev => ({ ...prev, isLoading: true, isBuffering: true }));
      trackEvent('video_load_start');
    };

    const handleCanPlay = () => {
      setVideoState(prev => ({ ...prev, isLoading: false, isBuffering: false }));
      trackEvent('video_can_play');
    };

    const handleWaiting = () => {
      setVideoState(prev => ({ ...prev, isBuffering: true }));
      trackEvent('video_buffering');
    };

    const handlePlaying = () => {
      setVideoState(prev => ({ ...prev, isBuffering: false }));
    };

    // Event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setVideoState(prev => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement
      }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls visibility handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = () => showControlsTemporarily();
    const handleMouseLeave = () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
      setVideoState(prev => ({ ...prev, showControls: false }));
    };
    const handleTouchStart = () => showControlsTemporarily();

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', handleTouchStart);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', handleTouchStart);
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [controlsTimeout]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (videoState.isPlaying) {
      video.pause();
    } else {
      video.play().catch(error => {
        console.error('Error playing video:', error);
        trackEvent('video_play_error', { error: error.message });
        toast({
          title: "Error de reproducción",
          description: "No se pudo reproducir el video",
          variant: "destructive"
        });
      });
    }
    showControlsTemporarily();
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (value[0] / 100) * videoState.duration;
    const oldTime = video.currentTime;
    video.currentTime = newTime;
    trackEvent('video_seek', { from: oldTime, to: newTime });
    showControlsTemporarily();
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0] / 100;
    video.volume = newVolume;
    video.muted = newVolume === 0;
    trackEvent('volume_change', { volume: newVolume });
    showControlsTemporarily();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const wasMuted = video.muted;
    video.muted = !video.muted;
    trackEvent('volume_mute', { muted: !wasMuted });
    showControlsTemporarily();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(error => {
        console.error('Error entering fullscreen:', error);
        trackEvent('fullscreen_error', { error: error.message });
      });
      trackEvent('fullscreen_enter');
    } else {
      document.exitFullscreen().catch(error => {
        console.error('Error exiting fullscreen:', error);
      });
      trackEvent('fullscreen_exit');
    }
    showControlsTemporarily();
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    const oldRate = video.playbackRate;
    video.playbackRate = rate;
    setVideoState(prev => ({ ...prev, playbackRate: rate }));
    trackEvent('playback_rate_change', { from: oldRate, to: rate });
    showControlsTemporarily();
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const oldTime = video.currentTime;
    const newTime = Math.max(0, Math.min(video.currentTime + seconds, videoState.duration));
    video.currentTime = newTime;
    trackEvent('video_skip', { seconds, from: oldTime, to: newTime });
    showControlsTemporarily();
  };

  const downloadVideo = () => {
    const downloadUrl = `https://${import.meta.env.VITE_BUNNY_CDN_HOSTNAME}/${videoId}/original.mp4`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${title || videoId}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareVideo = () => {
    const shareUrl = `${window.location.origin}/video/${videoId}`;
    
    if (navigator.share) {
      navigator.share({
        title: title || 'Video',
        url: shareUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: "Enlace copiado",
          description: "El enlace del video ha sido copiado al portapapeles"
        });
      }).catch(() => {
        toast({
          title: "Error",
          description: "No se pudo copiar el enlace",
          variant: "destructive"
        });
      });
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = videoState.duration > 0 ? (videoState.currentTime / videoState.duration) * 100 : 0;

  return (
    <Card className={`overflow-hidden ${className}`} ref={containerRef}>
      <CardContent className="p-0 relative group">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-auto bg-black"
          style={{ width, height }}
          poster={posterUrl}
          autoPlay={autoplay}
          playsInline
          preload="metadata"
        >
          <source src={videoUrl} type="application/x-mpegURL" />
          Tu navegador no soporta la reproducción de video.
        </video>

        {/* Loading Overlay */}
        {(videoState.isLoading || videoState.isBuffering) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <span className="text-white text-sm font-medium">
                {videoState.isLoading ? 'Cargando video...' : 'Buffering...'}
              </span>
            </div>
          </div>
        )}

        {/* Title Overlay */}
        {title && (
          <div className="absolute top-4 left-4 right-4 z-10">
            <Badge 
              variant="secondary" 
              className="bg-black/80 text-white backdrop-blur-sm border-0 shadow-lg"
            >
              {title}
            </Badge>
          </div>
        )}

        {/* Watermark */}
        {showWatermark && (
          <div className="absolute top-4 right-4 z-10">
            <div 
              className="px-3 py-1 rounded-md text-xs font-medium text-white/80 backdrop-blur-sm border border-white/20"
              style={{ backgroundColor: `${brandColor}20` }}
            >
              {watermarkText}
            </div>
          </div>
        )}

        {/* Analytics Overlay */}
        {showAnalytics && (
          <div className="absolute bottom-4 right-4 z-10 opacity-60">
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Eye className="w-3 h-3" />
              <span>{videoState.viewCount}</span>
              <Clock className="w-3 h-3 ml-2" />
              <span>{formatTime(videoState.watchTime)}</span>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        {controls && (
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-all duration-300 z-20 ${
            videoState.showControls || !videoState.isPlaying ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[progressPercentage]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:shadow-lg"
                style={{
                  '--slider-track': brandColor,
                  '--slider-range': brandColor
                } as React.CSSProperties}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  style={{ '--hover-bg': `${brandColor}40` } as React.CSSProperties}
                >
                  {videoState.isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>

                {/* Skip Backward */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skipTime(-10)}
                  className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  title="Retroceder 10s"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>

                {/* Skip Forward */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skipTime(10)}
                  className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  title="Avanzar 10s"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200"
                    title={videoState.isMuted ? 'Activar sonido' : 'Silenciar'}
                  >
                    {videoState.isMuted || videoState.volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Slider
                    value={[videoState.isMuted ? 0 : videoState.volume * 100]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-20 [&_[role=slider]]:bg-white [&_[role=slider]]:border [&_[role=slider]]:shadow-md"
                    style={{
                      '--slider-track': brandColor,
                      '--slider-range': brandColor
                    } as React.CSSProperties}
                  />
                </div>

                {/* Time Display */}
                <span className="text-white text-sm font-mono">
                  {formatTime(videoState.currentTime)} / {formatTime(videoState.duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Settings Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200"
                      title="Configuración"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-black/90 border-white/20 backdrop-blur-md">
                    <div className="px-2 py-1 text-xs font-medium text-white/60">Velocidad de reproducción</div>
                    <DropdownMenuItem 
                      onClick={() => changePlaybackRate(0.5)}
                      className="text-white hover:bg-white/10"
                    >
                      <span className="flex-1">0.5x</span>
                      {videoState.playbackRate === 0.5 && <span style={{ color: brandColor }}>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => changePlaybackRate(0.75)}
                      className="text-white hover:bg-white/10"
                    >
                      <span className="flex-1">0.75x</span>
                      {videoState.playbackRate === 0.75 && <span style={{ color: brandColor }}>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => changePlaybackRate(1)}
                      className="text-white hover:bg-white/10"
                    >
                      <span className="flex-1">Normal</span>
                      {videoState.playbackRate === 1 && <span style={{ color: brandColor }}>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => changePlaybackRate(1.25)}
                      className="text-white hover:bg-white/10"
                    >
                      <span className="flex-1">1.25x</span>
                      {videoState.playbackRate === 1.25 && <span style={{ color: brandColor }}>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => changePlaybackRate(1.5)}
                      className="text-white hover:bg-white/10"
                    >
                      <span className="flex-1">1.5x</span>
                      {videoState.playbackRate === 1.5 && <span style={{ color: brandColor }}>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => changePlaybackRate(2)}
                      className="text-white hover:bg-white/10"
                    >
                      <span className="flex-1">2x</span>
                      {videoState.playbackRate === 2 && <span style={{ color: brandColor }}>✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/20" />
                    <div className="px-2 py-1 text-xs font-medium text-white/60">Calidad</div>
                    <DropdownMenuItem className="text-white hover:bg-white/10">
                      <span className="flex-1">Auto</span>
                      <span style={{ color: brandColor }}>✓</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Download */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadVideo}
                  className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  title="Descargar video"
                >
                  <Download className="w-4 h-4" />
                </Button>

                {/* Share */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareVideo}
                  className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  title="Compartir video"
                >
                  <Share2 className="w-4 h-4" />
                </Button>

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  title={videoState.isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                  {videoState.isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Click to Play Overlay */}
        {!videoState.isPlaying && !videoState.isLoading && !videoState.isBuffering && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
            onClick={togglePlay}
          >
            <div 
              className="rounded-full p-6 hover:scale-110 transition-all duration-300 shadow-2xl backdrop-blur-sm border border-white/20"
              style={{ backgroundColor: `${brandColor}80` }}
            >
              <Play className="w-16 h-16 text-white drop-shadow-lg" fill="white" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;

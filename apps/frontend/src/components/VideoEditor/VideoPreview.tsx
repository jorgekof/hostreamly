import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize, Settings } from 'lucide-react';

interface VideoClip {
  id: string;
  url: string;
  startTime: number;
  endTime: number;
  volume: number;
  speed: number;
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue?: number;
  };
}

interface VideoPreviewProps {
  clips: VideoClip[];
  currentTime: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
  totalDuration: number;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  clips,
  currentTime,
  isPlaying,
  onPlay,
  onPause,
  onTimeUpdate,
  onSeek,
  totalDuration,
  volume,
  onVolumeChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('auto');

  // Encontrar el clip activo en el tiempo actual
  const activeClip = clips.find(clip => 
    currentTime >= clip.startTime && currentTime <= clip.endTime
  );

  useEffect(() => {
    if (videoRef.current && activeClip) {
      // Cargar el video del clip activo
      if (videoRef.current.src !== activeClip.url) {
        videoRef.current.src = activeClip.url;
      }
      
      // Ajustar el tiempo del video al tiempo relativo del clip
      const relativeTime = currentTime - activeClip.startTime;
      if (Math.abs(videoRef.current.currentTime - relativeTime) > 0.1) {
        videoRef.current.currentTime = relativeTime;
      }
      
      // Aplicar configuraciones del clip
      videoRef.current.volume = activeClip.volume * volume;
      videoRef.current.playbackRate = activeClip.speed * playbackRate;
      
      // Aplicar filtros CSS si existen
      if (activeClip.filters) {
        const filters = [];
        if (activeClip.filters.brightness !== undefined) {
          filters.push(`brightness(${100 + activeClip.filters.brightness}%)`);
        }
        if (activeClip.filters.contrast !== undefined) {
          filters.push(`contrast(${100 + activeClip.filters.contrast}%)`);
        }
        if (activeClip.filters.saturation !== undefined) {
          filters.push(`saturate(${100 + activeClip.filters.saturation}%)`);
        }
        if (activeClip.filters.hue !== undefined) {
          filters.push(`hue-rotate(${activeClip.filters.hue}deg)`);
        }
        videoRef.current.style.filter = filters.join(' ');
      }
    }
  }, [activeClip, currentTime, volume, playbackRate]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying && activeClip) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, activeClip]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && activeClip) {
      const videoTime = videoRef.current.currentTime;
      const globalTime = activeClip.startTime + videoTime;
      
      // Solo actualizar si hay una diferencia significativa
      if (Math.abs(globalTime - currentTime) > 0.1) {
        onTimeUpdate(globalTime);
      }
      
      // Cambiar al siguiente clip si es necesario
      if (globalTime >= activeClip.endTime) {
        const nextClip = clips.find(clip => clip.startTime >= activeClip.endTime);
        if (nextClip) {
          onSeek(nextClip.startTime);
        } else {
          onPause();
        }
      }
    }
  }, [activeClip, currentTime, clips, onTimeUpdate, onSeek, onPause]);

  const handleSeekBar = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * totalDuration;
    onSeek(newTime);
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen().catch(console.error);
      } else {
        document.exitFullscreen().catch(console.error);
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        isPlaying ? onPause() : onPlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 5));
        break;
      case 'ArrowRight':
        e.preventDefault();
        onSeek(Math.min(totalDuration, currentTime + 5));
        break;
      case 'ArrowUp':
        e.preventDefault();
        onVolumeChange(Math.min(1, volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        onVolumeChange(Math.max(0, volume - 0.1));
        break;
    }
  }, [isPlaying, onPlay, onPause, currentTime, onSeek, totalDuration, volume, onVolumeChange]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="video-preview flex flex-col h-full bg-black">
      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center relative group">
        {activeClip ? (
          <>
            <video
              ref={videoRef}
              className="max-w-full max-h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = currentTime - activeClip.startTime;
                }
              }}
            />
            
            {/* Overlay Controls */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30">
              <button
                onClick={isPlaying ? onPause : onPlay}
                className="p-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all"
              >
                {isPlaying ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white" />}
              </button>
            </div>
            
            {/* Quality Indicator */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              {quality === 'auto' ? 'Auto' : quality}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
              <Play size={32} />
            </div>
            <p className="text-lg font-medium">No hay clips en este momento</p>
            <p className="text-sm">Arrastra videos al timeline para comenzar</p>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        {/* Progress Bar */}
        <div 
          className="w-full h-2 bg-gray-600 rounded-full mb-4 cursor-pointer relative"
          onClick={handleSeekBar}
        >
          <div 
            className="h-full bg-blue-500 rounded-full relative"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
          </div>
          
          {/* Clip indicators */}
          {clips.map(clip => (
            <div
              key={clip.id}
              className="absolute top-0 bottom-0 bg-yellow-400 opacity-50"
              style={{
                left: `${(clip.startTime / totalDuration) * 100}%`,
                width: `${((clip.endTime - clip.startTime) / totalDuration) * 100}%`
              }}
            />
          ))}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
              title="Retroceder 10s"
            >
              <SkipBack size={20} />
            </button>
            
            <button
              onClick={isPlaying ? onPause : onPlay}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button
              onClick={() => onSeek(Math.min(totalDuration, currentTime + 10))}
              className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
              title="Avanzar 10s"
            >
              <SkipForward size={20} />
            </button>
            
            {/* Volume Control */}
            <div className="relative">
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
              >
                <Volume2 size={20} />
              </button>
              
              {showVolumeSlider && (
                <div className="absolute bottom-12 left-0 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-400 text-center mt-1">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
              )}
            </div>
            
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
              >
                <Settings size={20} />
              </button>
              
              {showSettings && (
                <div className="absolute bottom-12 right-0 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg min-w-48">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Velocidad de reproducción</label>
                      <select
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      >
                        <option value={0.25}>0.25x</option>
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Calidad</label>
                      <select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      >
                        <option value="auto">Automática</option>
                        <option value="1080p">1080p</option>
                        <option value="720p">720p</option>
                        <option value="480p">480p</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleFullscreen}
              className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
              title="Pantalla completa"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
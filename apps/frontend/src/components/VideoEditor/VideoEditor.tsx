import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Scissors, Volume2, Download, Upload, Undo, Redo } from 'lucide-react';
import { RealtimeCollaborationSystem } from '../../services/realtimeCollaboration';

interface VideoClip {
  id: string;
  name: string;
  url: string;
  duration: number;
  startTime: number;
  endTime: number;
  volume: number;
  speed: number;
}

interface VideoEditorProps {
  projectId?: string;
  onSave?: (project: any) => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ projectId, onSave }) => {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const collaborationRef = useRef<RealtimeCollaborationSystem | null>(null);

  useEffect(() => {
    if (projectId) {
      collaborationRef.current = new RealtimeCollaborationSystem(projectId);
    }
  }, [projectId]);

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleClipSelect = (clipId: string) => {
    setSelectedClip(clipId);
  };

  const handleClipSplit = () => {
    if (selectedClip) {
      const clip = clips.find(c => c.id === selectedClip);
      if (clip) {
        const splitTime = currentTime;
        const newClip: VideoClip = {
          ...clip,
          id: `${clip.id}_split_${Date.now()}`,
          startTime: splitTime,
          endTime: clip.endTime
        };
        
        const updatedClip = {
          ...clip,
          endTime: splitTime
        };
        
        setClips(prev => prev.map(c => c.id === selectedClip ? updatedClip : c).concat(newClip));
      }
    }
  };

  const handleVolumeChange = (volume: number) => {
    if (selectedClip) {
      setClips(prev => prev.map(clip => 
        clip.id === selectedClip ? { ...clip, volume } : clip
      ));
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (selectedClip) {
      setClips(prev => prev.map(clip => 
        clip.id === selectedClip ? { ...clip, speed } : clip
      ));
    }
  };

  const handleExport = () => {
    // Implementar exportación

    if (onSave) {
      onSave({ clips, duration: totalDuration });
    }
  };

  const selectedClipData = clips.find(c => c.id === selectedClip);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold">Editor de Video Hostreamly</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMediaLibrary(!showMediaLibrary)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
          >
            <Upload size={16} />
            Biblioteca
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
          >
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Media Library Sidebar */}
        {showMediaLibrary && (
          <div className="w-80 bg-gray-800 border-r border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-4">Biblioteca de Medios</h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                <div className="text-sm font-medium">Video 1.mp4</div>
                <div className="text-xs text-gray-400">2:30 min</div>
              </div>
              <div className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                <div className="text-sm font-medium">Video 2.mp4</div>
                <div className="text-xs text-gray-400">1:45 min</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              className="max-w-full max-h-full"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setTotalDuration(videoRef.current.duration);
                }
              }}
            >
              Tu navegador no soporta el elemento video.
            </video>
          </div>

          {/* Controls */}
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={handlePlay}
                className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={() => setIsPlaying(false)}
                className="p-2 bg-gray-600 hover:bg-gray-700 rounded"
              >
                <Square size={16} />
              </button>
              <button
                onClick={handleClipSplit}
                disabled={!selectedClip}
                className="p-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded"
              >
                <Scissors size={16} />
              </button>
            </div>

            {/* Timeline */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Timeline</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                  >
                    -
                  </button>
                  <span className="text-xs">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div 
                ref={timelineRef}
                className="h-20 bg-gray-700 rounded-lg relative overflow-x-auto"
                style={{ transform: `scaleX(${zoom})` }}
              >
                {clips.map((clip, index) => (
                  <div
                    key={clip.id}
                    onClick={() => handleClipSelect(clip.id)}
                    className={`absolute h-16 bg-blue-500 rounded cursor-pointer border-2 ${
                      selectedClip === clip.id ? 'border-yellow-400' : 'border-transparent'
                    }`}
                    style={{
                      left: `${(clip.startTime / totalDuration) * 100}%`,
                      width: `${((clip.endTime - clip.startTime) / totalDuration) * 100}%`,
                      top: '2px'
                    }}
                  >
                    <div className="p-1 text-xs truncate">{clip.name}</div>
                  </div>
                ))}
                
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                />
              </div>
            </div>

            {/* Clip Properties */}
            {selectedClipData && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Volumen</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedClipData.volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{Math.round(selectedClipData.volume * 100)}%</span>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Velocidad</label>
                  <input
                    type="range"
                    min="0.25"
                    max="2"
                    step="0.25"
                    value={selectedClipData.speed}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{selectedClipData.speed}x</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
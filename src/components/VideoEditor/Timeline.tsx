import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface TimelineClip {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  trackId: string;
  color: string;
  volume: number;
  speed: number;
  url: string;
}

interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio';
  height: number;
  muted: boolean;
  locked: boolean;
}

interface TimelineProps {
  clips: TimelineClip[];
  tracks: Track[];
  currentTime: number;
  totalDuration: number;
  zoom: number;
  onClipSelect: (clipId: string) => void;
  onClipMove: (clipId: string, newStartTime: number, newTrackId: string) => void;
  onClipResize: (clipId: string, newStartTime: number, newEndTime: number) => void;
  onTimeSeek: (time: number) => void;
  selectedClipId?: string;
}

const Timeline: React.FC<TimelineProps> = ({
  clips,
  tracks,
  currentTime,
  totalDuration,
  zoom,
  onClipSelect,
  onClipMove,
  onClipResize,
  onTimeSeek,
  selectedClipId
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'left' | 'right' | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [playheadPosition, setPlayheadPosition] = useState(0);

  const pixelsPerSecond = 100 * zoom;
  const timelineWidth = totalDuration * pixelsPerSecond;

  useEffect(() => {
    setPlayheadPosition((currentTime / totalDuration) * timelineWidth);
  }, [currentTime, totalDuration, timelineWidth]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (timelineRef.current && !isDragging && !isResizing) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = (x / timelineWidth) * totalDuration;
      onTimeSeek(Math.max(0, Math.min(totalDuration, time)));
    }
  }, [isDragging, isResizing, timelineWidth, totalDuration, onTimeSeek]);

  const handleClipDragStart = (clipId: string) => {
    setIsDragging(true);
    onClipSelect(clipId);
  };

  const handleClipDragEnd = () => {
    setIsDragging(false);
  };

  const handleResizeStart = (handle: 'left' | 'right', clipId: string) => {
    setIsResizing(true);
    setResizeHandle(handle);
    onClipSelect(clipId);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeHandle(null);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateTimeMarkers = () => {
    const markers = [];
    const interval = zoom > 2 ? 1 : zoom > 1 ? 5 : 10; // Segundos entre marcadores
    
    for (let time = 0; time <= totalDuration; time += interval) {
      const position = (time / totalDuration) * timelineWidth;
      markers.push(
        <div
          key={time}
          className="absolute top-0 bottom-0 border-l border-gray-600"
          style={{ left: `${position}px` }}
        >
          <span className="absolute -top-6 text-xs text-gray-400 transform -translate-x-1/2">
            {formatTime(time)}
          </span>
        </div>
      );
    }
    return markers;
  };

  return (
    <div className="timeline-container bg-gray-800 border-t border-gray-700">
      {/* Time Ruler */}
      <div className="h-8 bg-gray-900 border-b border-gray-700 relative overflow-hidden">
        <div 
          className="relative h-full"
          style={{ width: `${timelineWidth}px` }}
        >
          {generateTimeMarkers()}
        </div>
      </div>

      {/* Tracks Container */}
      <div className="tracks-container">
        {tracks.map((track) => (
          <div key={track.id} className="track flex border-b border-gray-700">
            {/* Track Header */}
            <div className="track-header w-48 bg-gray-800 p-2 border-r border-gray-700 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">{track.name}</div>
                <div className="text-xs text-gray-400">{track.type}</div>
              </div>
              <div className="flex gap-1">
                <button
                  className={`p-1 rounded text-xs ${
                    track.muted ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  M
                </button>
                <button
                  className={`p-1 rounded text-xs ${
                    track.locked ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  L
                </button>
              </div>
            </div>

            {/* Track Timeline */}
            <div 
              className="track-timeline flex-1 relative overflow-x-auto"
              style={{ height: `${track.height}px` }}
              onClick={handleTimelineClick}
              ref={timelineRef}
            >
              <div 
                className="relative h-full bg-gray-700"
                style={{ width: `${timelineWidth}px` }}
              >
                {/* Clips in this track */}
                {clips
                  .filter(clip => clip.trackId === track.id)
                  .map((clip) => {
                    const clipWidth = ((clip.endTime - clip.startTime) / totalDuration) * timelineWidth;
                    const clipLeft = (clip.startTime / totalDuration) * timelineWidth;
                    
                    return (
                      <div
                        key={clip.id}
                        className={`absolute top-1 bottom-1 rounded cursor-pointer border-2 transition-all ${
                          selectedClipId === clip.id 
                            ? 'border-yellow-400 shadow-lg' 
                            : 'border-transparent hover:border-blue-400'
                        }`}
                        style={{
                          left: `${clipLeft}px`,
                          width: `${clipWidth}px`,
                          backgroundColor: clip.color,
                          minWidth: '20px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClipSelect(clip.id);
                        }}
                        onMouseDown={() => handleClipDragStart(clip.id)}
                        onMouseUp={handleClipDragEnd}
                      >
                        {/* Clip Content */}
                        <div className="h-full flex items-center px-2 text-white text-xs font-medium truncate">
                          {clip.name}
                        </div>
                        
                        {/* Resize Handles */}
                        {selectedClipId === clip.id && (
                          <>
                            <div
                              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-yellow-400 opacity-75 hover:opacity-100"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleResizeStart('left', clip.id);
                              }}
                              onMouseUp={handleResizeEnd}
                            />
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-yellow-400 opacity-75 hover:opacity-100"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleResizeStart('right', clip.id);
                              }}
                              onMouseUp={handleResizeEnd}
                            />
                          </>
                        )}
                        
                        {/* Volume/Speed Indicators */}
                        {clip.volume !== 1 && (
                          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-1 rounded-bl">
                            {Math.round(clip.volume * 100)}%
                          </div>
                        )}
                        {clip.speed !== 1 && (
                          <div className="absolute bottom-0 right-0 bg-green-600 text-white text-xs px-1 rounded-tl">
                            {clip.speed}x
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Playhead */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
        style={{ 
          left: `${playheadPosition + 192}px`, // 192px = track header width
          transform: 'translateX(-50%)'
        }}
      >
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45" />
      </div>

      {/* Timeline Info */}
      <div className="flex justify-between items-center p-2 bg-gray-900 text-xs text-gray-400">
        <span>Duración: {formatTime(totalDuration)}</span>
        <span>Tiempo actual: {formatTime(currentTime)}</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

export default Timeline;
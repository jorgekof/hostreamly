import React, { useState } from 'react';
import { 
  Scissors, 
  Copy, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Zap, 
  RotateCcw, 
  RotateCw,
  Crop,
  Palette,
  Type,
  Music
} from 'lucide-react';

interface EditingToolsProps {
  selectedClipId?: string;
  onSplit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onVolumeChange: (volume: number) => void;
  onSpeedChange: (speed: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddText: () => void;
  onAddAudio: () => void;
  onCrop: () => void;
  onColorCorrect: () => void;
  currentVolume?: number;
  currentSpeed?: number;
  canUndo?: boolean;
  canRedo?: boolean;
}

const EditingTools: React.FC<EditingToolsProps> = ({
  selectedClipId,
  onSplit,
  onCopy,
  onDelete,
  onVolumeChange,
  onSpeedChange,
  onUndo,
  onRedo,
  onAddText,
  onAddAudio,
  onCrop,
  onColorCorrect,
  currentVolume = 1,
  currentSpeed = 1,
  canUndo = false,
  canRedo = false
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedSlider, setShowSpeedSlider] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);

  const speedPresets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="editing-tools bg-gray-800 border-b border-gray-700 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Undo/Redo */}
        <div className="flex gap-1 border-r border-gray-600 pr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            title="Deshacer (Ctrl+Z)"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            title="Rehacer (Ctrl+Y)"
          >
            <RotateCw size={16} />
          </button>
        </div>

        {/* Basic Editing Tools */}
        <div className="flex gap-1 border-r border-gray-600 pr-2">
          <button
            onClick={onSplit}
            disabled={!selectedClipId}
            className="p-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            title="Dividir clip (S)"
          >
            <Scissors size={16} />
          </button>
          <button
            onClick={onCopy}
            disabled={!selectedClipId}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            title="Copiar (Ctrl+C)"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={onDelete}
            disabled={!selectedClipId}
            className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            title="Eliminar (Delete)"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Volume Control */}
        <div className="relative border-r border-gray-600 pr-2">
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            disabled={!selectedClipId}
            className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            title="Control de volumen"
          >
            {currentVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          
          {showVolumeSlider && selectedClipId && (
            <div className="absolute top-12 left-0 bg-gray-900 border border-gray-600 rounded-lg p-3 z-10 shadow-lg">
              <div className="flex flex-col items-center gap-2">
                <label className="text-xs text-gray-300">Volumen</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={currentVolume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-400">{Math.round(currentVolume * 100)}%</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onVolumeChange(0)}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                  >
                    Silencio
                  </button>
                  <button
                    onClick={() => onVolumeChange(1)}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                  >
                    Normal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Speed Control */}
        <div className="relative border-r border-gray-600 pr-2">
          <button
            onClick={() => setShowSpeedSlider(!showSpeedSlider)}
            disabled={!selectedClipId}
            className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            title="Control de velocidad"
          >
            <Zap size={16} />
          </button>
          
          {showSpeedSlider && selectedClipId && (
            <div className="absolute top-12 left-0 bg-gray-900 border border-gray-600 rounded-lg p-3 z-10 shadow-lg">
              <div className="flex flex-col items-center gap-2">
                <label className="text-xs text-gray-300">Velocidad</label>
                <input
                  type="range"
                  min="0.25"
                  max="3"
                  step="0.25"
                  value={currentSpeed}
                  onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                  className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-400">{currentSpeed}x</span>
                <div className="grid grid-cols-4 gap-1">
                  {speedPresets.map(speed => (
                    <button
                      key={speed}
                      onClick={() => onSpeedChange(speed)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        currentSpeed === speed 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Tools */}
        <div className="flex gap-1 border-r border-gray-600 pr-2">
          <button
            onClick={onCrop}
            disabled={!selectedClipId}
            className="p-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            title="Recortar video"
          >
            <Crop size={16} />
          </button>
          <button
            onClick={() => setShowColorPanel(!showColorPanel)}
            disabled={!selectedClipId}
            className="p-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            title="Corrección de color"
          >
            <Palette size={16} />
          </button>
        </div>

        {/* Add Elements */}
        <div className="flex gap-1">
          <button
            onClick={onAddText}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
            title="Agregar texto"
          >
            <Type size={16} />
          </button>
          <button
            onClick={onAddAudio}
            className="p-2 bg-teal-600 hover:bg-teal-700 rounded transition-colors"
            title="Agregar audio"
          >
            <Music size={16} />
          </button>
        </div>
      </div>

      {/* Color Correction Panel */}
      {showColorPanel && selectedClipId && (
        <div className="mt-3 p-3 bg-gray-900 border border-gray-600 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-3">Corrección de Color</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Brillo</label>
              <input
                type="range"
                min="-100"
                max="100"
                defaultValue="0"
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Contraste</label>
              <input
                type="range"
                min="-100"
                max="100"
                defaultValue="0"
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Saturación</label>
              <input
                type="range"
                min="-100"
                max="100"
                defaultValue="0"
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">Matiz</label>
              <input
                type="range"
                min="-180"
                max="180"
                defaultValue="0"
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">
              Restablecer
            </button>
            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs">
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Info */}
      <div className="mt-2 text-xs text-gray-500">
        <span className="mr-4">S: Dividir</span>
        <span className="mr-4">Ctrl+C: Copiar</span>
        <span className="mr-4">Del: Eliminar</span>
        <span className="mr-4">Ctrl+Z: Deshacer</span>
        <span>Espacio: Reproducir/Pausar</span>
      </div>
    </div>
  );
};

export default EditingTools;
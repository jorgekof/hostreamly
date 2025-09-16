import React, { useState, useEffect } from 'react';
import { Download, Settings, Clock, FileVideo, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ExportSettings {
  format: 'mp4' | 'webm' | 'mov' | 'avi';
  quality: '480p' | '720p' | '1080p' | '4k';
  fps: 24 | 30 | 60;
  bitrate: 'auto' | 'low' | 'medium' | 'high' | 'custom';
  customBitrate?: number;
  audioQuality: 'low' | 'medium' | 'high';
  includeAudio: boolean;
}

interface ExportJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  settings: ExportSettings;
  startTime: Date;
  endTime?: Date;
  downloadUrl?: string;
  error?: string;
  estimatedSize: number;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: any;
  onExport: (settings: ExportSettings) => Promise<string>;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  projectData,
  onExport
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'mp4',
    quality: '1080p',
    fps: 30,
    bitrate: 'auto',
    audioQuality: 'high',
    includeAudio: true
  });
  
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'settings' | 'queue'>('settings');

  // Calcular tamaño estimado del archivo
  useEffect(() => {
    const calculateEstimatedSize = () => {
      if (!projectData?.duration) return 0;
      
      const duration = projectData.duration; // en segundos
      let baseBitrate = 0;
      
      // Bitrates base por calidad (kbps)
      switch (settings.quality) {
        case '480p': baseBitrate = 1000; break;
        case '720p': baseBitrate = 2500; break;
        case '1080p': baseBitrate = 5000; break;
        case '4k': baseBitrate = 15000; break;
      }
      
      // Ajustar por FPS
      const fpsMultiplier = settings.fps / 30;
      baseBitrate *= fpsMultiplier;
      
      // Ajustar por configuración de bitrate
      switch (settings.bitrate) {
        case 'low': baseBitrate *= 0.7; break;
        case 'medium': baseBitrate *= 1; break;
        case 'high': baseBitrate *= 1.5; break;
        case 'custom': baseBitrate = settings.customBitrate || baseBitrate; break;
      }
      
      // Agregar audio (aproximadamente 128 kbps)
      if (settings.includeAudio) {
        const audioMultiplier = settings.audioQuality === 'low' ? 0.5 : 
                               settings.audioQuality === 'medium' ? 1 : 1.5;
        baseBitrate += 128 * audioMultiplier;
      }
      
      // Calcular tamaño en MB
      const sizeInMB = (baseBitrate * duration) / (8 * 1024);
      setEstimatedSize(sizeInMB);
      
      // Estimar tiempo de procesamiento (aproximadamente 1:4 ratio)
      setEstimatedTime(duration / 4);
    };
    
    calculateEstimatedSize();
  }, [settings, projectData]);

  const handleExport = async () => {
    setIsExporting(true);
    
    const newJob: ExportJob = {
      id: `export_${Date.now()}`,
      status: 'queued',
      progress: 0,
      settings: { ...settings },
      startTime: new Date(),
      estimatedSize
    };
    
    setExportJobs(prev => [newJob, ...prev]);
    setActiveTab('queue');
    
    try {
      // Simular proceso de exportación
      const jobId = newJob.id;
      
      // Actualizar estado a procesando
      setExportJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'processing' as const } : job
      ));
      
      // Simular progreso
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setExportJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, progress } : job
        ));
      }
      
      // Llamar a la función de exportación real
      const downloadUrl = await onExport(settings);
      
      // Marcar como completado
      setExportJobs(prev => prev.map(job => 
        job.id === jobId ? { 
          ...job, 
          status: 'completed' as const, 
          progress: 100,
          endTime: new Date(),
          downloadUrl 
        } : job
      ));
      
    } catch (error) {
      // Marcar como fallido
      setExportJobs(prev => prev.map(job => 
        job.id === newJob.id ? { 
          ...job, 
          status: 'failed' as const,
          error: error instanceof Error ? error.message : 'Error desconocido'
        } : job
      ));
    } finally {
      setIsExporting(false);
    }
  };

  const formatFileSize = (mb: number): string => {
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityDetails = (quality: string) => {
    const details = {
      '480p': { resolution: '854x480', description: 'Calidad estándar, archivos pequeños' },
      '720p': { resolution: '1280x720', description: 'HD, buen balance calidad/tamaño' },
      '1080p': { resolution: '1920x1080', description: 'Full HD, alta calidad' },
      '4k': { resolution: '3840x2160', description: 'Ultra HD, máxima calidad' }
    };
    return details[quality as keyof typeof details];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg w-4/5 max-w-4xl h-4/5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Download size={24} />
            Exportar Video
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="inline mr-2" size={16} />
            Configuración
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'queue' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="inline mr-2" size={16} />
            Cola de Exportación ({exportJobs.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'settings' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Settings Panel */}
              <div className="space-y-6">
                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Formato de Video
                  </label>
                  <select
                    value={settings.format}
                    onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value as any }))}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="mp4">MP4 (Recomendado)</option>
                    <option value="webm">WebM</option>
                    <option value="mov">MOV</option>
                    <option value="avi">AVI</option>
                  </select>
                </div>

                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Calidad de Video
                  </label>
                  <div className="space-y-2">
                    {['480p', '720p', '1080p', '4k'].map(quality => {
                      const details = getQualityDetails(quality);
                      return (
                        <label key={quality} className="flex items-center p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                          <input
                            type="radio"
                            name="quality"
                            value={quality}
                            checked={settings.quality === quality}
                            onChange={(e) => setSettings(prev => ({ ...prev, quality: e.target.value as any }))}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="text-white font-medium">{quality}</div>
                            <div className="text-sm text-gray-400">{details.resolution} • {details.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* FPS */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Frames por Segundo
                  </label>
                  <select
                    value={settings.fps}
                    onChange={(e) => setSettings(prev => ({ ...prev, fps: parseInt(e.target.value) as any }))}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value={24}>24 FPS (Cinematográfico)</option>
                    <option value={30}>30 FPS (Estándar)</option>
                    <option value={60}>60 FPS (Suave)</option>
                  </select>
                </div>

                {/* Bitrate */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bitrate
                  </label>
                  <select
                    value={settings.bitrate}
                    onChange={(e) => setSettings(prev => ({ ...prev, bitrate: e.target.value as any }))}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="auto">Automático (Recomendado)</option>
                    <option value="low">Bajo (Archivo pequeño)</option>
                    <option value="medium">Medio (Balance)</option>
                    <option value="high">Alto (Máxima calidad)</option>
                    <option value="custom">Personalizado</option>
                  </select>
                  
                  {settings.bitrate === 'custom' && (
                    <input
                      type="number"
                      placeholder="Bitrate en kbps"
                      value={settings.customBitrate || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, customBitrate: parseInt(e.target.value) }))}
                      className="w-full mt-2 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Audio Settings */}
                <div>
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={settings.includeAudio}
                      onChange={(e) => setSettings(prev => ({ ...prev, includeAudio: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-300">Incluir Audio</span>
                  </label>
                  
                  {settings.includeAudio && (
                    <select
                      value={settings.audioQuality}
                      onChange={(e) => setSettings(prev => ({ ...prev, audioQuality: e.target.value as any }))}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="low">Calidad Baja (64 kbps)</option>
                      <option value="medium">Calidad Media (128 kbps)</option>
                      <option value="high">Calidad Alta (192 kbps)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Preview Panel */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Vista Previa de Exportación</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Formato:</span>
                    <span className="text-white">{settings.format.toUpperCase()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resolución:</span>
                    <span className="text-white">{getQualityDetails(settings.quality).resolution}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">FPS:</span>
                    <span className="text-white">{settings.fps}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Audio:</span>
                    <span className="text-white">
                      {settings.includeAudio ? `Sí (${settings.audioQuality})` : 'No'}
                    </span>
                  </div>
                  
                  <hr className="border-gray-700" />
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tamaño estimado:</span>
                    <span className="text-white font-medium">{formatFileSize(estimatedSize)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tiempo estimado:</span>
                    <span className="text-white font-medium">{formatDuration(estimatedTime)}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Iniciar Exportación
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Export Queue */
            <div className="space-y-4">
              {exportJobs.length === 0 ? (
                <div className="text-center py-12">
                  <FileVideo size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">No hay exportaciones en cola</p>
                </div>
              ) : (
                exportJobs.map(job => (
                  <div key={job.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {job.status === 'completed' && <CheckCircle className="text-green-500" size={20} />}
                        {job.status === 'failed' && <AlertCircle className="text-red-500" size={20} />}
                        {job.status === 'processing' && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        )}
                        {job.status === 'queued' && <Clock className="text-yellow-500" size={20} />}
                        
                        <div>
                          <div className="text-white font-medium">
                            {job.settings.quality} {job.settings.format.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-400">
                            {job.startTime.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-white">{job.progress}%</div>
                        <div className="text-sm text-gray-400">
                          {formatFileSize(job.estimatedSize)}
                        </div>
                      </div>
                    </div>
                    
                    {job.status === 'processing' && (
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {job.status === 'completed' && job.downloadUrl && (
                      <a
                        href={job.downloadUrl}
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                      >
                        <Download size={16} />
                        Descargar
                      </a>
                    )}
                    
                    {job.status === 'failed' && job.error && (
                      <div className="text-red-400 text-sm mt-2">
                        Error: {job.error}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
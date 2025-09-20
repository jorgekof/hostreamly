import React, { useState, useEffect } from 'react';
import { Search, Filter, Upload, Play, Clock, FileVideo, Folder, Grid, List } from 'lucide-react';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  duration: number;
  size: number;
  format: string;
  uploadDate: string;
  tags: string[];
  folder?: string;
}

interface MediaLibraryProps {
  onSelectMedia: (media: MediaItem) => void;
  onAddToTimeline: (media: MediaItem) => void;
  isVisible: boolean;
  onClose: () => void;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelectMedia,
  onAddToTimeline,
  isVisible,
  onClose
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'duration' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Simular carga de medios desde la API
  useEffect(() => {
    if (isVisible) {
      loadMediaItems();
    }
  }, [isVisible]);

  const loadMediaItems = async () => {
    setLoading(true);
    try {
      // Aquí se haría la llamada real a la API
      const mockData: MediaItem[] = [
        {
          id: '1',
          name: 'Presentación Producto.mp4',
          url: '/api/videos/1/stream',
          thumbnail: '/api/videos/1/thumbnail',
          duration: 180,
          size: 45000000,
          format: 'mp4',
          uploadDate: '2024-01-15T10:30:00Z',
          tags: ['producto', 'marketing'],
          folder: 'Marketing'
        },
        {
          id: '2',
          name: 'Tutorial Básico.mp4',
          url: '/api/videos/2/stream',
          thumbnail: '/api/videos/2/thumbnail',
          duration: 300,
          size: 78000000,
          format: 'mp4',
          uploadDate: '2024-01-14T15:45:00Z',
          tags: ['tutorial', 'educación'],
          folder: 'Tutoriales'
        },
        {
          id: '3',
          name: 'Webinar Q1.mp4',
          url: '/api/videos/3/stream',
          thumbnail: '/api/videos/3/thumbnail',
          duration: 3600,
          size: 890000000,
          format: 'mp4',
          uploadDate: '2024-01-13T09:00:00Z',
          tags: ['webinar', 'presentación'],
          folder: 'Webinars'
        }
      ];
      
      setMediaItems(mockData);
      setFilteredItems(mockData);
    } catch (error) {
      console.error('Error loading media items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar elementos
  useEffect(() => {
    let filtered = mediaItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFormat = selectedFormat === 'all' || item.format === selectedFormat;
      const matchesFolder = selectedFolder === 'all' || item.folder === selectedFolder;
      
      return matchesSearch && matchesFormat && matchesFolder;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredItems(filtered);
  }, [mediaItems, searchTerm, selectedFormat, selectedFolder, sortBy, sortOrder]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleItemSelect = (itemId: string, isMultiple: boolean = false) => {
    if (isMultiple) {
      setSelectedItems(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      setSelectedItems([itemId]);
      const item = mediaItems.find(m => m.id === itemId);
      if (item) {
        onSelectMedia(item);
      }
    }
  };

  const handleAddToTimeline = (item: MediaItem) => {
    onAddToTimeline(item);
  };

  const uniqueFormats = [...new Set(mediaItems.map(item => item.format))];
  const uniqueFolders = [...new Set(mediaItems.map(item => item.folder).filter(Boolean))];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg w-5/6 h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Biblioteca de Medios</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b border-gray-700 space-y-3">
          <div className="flex gap-4 items-center flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar videos, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Format Filter */}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todos los formatos</option>
              {uniqueFormats.map(format => (
                <option key={format} value={format}>{format.toUpperCase()}</option>
              ))}
            </select>

            {/* Folder Filter */}
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todas las carpetas</option>
              {uniqueFolders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-800'} hover:bg-blue-700 transition-colors`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-800'} hover:bg-blue-700 transition-colors`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 items-center">
            <span className="text-gray-400 text-sm">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="date">Fecha</option>
              <option value="name">Nombre</option>
              <option value="duration">Duración</option>
              <option value="size">Tamaño</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm hover:bg-gray-700 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">Cargando medios...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FileVideo size={48} className="mb-4" />
              <p className="text-lg font-medium">No se encontraron videos</p>
              <p className="text-sm">Intenta ajustar los filtros o sube nuevos videos</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all hover:bg-gray-700 ${
                    selectedItems.includes(item.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={(e) => handleItemSelect(item.id, e.ctrlKey || e.metaKey)}
                >
                  <div className="aspect-video bg-gray-700 relative">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzc0MTUxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFByZXZpZXc8L3RleHQ+PC9zdmc+';
                      }}
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                      {formatDuration(item.duration)}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-50 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToTimeline(item);
                        }}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                      >
                        <Play size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-sm font-medium truncate" title={item.name}>
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>{formatDuration(item.duration)}</span>
                      <span>•</span>
                      <span>{formatFileSize(item.size)}</span>
                    </div>
                    {item.folder && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Folder size={12} />
                        <span>{item.folder}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-3 bg-gray-800 rounded-lg cursor-pointer transition-all hover:bg-gray-700 ${
                    selectedItems.includes(item.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={(e) => handleItemSelect(item.id, e.ctrlKey || e.metaKey)}
                >
                  <div className="w-16 h-10 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzM3NDE1MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFByZXZpZXc8L3RleHQ+PC9zdmc+';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{item.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                      <span>{formatDuration(item.duration)}</span>
                      <span>{formatFileSize(item.size)}</span>
                      <span>{item.format.toUpperCase()}</span>
                      {item.folder && (
                        <span className="flex items-center gap-1">
                          <Folder size={12} />
                          {item.folder}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToTimeline(item);
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex-shrink-0"
                    title="Agregar al timeline"
                  >
                    <Play size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {filteredItems.length} de {mediaItems.length} videos
            {selectedItems.length > 0 && ` • ${selectedItems.length} seleccionados`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                selectedItems.forEach(itemId => {
                  const item = mediaItems.find(m => m.id === itemId);
                  if (item) handleAddToTimeline(item);
                });
                setSelectedItems([]);
              }}
              disabled={selectedItems.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
            >
              Agregar Seleccionados
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary;
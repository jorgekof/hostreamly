import React, { useState, useEffect } from 'react';
import { Play, Download, Star, Clock, Eye, Search, Filter, Grid, List, Sparkles } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  previewUrl: string;
  category: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  downloads: number;
  tags: string[];
  isPremium: boolean;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  elements: {
    videoTracks: number;
    audioTracks: number;
    textLayers: number;
    effects: number;
  };
}

interface TemplateLibraryProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'name'>('popular');
  const [isLoading, setIsLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Datos de ejemplo de plantillas
  const sampleTemplates: Template[] = [
    {
      id: 'template_1',
      name: 'Presentación Corporativa',
      description: 'Plantilla profesional para presentaciones de empresa con animaciones elegantes',
      thumbnail: '/api/placeholder/300/200',
      previewUrl: '/api/placeholder/video/preview1',
      category: 'business',
      duration: 60,
      difficulty: 'beginner',
      rating: 4.8,
      downloads: 1250,
      tags: ['corporativo', 'profesional', 'presentación', 'negocios'],
      isPremium: false,
      aspectRatio: '16:9',
      elements: { videoTracks: 2, audioTracks: 1, textLayers: 5, effects: 8 }
    },
    {
      id: 'template_2',
      name: 'Reel de Instagram',
      description: 'Plantilla moderna para reels con transiciones dinámicas y efectos trendy',
      thumbnail: '/api/placeholder/300/200',
      previewUrl: '/api/placeholder/video/preview2',
      category: 'social',
      duration: 30,
      difficulty: 'intermediate',
      rating: 4.9,
      downloads: 2100,
      tags: ['instagram', 'reel', 'social media', 'vertical'],
      isPremium: true,
      aspectRatio: '9:16',
      elements: { videoTracks: 3, audioTracks: 2, textLayers: 8, effects: 12 }
    },
    {
      id: 'template_3',
      name: 'Tutorial Educativo',
      description: 'Plantilla clara y organizada para contenido educativo y tutoriales',
      thumbnail: '/api/placeholder/300/200',
      previewUrl: '/api/placeholder/video/preview3',
      category: 'education',
      duration: 120,
      difficulty: 'beginner',
      rating: 4.7,
      downloads: 890,
      tags: ['educación', 'tutorial', 'aprendizaje', 'explicativo'],
      isPremium: false,
      aspectRatio: '16:9',
      elements: { videoTracks: 2, audioTracks: 1, textLayers: 6, effects: 4 }
    },
    {
      id: 'template_4',
      name: 'Promoción de Producto',
      description: 'Plantilla llamativa para promocionar productos con animaciones atractivas',
      thumbnail: '/api/placeholder/300/200',
      previewUrl: '/api/placeholder/video/preview4',
      category: 'marketing',
      duration: 45,
      difficulty: 'intermediate',
      rating: 4.6,
      downloads: 1560,
      tags: ['producto', 'marketing', 'promoción', 'ventas'],
      isPremium: true,
      aspectRatio: '1:1',
      elements: { videoTracks: 4, audioTracks: 2, textLayers: 7, effects: 15 }
    },
    {
      id: 'template_5',
      name: 'Evento en Vivo',
      description: 'Plantilla para streaming y eventos en vivo con overlays profesionales',
      thumbnail: '/api/placeholder/300/200',
      previewUrl: '/api/placeholder/video/preview5',
      category: 'streaming',
      duration: 180,
      difficulty: 'advanced',
      rating: 4.9,
      downloads: 750,
      tags: ['streaming', 'evento', 'en vivo', 'overlay'],
      isPremium: true,
      aspectRatio: '16:9',
      elements: { videoTracks: 5, audioTracks: 3, textLayers: 10, effects: 20 }
    },
    {
      id: 'template_6',
      name: 'Historia Personal',
      description: 'Plantilla emotiva para contar historias personales y momentos especiales',
      thumbnail: '/api/placeholder/300/200',
      previewUrl: '/api/placeholder/video/preview6',
      category: 'personal',
      duration: 90,
      difficulty: 'beginner',
      rating: 4.5,
      downloads: 1100,
      tags: ['personal', 'historia', 'emocional', 'recuerdos'],
      isPremium: false,
      aspectRatio: '16:9',
      elements: { videoTracks: 3, audioTracks: 2, textLayers: 4, effects: 6 }
    }
  ];

  const categories = [
    { id: 'all', name: 'Todas las Categorías', count: sampleTemplates.length },
    { id: 'business', name: 'Negocios', count: sampleTemplates.filter(t => t.category === 'business').length },
    { id: 'social', name: 'Redes Sociales', count: sampleTemplates.filter(t => t.category === 'social').length },
    { id: 'education', name: 'Educación', count: sampleTemplates.filter(t => t.category === 'education').length },
    { id: 'marketing', name: 'Marketing', count: sampleTemplates.filter(t => t.category === 'marketing').length },
    { id: 'streaming', name: 'Streaming', count: sampleTemplates.filter(t => t.category === 'streaming').length },
    { id: 'personal', name: 'Personal', count: sampleTemplates.filter(t => t.category === 'personal').length }
  ];

  // Cargar plantillas
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      // Simular carga de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTemplates(sampleTemplates);
      setFilteredTemplates(sampleTemplates);
      setIsLoading(false);
    };
    
    loadTemplates();
  }, []);

  // Filtrar y ordenar plantillas
  useEffect(() => {
    let filtered = [...templates];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filtrar por aspect ratio
    if (selectedAspectRatio !== 'all') {
      filtered = filtered.filter(template => template.aspectRatio === selectedAspectRatio);
    }

    // Filtrar por dificultad
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'recent':
          return b.id.localeCompare(a.id); // Simulando fecha por ID
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory, selectedAspectRatio, selectedDifficulty, sortBy]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTemplateSelect = (template: Template) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg w-11/12 h-5/6 flex flex-col max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles size={24} className="text-purple-400" />
              Biblioteca de Plantillas
            </h2>
            <p className="text-gray-400 mt-1">Comienza rápido con plantillas profesionales</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 bg-gray-800 p-6 overflow-y-auto">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar plantillas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Categorías</h3>
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className="text-xs bg-gray-600 px-2 py-1 rounded">{category.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Formato</h3>
              <select
                value={selectedAspectRatio}
                onChange={(e) => setSelectedAspectRatio(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Todos los formatos</option>
                <option value="16:9">16:9 (Horizontal)</option>
                <option value="9:16">9:16 (Vertical)</option>
                <option value="1:1">1:1 (Cuadrado)</option>
                <option value="4:5">4:5 (Retrato)</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Dificultad</h3>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Todas las dificultades</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <span className="text-gray-400">
                  {filteredTemplates.length} plantillas encontradas
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="p-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="popular">Más populares</option>
                  <option value="recent">Más recientes</option>
                  <option value="rating">Mejor valoradas</option>
                  <option value="name">Nombre A-Z</option>
                </select>

                {/* View Mode */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${
                      viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${
                      viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Templates Grid/List */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Filter size={48} className="mb-4" />
                  <p className="text-lg">No se encontraron plantillas</p>
                  <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
                }>
                  {filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className={`bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {/* Thumbnail */}
                      <div className={`relative ${
                        viewMode === 'list' ? 'w-48 h-32' : 'aspect-video'
                      }`}>
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Premium Badge */}
                        {template.isPremium && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                            PRO
                          </div>
                        )}
                        
                        {/* Duration */}
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <Clock size={12} />
                          {formatDuration(template.duration)}
                        </div>
                        
                        {/* Preview Button */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTemplate(template);
                            }}
                            className="opacity-0 hover:opacity-100 bg-blue-600 text-white p-3 rounded-full transition-opacity"
                          >
                            <Play size={20} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white truncate">{template.name}</h3>
                          <div className="flex items-center gap-1 text-yellow-400 ml-2">
                            <Star size={14} fill="currentColor" />
                            <span className="text-xs">{template.rating}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{template.description}</p>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={getDifficultyColor(template.difficulty)}>
                              {template.difficulty === 'beginner' ? 'Principiante' :
                               template.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">{template.aspectRatio}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-gray-400">
                            <Download size={12} />
                            <span>{template.downloads}</span>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-60 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{previewTemplate.name}</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="aspect-video bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <Play size={48} className="mx-auto mb-2" />
                <p>Vista previa del video</p>
                <p className="text-sm">(Funcionalidad de preview se implementará)</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleTemplateSelect(previewTemplate)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Usar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
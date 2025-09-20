import React, { useState, useEffect, useCallback } from 'react';
import { useLMSIntegration, createMoodleAdapter, createLearnDashAdapter } from '../../services/lmsIntegration';
import type { 
  Course, 
  LMSUser, 
  CourseProgress, 
  VideoProgress,
  LMSVideo 
} from '../../services/lmsIntegration';

interface LMSIntegrationProps {
  lmsType: 'moodle' | 'learndash' | 'custom';
  apiUrl: string;
  apiKey: string;
  onProgressUpdate?: (progress: CourseProgress) => void;
  onVideoComplete?: (videoId: string, userId: string) => void;
}

interface LMSConfig {
  name: string;
  type: 'moodle' | 'learndash' | 'custom';
  apiUrl: string;
  apiKey: string;
  connected: boolean;
}

export const LMSIntegration: React.FC<LMSIntegrationProps> = ({
  lmsType,
  apiUrl,
  apiKey,
  onProgressUpdate,
  onVideoComplete
}) => {
  const lmsSDK = useLMSIntegration(apiUrl, apiKey);
  
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<LMSUser[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedUser, setSelectedUser] = useState<LMSUser | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'progress' | 'analytics'>('courses');

  // Conectar con el LMS
  const connectToLMS = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Crear adaptador específico según el tipo de LMS
      let adapter;
      switch (lmsType) {
        case 'moodle':
          adapter = createMoodleAdapter(apiUrl, apiKey);
          break;
        case 'learndash':
          adapter = createLearnDashAdapter(apiUrl, apiKey);
          break;
        default:
          adapter = lmsSDK;
      }
      
      // Probar la conexión obteniendo cursos
      const testCourses = await adapter.getCourse('test') || [];
      setIsConnected(true);
      
    } catch (error) {
      console.error('LMS connection failed:', error);
      setError('No se pudo conectar con el LMS. Verifica la configuración.');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [lmsType, apiUrl, apiKey, lmsSDK]);

  // Cargar cursos
  const loadCourses = useCallback(async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      // Simular carga de cursos (en implementación real se usaría el adaptador)
      const mockCourses: Course[] = [
        {
          id: '1',
          title: 'Introducción a Hostreamly',
          description: 'Aprende los fundamentos de la plataforma de video',
          instructorId: 'instructor1',
          videos: [
            {
              id: 'video1',
              bunnyVideoId: 'bunny-video-1',
              title: 'Bienvenida al curso',
              description: 'Video introductorio',
              duration: 300,
              order: 1,
              isRequired: true,
              watchTimeRequired: 80
            },
            {
              id: 'video2',
              bunnyVideoId: 'bunny-video-2',
              title: 'Configuración inicial',
              description: 'Cómo configurar tu cuenta',
              duration: 450,
              order: 2,
              isRequired: true,
              watchTimeRequired: 90
            }
          ],
          assignments: [],
          quizzes: [],
          settings: {
            isPublic: true,
            requiresEnrollment: true,
            allowSelfEnrollment: true,
            certificateEnabled: true,
            passingGrade: 70,
            trackingEnabled: true,
            discussionEnabled: true
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15')
        }
      ];
      
      setCourses(mockCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Cargar usuarios
  const loadUsers = useCallback(async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      // Simular carga de usuarios
      const mockUsers: LMSUser[] = [
        {
          id: 'user1',
          email: 'estudiante@ejemplo.com',
          name: 'Juan Pérez',
          role: 'student',
          enrollments: ['1'],
          progress: {
            '1': {
              courseId: '1',
              userId: 'user1',
              completedVideos: ['video1'],
              videoProgress: {
                'video1': {
                  videoId: 'video1',
                  watchTime: 280,
                  totalTime: 300,
                  completed: true,
                  lastPosition: 300,
                  watchSessions: [],
                  interactions: []
                },
                'video2': {
                  videoId: 'video2',
                  watchTime: 200,
                  totalTime: 450,
                  completed: false,
                  lastPosition: 200,
                  watchSessions: [],
                  interactions: []
                }
              },
              assignmentScores: {},
              quizScores: {},
              overallProgress: 65,
              lastAccessed: new Date(),
              certificateEarned: false
            }
          }
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Cargar progreso del curso
  const loadCourseProgress = useCallback(async (userId: string, courseId: string) => {
    if (!isConnected) return;
    
    try {
      const progress = await lmsSDK.getCourseProgress(userId, courseId);
      setCourseProgress(progress);
      onProgressUpdate?.(progress!);
    } catch (error) {
      console.error('Error loading course progress:', error);
    }
  }, [isConnected, lmsSDK, onProgressUpdate]);

  // Rastrear progreso de video
  const trackVideoProgress = useCallback(async (userId: string, videoId: string, progress: Partial<VideoProgress>) => {
    if (!isConnected) return;
    
    try {
      await lmsSDK.trackVideoProgress(userId, videoId, progress);
      
      // Si el video se completó, emitir evento
      if (progress.completed) {
        onVideoComplete?.(videoId, userId);
      }
      
      // Actualizar progreso del curso
      if (selectedCourse && selectedUser) {
        await loadCourseProgress(selectedUser.id, selectedCourse.id);
      }
    } catch (error) {
      console.error('Error tracking video progress:', error);
    }
  }, [isConnected, lmsSDK, onVideoComplete, selectedCourse, selectedUser, loadCourseProgress]);

  // Inscribir usuario en curso
  const enrollUserInCourse = useCallback(async (userId: string, courseId: string) => {
    if (!isConnected) return;
    
    try {
      const success = await lmsSDK.enrollUser(userId, courseId);
      if (success) {
        await loadUsers(); // Recargar usuarios para actualizar inscripciones
      }
      return success;
    } catch (error) {
      console.error('Error enrolling user:', error);
      return false;
    }
  }, [isConnected, lmsSDK, loadUsers]);

  // Efectos
  useEffect(() => {
    connectToLMS();
  }, [connectToLMS]);

  useEffect(() => {
    if (isConnected) {
      loadCourses();
      loadUsers();
    }
  }, [isConnected, loadCourses, loadUsers]);

  useEffect(() => {
    if (selectedUser && selectedCourse) {
      loadCourseProgress(selectedUser.id, selectedCourse.id);
    }
  }, [selectedUser, selectedCourse, loadCourseProgress]);

  // Renderizar estado de conexión
  const renderConnectionStatus = () => {
    return (
      <div className="flex items-center space-x-2 mb-6">
        <div className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-sm font-medium">
          {isConnected ? `Conectado a ${lmsType.toUpperCase()}` : 'Desconectado'}
        </span>
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        )}
      </div>
    );
  };

  // Renderizar lista de cursos
  const renderCourses = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cursos Disponibles</h3>
        {courses.map(course => (
          <div 
            key={course.id} 
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedCourse?.id === course.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedCourse(course)}
          >
            <h4 className="font-medium">{course.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{course.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>{course.videos.length} videos</span>
              <span>{course.assignments.length} tareas</span>
              <span>{course.quizzes.length} cuestionarios</span>
              {course.settings.certificateEnabled && (
                <span className="text-green-600">✓ Certificado</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar lista de usuarios
  const renderUsers = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Usuarios</h3>
        {users.map(user => (
          <div 
            key={user.id} 
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedUser?.id === user.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedUser(user)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{user.name}</h4>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {user.role}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {user.enrollments.length} inscripciones
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar progreso del curso
  const renderProgress = () => {
    if (!selectedUser || !selectedCourse || !courseProgress) {
      return (
        <div className="text-center text-gray-500 py-8">
          Selecciona un usuario y un curso para ver el progreso
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Progreso del Curso</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(courseProgress.overallProgress)}%
            </div>
            <div className="text-sm text-gray-500">Completado</div>
          </div>
        </div>

        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${courseProgress.overallProgress}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {courseProgress.completedVideos.length}
            </div>
            <div className="text-sm text-green-700">Videos Completados</div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(courseProgress.assignmentScores).length}
            </div>
            <div className="text-sm text-blue-700">Tareas Entregadas</div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Progreso por Video</h4>
          {selectedCourse.videos.map(video => {
            const progress = courseProgress.videoProgress[video.id];
            const progressPercent = progress ? (progress.watchTime / progress.totalTime) * 100 : 0;
            
            return (
              <div key={video.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{video.title}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    progress?.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {progress?.completed ? 'Completado' : 'En progreso'}
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(progressPercent)}% • {progress ? Math.round(progress.watchTime / 60) : 0} min de {Math.round(video.duration / 60)} min
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar analytics
  const renderAnalytics = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Analytics del LMS</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
            <div className="text-sm text-blue-700">Cursos Activos</div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{users.length}</div>
            <div className="text-sm text-green-700">Usuarios Registrados</div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {courses.reduce((total, course) => total + course.videos.length, 0)}
            </div>
            <div className="text-sm text-purple-700">Videos Totales</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Actividad Reciente</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Juan Pérez completó "Bienvenida al curso"</span>
              <span className="text-gray-500">Hace 2 horas</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Nuevo usuario registrado: María García</span>
              <span className="text-gray-500">Hace 4 horas</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Curso "Introducción a Hostreamly" actualizado</span>
              <span className="text-gray-500">Hace 1 día</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 text-red-500">⚠️</div>
          <h3 className="font-medium text-red-800">Error de Conexión LMS</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button 
          onClick={connectToLMS}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar Conexión
        </button>
      </div>
    );
  }

  return (
    <div className="lms-integration p-6">
      {renderConnectionStatus()}
      
      {/* Navegación por pestañas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'courses', label: 'Cursos' },
            { key: 'users', label: 'Usuarios' },
            { key: 'progress', label: 'Progreso' },
            { key: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      <div className="tab-content">
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'progress' && renderProgress()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>

      {/* Acciones rápidas */}
      {isConnected && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Acciones Rápidas</h4>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => selectedUser && selectedCourse && enrollUserInCourse(selectedUser.id, selectedCourse.id)}
              disabled={!selectedUser || !selectedCourse}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Inscribir Usuario
            </button>
            
            <button 
              onClick={() => selectedUser && selectedCourse && trackVideoProgress(selectedUser.id, 'video1', { completed: true, watchTime: 300, totalTime: 300 })}
              disabled={!selectedUser || !selectedCourse}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Marcar Video Completado
            </button>
            
            <button 
              onClick={() => lmsSDK.clearCache()}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Limpiar Caché
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LMSIntegration;

// Componente para configuración de LMS
export const LMSConfiguration: React.FC<{
  onConfigSave: (config: LMSConfig) => void;
}> = ({ onConfigSave }) => {
  const [config, setConfig] = useState<LMSConfig>({
    name: '',
    type: 'custom',
    apiUrl: '',
    apiKey: '',
    connected: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigSave(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Configuración LMS</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la Integración
        </label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => setConfig({ ...config, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mi LMS"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de LMS
        </label>
        <select
          value={config.type}
          onChange={(e) => setConfig({ ...config, type: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="custom">Personalizado</option>
          <option value="moodle">Moodle</option>
          <option value="learndash">LearnDash</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL de la API
        </label>
        <input
          type="url"
          value={config.apiUrl}
          onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://mi-lms.com/api"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Clave de API
        </label>
        <input
          type="password"
          value={config.apiKey}
          onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tu clave de API"
          required
        />
      </div>
      
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Guardar Configuración
      </button>
    </form>
  );
};
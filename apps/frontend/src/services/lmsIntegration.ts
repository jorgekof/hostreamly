import { bunnyConfig } from '../config/bunnyConfig';
import type { BunnyVideoMetadata } from '../config/bunnyConfig';

// Interfaces para integración LMS
export interface LMSUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  enrollments: string[]; // Course IDs
  progress: Record<string, CourseProgress>;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  videos: LMSVideo[];
  assignments: Assignment[];
  quizzes: Quiz[];
  settings: CourseSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface LMSVideo {
  id: string;
  bunnyVideoId: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  isRequired: boolean;
  watchTimeRequired?: number; // Percentage (0-100)
  transcripts?: Transcript[];
  chapters?: VideoChapter[];
  assignments?: string[]; // Assignment IDs
  quizzes?: string[]; // Quiz IDs
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completedVideos: string[];
  videoProgress: Record<string, VideoProgress>;
  assignmentScores: Record<string, number>;
  quizScores: Record<string, QuizResult>;
  overallProgress: number; // Percentage (0-100)
  lastAccessed: Date;
  certificateEarned?: boolean;
}

export interface VideoProgress {
  videoId: string;
  watchTime: number; // seconds
  totalTime: number; // seconds
  completed: boolean;
  lastPosition: number; // seconds
  watchSessions: WatchSession[];
  interactions: VideoInteraction[];
}

export interface WatchSession {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  watchTime: number;
  pauseCount: number;
  seekCount: number;
  qualityChanges: number;
}

export interface VideoInteraction {
  type: 'pause' | 'play' | 'seek' | 'speed_change' | 'quality_change' | 'fullscreen';
  timestamp: number; // Video timestamp
  value?: any; // Additional data
  sessionTime: Date;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  type: 'essay' | 'file_upload' | 'video_response' | 'quiz';
  dueDate?: Date;
  maxScore: number;
  rubric?: AssignmentRubric;
  submissions: AssignmentSubmission[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit?: number; // minutes
  attempts: number;
  passingScore: number;
  randomizeQuestions: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
}

export interface QuizResult {
  quizId: string;
  userId: string;
  score: number;
  maxScore: number;
  answers: Record<string, any>;
  timeSpent: number; // minutes
  submittedAt: Date;
  attempt: number;
}

export interface Transcript {
  language: string;
  content: TranscriptEntry[];
}

export interface TranscriptEntry {
  start: number; // seconds
  end: number; // seconds
  text: string;
}

export interface VideoChapter {
  id: string;
  title: string;
  startTime: number; // seconds
  endTime: number; // seconds
  description?: string;
}

export interface CourseSettings {
  isPublic: boolean;
  requiresEnrollment: boolean;
  allowSelfEnrollment: boolean;
  certificateEnabled: boolean;
  passingGrade: number;
  trackingEnabled: boolean;
  discussionEnabled: boolean;
}

export interface AssignmentRubric {
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  levels: RubricLevel[];
}

export interface RubricLevel {
  name: string;
  description: string;
  points: number;
}

export interface AssignmentSubmission {
  id: string;
  userId: string;
  assignmentId: string;
  content: any;
  submittedAt: Date;
  score?: number;
  feedback?: string;
  graded: boolean;
}

// Clase principal para integración LMS
export class LMSIntegrationSDK {
  private apiBaseUrl: string;
  private apiKey: string;
  private bunnyConfig: any;
  private cache: Map<string, any> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(apiBaseUrl: string, apiKey: string) {
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
    this.bunnyConfig = bunnyConfig;
  }

  // Métodos de autenticación y configuración
  async authenticate(credentials: { username: string; password: string } | { token: string }): Promise<boolean> {
    try {
      const response = await this.makeRequest('/auth/login', 'POST', credentials);
      if (response.token) {
        this.apiKey = response.token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  // Métodos de gestión de usuarios
  async createUser(userData: Omit<LMSUser, 'id' | 'progress'>): Promise<LMSUser> {
    const response = await this.makeRequest('/users', 'POST', userData);
    return response.user;
  }

  async getUser(userId: string): Promise<LMSUser> {
    const cacheKey = `user_${userId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await this.makeRequest(`/users/${userId}`, 'GET');
    this.cache.set(cacheKey, response.user);
    return response.user;
  }

  async updateUser(userId: string, updates: Partial<LMSUser>): Promise<LMSUser> {
    const response = await this.makeRequest(`/users/${userId}`, 'PUT', updates);
    this.cache.delete(`user_${userId}`);
    return response.user;
  }

  async enrollUser(userId: string, courseId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/users/${userId}/enroll`, 'POST', { courseId });
      this.cache.delete(`user_${userId}`);
      return true;
    } catch (error) {
      console.error('Enrollment failed:', error);
      return false;
    }
  }

  // Métodos de gestión de cursos
  async createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    const response = await this.makeRequest('/courses', 'POST', courseData);
    return response.course;
  }

  async getCourse(courseId: string): Promise<Course> {
    const cacheKey = `course_${courseId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await this.makeRequest(`/courses/${courseId}`, 'GET');
    this.cache.set(cacheKey, response.course);
    return response.course;
  }

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    const response = await this.makeRequest(`/courses/${courseId}`, 'PUT', updates);
    this.cache.delete(`course_${courseId}`);
    return response.course;
  }

  async deleteCourse(courseId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/courses/${courseId}`, 'DELETE');
      this.cache.delete(`course_${courseId}`);
      return true;
    } catch (error) {
      console.error('Course deletion failed:', error);
      return false;
    }
  }

  // Métodos de gestión de videos
  async addVideoToCourse(courseId: string, videoData: Omit<LMSVideo, 'id'>): Promise<LMSVideo> {
    // Verificar que el video existe en Bunny
    const bunnyVideo = await this.getBunnyVideoMetadata(videoData.bunnyVideoId);
    if (!bunnyVideo) {
      throw new Error('Video not found in Bunny CDN');
    }

    const response = await this.makeRequest(`/courses/${courseId}/videos`, 'POST', {
      ...videoData,
      duration: bunnyVideo.duration
    });
    
    this.cache.delete(`course_${courseId}`);
    return response.video;
  }

  async updateVideo(courseId: string, videoId: string, updates: Partial<LMSVideo>): Promise<LMSVideo> {
    const response = await this.makeRequest(`/courses/${courseId}/videos/${videoId}`, 'PUT', updates);
    this.cache.delete(`course_${courseId}`);
    return response.video;
  }

  async deleteVideo(courseId: string, videoId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/courses/${courseId}/videos/${videoId}`, 'DELETE');
      this.cache.delete(`course_${courseId}`);
      return true;
    } catch (error) {
      console.error('Video deletion failed:', error);
      return false;
    }
  }

  // Métodos de seguimiento de progreso
  async trackVideoProgress(userId: string, videoId: string, progress: Partial<VideoProgress>): Promise<void> {
    await this.makeRequest('/progress/video', 'POST', {
      userId,
      videoId,
      ...progress
    });

    // Emitir evento de progreso
    this.emit('video_progress', { userId, videoId, progress });
  }

  async getVideoProgress(userId: string, videoId: string): Promise<VideoProgress | null> {
    try {
      const response = await this.makeRequest(`/progress/video/${userId}/${videoId}`, 'GET');
      return response.progress;
    } catch (error) {
      return null;
    }
  }

  async getCourseProgress(userId: string, courseId: string): Promise<CourseProgress | null> {
    try {
      const response = await this.makeRequest(`/progress/course/${userId}/${courseId}`, 'GET');
      return response.progress;
    } catch (error) {
      return null;
    }
  }

  async updateCourseProgress(userId: string, courseId: string): Promise<CourseProgress> {
    const response = await this.makeRequest(`/progress/course/${userId}/${courseId}/update`, 'POST');
    return response.progress;
  }

  // Métodos de interacciones de video
  async recordVideoInteraction(userId: string, videoId: string, interaction: Omit<VideoInteraction, 'sessionTime'>): Promise<void> {
    await this.makeRequest('/interactions/video', 'POST', {
      userId,
      videoId,
      ...interaction,
      sessionTime: new Date()
    });
  }

  async getVideoInteractions(userId: string, videoId: string): Promise<VideoInteraction[]> {
    const response = await this.makeRequest(`/interactions/video/${userId}/${videoId}`, 'GET');
    return response.interactions;
  }

  // Métodos de analytics
  async getCourseAnalytics(courseId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    const params = dateRange ? `?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}` : '';
    const response = await this.makeRequest(`/analytics/course/${courseId}${params}`, 'GET');
    return response.analytics;
  }

  async getUserAnalytics(userId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    const params = dateRange ? `?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}` : '';
    const response = await this.makeRequest(`/analytics/user/${userId}${params}`, 'GET');
    return response.analytics;
  }

  async getVideoAnalytics(videoId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    const params = dateRange ? `?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}` : '';
    const response = await this.makeRequest(`/analytics/video/${videoId}${params}`, 'GET');
    return response.analytics;
  }

  // Métodos de certificados
  async generateCertificate(userId: string, courseId: string): Promise<{ certificateUrl: string; certificateId: string }> {
    const response = await this.makeRequest('/certificates/generate', 'POST', {
      userId,
      courseId
    });
    return response.certificate;
  }

  async getCertificate(certificateId: string): Promise<any> {
    const response = await this.makeRequest(`/certificates/${certificateId}`, 'GET');
    return response.certificate;
  }

  // Métodos de integración con Bunny
  private async getBunnyVideoMetadata(videoId: string): Promise<BunnyVideoMetadata | null> {
    try {
      // Usar la configuración de Bunny para obtener metadatos del video
      const videoUrl = this.bunnyConfig.getVideoUrl(videoId);
      // Aquí se haría la llamada real a la API de Bunny
      return {
        id: videoId,
        title: 'Video Title',
        duration: 0,
        thumbnailUrl: '',
        streamUrl: videoUrl,
        resolutions: ['240p', '360p', '480p', '720p', '1080p']
      };
    } catch (error) {
      console.error('Error fetching Bunny video metadata:', error);
      return null;
    }
  }

  // Métodos de eventos
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Método auxiliar para hacer peticiones HTTP
  private async makeRequest(endpoint: string, method: string, data?: any): Promise<any> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    const config: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  // Método para limpiar caché
  clearCache(): void {
    this.cache.clear();
  }
}

// Adaptadores específicos para diferentes LMS
export class MoodleAdapter extends LMSIntegrationSDK {
  constructor(moodleUrl: string, token: string) {
    super(`${moodleUrl}/webservice/rest/server.php`, token);
  }

  // Métodos específicos de Moodle
  async getMoodleCourses(): Promise<Course[]> {
    const response = await this.makeRequest('', 'GET', {
      wstoken: this.apiKey,
      wsfunction: 'core_course_get_courses',
      moodlewsrestformat: 'json'
    });
    return this.transformMoodleCoursesToLMS(response);
  }

  async getMoodleUsers(): Promise<LMSUser[]> {
    const response = await this.makeRequest('', 'GET', {
      wstoken: this.apiKey,
      wsfunction: 'core_user_get_users',
      moodlewsrestformat: 'json'
    });
    return this.transformMoodleUsersToLMS(response);
  }

  private transformMoodleCoursesToLMS(moodleCourses: any[]): Course[] {
    return moodleCourses.map(course => ({
      id: course.id.toString(),
      title: course.fullname,
      description: course.summary,
      instructorId: course.contacts?.[0]?.id?.toString() || '',
      videos: [],
      assignments: [],
      quizzes: [],
      settings: {
        isPublic: course.visible === 1,
        requiresEnrollment: true,
        allowSelfEnrollment: course.enrollmentmethods?.includes('self') || false,
        certificateEnabled: false,
        passingGrade: 60,
        trackingEnabled: true,
        discussionEnabled: true
      },
      createdAt: new Date(course.timecreated * 1000),
      updatedAt: new Date(course.timemodified * 1000)
    }));
  }

  private transformMoodleUsersToLMS(moodleUsers: any[]): LMSUser[] {
    return moodleUsers.map(user => ({
      id: user.id.toString(),
      email: user.email,
      name: `${user.firstname} ${user.lastname}`,
      role: this.mapMoodleRole(user.roles),
      enrollments: [],
      progress: {}
    }));
  }

  private mapMoodleRole(roles: any[]): 'student' | 'instructor' | 'admin' {
    if (!roles || roles.length === 0) return 'student';
    
    const roleNames = roles.map(role => role.shortname.toLowerCase());
    
    if (roleNames.includes('manager') || roleNames.includes('admin')) return 'admin';
    if (roleNames.includes('teacher') || roleNames.includes('editingteacher')) return 'instructor';
    return 'student';
  }
}

export class LearnDashAdapter extends LMSIntegrationSDK {
  constructor(wordpressUrl: string, apiKey: string) {
    super(`${wordpressUrl}/wp-json/ldlms/v2`, apiKey);
  }

  // Métodos específicos de LearnDash
  async getLearnDashCourses(): Promise<Course[]> {
    const response = await this.makeRequest('/sfwd-courses', 'GET');
    return this.transformLearnDashCoursesToLMS(response);
  }

  async getLearnDashLessons(courseId: string): Promise<any[]> {
    const response = await this.makeRequest(`/sfwd-lessons?course=${courseId}`, 'GET');
    return response;
  }

  private transformLearnDashCoursesToLMS(ldCourses: any[]): Course[] {
    return ldCourses.map(course => ({
      id: course.id.toString(),
      title: course.title.rendered,
      description: course.content.rendered,
      instructorId: course.author.toString(),
      videos: [],
      assignments: [],
      quizzes: [],
      settings: {
        isPublic: course.status === 'publish',
        requiresEnrollment: true,
        allowSelfEnrollment: course.meta?.course_price_type === 'open',
        certificateEnabled: course.meta?.certificate || false,
        passingGrade: parseInt(course.meta?.course_points_access) || 60,
        trackingEnabled: true,
        discussionEnabled: true
      },
      createdAt: new Date(course.date),
      updatedAt: new Date(course.modified)
    }));
  }
}

// Hook personalizado para usar el SDK de LMS
export const useLMSIntegration = (apiBaseUrl: string, apiKey: string) => {
  const sdk = new LMSIntegrationSDK(apiBaseUrl, apiKey);
  
  return {
    // Métodos de usuario
    createUser: sdk.createUser.bind(sdk),
    getUser: sdk.getUser.bind(sdk),
    updateUser: sdk.updateUser.bind(sdk),
    enrollUser: sdk.enrollUser.bind(sdk),
    
    // Métodos de curso
    createCourse: sdk.createCourse.bind(sdk),
    getCourse: sdk.getCourse.bind(sdk),
    updateCourse: sdk.updateCourse.bind(sdk),
    deleteCourse: sdk.deleteCourse.bind(sdk),
    
    // Métodos de video
    addVideoToCourse: sdk.addVideoToCourse.bind(sdk),
    updateVideo: sdk.updateVideo.bind(sdk),
    deleteVideo: sdk.deleteVideo.bind(sdk),
    
    // Métodos de progreso
    trackVideoProgress: sdk.trackVideoProgress.bind(sdk),
    getVideoProgress: sdk.getVideoProgress.bind(sdk),
    getCourseProgress: sdk.getCourseProgress.bind(sdk),
    updateCourseProgress: sdk.updateCourseProgress.bind(sdk),
    
    // Métodos de analytics
    getCourseAnalytics: sdk.getCourseAnalytics.bind(sdk),
    getUserAnalytics: sdk.getUserAnalytics.bind(sdk),
    getVideoAnalytics: sdk.getVideoAnalytics.bind(sdk),
    
    // Métodos de certificados
    generateCertificate: sdk.generateCertificate.bind(sdk),
    getCertificate: sdk.getCertificate.bind(sdk),
    
    // Métodos de eventos
    on: sdk.on.bind(sdk),
    off: sdk.off.bind(sdk),
    
    // Utilidades
    clearCache: sdk.clearCache.bind(sdk)
  };
};

// Funciones auxiliares para crear adaptadores específicos
export const createMoodleAdapter = (moodleUrl: string, token: string) => {
  return new MoodleAdapter(moodleUrl, token);
};

export const createLearnDashAdapter = (wordpressUrl: string, apiKey: string) => {
  return new LearnDashAdapter(wordpressUrl, apiKey);
};

export default LMSIntegrationSDK;
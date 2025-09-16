import axios, { AxiosResponse } from 'axios';

interface VideoCDNConfig {
  apiKey: string;
  libraryId: string;
  baseUrl: string;
  cdnHostname: string;
}

interface VideoMetadata {
  title: string;
  description?: string;
  category?: string;
  thumbnailTime: number;
  tags?: string[];
  privacy: 'public' | 'private' | 'unlisted';
}

interface VideoResponse {
  videoId: string;
  libraryId?: string;
  title: string;
  status: number;
  thumbnailFileName?: string;
  views: number;
  isPublic: boolean;
  length: number;
  dateUploaded: string;
  storageSize: number;
  encodeProgress: number;
  width: number;
  height: number;
  framerate: number;
  rotation: number;
  availableResolutions: string;
  thumbnailCount: number;
  captions: Array<{
    language: string;
    label: string;
    srclang: string;
    src: string;
  }>;
  hasMP4Fallback: boolean;
  collectionId: string;
  thumbnailTime: number;
  averageWatchTime: number;
  totalWatchTime: number;
  category: string;
  chapters: Array<{
    title: string;
    start: number;
    end: number;
  }>;
  moments: Array<{
    time: number;
    title: string;
    description?: string;
  }>;
  metaTags: Array<{
    property: string;
    content: string;
  }>;
}

interface UploadResponse {
  success: boolean;
  message: string;
}

class VideoCDNService {
  private config: VideoCDNConfig;
  private axiosInstance;
  private configurationValid: boolean = false;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_BUNNY_STREAM_API_KEY || '',
      libraryId: import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID || '',
      baseUrl: import.meta.env.VITE_BUNNY_STREAM_BASE_URL || 'https://video.bunnycdn.com',
      cdnHostname: import.meta.env.VITE_BUNNY_CDN_HOSTNAME || ''
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'AccessKey': this.config.apiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      }
    });

    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    try {
      // Importar esquema de validación
      import('@/schemas/validation').then(({ cdnConfigSchema }) => {
        const config = {
          apiKey: import.meta.env.VITE_BUNNY_STREAM_API_KEY,
          libraryId: import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID,
          baseUrl: import.meta.env.VITE_BUNNY_STREAM_BASE_URL,
          hostname: import.meta.env.VITE_BUNNY_CDN_HOSTNAME
        };

        cdnConfigSchema.parse(config);
        this.configurationValid = true;
    
      }).catch((error) => {
        console.warn('⚠️ VideoCDN: Error de validación de configuración:', error.message);
        this.configurationValid = false;
      });
    } catch (error) {
      // Fallback a validación manual si no se puede importar Zod
      const requiredVars = [
        'VITE_BUNNY_STREAM_API_KEY',
        'VITE_BUNNY_STREAM_LIBRARY_ID', 
        'VITE_BUNNY_STREAM_BASE_URL',
        'VITE_BUNNY_CDN_HOSTNAME'
      ];

      const missingVars = requiredVars.filter(varName => {
        const value = import.meta.env[varName];
        return !value || value === 'your-api-key-here' || value === 'your-library-id-here';
      });

      if (missingVars.length > 0) {
        console.warn('⚠️ VideoCDN: Variables de entorno faltantes o con valores demo:', missingVars);
        this.configurationValid = false;
      } else {
        this.configurationValid = true;
  
      }
    }
  }

  public isConfigurationValid(): boolean {
    return this.configurationValid;
  }

  private handleError(error: unknown, operation: string): never {
    console.error(`VideoCDN ${operation} error:`, error);
    
    if (!this.configurationValid) {
      throw { code: 'CONFIG_ERROR', message: 'Configuración de CDN inválida' };
    }
    
    // Verificar si el error tiene la estructura de AxiosError
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response) {
        const status = axiosError.response.status;
        switch (status) {
          case 401:
            throw { code: 'AUTH_ERROR', message: 'Credenciales de API inválidas' };
          case 403:
            throw { code: 'AUTH_ERROR', message: 'Acceso denegado - Verifica permisos' };
          case 404:
            throw { code: 'NOT_FOUND', message: 'Recurso no encontrado' };
          case 429:
            throw { code: 'RATE_LIMIT', message: 'Límite de velocidad excedido' };
          case 500:
            throw { code: 'SERVER_ERROR', message: 'Error interno del servidor CDN' };
          default:
            throw { code: 'HTTP_ERROR', message: `Error HTTP ${status}` };
        }
      }
    }
    
    // Verificar si el error tiene código de red
    if (error && typeof error === 'object' && 'code' in error) {
      const codeError = error as { code: string; response?: unknown };
      if (codeError.code === 'NETWORK_ERROR' || !codeError.response) {
        throw { code: 'CONNECTION_ERROR', message: 'Error de conexión de red' };
      }
    }
    
    // Manejar errores con mensaje
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    throw { code: 'UNKNOWN_ERROR', message: errorMessage };
  }

  /**
   * Crear un nuevo objeto de video en la biblioteca
   */
  async createVideo(metadata: VideoMetadata): Promise<VideoResponse> {
    try {
      const response: AxiosResponse<VideoResponse> = await this.axiosInstance.post(
        `/library/${this.config.libraryId}/videos`,
        metadata
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'createVideo');
    }
  }

  /**
   * Subir archivo de video con callback de progreso
   */
  async uploadVideo(videoId: string, file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    try {
      const uploadInstance = axios.create({
        baseURL: this.config.baseUrl,
        headers: {
          'AccessKey': this.config.apiKey,
          'accept': 'application/json'
        }
      });

      const response: AxiosResponse<UploadResponse> = await uploadInstance.put(
        `/library/${this.config.libraryId}/videos/${videoId}`,
        file,
        {
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress?.(percentCompleted);
            }
          }
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'uploadVideo');
    }
  }

  /**
   * Proceso completo de subida de video con callback de progreso
   */
  async uploadVideoComplete(
    file: File, 
    metadata: VideoMetadata, 
    onProgress?: (progress: number) => void
  ): Promise<{ video: VideoResponse, upload: UploadResponse }> {
    try {
      const video = await this.createVideo(metadata);
      const upload = await this.uploadVideo(video.videoId, file, onProgress);
      return { video, upload };
    } catch (error) {
      this.handleError(error, 'uploadVideoComplete');
    }
  }

  /**
   * Obtener información de un video específico
   */
  async getVideo(videoId: string): Promise<VideoResponse> {
    try {
      const response: AxiosResponse<VideoResponse> = await this.axiosInstance.get(
        `/library/${this.config.libraryId}/videos/${videoId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'getVideo');
    }
  }

  /**
   * Obtener lista de videos en la biblioteca
   */
  async getVideos(page: number = 1, perPage: number = 100, search?: string): Promise<{ items: VideoResponse[], totalItems: number, currentPage: number }> {
    try {
      const params: Record<string, unknown> = {
        page,
        perPage
      };
      
      if (search) {
        params.search = search;
      }

      const response = await this.axiosInstance.get(
        `/library/${this.config.libraryId}/videos`,
        { params }
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'getVideos');
    }
  }

  /**
   * Eliminar un video
   */
  async deleteVideo(videoId: string): Promise<{ success: boolean }> {
    try {
      await this.axiosInstance.delete(
        `/library/${this.config.libraryId}/videos/${videoId}`
      );
      return { success: true };
    } catch (error) {
      this.handleError(error, 'deleteVideo');
    }
  }

  /**
   * Actualizar metadatos de un video
   */
  async updateVideo(videoId: string, updates: Partial<VideoMetadata>): Promise<VideoResponse> {
    try {
      const response: AxiosResponse<VideoResponse> = await this.axiosInstance.post(
        `/library/${this.config.libraryId}/videos/${videoId}`,
        updates
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'updateVideo');
    }
  }

  /**
   * Obtener URL de reproducción para un video
   */
  getPlaybackUrl(videoId: string, resolution?: string): string {
    const baseUrl = `https://${this.config.cdnHostname}`;
    if (resolution) {
      return `${baseUrl}/${videoId}/playlist_${resolution}.m3u8`;
    }
    return `${baseUrl}/${videoId}/playlist.m3u8`;
  }

  /**
   * Obtener URL de thumbnail
   */
  getThumbnailUrl(videoId: string, width?: number, height?: number): string {
    const baseUrl = `https://${this.config.cdnHostname}`;
    if (width && height) {
      return `${baseUrl}/${videoId}/thumbnail_${width}x${height}.jpg`;
    }
    return `${baseUrl}/${videoId}/thumbnail.jpg`;
  }

  /**
   * Subir video desde URL remota
   */
  async fetchVideoFromUrl(url: string, title: string): Promise<VideoResponse> {
    try {
      const response: AxiosResponse<VideoResponse> = await this.axiosInstance.post(
        `/library/${this.config.libraryId}/videos/fetch`,
        {
          url,
          title
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'fetchVideoFromUrl');
    }
  }

  /**
   * Obtener lista de videos (alias para getVideos)
   */
  async getVideoList(page: number = 1, perPage: number = 100, search?: string): Promise<{ items: VideoResponse[], totalItems: number, currentPage: number }> {
    return this.getVideos(page, perPage, search);
  }
}

export default new VideoCDNService();
export type { VideoResponse, VideoMetadata, UploadResponse };

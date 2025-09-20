import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');

// Create axios instance for folder service
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface UserFolder {
  id: string;
  name: string;
  parentId?: string;
  children?: UserFolder[];
  createdAt: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

export interface FolderStructureResponse {
  success: boolean;
  data: UserFolder[];
  message?: string;
}

export interface CreateFolderResponse {
  success: boolean;
  data: UserFolder;
  message?: string;
}

class FolderService {
  private readonly baseUrl = '/api/multi-library/user/folders';

  /**
   * Obtiene la estructura de carpetas del usuario
   */
  async getUserFolders(): Promise<UserFolder[]> {
    try {
      const response = await api.get<FolderStructureResponse>(this.baseUrl);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al obtener carpetas');
      }
    } catch (error: any) {
      console.error('Error fetching user folders:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al obtener la estructura de carpetas'
      );
    }
  }

  /**
   * Crea una nueva carpeta
   */
  async createFolder(folderData: CreateFolderRequest): Promise<UserFolder> {
    try {
      const response = await api.post<CreateFolderResponse>(this.baseUrl, folderData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al crear carpeta');
      }
    } catch (error: any) {
      console.error('Error creating folder:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al crear la carpeta'
      );
    }
  }

  /**
   * Elimina una carpeta (implementación futura)
   */
  async deleteFolder(folderId: string): Promise<void> {
    try {
      const response = await api.delete(`${this.baseUrl}/${folderId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar carpeta');
      }
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al eliminar la carpeta'
      );
    }
  }

  /**
   * Renombra una carpeta (implementación futura)
   */
  async renameFolder(folderId: string, newName: string): Promise<UserFolder> {
    try {
      const response = await api.patch<CreateFolderResponse>(`${this.baseUrl}/${folderId}`, {
        name: newName
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al renombrar carpeta');
      }
    } catch (error: any) {
      console.error('Error renaming folder:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Error al renombrar la carpeta'
      );
    }
  }
}

export const folderService = new FolderService();
export default folderService;
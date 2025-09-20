import { z } from 'zod';

// Esquemas para VideoUpload
export const videoFileSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => {
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
      return allowedTypes.includes(file.type);
    }, 'Tipo de archivo no válido. Solo se permiten: MP4, AVI, MOV, WMV, FLV, WebM')
    .refine((file) => {
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
      return file.size <= maxSize;
    }, 'El archivo no puede ser mayor a 2GB'),
});

export const videoMetadataSchema = z.object({
  title: z.string()
    .min(1, 'El título es requerido')
    .max(100, 'El título no puede exceder 100 caracteres')
    .trim(),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  thumbnailTime: z.number()
    .min(0, 'El tiempo del thumbnail debe ser positivo')
    .max(3600000, 'El tiempo del thumbnail no puede exceder 1 hora')
    .default(5000),
  category: z.string().optional(),
  tags: z.array(z.string().max(50, 'Cada tag no puede exceder 50 caracteres'))
    .max(10, 'No se pueden agregar más de 10 tags')
    .optional(),
  privacy: z.enum(['public', 'private', 'unlisted']).default('public'),
});

// Esquemas para VideoChapters
export const videoChapterSchema = z.object({
  title: z.string()
    .min(1, 'El título del capítulo es requerido')
    .max(100, 'El título no puede exceder 100 caracteres'),
  description: z.string()
    .max(300, 'La descripción no puede exceder 300 caracteres')
    .optional(),
  startTime: z.number()
    .min(0, 'El tiempo de inicio debe ser positivo'),
  endTime: z.number()
    .min(0, 'El tiempo de fin debe ser positivo')
    .optional(),
  order: z.number()
    .min(0, 'El orden debe ser positivo'),
  enabled: z.boolean().default(true),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    keyPoints: z.array(z.string()).optional(),
  }).optional(),
}).refine((data) => {
  if (data.endTime && data.startTime >= data.endTime) {
    return false;
  }
  return true;
}, {
  message: 'El tiempo de fin debe ser mayor al tiempo de inicio',
  path: ['endTime'],
});

// Esquemas para búsqueda y filtros
export const searchSchema = z.object({
  searchTerm: z.string()
    .max(100, 'El término de búsqueda no puede exceder 100 caracteres')
    .optional(),
  sortBy: z.enum(['date', 'title', 'views', 'duration']).default('date'),
  filterBy: z.enum(['all', 'ready', 'processing', 'error']).default('all'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Esquemas para configuración de CDN
export const cdnConfigSchema = z.object({
  apiKey: z.string()
    .min(1, 'La API Key es requerida')
    .refine((key) => key !== 'your-api-key-here', 'Debe configurar una API Key válida'),
  libraryId: z.string()
    .min(1, 'El Library ID es requerido')
    .refine((id) => id !== 'your-library-id-here', 'Debe configurar un Library ID válido'),
  baseUrl: z.string()
    .url('Debe ser una URL válida'),
  hostname: z.string()
    .min(1, 'El hostname es requerido'),
});

// Esquemas para PPV (Pay-Per-View)
export const ppvItemSchema = z.object({
  video_id: z.string().uuid('ID de video inválido'),
  title: z.string()
    .min(1, 'El título es requerido')
    .max(100, 'El título no puede exceder 100 caracteres'),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  price: z.number()
    .min(0.01, 'El precio debe ser mayor a 0')
    .max(999.99, 'El precio no puede exceder $999.99'),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
  access_duration: z.number()
    .min(1, 'La duración de acceso debe ser al menos 1 hora')
    .max(8760, 'La duración de acceso no puede exceder 1 año (8760 horas)'),
  preview_duration: z.number()
    .min(0, 'La duración del preview debe ser positiva')
    .max(600, 'La duración del preview no puede exceder 10 minutos')
    .optional(),
  active: z.boolean().default(true),
});

// Esquemas para autenticación
export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'El email es requerido'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'El email es requerido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: z.string(),
  firstName: z.string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z.string()
    .min(1, 'El apellido es requerido')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  acceptTerms: z.boolean()
    .refine((val) => val === true, 'Debe aceptar los términos y condiciones'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Esquemas para configuración de usuario
export const userProfileSchema = z.object({
  firstName: z.string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z.string()
    .min(1, 'El apellido es requerido')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  email: z.string()
    .email('Email inválido'),
  avatar: z.string().url('URL de avatar inválida').optional(),
  timezone: z.string().optional(),
  language: z.enum(['es', 'en', 'fr', 'de']).default('es'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    marketing: z.boolean().default(false),
  }).optional(),
});

// Esquemas para analytics y reportes
export const analyticsQuerySchema = z.object({
  video_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  metrics: z.array(z.enum(['views', 'watch_time', 'engagement', 'completion_rate']))
    .min(1, 'Debe seleccionar al menos una métrica'),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) < new Date(data.end_date);
  }
  return true;
}, {
  message: 'La fecha de inicio debe ser anterior a la fecha de fin',
  path: ['end_date'],
});

// Tipos TypeScript derivados de los esquemas
export type VideoFile = z.infer<typeof videoFileSchema>;
export type VideoMetadata = z.infer<typeof videoMetadataSchema>;
export type VideoChapter = z.infer<typeof videoChapterSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
export type CDNConfig = z.infer<typeof cdnConfigSchema>;
export type PPVItem = z.infer<typeof ppvItemSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

// Utilidades de validación
export const validateVideoFile = (file: File) => {
  return videoFileSchema.parse({ file });
};

export const validateVideoMetadata = (metadata: unknown) => {
  return videoMetadataSchema.parse(metadata);
};

export const validateSearchParams = (params: unknown) => {
  return searchSchema.parse(params);
};

export const validateCDNConfig = (config: unknown) => {
  return cdnConfigSchema.parse(config);
};

// Función helper para manejar errores de validación
export const handleValidationError = (error: z.ZodError) => {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
};

// Middleware de validación para formularios
export const createFormValidator = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
    try {
      const validData = schema.parse(data);
      return { success: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: handleValidationError(error) };
      }
      return { success: false, errors: { general: 'Error de validación desconocido' } };
    }
  };
};

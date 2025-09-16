import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { bunnyConfig } from '../config/bunnyConfig';
import type { BunnyRegion } from '../config/bunnyConfig';

// Interfaces para DRM básico
export interface DRMConfig {
  jwtSecret: string;
  tokenExpirationTime: number; // seconds
  allowedRegions: BunnyRegion[];
  maxConcurrentStreams: number;
  enableGeoblocking: boolean;
  enableDeviceBinding: boolean;
  enableTimeRestrictions: boolean;
}

export interface UserSubscription {
  userId: string;
  subscriptionType: 'free' | 'premium' | 'enterprise';
  expiresAt: Date;
  allowedRegions: BunnyRegion[];
  maxConcurrentStreams: number;
  features: string[];
}

export interface AccessToken {
  videoId: string;
  userId: string;
  expiresAt: number;
  allowedRegions: BunnyRegion[];
  deviceId?: string;
  sessionId: string;
  permissions: string[];
}

export interface SignedURL {
  url: string;
  expiresAt: number;
  signature: string;
  token: string;
}

export interface GeolocationInfo {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'tv';
  platform: string;
  userAgent: string;
  fingerprint: string;
}

export interface StreamSession {
  sessionId: string;
  userId: string;
  videoId: string;
  deviceId: string;
  startTime: Date;
  lastActivity: Date;
  region: BunnyRegion;
  isActive: boolean;
}

export interface DRMValidationResult {
  isValid: boolean;
  reason?: string;
  allowedDuration?: number;
  restrictions?: string[];
}

// Clase principal para DRM básico
export class BunnyDRMSystem {
  private config: DRMConfig;
  private activeSessions: Map<string, StreamSession> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private deviceBindings: Map<string, string[]> = new Map();
  private geoCache: Map<string, GeolocationInfo> = new Map();

  constructor(config: DRMConfig) {
    this.config = config;
    this.startSessionCleanup();
  }

  // Generación de tokens JWT
  public generateAccessToken(
    videoId: string,
    userId: string,
    subscription: UserSubscription,
    deviceInfo?: DeviceInfo,
    geolocation?: GeolocationInfo
  ): AccessToken {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + this.config.tokenExpirationTime;
    const sessionId = this.generateSessionId();

    // Validar suscripción
    if (subscription.expiresAt < new Date()) {
      throw new Error('Subscription expired');
    }

    // Determinar permisos basados en suscripción
    const permissions = this.getPermissionsForSubscription(subscription);

    // Validar restricciones geográficas
    let allowedRegions = subscription.allowedRegions;
    if (this.config.enableGeoblocking && geolocation) {
      allowedRegions = this.filterRegionsByGeolocation(allowedRegions, geolocation);
    }

    const token: AccessToken = {
      videoId,
      userId,
      expiresAt,
      allowedRegions,
      deviceId: deviceInfo?.deviceId,
      sessionId,
      permissions
    };

    return token;
  }

  public signAccessToken(token: AccessToken): string {
    const payload = {
      ...token,
      iat: Math.floor(Date.now() / 1000),
      iss: 'hostreamly-drm'
    };

    return jwt.sign(payload, this.config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: this.config.tokenExpirationTime
    });
  }

  public verifyAccessToken(tokenString: string): AccessToken {
    try {
      const decoded = jwt.verify(tokenString, this.config.jwtSecret) as any;
      
      // Validar estructura del token
      if (!decoded.videoId || !decoded.userId || !decoded.sessionId) {
        throw new Error('Invalid token structure');
      }

      return {
        videoId: decoded.videoId,
        userId: decoded.userId,
        expiresAt: decoded.expiresAt,
        allowedRegions: decoded.allowedRegions || [],
        deviceId: decoded.deviceId,
        sessionId: decoded.sessionId,
        permissions: decoded.permissions || []
      };
    } catch (error) {
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generación de URLs firmadas
  public generateSignedURL(
    videoId: string,
    token: AccessToken,
    expirationMinutes: number = 60
  ): SignedURL {
    const baseUrl = bunnyConfig.getVideoUrl(videoId);
    const expiresAt = Math.floor(Date.now() / 1000) + (expirationMinutes * 60);
    
    // Crear parámetros de URL
    const params = new URLSearchParams({
      token: this.signAccessToken(token),
      expires: expiresAt.toString(),
      session: token.sessionId
    });

    // Generar firma HMAC
    const dataToSign = `${baseUrl}?${params.toString()}`;
    const signature = crypto
      .createHmac('sha256', this.config.jwtSecret)
      .update(dataToSign)
      .digest('hex');

    params.append('signature', signature);
    
    const signedUrl = `${baseUrl}?${params.toString()}`;

    return {
      url: signedUrl,
      expiresAt,
      signature,
      token: this.signAccessToken(token)
    };
  }

  public validateSignedURL(url: string): DRMValidationResult {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      
      const token = params.get('token');
      const expires = params.get('expires');
      const signature = params.get('signature');
      const sessionId = params.get('session');

      if (!token || !expires || !signature || !sessionId) {
        return { isValid: false, reason: 'Missing required parameters' };
      }

      // Verificar expiración
      const expiresAt = parseInt(expires);
      if (Date.now() / 1000 > expiresAt) {
        return { isValid: false, reason: 'URL expired' };
      }

      // Verificar firma
      const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
      const paramsWithoutSignature = new URLSearchParams();
      params.forEach((value, key) => {
        if (key !== 'signature') {
          paramsWithoutSignature.append(key, value);
        }
      });
      
      const dataToVerify = `${baseUrl}?${paramsWithoutSignature.toString()}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.config.jwtSecret)
        .update(dataToVerify)
        .digest('hex');

      if (signature !== expectedSignature) {
        return { isValid: false, reason: 'Invalid signature' };
      }

      // Verificar token
      const accessToken = this.verifyAccessToken(token);
      if (accessToken.sessionId !== sessionId) {
        return { isValid: false, reason: 'Session mismatch' };
      }

      return { isValid: true, allowedDuration: expiresAt - Math.floor(Date.now() / 1000) };
    } catch (error) {
      return { 
        isValid: false, 
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Gestión de sesiones de streaming
  public async startStreamSession(
    token: AccessToken,
    deviceInfo: DeviceInfo,
    geolocation?: GeolocationInfo
  ): Promise<StreamSession> {
    // Validar límites de streams concurrentes
    const userActiveSessions = this.getUserActiveSessions(token.userId);
    if (userActiveSessions.length >= this.config.maxConcurrentStreams) {
      throw new Error('Maximum concurrent streams exceeded');
    }

    // Validar binding de dispositivo
    if (this.config.enableDeviceBinding && token.deviceId) {
      const boundDevices = this.deviceBindings.get(token.userId) || [];
      if (boundDevices.length > 0 && !boundDevices.includes(token.deviceId)) {
        throw new Error('Device not authorized');
      }
    }

    // Validar restricciones geográficas
    if (this.config.enableGeoblocking && geolocation) {
      const isAllowed = await this.validateGeolocation(token.allowedRegions, geolocation);
      if (!isAllowed) {
        throw new Error('Geographic restriction violation');
      }
    }

    // Crear sesión
    const session: StreamSession = {
      sessionId: token.sessionId,
      userId: token.userId,
      videoId: token.videoId,
      deviceId: deviceInfo.deviceId,
      startTime: new Date(),
      lastActivity: new Date(),
      region: this.determineRegion(geolocation),
      isActive: true
    };

    // Registrar sesión
    this.activeSessions.set(session.sessionId, session);
    
    const userSessions = this.userSessions.get(token.userId) || new Set();
    userSessions.add(session.sessionId);
    this.userSessions.set(token.userId, userSessions);

    return session;
  }

  public updateSessionActivity(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.activeSessions.set(sessionId, session);
    }
  }

  public endStreamSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
    }
  }

  public getActiveSession(sessionId: string): StreamSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  public getUserActiveSessions(userId: string): StreamSession[] {
    const sessionIds = this.userSessions.get(userId) || new Set();
    return Array.from(sessionIds)
      .map(id => this.activeSessions.get(id))
      .filter((session): session is StreamSession => session !== undefined);
  }

  // Restricciones geográficas
  public async validateGeolocation(
    allowedRegions: BunnyRegion[],
    geolocation: GeolocationInfo
  ): Promise<boolean> {
    if (!this.config.enableGeoblocking || allowedRegions.length === 0) {
      return true;
    }

    // Mapear país a región de Bunny CDN
    const userRegion = this.mapCountryToRegion(geolocation.country);
    return allowedRegions.includes(userRegion);
  }

  public async getGeolocation(ipAddress: string): Promise<GeolocationInfo> {
    // Verificar caché
    if (this.geoCache.has(ipAddress)) {
      return this.geoCache.get(ipAddress)!;
    }

    try {
      // Usar servicio de geolocalización (ejemplo con ipapi.co)
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const data = await response.json();

      const geolocation: GeolocationInfo = {
        country: data.country_code,
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone
      };

      // Cachear resultado por 1 hora
      this.geoCache.set(ipAddress, geolocation);
      setTimeout(() => this.geoCache.delete(ipAddress), 3600000);

      return geolocation;
    } catch (error) {
      console.error('Geolocation lookup failed:', error);
      // Retornar ubicación por defecto
      return {
        country: 'US',
        region: 'Unknown',
        city: 'Unknown',
        latitude: 0,
        longitude: 0,
        timezone: 'UTC'
      };
    }
  }

  // Binding de dispositivos
  public bindDevice(userId: string, deviceId: string): void {
    if (!this.config.enableDeviceBinding) return;

    const boundDevices = this.deviceBindings.get(userId) || [];
    if (!boundDevices.includes(deviceId)) {
      boundDevices.push(deviceId);
      this.deviceBindings.set(userId, boundDevices);
    }
  }

  public unbindDevice(userId: string, deviceId: string): void {
    const boundDevices = this.deviceBindings.get(userId) || [];
    const index = boundDevices.indexOf(deviceId);
    if (index > -1) {
      boundDevices.splice(index, 1);
      this.deviceBindings.set(userId, boundDevices);
    }
  }

  public getBoundDevices(userId: string): string[] {
    return this.deviceBindings.get(userId) || [];
  }

  // Validación de acceso completa
  public async validateAccess(
    tokenString: string,
    videoId: string,
    deviceInfo: DeviceInfo,
    ipAddress: string
  ): Promise<DRMValidationResult> {
    try {
      // Verificar token
      const token = this.verifyAccessToken(tokenString);
      
      // Verificar video ID
      if (token.videoId !== videoId) {
        return { isValid: false, reason: 'Video ID mismatch' };
      }

      // Verificar expiración
      if (Date.now() / 1000 > token.expiresAt) {
        return { isValid: false, reason: 'Token expired' };
      }

      // Verificar dispositivo
      if (this.config.enableDeviceBinding && token.deviceId && token.deviceId !== deviceInfo.deviceId) {
        return { isValid: false, reason: 'Device mismatch' };
      }

      // Verificar geolocalización
      if (this.config.enableGeoblocking) {
        const geolocation = await this.getGeolocation(ipAddress);
        const isGeoAllowed = await this.validateGeolocation(token.allowedRegions, geolocation);
        if (!isGeoAllowed) {
          return { isValid: false, reason: 'Geographic restriction' };
        }
      }

      // Verificar límites de streams concurrentes
      const activeSessions = this.getUserActiveSessions(token.userId);
      if (activeSessions.length >= this.config.maxConcurrentStreams) {
        return { isValid: false, reason: 'Concurrent stream limit exceeded' };
      }

      return { 
        isValid: true, 
        allowedDuration: token.expiresAt - Math.floor(Date.now() / 1000),
        restrictions: this.getActiveRestrictions(token)
      };
    } catch (error) {
      return { 
        isValid: false, 
        reason: `Access validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Métodos de utilidad privados
  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private getPermissionsForSubscription(subscription: UserSubscription): string[] {
    const basePermissions = ['stream', 'pause', 'seek'];
    
    switch (subscription.subscriptionType) {
      case 'premium':
        return [...basePermissions, 'download', 'hd_quality', 'skip_ads'];
      case 'enterprise':
        return [...basePermissions, 'download', 'hd_quality', 'skip_ads', 'analytics', 'admin'];
      default:
        return basePermissions;
    }
  }

  private filterRegionsByGeolocation(
    allowedRegions: BunnyRegion[],
    geolocation: GeolocationInfo
  ): BunnyRegion[] {
    const userRegion = this.mapCountryToRegion(geolocation.country);
    return allowedRegions.includes(userRegion) ? [userRegion] : [];
  }

  private mapCountryToRegion(countryCode: string): BunnyRegion {
    const regionMap: Record<string, BunnyRegion> = {
      'US': 'ny',
      'CA': 'ny',
      'GB': 'falkenstein',
      'DE': 'falkenstein',
      'FR': 'falkenstein',
      'SG': 'singapore',
      'JP': 'singapore',
      'AU': 'sydney',
      'BR': 'sao-paulo'
    };
    
    return regionMap[countryCode] || 'ny';
  }

  private determineRegion(geolocation?: GeolocationInfo): BunnyRegion {
    if (!geolocation) return 'ny';
    return this.mapCountryToRegion(geolocation.country);
  }

  private getActiveRestrictions(token: AccessToken): string[] {
    const restrictions: string[] = [];
    
    if (this.config.enableGeoblocking && token.allowedRegions.length > 0) {
      restrictions.push(`geo:${token.allowedRegions.join(',')}`);
    }
    
    if (this.config.enableDeviceBinding && token.deviceId) {
      restrictions.push(`device:${token.deviceId}`);
    }
    
    if (this.config.maxConcurrentStreams > 0) {
      restrictions.push(`concurrent:${this.config.maxConcurrentStreams}`);
    }
    
    return restrictions;
  }

  private startSessionCleanup(): void {
    // Limpiar sesiones inactivas cada 5 minutos
    setInterval(() => {
      const now = new Date();
      const inactiveThreshold = 30 * 60 * 1000; // 30 minutos
      
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now.getTime() - session.lastActivity.getTime() > inactiveThreshold) {
          this.endStreamSession(sessionId);
        }
      }
    }, 5 * 60 * 1000);
  }
}

// Hook personalizado para DRM
export const useBunnyDRM = (config: DRMConfig) => {
  const drm = new BunnyDRMSystem(config);
  
  return {
    // Métodos de tokens
    generateAccessToken: drm.generateAccessToken.bind(drm),
    signAccessToken: drm.signAccessToken.bind(drm),
    verifyAccessToken: drm.verifyAccessToken.bind(drm),
    
    // Métodos de URLs firmadas
    generateSignedURL: drm.generateSignedURL.bind(drm),
    validateSignedURL: drm.validateSignedURL.bind(drm),
    
    // Métodos de sesiones
    startStreamSession: drm.startStreamSession.bind(drm),
    updateSessionActivity: drm.updateSessionActivity.bind(drm),
    endStreamSession: drm.endStreamSession.bind(drm),
    getActiveSession: drm.getActiveSession.bind(drm),
    getUserActiveSessions: drm.getUserActiveSessions.bind(drm),
    
    // Métodos de geolocalización
    validateGeolocation: drm.validateGeolocation.bind(drm),
    getGeolocation: drm.getGeolocation.bind(drm),
    
    // Métodos de dispositivos
    bindDevice: drm.bindDevice.bind(drm),
    unbindDevice: drm.unbindDevice.bind(drm),
    getBoundDevices: drm.getBoundDevices.bind(drm),
    
    // Validación completa
    validateAccess: drm.validateAccess.bind(drm)
  };
};

export default BunnyDRMSystem;
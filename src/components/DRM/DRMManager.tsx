import React, { useState, useEffect, useCallback } from 'react';
import { useBunnyDRM } from '../../services/bunnyDRM';
import type {
  DRMConfig,
  UserSubscription,
  AccessToken,
  SignedURL,
  StreamSession,
  DeviceInfo,
  GeolocationInfo,
  DRMValidationResult
} from '../../services/bunnyDRM';
import type { BunnyRegion } from '../../config/bunnyConfig';

interface DRMManagerProps {
  videoId: string;
  userId: string;
  subscription: UserSubscription;
  onAccessGranted?: (signedUrl: string, session: StreamSession) => void;
  onAccessDenied?: (reason: string) => void;
  onSessionEnd?: (sessionId: string) => void;
}

const DRMManager: React.FC<DRMManagerProps> = ({
  videoId,
  userId,
  subscription,
  onAccessGranted,
  onAccessDenied,
  onSessionEnd
}) => {
  // Configuración DRM
  const drmConfig: DRMConfig = {
    jwtSecret: process.env.REACT_APP_JWT_SECRET || 'your-secret-key',
    tokenExpirationTime: 3600, // 1 hora
    allowedRegions: ['ny', 'falkenstein', 'singapore'],
    maxConcurrentStreams: 3,
    enableGeoblocking: true,
    enableDeviceBinding: true,
    enableTimeRestrictions: true
  };

  const bunnyDRM = useBunnyDRM(drmConfig);

  // Estados del componente
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<AccessToken | null>(null);
  const [signedUrl, setSignedUrl] = useState<SignedURL | null>(null);
  const [activeSession, setActiveSession] = useState<StreamSession | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [geolocation, setGeolocation] = useState<GeolocationInfo | null>(null);
  const [validationResult, setValidationResult] = useState<DRMValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<StreamSession[]>([]);
  const [boundDevices, setBoundDevices] = useState<string[]>([]);

  // Detectar información del dispositivo
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const deviceId = generateDeviceFingerprint();
      
      let deviceType: DeviceInfo['deviceType'] = 'desktop';
      if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
        deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
      }
      
      const device: DeviceInfo = {
        deviceId,
        deviceType,
        platform: navigator.platform,
        userAgent,
        fingerprint: deviceId
      };
      
      setDeviceInfo(device);
    };
    
    detectDevice();
  }, []);

  // Obtener geolocalización
  useEffect(() => {
    const getGeolocation = async () => {
      try {
        // Simular obtención de IP (en producción usar servicio real)
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();
        
        const geo = await bunnyDRM.getGeolocation(ip);
        setGeolocation(geo);
      } catch (error) {
        console.error('Failed to get geolocation:', error);
        // Usar ubicación por defecto
        setGeolocation({
          country: 'US',
          region: 'Unknown',
          city: 'Unknown',
          latitude: 0,
          longitude: 0,
          timezone: 'UTC'
        });
      }
    };
    
    getGeolocation();
  }, []);

  // Cargar sesiones activas del usuario
  useEffect(() => {
    if (userId) {
      const sessions = bunnyDRM.getUserActiveSessions(userId);
      setActiveSessions(sessions);
      
      const devices = bunnyDRM.getBoundDevices(userId);
      setBoundDevices(devices);
    }
  }, [userId]);

  // Actualizar actividad de sesión cada 30 segundos
  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        bunnyDRM.updateSessionActivity(activeSession.sessionId);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  // Generar huella digital del dispositivo
  const generateDeviceFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Generar hash simple
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  };

  // Solicitar acceso al video
  const requestAccess = useCallback(async () => {
    if (!deviceInfo || !geolocation) {
      setError('Device information or geolocation not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generar token de acceso
      const token = bunnyDRM.generateAccessToken(
        videoId,
        userId,
        subscription,
        deviceInfo,
        geolocation
      );
      
      setAccessToken(token);

      // Validar acceso completo
      const signedToken = bunnyDRM.signAccessToken(token);
      const validation = await bunnyDRM.validateAccess(
        signedToken,
        videoId,
        deviceInfo,
        '127.0.0.1' // En producción usar IP real
      );
      
      setValidationResult(validation);

      if (validation.isValid) {
        // Generar URL firmada
        const signed = bunnyDRM.generateSignedURL(videoId, token, 60);
        setSignedUrl(signed);

        // Iniciar sesión de streaming
        const session = await bunnyDRM.startStreamSession(token, deviceInfo, geolocation);
        setActiveSession(session);
        
        // Vincular dispositivo si está habilitado
        if (drmConfig.enableDeviceBinding) {
          bunnyDRM.bindDevice(userId, deviceInfo.deviceId);
          setBoundDevices(bunnyDRM.getBoundDevices(userId));
        }

        onAccessGranted?.(signed.url, session);
      } else {
        setError(validation.reason || 'Access denied');
        onAccessDenied?.(validation.reason || 'Access denied');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      onAccessDenied?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [videoId, userId, subscription, deviceInfo, geolocation]);

  // Finalizar sesión
  const endSession = useCallback(() => {
    if (activeSession) {
      bunnyDRM.endStreamSession(activeSession.sessionId);
      setActiveSession(null);
      setSignedUrl(null);
      setAccessToken(null);
      onSessionEnd?.(activeSession.sessionId);
    }
  }, [activeSession]);

  // Desvincular dispositivo
  const unbindDevice = useCallback((deviceId: string) => {
    bunnyDRM.unbindDevice(userId, deviceId);
    setBoundDevices(bunnyDRM.getBoundDevices(userId));
  }, [userId]);

  // Finalizar otras sesiones
  const endOtherSessions = useCallback(() => {
    const sessions = bunnyDRM.getUserActiveSessions(userId);
    sessions.forEach(session => {
      if (session.sessionId !== activeSession?.sessionId) {
        bunnyDRM.endStreamSession(session.sessionId);
      }
    });
    setActiveSessions(bunnyDRM.getUserActiveSessions(userId));
  }, [userId, activeSession]);

  // Formatear fecha
  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };

  // Formatear duración
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="drm-manager">
      <div className="drm-header">
        <h2>🔐 DRM Manager</h2>
        <p>Gestión de acceso y protección de contenido</p>
      </div>

      {/* Información del usuario y suscripción */}
      <div className="subscription-info">
        <h3>📋 Información de Suscripción</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Usuario:</label>
            <span>{userId}</span>
          </div>
          <div className="info-item">
            <label>Tipo:</label>
            <span className={`subscription-type ${subscription.subscriptionType}`}>
              {subscription.subscriptionType.toUpperCase()}
            </span>
          </div>
          <div className="info-item">
            <label>Expira:</label>
            <span>{formatDate(subscription.expiresAt)}</span>
          </div>
          <div className="info-item">
            <label>Streams Máximos:</label>
            <span>{subscription.maxConcurrentStreams}</span>
          </div>
          <div className="info-item">
            <label>Regiones Permitidas:</label>
            <span>{subscription.allowedRegions.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Información del dispositivo */}
      {deviceInfo && (
        <div className="device-info">
          <h3>📱 Información del Dispositivo</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>ID del Dispositivo:</label>
              <span className="device-id">{deviceInfo.deviceId}</span>
            </div>
            <div className="info-item">
              <label>Tipo:</label>
              <span>{deviceInfo.deviceType}</span>
            </div>
            <div className="info-item">
              <label>Plataforma:</label>
              <span>{deviceInfo.platform}</span>
            </div>
          </div>
        </div>
      )}

      {/* Información de geolocalización */}
      {geolocation && (
        <div className="geolocation-info">
          <h3>🌍 Geolocalización</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>País:</label>
              <span>{geolocation.country}</span>
            </div>
            <div className="info-item">
              <label>Región:</label>
              <span>{geolocation.region}</span>
            </div>
            <div className="info-item">
              <label>Ciudad:</label>
              <span>{geolocation.city}</span>
            </div>
            <div className="info-item">
              <label>Zona Horaria:</label>
              <span>{geolocation.timezone}</span>
            </div>
          </div>
        </div>
      )}

      {/* Controles de acceso */}
      <div className="access-controls">
        <h3>🔑 Control de Acceso</h3>
        
        {!activeSession ? (
          <button 
            className="access-button request"
            onClick={requestAccess}
            disabled={isLoading || !deviceInfo || !geolocation}
          >
            {isLoading ? '⏳ Validando...' : '🚀 Solicitar Acceso'}
          </button>
        ) : (
          <button 
            className="access-button end"
            onClick={endSession}
          >
            🛑 Finalizar Sesión
          </button>
        )}

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
      </div>

      {/* Resultado de validación */}
      {validationResult && (
        <div className="validation-result">
          <h3>✅ Resultado de Validación</h3>
          <div className={`validation-status ${validationResult.isValid ? 'valid' : 'invalid'}`}>
            <span className="status-icon">
              {validationResult.isValid ? '✅' : '❌'}
            </span>
            <span className="status-text">
              {validationResult.isValid ? 'Acceso Permitido' : 'Acceso Denegado'}
            </span>
          </div>
          
          {validationResult.reason && (
            <div className="validation-reason">
              <strong>Razón:</strong> {validationResult.reason}
            </div>
          )}
          
          {validationResult.allowedDuration && (
            <div className="validation-duration">
              <strong>Duración Permitida:</strong> {formatDuration(validationResult.allowedDuration)}
            </div>
          )}
          
          {validationResult.restrictions && validationResult.restrictions.length > 0 && (
            <div className="validation-restrictions">
              <strong>Restricciones Activas:</strong>
              <ul>
                {validationResult.restrictions.map((restriction, index) => (
                  <li key={index}>{restriction}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Token de acceso */}
      {accessToken && (
        <div className="access-token">
          <h3>🎫 Token de Acceso</h3>
          <div className="token-info">
            <div className="info-item">
              <label>Video ID:</label>
              <span>{accessToken.videoId}</span>
            </div>
            <div className="info-item">
              <label>Sesión ID:</label>
              <span>{accessToken.sessionId}</span>
            </div>
            <div className="info-item">
              <label>Expira:</label>
              <span>{formatDate(new Date(accessToken.expiresAt * 1000))}</span>
            </div>
            <div className="info-item">
              <label>Permisos:</label>
              <span>{accessToken.permissions.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* URL firmada */}
      {signedUrl && (
        <div className="signed-url">
          <h3>🔗 URL Firmada</h3>
          <div className="url-info">
            <div className="url-display">
              <input 
                type="text" 
                value={signedUrl.url} 
                readOnly 
                className="url-input"
              />
              <button 
                className="copy-button"
                onClick={() => navigator.clipboard.writeText(signedUrl.url)}
              >
                📋 Copiar
              </button>
            </div>
            <div className="url-details">
              <span>Expira: {formatDate(new Date(signedUrl.expiresAt * 1000))}</span>
              <span>Firma: {signedUrl.signature.substring(0, 16)}...</span>
            </div>
          </div>
        </div>
      )}

      {/* Sesión activa */}
      {activeSession && (
        <div className="active-session">
          <h3>🎬 Sesión Activa</h3>
          <div className="session-info">
            <div className="info-item">
              <label>Sesión ID:</label>
              <span>{activeSession.sessionId}</span>
            </div>
            <div className="info-item">
              <label>Dispositivo:</label>
              <span>{activeSession.deviceId}</span>
            </div>
            <div className="info-item">
              <label>Región:</label>
              <span>{activeSession.region}</span>
            </div>
            <div className="info-item">
              <label>Inicio:</label>
              <span>{formatDate(activeSession.startTime)}</span>
            </div>
            <div className="info-item">
              <label>Última Actividad:</label>
              <span>{formatDate(activeSession.lastActivity)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sesiones activas del usuario */}
      {activeSessions.length > 0 && (
        <div className="user-sessions">
          <h3>📺 Sesiones Activas ({activeSessions.length}/{subscription.maxConcurrentStreams})</h3>
          <div className="sessions-list">
            {activeSessions.map((session) => (
              <div key={session.sessionId} className="session-item">
                <div className="session-details">
                  <span className="session-video">Video: {session.videoId}</span>
                  <span className="session-device">Dispositivo: {session.deviceId.substring(0, 8)}...</span>
                  <span className="session-region">Región: {session.region}</span>
                  <span className="session-time">Inicio: {formatDate(session.startTime)}</span>
                </div>
                {session.sessionId !== activeSession?.sessionId && (
                  <button 
                    className="end-session-button"
                    onClick={() => bunnyDRM.endStreamSession(session.sessionId)}
                  >
                    🛑 Finalizar
                  </button>
                )}
              </div>
            ))}
            
            {activeSessions.length > 1 && (
              <button 
                className="end-all-button"
                onClick={endOtherSessions}
              >
                🛑 Finalizar Otras Sesiones
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dispositivos vinculados */}
      {boundDevices.length > 0 && (
        <div className="bound-devices">
          <h3>📱 Dispositivos Vinculados</h3>
          <div className="devices-list">
            {boundDevices.map((deviceId) => (
              <div key={deviceId} className="device-item">
                <span className="device-id">{deviceId}</span>
                <button 
                  className="unbind-button"
                  onClick={() => unbindDevice(deviceId)}
                >
                  🗑️ Desvincular
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .drm-manager {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .drm-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }

        .drm-header h2 {
          margin: 0 0 10px 0;
          font-size: 2rem;
        }

        .drm-header p {
          margin: 0;
          opacity: 0.9;
        }

        .subscription-info,
        .device-info,
        .geolocation-info,
        .access-controls,
        .validation-result,
        .access-token,
        .signed-url,
        .active-session,
        .user-sessions,
        .bound-devices {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border: 1px solid #e1e5e9;
        }

        .subscription-info h3,
        .device-info h3,
        .geolocation-info h3,
        .access-controls h3,
        .validation-result h3,
        .access-token h3,
        .signed-url h3,
        .active-session h3,
        .user-sessions h3,
        .bound-devices h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
          font-size: 1.2rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .info-item label {
          font-weight: 600;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .info-item span {
          color: #2c3e50;
          font-weight: 500;
        }

        .subscription-type {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
          text-transform: uppercase;
        }

        .subscription-type.free {
          background: #ecf0f1;
          color: #7f8c8d;
        }

        .subscription-type.premium {
          background: #3498db;
          color: white;
        }

        .subscription-type.enterprise {
          background: #9b59b6;
          color: white;
        }

        .device-id {
          font-family: monospace;
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .access-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-right: 10px;
        }

        .access-button.request {
          background: #27ae60;
          color: white;
        }

        .access-button.request:hover {
          background: #229954;
        }

        .access-button.end {
          background: #e74c3c;
          color: white;
        }

        .access-button.end:hover {
          background: #c0392b;
        }

        .access-button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .error-message {
          background: #fadbd8;
          color: #c0392b;
          padding: 12px;
          border-radius: 6px;
          margin-top: 10px;
          border-left: 4px solid #e74c3c;
        }

        .validation-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .validation-status.valid {
          background: #d5f4e6;
          color: #27ae60;
        }

        .validation-status.invalid {
          background: #fadbd8;
          color: #e74c3c;
        }

        .status-icon {
          font-size: 1.2rem;
        }

        .status-text {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .validation-reason,
        .validation-duration {
          margin-bottom: 10px;
          color: #2c3e50;
        }

        .validation-restrictions ul {
          margin: 5px 0 0 20px;
          color: #7f8c8d;
        }

        .token-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #3498db;
        }

        .url-display {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .url-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9rem;
          background: #f8f9fa;
        }

        .copy-button {
          padding: 8px 16px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .copy-button:hover {
          background: #2980b9;
        }

        .url-details {
          display: flex;
          gap: 20px;
          font-size: 0.9rem;
          color: #7f8c8d;
        }

        .session-info {
          background: #e8f5e8;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #27ae60;
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e1e5e9;
        }

        .session-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .session-details span {
          font-size: 0.9rem;
          color: #2c3e50;
        }

        .end-session-button,
        .end-all-button {
          padding: 6px 12px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .end-session-button:hover,
        .end-all-button:hover {
          background: #c0392b;
        }

        .end-all-button {
          margin-top: 10px;
          width: 100%;
        }

        .devices-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .device-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e1e5e9;
        }

        .device-item .device-id {
          font-family: monospace;
          font-size: 0.9rem;
        }

        .unbind-button {
          padding: 4px 8px;
          background: #f39c12;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .unbind-button:hover {
          background: #e67e22;
        }

        @media (max-width: 768px) {
          .drm-manager {
            padding: 10px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .url-display {
            flex-direction: column;
          }

          .session-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .device-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default DRMManager;
export type { DRMManagerProps };
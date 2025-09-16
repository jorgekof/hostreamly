import React from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, Globe, Users, Key } from "lucide-react";
import { Link } from "react-router-dom";

const SecurityGuide = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "Encriptación End-to-End",
      description: "Todo el contenido se encripta usando AES-256 en tránsito y en reposo",
      features: [
        "Certificados SSL/TLS actualizados",
        "Encriptación de base de datos",
        "Claves rotadas automáticamente",
        "Cumplimiento con estándares SOC 2"
      ]
    },
    {
      icon: Eye,
      title: "Control de Acceso Granular",
      description: "Define exactamente quién puede ver tu contenido y cuándo",
      features: [
        "Autenticación por token personalizada",
        "Restricciones geográficas",
        "Límites de tiempo de visualización",
        "Control de dominio referrer"
      ]
    },
    {
      icon: Shield,
      title: "Protección DRM",
      description: "Digital Rights Management para contenido premium",
      features: [
        "Widevine DRM para Chrome/Android",
        "FairPlay DRM para Safari/iOS",
        "PlayReady DRM para Windows/Xbox",
        "Marcas de agua dinámicas"
      ]
    },
    {
      icon: Users,
      title: "Gestión de Usuarios",
      description: "Controla el acceso de equipos y organizaciones",
      features: [
        "Single Sign-On (SSO) con SAML",
        "Autenticación multifactor (2FA)",
        "Roles y permisos personalizables",
        "Auditoría de accesos"
      ]
    }
  ];

  const privacyLevels = [
    {
      level: "Público",
      description: "Visible para cualquier persona con el enlace",
      icon: Globe,
      settings: [
        "Indexable en motores de búsqueda",
        "Compartible en redes sociales",
        "Sin restricciones de dominio",
        "Analytics públicos disponibles"
      ]
    },
    {
      level: "No Listado",
      description: "Solo accesible con enlace directo",
      icon: Eye,
      settings: [
        "No indexable en buscadores",
        "Enlace requerido para acceder",
        "Compartible pero no descubrible",
        "Analytics limitados"
      ]
    },
    {
      level: "Privado",
      description: "Requiere autenticación para acceder",
      icon: Lock,
      settings: [
        "Login requerido",
        "Solo usuarios autorizados",
        "Control de permisos granular",
        "Analytics completos"
      ]
    },
    {
      level: "Enterprise",
      description: "Máxima seguridad con DRM y controles avanzados",
      icon: Shield,
      settings: [
        "Protección DRM activa",
        "Marcas de agua personalizadas",
        "Restricciones geográficas",
        "Auditoría completa de accesos"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Link to="/docs" className="text-muted-foreground hover:text-primary">
                ← Volver a Documentación
              </Link>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-primary rounded-lg">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Seguridad y Privacidad</h1>
                <div className="flex items-center gap-4">
                  <Badge>SOC 2 Certified</Badge>
                  <Badge variant="secondary">10 min de lectura</Badge>
                  <p className="text-muted-foreground">
                    Protege tu contenido con seguridad de nivel empresarial
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Security Overview */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Características de Seguridad</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityFeatures.map((feature, index) => (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-primary rounded-lg">
                        <feature.icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      {feature.title}
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.features.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Privacy Levels */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Niveles de Privacidad</h2>
            <div className="space-y-4">
              {privacyLevels.map((level, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-primary rounded-lg">
                        <level.icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <span className="text-lg">{level.level}</span>
                        <CardDescription className="mt-1">{level.description}</CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {level.settings.map((setting, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          {setting}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Implementation Guide */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Guía de Implementación</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Configuración Básica de Seguridad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Habilitar HTTPS Obligatorio</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// Configuración de seguridad en tu aplicación
const hostreamlyConfig = {
            apiKey: process.env.HOSTREAMLY_API_KEY,
            baseURL: 'https://api.hostreamly.com', // Siempre HTTPS
  security: {
    enforceHttps: true,
    requireAuthentication: true,
    allowedDomains: ['yourdomain.com', 'app.yourdomain.com']
  }
};`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Autenticación con Token</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// Generar token de acceso para video
const generateSecureToken = (videoId, userId, expirationHours = 24) => {
  const payload = {
    videoId: videoId,
    userId: userId,
    exp: Math.floor(Date.now() / 1000) + (expirationHours * 3600),
    permissions: ['view', 'analytics'], // Permisos específicos
    restrictions: {
      maxViews: 5, // Límite de visualizaciones
      geoBlocking: ['US', 'CA'], // Solo estos países
      domainRestriction: 'yourdomain.com'
    }
  };
  
  return jwt.sign(payload, process.env.HOSTREAMLY_SECRET);
};

// Usar token en el reproductor
const playerConfig = {
  videoId: 'your-video-id',
  token: generateSecureToken('video-id', 'user-123'),
  security: {
    preventDownload: true,
    disableRightClick: true,
    watermark: {
      text: 'Confidencial - \${user.name}',
      position: 'bottom-right',
      opacity: 0.7
    }
  }
};`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Implementar Restricciones Avanzadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Control de Dominio y Geolocalización</h4>
                      <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// API call para configurar restricciones
const configureVideoSecurity = async (videoId, restrictions) => {
  const response = await fetch(\`https://api.hostreamly.com/v1/videos/\${videoId}/security\`, {
    method: 'PUT',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      domainWhitelist: ['yourdomain.com', 'training.yourdomain.com'],
      geoRestrictions: {
        allowedCountries: ['US', 'CA', 'MX'],
        blockedCountries: ['CN', 'RU']
      },
      timeRestrictions: {
        availableFrom: '2024-01-01T00:00:00Z',
        availableUntil: '2024-12-31T23:59:59Z',
        timezone: 'America/New_York'
      },
      accessControl: {
        maxConcurrentViewers: 100,
        sessionTimeout: 3600, // 1 hora
        requireReauth: true
      }
    })
  });
  
  return response.json();
};`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Integración con SSO y 2FA</h4>
                      <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// Configuración SSO con SAML
const ssoConfig = {
  provider: 'azure-ad', // o 'okta', 'onelogin', etc.
  entityId: 'https://your-company.com/hostreamly',
  ssoUrl: 'https://login.microsoftonline.com/your-tenant-id/saml2',
  certificate: process.env.SAML_CERTIFICATE,
  userMapping: {
    email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
    department: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/department'
  }
};

// Verificar 2FA antes de acceso a video
const verify2FA = async (userId, totpCode) => {
  const response = await fetch('https://api.hostreamly.com/v1/auth/verify-2fa', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      totpCode: totpCode,
      requiredForVideoAccess: true
    })
  });
  
  return response.json();
};`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Monitoreo y Auditoría</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <h4 className="font-medium mb-2">Configurar Logs de Seguridad</h4>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`// Configurar webhooks para eventos de seguridad
const securityWebhooks = {
  webhookUrl: 'https://yourapp.com/security-events',
  events: [
    'unauthorized_access_attempt',
    'suspicious_download_activity',
    'geo_restriction_violation',
    'token_expiration_warning',
    'drm_bypass_attempt'
  ],
  alerting: {
    email: 'security@yourcompany.com',
    slack: process.env.SLACK_SECURITY_WEBHOOK,
    threshold: {
      suspiciousActivity: 5, // alertas después de 5 intentos
      timeWindow: 300 // en 5 minutos
    }
  }
};

// Analizar logs de acceso
const getSecurityAnalytics = async (startDate, endDate) => {
  const response = await fetch(\`https://api.hostreamly.com/v1/analytics/security\`, {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`
    },
    params: {
      start_date: startDate,
      end_date: endDate,
      include: ['access_attempts', 'geo_violations', 'failed_auth']
    }
  });
  
  return response.json();
};`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Compliance */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Cumplimiento y Certificaciones</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h4 className="font-medium mb-2">SOC 2 Type II</h4>
                    <p className="text-sm text-muted-foreground">
                      Auditado anualmente para seguridad, disponibilidad y confidencialidad
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Lock className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h4 className="font-medium mb-2">GDPR Ready</h4>
                    <p className="text-sm text-muted-foreground">
                      Cumplimiento completo con regulaciones europeas de privacidad
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Key className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h4 className="font-medium mb-2">ISO 27001</h4>
                    <p className="text-sm text-muted-foreground">
                      Gestión de seguridad de la información certificada
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Garantías de Seguridad
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>99.9% uptime</strong> con redundancia geográfica</li>
                    <li>• <strong>Backups automáticos</strong> cada 6 horas con retención de 30 días</li>
                    <li>• <strong>Recuperación ante desastres</strong> con RTO &lt; 4 horas</li>
                    <li>• <strong>Monitoreo 24/7</strong> por equipo de seguridad dedicado</li>
                    <li>• <strong>Penetration testing</strong> trimestral por terceros</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Best Practices */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Mejores Prácticas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Para Desarrolladores</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Usa variables de entorno para API keys</li>
                    <li>• Implementa rate limiting en tu aplicación</li>
                    <li>• Valida todas las entradas de usuario</li>
                    <li>• Mantén logs detallados de acceso</li>
                    <li>• Rota API keys cada 90 días</li>
                    <li>• Usa HTTPS para todas las comunicaciones</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Para Administradores</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Revisa permisos de usuario regularmente</li>
                    <li>• Configura alertas de seguridad</li>
                    <li>• Capacita al equipo en mejores prácticas</li>
                    <li>• Realiza auditorías de acceso trimestrales</li>
                    <li>• Mantén políticas de seguridad actualizadas</li>
                    <li>• Planifica respuestas a incidentes</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Support */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-4">¿Necesitas asistencia con seguridad?</h3>
            <p className="text-muted-foreground mb-6">
              Nuestro equipo de seguridad está disponible para consultas específicas
            </p>
            <div className="flex gap-4 justify-center">
              <Button>Contactar Seguridad</Button>
              <Link to="/docs">
                <Button variant="outline">Ver más guías</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityGuide;

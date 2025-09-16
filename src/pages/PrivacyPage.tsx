import React from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, UserCheck, Globe } from "lucide-react";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Content Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Política de Privacidad
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Cómo protegemos y utilizamos su información personal en Hostreamly.com
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Última actualización: Enero 2024
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Compromiso con la Privacidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                En Hostreamly.com, nos tomamos en serio la privacidad de nuestros usuarios. Esta política 
                describe cómo recopilamos, utilizamos, almacenamos y protegemos su información personal 
                cuando utiliza nuestros servicios de hosting de video.
              </p>
              <p className="text-muted-foreground">
                Cumplimos con el Reglamento General de Protección de Datos (RGPD), la Ley de Privacidad 
                del Consumidor de California (CCPA) y otras regulaciones de privacidad aplicables.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Información que Recopilamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Información de Cuenta</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Nombre completo y dirección de correo electrónico</li>
                  <li>• Información de facturación y pago</li>
                  <li>• Preferencias de cuenta y configuraciones</li>
                  <li>• Historial de uso del servicio</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Contenido de Video</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Archivos de video que sube a nuestra plataforma</li>
                  <li>• Metadatos asociados (título, descripción, etiquetas)</li>
                  <li>• Configuraciones de privacidad y acceso</li>
                  <li>• Estadísticas de visualización y analytics</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Información Técnica</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Dirección IP y ubicación geográfica aproximada</li>
                  <li>• Tipo de navegador y sistema operativo</li>
                  <li>• Cookies y tecnologías de seguimiento similares</li>
                  <li>• Logs de acceso y actividad del sistema</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Cómo Utilizamos su Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">Propósitos Principales</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Proporcionar y mantener nuestros servicios de hosting de video</li>
                <li>• Procesar pagos y gestionar su cuenta</li>
                <li>• Proporcionar soporte técnico y atención al cliente</li>
                <li>• Mejorar nuestros servicios y desarrollar nuevas características</li>
                <li>• Garantizar la seguridad y prevenir fraudes</li>
                <li>• Cumplir con obligaciones legales y regulatorias</li>
              </ul>
              
              <h4 className="font-semibold mt-6">Analytics y Mejoras</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Analizar patrones de uso para optimizar el rendimiento</li>
                <li>• Generar estadísticas agregadas y anónimas</li>
                <li>• Realizar investigación y desarrollo de productos</li>
                <li>• Personalizar su experiencia de usuario</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Protección y Seguridad de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">Medidas de Seguridad Técnicas</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Encriptación TLS/SSL para todas las transmisiones de datos</li>
                <li>• Encriptación AES-256 para datos almacenados</li>
                <li>• Autenticación de dos factores disponible</li>
                <li>• Monitoreo continuo de seguridad y detección de amenazas</li>
                <li>• Copias de seguridad automatizadas y redundancia de datos</li>
              </ul>
              
              <h4 className="font-semibold mt-6">Medidas Organizacionales</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Acceso limitado basado en principio de menor privilegio</li>
                <li>• Capacitación regular en seguridad para empleados</li>
                <li>• Auditorías de seguridad independientes</li>
                <li>• Políticas estrictas de manejo de datos</li>
                <li>• Procedimientos de respuesta a incidentes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Sus Derechos de Privacidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Bajo el RGPD y otras leyes de privacidad, usted tiene los siguientes derechos:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Derechos de Acceso</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Acceder a sus datos personales</li>
                    <li>• Obtener una copia de sus datos</li>
                    <li>• Conocer cómo se procesan sus datos</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Derechos de Control</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Rectificar datos inexactos</li>
                    <li>• Solicitar eliminación de datos</li>
                    <li>• Limitar el procesamiento</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Portabilidad</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Exportar sus datos</li>
                    <li>• Transferir a otro proveedor</li>
                    <li>• Formato estructurado y legible</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Objeción</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Oponerse al procesamiento</li>
                    <li>• Retirar consentimiento</li>
                    <li>• Opt-out de marketing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Transferencias Internacionales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Nuestros servidores están ubicados en múltiples regiones geográficas para proporcionar 
                el mejor rendimiento. Esto puede implicar transferencias de datos fuera de su país de residencia.
              </p>
              
              <h4 className="font-semibold">Salvaguardas para Transferencias</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Utilizamos cláusulas contractuales estándar aprobadas por la UE</li>
                <li>• Implementamos medidas de seguridad adicionales para datos en tránsito</li>
                <li>• Realizamos evaluaciones de impacto de transferencia</li>
                <li>• Mantenemos registros de todas las transferencias internacionales</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retención de Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Conservamos su información personal solo durante el tiempo necesario para los fines 
                descritos en esta política o según lo requiera la ley.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Datos de Cuenta</h4>
                  <p className="text-sm text-muted-foreground">
                    Se conservan mientras su cuenta esté activa y hasta 30 días después de la eliminación.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Contenido de Video</h4>
                  <p className="text-sm text-muted-foreground">
                    Se conserva según sus configuraciones y se elimina cuando usted lo solicite.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Datos de Facturación</h4>
                  <p className="text-sm text-muted-foreground">
                    Se conservan durante 7 años para cumplir con obligaciones contables y fiscales.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Logs del Sistema</h4>
                  <p className="text-sm text-muted-foreground">
                    Se conservan durante 90 días para propósitos de seguridad y troubleshooting.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacto y Ejercicio de Derechos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Para ejercer sus derechos de privacidad o si tiene preguntas sobre esta política, 
                puede contactarnos:
              </p>
              
              <div className="space-y-2">
                <p><strong>Oficial de Protección de Datos:</strong> privacy@hostreamly.com</p>
                <p><strong>Soporte General:</strong> support@hostreamly.com</p>
                <p><strong>Dirección Postal:</strong></p>
                <p>Hostreamly Technologies - Privacy Department</p>
                <p>1234 Tech Street, Suite 100</p>
                <p>San Francisco, CA 94105, USA</p>
              </div>
              
              <p className="text-sm text-muted-foreground mt-6">
                También tiene derecho a presentar una queja ante su autoridad de protección de datos local 
                si considera que hemos violado sus derechos de privacidad.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;

import React from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Users, Globe } from "lucide-react";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Content Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Términos de Servicio
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Condiciones legales para el uso de Hostreamly.com
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
                <FileText className="w-5 h-5" />
                1. Aceptación de los Términos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Al acceder y utilizar Hostreamly.com, usted acepta cumplir con estos términos de servicio 
                y todas las leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos 
                términos, no debe utilizar nuestro servicio.
              </p>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Las 
                modificaciones entrarán en vigor inmediatamente después de su publicación en nuestro sitio web.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                2. Uso del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">Cuentas de Usuario</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Debe proporcionar información precisa y completa al crear su cuenta</li>
                <li>• Es responsable de mantener la confidencialidad de sus credenciales</li>
                <li>• Debe notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta</li>
                <li>• No puede compartir su cuenta con terceros sin autorización previa</li>
              </ul>
              
              <h4 className="font-semibold mt-6">Contenido Permitido</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Solo puede subir contenido del cual posee los derechos legales</li>
                <li>• No está permitido contenido que infrinja derechos de autor</li>
                <li>• Prohibido contenido ilegal, difamatorio o que incite al odio</li>
                <li>• Nos reservamos el derecho de eliminar contenido que viole estas políticas</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                3. Privacidad y Protección de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cumplimos con el RGPD y otras regulaciones de privacidad aplicables. Su información 
                personal se procesa de acuerdo con nuestra Política de Privacidad, que forma parte 
                integral de estos términos.
              </p>
              <h4 className="font-semibold">Recopilación de Datos</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Recopilamos solo los datos necesarios para proporcionar nuestro servicio</li>
                <li>• Sus datos de video se almacenan de forma segura en nuestros servidores</li>
                <li>• Implementamos medidas de seguridad técnicas y organizacionales apropiadas</li>
                <li>• No vendemos ni compartimos sus datos con terceros sin consentimiento</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                4. Facturación y Pagos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">Planes de Suscripción</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Los precios se muestran en USD y están sujetos a cambios con aviso previo</li>
                <li>• La facturación se realiza mensual o anualmente según el plan seleccionado</li>
                <li>• Los pagos se procesan a través de procesadores seguros como Stripe</li>
                <li>• No se proporcionan reembolsos por uso parcial de períodos de facturación</li>
              </ul>
              
              <h4 className="font-semibold mt-6">Uso de Recursos</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• El almacenamiento y ancho de banda se miden según el uso real</li>
                <li>• Los cargos adicionales de $0.05/GB se aplican al exceso de uso</li>
                <li>• Las facturas se generan automáticamente y se envían por correo electrónico</li>
                <li>• El servicio puede suspenderse por falta de pago después de 7 días</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Limitaciones de Responsabilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Hostreamly.com se proporciona "tal como está" sin garantías de ningún tipo. No garantizamos 
                que el servicio esté libre de errores o interrupciones. Nuestra responsabilidad se limita 
                al monto pagado por el servicio en los últimos 12 meses.
              </p>
              <p className="text-muted-foreground">
                No somos responsables de pérdidas de datos, pérdidas de beneficios, o daños indirectos 
                que puedan resultar del uso de nuestro servicio.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Terminación del Servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cualquiera de las partes puede terminar el acuerdo en cualquier momento. Al terminar 
                su cuenta, perderá el acceso a todo el contenido almacenado en nuestros servidores.
              </p>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos 
                sin previo aviso. Se recomienda mantener copias de seguridad de su contenido importante.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Si tiene preguntas sobre estos términos de servicio, puede contactarnos en:
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Email:</strong> legal@hostreamly.com</p>
        <p><strong>Dirección:</strong> Hostreamly Technologies</p>
                <p>1234 Tech Street, Suite 100</p>
                <p>San Francisco, CA 94105, USA</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default TermsPage;

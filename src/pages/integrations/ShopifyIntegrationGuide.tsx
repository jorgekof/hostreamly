import React from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Code, Settings, Webhook, Key, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const ShopifyIntegrationGuide = () => {
  const features = [
    {
      icon: ShoppingCart,
      title: "Integración Completa",
      description: "Aplicación nativa de Shopify con OAuth y webhooks"
    },
    {
      icon: Code,
      title: "Código de Incrustación",
      description: "Genera automáticamente códigos embed para productos"
    },
    {
      icon: Settings,
      title: "Configuración Flexible",
      description: "Personaliza tamaño, controles y apariencia del reproductor"
    },
    {
      icon: Webhook,
      title: "Sincronización Automática",
      description: "Webhooks para mantener productos y videos sincronizados"
    }
  ];

  const steps = [
    {
      step: 1,
      title: "Configurar Variables de Entorno",
      description: "Configura las credenciales necesarias",
      code: `# .env
SHOPIFY_API_KEY=tu_api_key_aqui
SHOPIFY_API_SECRET=tu_api_secret_aqui
SHOPIFY_WEBHOOK_SECRET=tu_webhook_secret_aqui
HOSTREAMLY_API_KEY=tu_hostreamly_api_key
HOSTREAMLY_API_URL=https://api.hostreamly.com
APP_URL=https://tu-dominio.com`
    },
    {
      step: 2,
      title: "Instalar Dependencias",
      description: "Instala los paquetes necesarios",
      code: `npm install @shopify/shopify-api express axios dotenv cors helmet`
    },
    {
      step: 3,
      title: "Configurar Aplicación Shopify",
      description: "Crea la aplicación en Shopify Partners",
      code: `# shopify.app.toml
name = "hostreamly-video-integration"
client_id = "{{ SHOPIFY_API_KEY }}"
application_url = "https://tu-dominio.com"
embedded = true

[access_scopes]
scopes = "read_products,write_products,read_content,write_content"`
    },
    {
      step: 4,
      title: "Implementar Autenticación OAuth",
      description: "Configura el flujo de autenticación",
      code: `// Ruta de autenticación
app.get('/auth', async (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).send('Shop parameter required');
  }
  
  const authRoute = await shopify.auth.begin({
    shop: shop.toString(),
    callbackPath: '/auth/callback',
    isOnline: false
  });
  
  res.redirect(authRoute);
});`
    },
    {
      step: 5,
      title: "Configurar Webhooks",
      description: "Maneja eventos de productos",
      code: `// Webhook para productos creados
app.post('/webhooks/products/create', (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const body = req.body;
  
  if (!verifyShopifyWebhook(body, hmac)) {
    return res.status(401).send('Unauthorized');
  }
  
  const product = JSON.parse(body.toString());
  console.log('New product created:', product.title);
  
  res.status(200).send('OK');
});`
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
                <ShoppingCart className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Integración con Shopify</h1>
                <div className="flex items-center gap-4">
                  <Badge className="bg-green-100 text-green-800">Funcional</Badge>
                  <Badge variant="secondary">Aplicación Nativa</Badge>
                  <p className="text-muted-foreground">
                    Integra videos de Hostreamly en tu tienda Shopify
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Features */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Características Principales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-primary rounded-lg">
                        <feature.icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Installation Steps */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Guía de Instalación</h2>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {step.step}
                      </div>
                      {step.title}
                    </CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{step.code}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Usage Examples */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Ejemplos de Uso</h2>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Agregar Video a Producto</CardTitle>
                <CardDescription>Código Liquid para mostrar videos en productos</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{`<!-- En tu template de producto -->
<div class="hostreamly-video-section">
  <h3>Video del Producto</h3>
  
  {% if product.metafields.custom.hostreamly_video_id %}
    <div class="hostreamly-responsive">
      <iframe 
        src="https://api.hostreamly.com/embed/player/{{ product.metafields.custom.hostreamly_video_id }}?controls=1&responsive=1" 
        frameborder="0" 
        allowfullscreen
        allow="autoplay; encrypted-media">
      </iframe>
    </div>
  {% endif %}
</div>

<style>
.hostreamly-responsive {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  margin: 20px 0;
}

.hostreamly-responsive iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
}
</style>`}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API para Gestión de Videos</CardTitle>
                <CardDescription>Endpoints disponibles para la aplicación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm">/api/videos</code>
                    <span className="text-sm text-muted-foreground">Obtener videos de Hostreamly</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge>POST</Badge>
                    <code className="text-sm">/api/embed-code</code>
                    <span className="text-sm text-muted-foreground">Generar código de incrustación</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm">/preview/:videoId</code>
                    <span className="text-sm text-muted-foreground">Vista previa de video</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Requirements */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Requisitos</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Shopify
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Cuenta de Shopify Partners</li>
                      <li>• Tienda de desarrollo o producción</li>
                      <li>• Permisos de aplicación configurados</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Hostreamly
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Cuenta activa de Hostreamly</li>
                      <li>• API Key con permisos de lectura</li>
                      <li>• Videos subidos y procesados</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Support */}
          <section>
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">¿Necesitas Ayuda?</h3>
                  <p className="text-muted-foreground mb-4">
                    Nuestro equipo está aquí para ayudarte con la integración
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button asChild>
                      <Link to="/support">Contactar Soporte</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="https://github.com/hostreamly/shopify-app" target="_blank" rel="noopener noreferrer">
                        Ver en GitHub
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShopifyIntegrationGuide;
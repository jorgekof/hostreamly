import React from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Zap, Upload, Settings, Play } from "lucide-react";
import { Link } from "react-router-dom";

const QuickStartGuide = () => {
  const steps = [
    {
      step: 1,
      title: "Crear tu cuenta Hostreamly.com",
      description: "Regístrate gratis y obtén acceso instantáneo",
      content: [
        "Visita la página de registro de Hostreamly.com",
        "Completa el formulario con tu información empresarial",
        "Confirma tu email y activa tu cuenta",
        "Accede al dashboard principal"
      ],
      time: "1 min"
    },
    {
      step: 2,
      title: "Configuración inicial de la cuenta",
      description: "Configura los ajustes básicos de tu workspace",
      content: [
        "Configura tu perfil de empresa y branding",
        "Establece configuraciones de privacidad y seguridad",
        "Invita a miembros del equipo (opcional)",
        "Configura notificaciones y webhooks"
      ],
      time: "2 min"
    },
    {
      step: 3,
      title: "Subir tu primer video",
      description: "Carga y publica tu contenido de video",
      content: [
        "Arrastra y suelta tu archivo de video",
        "Añade título, descripción y etiquetas",
        "Selecciona configuraciones de privacidad",
        "Inicia el proceso de codificación automática"
      ],
      time: "1 min"
    },
    {
      step: 4,
      title: "Reproducir y compartir",
      description: "Visualiza y distribuye tu contenido",
      content: [
        "Accede al reproductor integrado",
        "Copia el código de incrustación",
        "Configura controles y apariencia",
        "Comparte en tus plataformas"
      ],
      time: "1 min"
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
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Guía de Inicio Rápido</h1>
                <div className="flex items-center gap-4">
                  <Badge className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    5 minutos total
                  </Badge>
                  <p className="text-muted-foreground">
                    Configura tu cuenta y sube tu primer video en minutos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Prerequisites */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Requisitos Previos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Una cuenta de email válida para registro
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Un archivo de video para subir (formatos soportados: MP4, MOV, AVI, MKV)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Navegador web moderno (Chrome, Firefox, Safari, Edge)
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-foreground">{step.step}</span>
                      </div>
                      <div>
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                        <CardDescription className="text-base">{step.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {step.time}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ol className="space-y-3">
                    {step.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Next Steps */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Próximos Pasos
              </CardTitle>
              <CardDescription>
                ¡Felicidades! Has completado la configuración básica. Ahora puedes explorar funciones avanzadas:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/docs/api-integration">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Integración de API</div>
                      <div className="text-sm text-muted-foreground">
                        Conecta Hostreamly.com con tu aplicación
                      </div>
                    </div>
                  </Button>
                </Link>
                <Link to="/docs/security">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Seguridad y Privacidad</div>
                      <div className="text-sm text-muted-foreground">
                        Configura controles de acceso avanzados
                      </div>
                    </div>
                  </Button>
                </Link>
                <Link to="/docs/cdn">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">CDN Global</div>
                      <div className="text-sm text-muted-foreground">
                        Optimiza la entrega de contenido mundial
                      </div>
                    </div>
                  </Button>
                </Link>
                <Link to="/docs">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Ver todas las guías</div>
                      <div className="text-sm text-muted-foreground">
                        Explora la documentación completa
                      </div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-4">¿Necesitas ayuda?</h3>
            <p className="text-muted-foreground mb-6">
              Nuestro equipo de soporte está disponible 24/7 para ayudarte
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/support">
                <Button variant="outline">Centro de Soporte</Button>
              </Link>
              <Button>Chat en Vivo</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStartGuide;

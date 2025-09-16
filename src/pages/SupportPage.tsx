import React, { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Mail, Phone, Clock, Search, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const SupportPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const faqData = [
    {
      question: "¿Cómo subo mi primer video?",
      answer: "Para subir tu primer video, dirígete al Dashboard, haz clic en 'Subir Video', selecciona tu archivo y completa la información básica. El proceso de codificación comenzará automáticamente."
    },
    {
      question: "¿Qué formatos de video son compatibles?",
      answer: "Soportamos todos los formatos populares: MP4, AVI, MOV, WMV, FLV, MKV, y muchos más. Los videos se transcodifican automáticamente para optimizar la reproducción."
    },
    {
      question: "¿Cómo configuro la privacidad de mis videos?",
      answer: "Puedes configurar la privacidad desde el panel de cada video. Opciones disponibles: Público, Privado, Solo con enlace, y Control de dominio."
    },
    {
      question: "¿Cuál es el límite de almacenamiento?",
      answer: "Los límites dependen de tu plan: Plan Starter (100GB), Plan Professional (1TB), Plan Enterprise (Ilimitado). Puedes ver tu uso actual en el Dashboard."
    },
    {
      question: "¿Puedo integrar videos en mi sitio web?",
      answer: "Sí, proporcionamos códigos de embebido responsivos y una API completa para integraciones personalizadas. También ofrecemos SDKs para diferentes plataformas."
    },
    {
      question: "¿Cómo accedo a las estadísticas de mis videos?",
      answer: "Las estadísticas están disponibles en tiempo real desde tu Dashboard. Incluyen visualizaciones, tiempo de reproducción, ubicación geográfica y dispositivos utilizados."
    }
  ];

  const filteredFAQ = faqData.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Content Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Centro de Soporte
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Estamos aquí para ayudarte. Encuentra respuestas o contacta con nuestro equipo
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Options */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">¿Necesitas Ayuda?</h2>
            <p className="text-muted-foreground">Elige la forma más conveniente para contactarnos</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto p-3 bg-gradient-primary rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle>Chat en Vivo</CardTitle>
                <CardDescription>Respuesta inmediata</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="mb-4">
                  <Clock className="w-3 h-3 mr-1" />
                  24/7 Disponible
                </Badge>
                <p className="text-sm text-muted-foreground mb-4">
                  Chatea con nuestros expertos técnicos en tiempo real
                </p>
                <Button className="w-full">Iniciar Chat</Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto p-3 bg-gradient-primary rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle>Email</CardTitle>
                <CardDescription>Consultas detalladas</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="mb-4">
                  <Clock className="w-3 h-3 mr-1" />
                  &lt; 2 horas
                </Badge>
                <p className="text-sm text-muted-foreground mb-4">
                  soporte@hostreamly.com
                </p>
                <Button variant="outline" className="w-full">Enviar Email</Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto p-3 bg-gradient-primary rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Phone className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle>Teléfono</CardTitle>
                <CardDescription>Soporte prioritario</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="mb-4">
                  <Clock className="w-3 h-3 mr-1" />
                  Lun-Vie 9-18h
                </Badge>
                <p className="text-sm text-muted-foreground mb-4">
                  +1 (555) 123-4567
                </p>
                <Button variant="outline" className="w-full">Llamar Ahora</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Preguntas Frecuentes</h2>
            <p className="text-muted-foreground">Encuentra respuestas rápidas a las consultas más comunes</p>
          </div>
          
          {/* Search FAQ */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar en preguntas frecuentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {filteredFAQ.map((faq, index) => (
              <Collapsible key={index}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-left">{faq.question}</CardTitle>
                        <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform ui-open:transform ui-open:rotate-180" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Envíanos un Mensaje</h2>
            <p className="text-muted-foreground">¿No encuentras lo que buscas? Contacta directamente con nosotros</p>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Formulario de Contacto</CardTitle>
              <CardDescription>
                Nos pondremos en contacto contigo dentro de las próximas 2 horas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nombre</label>
                  <Input placeholder="Tu nombre completo" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input type="email" placeholder="tu@email.com" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Asunto</label>
                <Input placeholder="¿En qué podemos ayudarte?" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Mensaje</label>
                <Textarea 
                  placeholder="Describe tu consulta o problema en detalle..."
                  rows={5}
                />
              </div>
              <Button className="w-full">Enviar Mensaje</Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default SupportPage;

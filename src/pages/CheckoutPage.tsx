import React, { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, Shield, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'starter';
  
  const plans = {
    starter: {
      name: "Starter",
      price: 25,
      period: "/mes",
      storage: "100 GB",
      bandwidth: "1 TB",
      features: [
        "100 GB de almacenamiento",
        "1 TB de transferencia mensual",
        "Procesamiento instantáneo de videos",
        "Reproductor HTML5 personalizable",
        "Analytics básicos de reproducción",
        "Carga y streaming inmediato",
        "SSL y CDN global incluido",
        "CDN global básico",
        "Protección hotlink básica",
        "Compresión automática",
        "Soporte por email",
        "Dashboard de gestión",
        "API básica",
        "Transferencia adicional: $0.05/GB"
      ]
    },
    professional: {
      name: "Professional",
      price: 219,
      period: "/mes",
      storage: "1 TB",
      bandwidth: "10 TB",
      features: [
        "1 TB de almacenamiento",
        "10 TB de transferencia mensual",
        "Live streaming no incluido",
        "200 horas de visualización mensual",
        "Procesamiento instantáneo hasta 4K",
        "Reproductor con marca personalizada",
        "Analytics avanzados + reportes",
        "API REST para integración",
        "Streaming adaptativo automático",
        "CDN optimizado con caché inteligente",
        "DRM básico incluido",
        "Rate limiting personalizable",
        "Monitoreo de performance",
        "Soporte prioritario",
        "Gestión multi-usuario (5 usuarios)",
        "Calidad premium garantizada",
        "Transferencia adicional: $0.05/GB"
      ]
    },
    enterprise: {
      name: "Enterprise",
      price: 999,
      period: "/mes",
      storage: "3.5 TB",
      bandwidth: "35 TB",
      features: [
        "3.5 TB de almacenamiento",
        "35 TB de transferencia mensual",
        "15 horas mensuales de live streaming 4K",
        "500 horas de visualización mensual",
        "Máximo 60 espectadores simultáneos",
        "Procesamiento instantáneo sin límites hasta 4K",
        "DRM premium (Widevine & FairPlay)",
        "CDN global premium con Edge Computing",
        "Seguridad avanzada y 2FA",
        "Monitoreo y alertas en tiempo real",
        "Optimización automática de performance",
        "Geo-blocking y control de acceso avanzado",
        "White-label completo",
        "Analytics empresariales personalizados",
        "API completa + webhooks",
        "Soporte 24/7 + account manager",
        "SLA garantizado 99.9%",
        "Hasta 5 usuarios (sostenible)",
        "Integración personalizada",
        "Transferencia adicional: $0.05/GB"
      ]
    }
  };

  const selectedPlan = plans[plan as keyof typeof plans] || plans.starter;
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      alert("¡Pago procesado exitosamente! Te hemos enviado un email de confirmación.");
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Planes
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Finalizar Compra
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Completa tu suscripción al plan {selectedPlan.name}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Plan Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Resumen del Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-gradient-card rounded-lg border border-primary/20">
                  <h3 className="text-2xl font-bold mb-2">{selectedPlan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-4">
                    <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      {selectedPlan.price}
                    </span>
                    <span className="text-muted-foreground">{selectedPlan.period}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span>Almacenamiento:</span>
                    <span className="font-medium">{selectedPlan.storage}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Transferencia:</span>
                    <span className="font-medium">{selectedPlan.bandwidth}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Características incluidas:</h4>
                  <ul className="space-y-2">
                    {selectedPlan.features.slice(0, 6).map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{selectedPlan.price}/mes</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Impuestos:</span>
                    <span>Calculados en checkout</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                      {selectedPlan.price}/mes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Información de Pago
                </CardTitle>
                <CardDescription>
                  Tus datos están protegidos con encriptación SSL de 256 bits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input 
                      type="email" 
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Nombre completo</label>
                    <Input 
                      type="text" 
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Número de tarjeta</label>
                    <Input 
                      type="text" 
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Vencimiento</label>
                      <Input 
                        type="text" 
                        placeholder="MM/AA"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">CVV</label>
                      <Input 
                        type="text" 
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">País</label>
                    <Input 
                      type="text" 
                      placeholder="España"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Pago 100% Seguro</p>
                      <p className="text-xs text-muted-foreground">
                        Procesado por Stripe con encriptación de grado bancario
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? "Procesando..." : `Pagar ${selectedPlan.price}/mes`}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Al completar la compra, aceptas nuestros{" "}
                    <a href="#" className="text-primary hover:underline">Términos de Servicio</a>
                    {" "}y{" "}
                    <a href="#" className="text-primary hover:underline">Política de Privacidad</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Features */}
          <div className="mt-12 text-center">
            <div className="flex justify-center items-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm">SSL Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="text-sm">Stripe Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-sm">Garantía 30 días</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

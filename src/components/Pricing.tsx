import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Rocket, Crown, Sparkles, ArrowRight, Shield, Globe, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();
  
  const handlePlanSelect = (planType: string) => {
    navigate(`/checkout?plan=${planType}`);
  };

  const getCardClasses = (color: string) => {
    if (color === 'brand-primary') return 'bg-gradient-to-br from-brand-primary/20 via-background/90 to-brand-primary/10 border-brand-primary/40';
    if (color === 'brand-secondary') return 'bg-gradient-to-br from-brand-secondary/20 via-background/90 to-brand-secondary/10 border-brand-secondary/40';
    return 'bg-gradient-to-br from-brand-accent/20 via-background/90 to-brand-accent/10 border-brand-accent/40';
  };

  const getBadgeClasses = (color: string) => {
    if (color === 'brand-primary') return 'bg-gradient-to-r from-brand-primary to-brand-primary/80';
    if (color === 'brand-secondary') return 'bg-gradient-to-r from-brand-secondary to-brand-secondary/80';
    return 'bg-gradient-to-r from-brand-accent to-brand-accent/80';
  };

  const getIconClasses = (color: string) => {
    if (color === 'brand-primary') return 'bg-gradient-to-br from-brand-primary to-brand-primary/60';
    if (color === 'brand-secondary') return 'bg-gradient-to-br from-brand-secondary to-brand-secondary/60';
    return 'bg-gradient-to-br from-brand-accent to-brand-accent/60';
  };

  const getTitleClasses = (color: string) => {
    if (color === 'brand-primary') return 'text-brand-primary';
    if (color === 'brand-secondary') return 'text-brand-secondary';
    return 'text-brand-accent';
  };

  const getPriceClasses = (color: string) => {
    if (color === 'brand-primary') return 'bg-gradient-to-r from-brand-primary to-brand-primary/70';
    if (color === 'brand-secondary') return 'bg-gradient-to-r from-brand-secondary to-brand-secondary/70';
    return 'bg-gradient-to-r from-brand-accent to-brand-accent/70';
  };

  const getCheckBgClasses = (color: string) => {
    if (color === 'brand-primary') return 'bg-brand-primary/20';
    if (color === 'brand-secondary') return 'bg-brand-secondary/20';
    return 'bg-brand-accent/20';
  };

  const getButtonClasses = (color: string) => {
    if (color === 'brand-primary') return 'bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:from-brand-primary/90 hover:to-brand-primary/70';
    if (color === 'brand-secondary') return 'bg-gradient-to-r from-brand-secondary to-brand-secondary/80 hover:from-brand-secondary/90 hover:to-brand-secondary/70';
    return 'bg-gradient-to-r from-brand-accent to-brand-accent/80 hover:from-brand-accent/90 hover:to-brand-accent/70';
  };

  const getLateralClasses = (color: string) => {
    const base = 'bg-gradient-to-r border';
    if (color === 'brand-primary') {
      return `${base} from-brand-primary/20 to-brand-primary/10 hover:from-brand-primary/30 hover:to-brand-primary/20 text-brand-primary border-brand-primary/30 hover:border-brand-primary/50`;
    }
    if (color === 'brand-secondary') {
      return `${base} from-brand-secondary/20 to-brand-secondary/10 hover:from-brand-secondary/30 hover:to-brand-secondary/20 text-brand-secondary border-brand-secondary/30 hover:border-brand-secondary/50`;
    }
    return `${base} from-brand-accent/20 to-brand-accent/10 hover:from-brand-accent/30 hover:to-brand-accent/20 text-brand-accent border-brand-accent/30 hover:border-brand-accent/50`;
  };

  const plans = [
    {
      name: "STARTER",
      price: "25",
      period: "/mes",
      description: "Ideal para creadores y pequeños proyectos de video",
      icon: <Rocket className="w-8 h-8" />,
      color: "brand-primary",
      features: [
        "100 GB almacenamiento",
        "1 TB transferencia mensual",
        "20h visualización/mes",
        "Videos ilimitados",
        "Procesamiento instantáneo",
        "Reproductor personalizable",
        "Analytics básicos",
        "SSL + CDN global"
      ],
      popular: false,
      tier: "basic",
      cta: "COMENZAR AHORA"
    },
    {
      name: "PROFESSIONAL",
      price: "219",
      period: "/mes",
      description: "Para empresas que buscan rendimiento y escalabilidad",
      icon: <Star className="w-8 h-8" />,
      color: "brand-secondary",
      features: [
        "1 TB almacenamiento",
        "10 TB transferencia mensual",
        "200h visualización/mes",
        "Procesamiento hasta 4K",
        "Marca personalizada",
        "Analytics avanzados",
        "API REST completa",
        "DRM básico incluido",
        "Soporte prioritario",
        "Multi-usuario (3 users)"
      ],
      popular: true,
      tier: "premium",
      cta: "MÁS ELEGIDO"
    },
    {
      name: "ENTERPRISE",
      price: "999",
      period: "/mes",
      description: "Para empresas con necesidades avanzadas de live streaming 4K",
      icon: <Crown className="w-8 h-8" />,
      color: "brand-accent",
      features: [
        "3.5 TB almacenamiento",
        "35 TB transferencia mensual",
        "500h visualización/mes",
        "15h live streaming 4K/mes",
        "60 espectadores simultáneos",
        "DRM premium completo",
        "CDN global premium",
        "SLA 99.9% garantizado",
        "Soporte 24/7",
        "API personalizada",
        "Hasta 15 administradores"
      ],
      popular: false,
      tier: "enterprise",
      cta: "COMENZAR AHORA"
    }
  ];

  return (
    <section id="pricing" className="py-32 bg-gradient-to-b from-background via-background/80 to-background relative overflow-hidden min-h-screen">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-primary/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-secondary/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-3xl" />
        
        {/* Grid futurista de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
            {Array.from({length: 144}).map((_, i) => (
              <div key={i} className="border border-brand-accent/20 animate-pulse" style={{animationDelay: `${i * 0.1}s`}} />
            ))}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header futurista */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-accent/20 border border-brand-accent/30 backdrop-blur-xl mb-8 shadow-electric">
            <Sparkles className="w-6 h-6 mr-3 text-brand-accent animate-pulse" />
            <span className="text-sm font-black text-brand-accent tracking-widest brand-font-heading">PLANES DE PODER</span>
            <div className="ml-3 flex space-x-1">
              <div className="w-2 h-2 bg-brand-primary rounded-full animate-ping" />
              <div className="w-2 h-2 bg-brand-secondary rounded-full animate-ping" style={{animationDelay: '0.2s'}} />
              <div className="w-2 h-2 bg-brand-accent rounded-full animate-ping" style={{animationDelay: '0.4s'}} />
            </div>
          </div>
          
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 brand-font-display">
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
              PRICING
            </span>
            <br />
            <span className="text-foreground">MATRIX</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed brand-font-body">
            Elige tu nivel de poder. Cada plan está diseñado para 
            <span className="text-brand-accent font-bold brand-font-heading"> maximizar tu potencial</span> y 
            <span className="text-brand-primary font-bold brand-font-heading"> escalar sin límites</span>.
          </p>
        </div>

        {/* Layout de planes futurista */}
        <div className="relative max-w-7xl mx-auto">
          {/* Contenedor principal con grid responsivo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-stretch">
            {/* Plan Starter */}
            {plans.filter(plan => plan.name === 'STARTER').map((plan, index) => (
              <div key={index} className="relative group order-1 lg:order-1">
                <div className={`w-full min-h-[650px] backdrop-blur-xl rounded-2xl shadow-glow hover:shadow-electric transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden ${getCardClasses(plan.color)}`}>
                  {/* Contenido */}
                  <div className="p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center shadow-glow transform group-hover:scale-110 transition-all duration-300 ${getIconClasses(plan.color)}`}>
                        <div className="text-white">
                          {plan.icon}
                        </div>
                      </div>
                      <h3 className={`text-xl font-black mb-2 tracking-wider ${getTitleClasses(plan.color)}`}>{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1 mb-3">
                        <span className="text-xs text-muted-foreground">$</span>
                        <span className={`text-4xl font-black ${getTitleClasses(plan.color)}`}>
                          {plan.price}
                        </span>
                        <span className="text-muted-foreground text-xs">{plan.period}</span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {plan.description}
                      </p>
                    </div>
                    
                    {/* Features */}
                    <div className="flex-1 mb-6">
                      <ul className="space-y-2">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getCheckBgClasses(plan.color)}`}>
                               <Check className={`w-2.5 h-2.5 ${getTitleClasses(plan.color)}`} />
                            </div>
                            <span className="text-muted-foreground text-xs font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* CTA */}
                    <Button 
                      className={`w-full shadow-glow hover:shadow-electric transition-all duration-300 transform hover:scale-105 font-bold tracking-wide ${getLateralClasses(plan.color)}`}
                      size="lg"
                      onClick={() => handlePlanSelect(plan.name.toLowerCase())}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  {/* Efectos decorativos */}
                  <div className={`absolute top-2 right-2 w-8 h-8 rounded-full blur-lg animate-pulse ${getCheckBgClasses(plan.color)}`} />
                </div>
              </div>
            ))}
            
            {/* Plan Popular (Professional) - Centro */}
            {plans.filter(plan => plan.popular).map((plan, index) => (
              <div key={index} className="relative group order-2 lg:order-2">
                {/* Aura del plan popular */}
                <div className="absolute -inset-4 bg-gradient-to-r from-brand-primary/20 via-brand-secondary/30 to-brand-accent/20 rounded-3xl blur-2xl animate-pulse" />
                
                {/* Card principal */}
                <div className={`relative w-full min-h-[700px] backdrop-blur-xl border-2 rounded-3xl shadow-electric hover:shadow-glow transition-all duration-500 transform hover:scale-105 hover:-translate-y-4 overflow-hidden ${getCardClasses(plan.color)}`}>
                  {/* Badge popular */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className={`text-white px-6 py-3 rounded-full text-sm font-black flex items-center gap-2 shadow-electric animate-pulse ${getBadgeClasses(plan.color)}`}>
                      <Star className="w-5 h-5" />
                      RECOMENDADO
                    </div>
                  </div>
                  
                  {/* Contenido */}
                  <div className="p-8 h-full flex flex-col">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-glow transform group-hover:scale-110 transition-all duration-300 ${getIconClasses(plan.color)}`}>
                        <div className="text-white">
                          {plan.icon}
                        </div>
                      </div>
                      <h3 className={`text-2xl font-black mb-2 tracking-wider brand-font-heading ${getTitleClasses(plan.color)}`}>{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1 mb-4">
                        <span className="text-sm text-muted-foreground">$</span>
                        <span className={`text-5xl font-black bg-clip-text text-transparent ${getPriceClasses(plan.color)}`}>
                          {plan.price}
                        </span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed brand-font-body">
                        {plan.description}
                      </p>
                    </div>
                    
                    {/* Features */}
                    <div className="flex-1 mb-8">
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getCheckBgClasses(plan.color)}`}>
                               <Check className={`w-3 h-3 ${getTitleClasses(plan.color)}`} />
                            </div>
                            <span className="text-muted-foreground text-sm font-medium brand-font-body">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* CTA */}
                    <Button 
                      className={`w-full text-white border-0 shadow-electric hover:shadow-glow transition-all duration-300 transform hover:scale-105 font-black tracking-wider brand-font-heading ${getButtonClasses(plan.color)}`}
                      size="lg"
                      onClick={() => handlePlanSelect(plan.name.toLowerCase())}
                    >
                      <Zap className="w-5 h-5 mr-2 animate-pulse" />
                      {plan.cta}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                  
                  {/* Efectos decorativos */}
                  <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-brand-accent/30 to-transparent rounded-full blur-xl animate-pulse" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-tl from-brand-primary/30 to-transparent rounded-full blur-lg animate-pulse" style={{animationDelay: "1s"}} />
                </div>
              </div>
            ))}
            
            {/* Plan Enterprise */}
            {plans.filter(plan => plan.name === 'ENTERPRISE').map((plan, index) => (
              <div key={index} className="relative group order-3 lg:order-3">
                <div className={`w-full min-h-[650px] backdrop-blur-xl rounded-2xl shadow-glow hover:shadow-electric transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden ${getCardClasses(plan.color)}`}>
                  {/* Contenido */}
                  <div className="p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center shadow-glow transform group-hover:scale-110 transition-all duration-300 ${getIconClasses(plan.color)}`}>
                        <div className="text-white">
                          {plan.icon}
                        </div>
                      </div>
                      <h3 className={`text-xl font-black mb-2 tracking-wider ${getTitleClasses(plan.color)}`}>{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1 mb-3">
                        <span className="text-xs text-muted-foreground">$</span>
                        <span className={`text-4xl font-black ${getTitleClasses(plan.color)}`}>
                          {plan.price}
                        </span>
                        <span className="text-muted-foreground text-xs">{plan.period}</span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {plan.description}
                      </p>
                    </div>
                    
                    {/* Features */}
                    <div className="flex-1 mb-6">
                      <ul className="space-y-2">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getCheckBgClasses(plan.color)}`}>
                               <Check className={`w-2.5 h-2.5 ${getTitleClasses(plan.color)}`} />
                            </div>
                            <span className="text-muted-foreground text-xs font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* CTA */}
                    <Button 
                      className={`w-full shadow-glow hover:shadow-electric transition-all duration-300 transform hover:scale-105 font-bold tracking-wide ${getLateralClasses(plan.color)}`}
                      size="lg"
                      onClick={() => handlePlanSelect(plan.name.toLowerCase())}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  {/* Efectos decorativos */}
                  <div className={`absolute top-2 right-2 w-8 h-8 rounded-full blur-lg animate-pulse ${getCheckBgClasses(plan.color)}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom CTA futurista */}
        <div className="text-center mt-24">
          <div className="inline-flex flex-col items-center space-y-6 px-12 py-8 rounded-3xl bg-gradient-to-r from-background/90 via-background/80 to-background/90 backdrop-blur-xl border border-brand-accent/30 shadow-electric">
            <div className="flex items-center space-x-6">
              <div className="flex flex-col items-center">
                <Shield className="w-8 h-8 text-brand-primary mb-2" />
                <span className="text-xs font-black text-brand-primary tracking-wider">SEGURIDAD TOTAL</span>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="flex flex-col items-center">
                <Globe className="w-8 h-8 text-brand-secondary mb-2" />
                <span className="text-xs font-black text-brand-secondary tracking-wider">CDN GLOBAL</span>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="flex flex-col items-center">
                <BarChart3 className="w-8 h-8 text-brand-accent mb-2" />
                <span className="text-xs font-black text-brand-accent tracking-wider">ANALYTICS PRO</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground mb-4 text-sm">
                ¿Necesitas algo más específico? Nuestro equipo está listo para crear una solución personalizada.
              </p>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 
                  border-brand-accent/30 hover:border-brand-accent/50 
                  text-brand-accent hover:bg-brand-accent/10 
                  font-bold tracking-wide"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                HABLAR CON EXPERTOS
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

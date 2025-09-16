import React from 'react';
import { Shield, Zap, Globe, Play, BarChart3, Lock, Smartphone, Cloud } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Play className="w-10 h-10" />,
      title: "Streaming Ultra HD",
      description: "Transmite videos en calidad 4K con latencia mínima y carga adaptativa automática.",
      color: "brand-primary",
      position: "top-20 left-1/4"
    },
    {
      icon: <Shield className="w-10 h-10" />,
      title: "Protección DRM",
      description: "Protege tu contenido con encriptación de nivel empresarial y control de acceso granular.",
      color: "brand-secondary",
      position: "top-20 right-1/4"
    },
    {
      icon: <Globe className="w-10 h-10" />,
      title: "CDN Global",
      description: "Red de distribución mundial con 180+ ubicaciones para entrega ultrarrápida.",
      color: "brand-accent",
      position: "top-1/2 left-10"
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: "Analytics Avanzados",
      description: "Métricas detalladas de audiencia, engagement y rendimiento en tiempo real.",
      color: "brand-primary",
      position: "top-1/2 right-10"
    },
    {
      icon: <Lock className="w-10 h-10" />,
      title: "Seguridad Empresarial",
      description: "Cumplimiento SOC 2, GDPR y certificaciones de seguridad internacionales.",
      color: "brand-secondary",
      position: "bottom-32 left-1/3"
    },
    {
      icon: <Smartphone className="w-10 h-10" />,
      title: "Multi-Dispositivo",
      description: "Reproducción optimizada en web, móvil, smart TV y dispositivos IoT.",
      color: "brand-accent",
      position: "bottom-32 right-1/3"
    },
    {
      icon: <Cloud className="w-10 h-10" />,
      title: "Escalabilidad Infinita",
      description: "Infraestructura que escala automáticamente desde 1 hasta millones de viewers.",
      color: "brand-primary",
      position: "bottom-20 left-1/2 transform -translate-x-1/2"
    }
  ];

  return (
    <section id="features" className="py-32 bg-gradient-to-b from-background via-background/50 to-background relative overflow-hidden min-h-screen">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-secondary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-3xl" />
        
        {/* Líneas conectoras animadas */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#6a0dad" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#39ff14" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d="M200,150 Q400,300 600,150 T1000,300" stroke="url(#lineGradient)" strokeWidth="2" fill="none" className="animate-pulse" />
          <path d="M150,400 Q500,200 850,400 T1200,200" stroke="url(#lineGradient)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '1s'}} />
        </svg>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-accent/20 border border-brand-accent/30 backdrop-blur-xl mb-8 shadow-electric">
            <Zap className="w-5 h-5 mr-3 text-brand-accent animate-pulse" />
            <span className="text-sm font-black text-brand-accent tracking-wider">ECOSISTEMA TECNOLÓGICO</span>
            <div className="ml-3 w-2 h-2 bg-brand-accent rounded-full animate-ping" />
          </div>
          
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8">
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
              ARQUITECTURA
            </span>
            <br />
            <span className="text-foreground">HEXAGONAL</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Descubre un ecosistema de características interconectadas que trabajan en perfecta armonía para 
            <span className="text-brand-accent font-bold"> revolucionar tu experiencia de video</span>.
          </p>
        </div>

        {/* Features Layout Hexagonal */}
        <div className="relative max-w-6xl mx-auto h-[800px]">
          {/* Feature central */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="relative group">
              <div className="w-32 h-32 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-accent rounded-3xl flex items-center justify-center shadow-electric hover:shadow-glow transition-all duration-500 transform hover:scale-110 hover:rotate-12 backdrop-blur-xl border border-white/20">
                <Zap className="w-16 h-16 text-white animate-pulse" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-accent rounded-full animate-ping" />
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-sm font-black text-brand-accent">CORE ENGINE</div>
              </div>
            </div>
          </div>

          {/* Features orbitales */}
          {features.map((feature, index) => {
            const angle = (index * 360) / features.length;
            const radius = 280;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            
            return (
              <div 
                key={index}
                className="absolute group cursor-pointer"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                }}
              >
                {/* Hexágono */}
                <div className="relative">
                  <div className={`w-24 h-24 bg-gradient-to-br from-${feature.color}/30 to-${feature.color}/10 border-2 border-${feature.color}/40 backdrop-blur-xl shadow-glow hover:shadow-electric transition-all duration-500 transform hover:scale-125 hover:rotate-12 group-hover:-translate-y-2`}
                       style={{
                         clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                       }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className={`text-${feature.color}`}>
                        {feature.icon}
                      </div>
                    </div>
                  </div>
                  
                  {/* Partícula orbital */}
                  <div className={`absolute -top-1 -right-1 w-3 h-3 bg-${feature.color} rounded-full animate-pulse`} />
                  
                  {/* Tooltip expandido */}
                  <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 w-64 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-electric opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-30">
                    <div className={`text-lg font-bold text-${feature.color} mb-2`}>{feature.title}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{feature.description}</div>
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-background/95 border-l border-t border-border/50 rotate-45" />
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Líneas de conexión animadas */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#6a0dad" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#39ff14" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {features.map((_, index) => {
              const angle = (index * 360) / features.length;
              const radius = 280;
              const x = Math.cos((angle * Math.PI) / 180) * radius + 400;
              const y = Math.sin((angle * Math.PI) / 180) * radius + 400;
              
              return (
                <line 
                  key={index}
                  x1="400" y1="400" 
                  x2={x} y2={y}
                  stroke="url(#connectionGradient)" 
                  strokeWidth="2" 
                  className="animate-pulse"
                  style={{animationDelay: `${index * 0.2}s`}}
                />
              );
            })}
          </svg>
        </div>
        
        {/* Bottom Stats */}
        <div className="text-center mt-24">
          <div className="inline-flex items-center space-x-8 px-12 py-6 rounded-3xl bg-gradient-to-r from-background/90 via-background/80 to-background/90 backdrop-blur-xl border border-brand-accent/30 shadow-electric">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 bg-brand-primary rounded-full animate-pulse mb-2" />
              <span className="text-xs font-black text-brand-primary tracking-wider">ULTRA VELOCIDAD</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 bg-brand-secondary rounded-full animate-pulse mb-2" style={{animationDelay: '0.5s'}} />
              <span className="text-xs font-black text-brand-secondary tracking-wider">MÁXIMA SEGURIDAD</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 bg-brand-accent rounded-full animate-pulse mb-2" style={{animationDelay: '1s'}} />
              <span className="text-xs font-black text-brand-accent tracking-wider">ESCALABILIDAD ∞</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;

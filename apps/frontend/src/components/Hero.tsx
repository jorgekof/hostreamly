import React from "react";
import { Shield, Globe, Zap, Users, Award, TrendingUp } from "lucide-react";
import videoStreamingImg from "@/assets/video-streaming.svg";
import streamingNetworkImg from "@/assets/streaming-network.svg";

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-white overflow-hidden">
      {/* Clean geometric background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-slate-300 rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 border border-slate-200 rounded-full" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-slate-100 rounded-full" />
      </div>

      <div className="relative z-10 w-full px-8 py-20">
        {/* Header Section */}
         <div className="text-center mb-16 max-w-6xl mx-auto">
           <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 border border-slate-200 mb-8">
             <Shield className="w-5 h-5 text-slate-600" />
             <span className="text-sm font-semibold text-slate-700">Plataforma Empresarial de Streaming</span>
           </div>
           
           <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-slate-800 mb-8 leading-tight">
             Soluciones de Streaming
             <br />
             <span className="text-slate-800">
               de Nivel Empresarial
             </span>
           </h1>
           
           <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
             Infraestructura robusta y escalable para organizaciones que requieren 
             transmisiones de alta calidad con máxima confiabilidad y seguridad.
           </p>
         </div>

        {/* Features Grid */}
         <div className="max-w-7xl mx-auto mb-20">
           {/* Visual Banner */}
           <div className="mb-16 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden">
             <img 
               src={videoStreamingImg} 
               alt="Plataforma de Video Streaming" 
               className="w-full h-64 object-contain"
             />
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[
               {
                 icon: Globe,
                 title: "Alcance Global",
                 description: "Red de distribución mundial con servidores en múltiples continentes para latencia mínima."
               },
               {
                 icon: Shield,
                 title: "Seguridad Avanzada",
                 description: "Encriptación de extremo a extremo y protocolos de seguridad de grado empresarial."
               },
               {
                 icon: Zap,
                 title: "Rendimiento Óptimo",
                 description: "Tecnología de compresión adaptativa para la mejor calidad en cualquier ancho de banda."
               },
               {
                 icon: Users,
                 title: "Escalabilidad Masiva",
                 description: "Soporte para millones de espectadores simultáneos sin comprometer la calidad."
               },
               {
                 icon: Award,
                 title: "Confiabilidad 99.9%",
                 description: "Infraestructura redundante que garantiza disponibilidad continua del servicio."
               },
               {
                 icon: TrendingUp,
                 title: "Analíticas Avanzadas",
                 description: "Métricas detalladas y reportes en tiempo real para optimizar el rendimiento."
               }
             ].map((feature, index) => (
               <div key={index} className="group p-8 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300">
                 <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center mb-6 group-hover:bg-slate-200 transition-colors duration-300">
                   <feature.icon className="w-7 h-7 text-slate-600" />
                 </div>
                 <h3 className="text-xl font-semibold text-slate-800 mb-4">{feature.title}</h3>
                 <p className="text-slate-600 leading-relaxed">{feature.description}</p>
               </div>
             ))}
           </div>
         </div>

        {/* Stats Section */}
         <div className="max-w-5xl mx-auto mb-20">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {[
               { value: "99.9%", label: "Uptime Garantizado", suffix: "" },
               { value: "<25", label: "Latencia Global", suffix: "ms" },
               { value: "10M+", label: "Usuarios Concurrentes", suffix: "" },
               { value: "150+", label: "Países Cubiertos", suffix: "" }
             ].map((stat, index) => (
               <div key={index} className="text-center p-6 rounded-lg bg-slate-50 border border-slate-100">
                 <div className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">
                   {stat.value}
                   <span className="text-slate-600">{stat.suffix}</span>
                 </div>
                 <div className="text-slate-600 text-sm font-medium">{stat.label}</div>
               </div>
             ))}
           </div>
         </div>

        {/* Technology Showcase */}
         <div className="max-w-7xl mx-auto">
           <div className="bg-slate-50 rounded-2xl p-8 md:p-12 border border-slate-200">
             <div className="grid md:grid-cols-2 gap-12 items-center">
               <div>
                 <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
                   Tecnología de
                   <span className="text-slate-800"> Vanguardia</span>
                 </h2>
                 <p className="text-slate-600 text-lg leading-relaxed mb-8">
                   Nuestra plataforma utiliza los últimos avances en codificación de video, 
                   inteligencia artificial y computación en la nube para ofrecer experiencias 
                   de streaming excepcionales.
                 </p>
                 <div className="space-y-4">
                   {[
                     "Codificación AV1 y HEVC para máxima eficiencia",
                     "CDN inteligente con enrutamiento adaptativo",
                     "Transcoding en tiempo real con IA",
                     "Monitoreo proactivo 24/7"
                   ].map((item, index) => (
                     <div key={index} className="flex items-center gap-4">
                       <div className="w-2 h-2 rounded-full bg-slate-600" />
                       <span className="text-slate-600 font-medium">{item}</span>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div className="relative">
                 <div className="w-full h-80 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden">
                   <img 
                     src={streamingNetworkImg} 
                     alt="Red Global de Streaming" 
                     className="w-full h-full object-contain"
                   />
                 </div>
               </div>
             </div>
           </div>
         </div>
      </div>
    </section>
  );
};

export default Hero;

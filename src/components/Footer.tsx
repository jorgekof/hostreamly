import { Play, Twitter, Github, Linkedin, Mail, ArrowUp, Zap, Globe, Shield, BarChart3, Sparkles, ArrowRight, Heart, Phone, MapPin } from "lucide-react";
import { Button } from '@/components/ui/button';

const Footer = () => {
  const footerSections = [
    {
      title: 'Producto',
      links: [
        { name: 'Características', href: '#features' },
        { name: 'Precios', href: '#pricing' },
        { name: 'API', href: '/api' },
        { name: 'Documentación', href: '/docs' }
      ]
    },
    {
      title: 'Empresa',
      links: [
        { name: 'Acerca de', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Carreras', href: '/careers' },
        { name: 'Contacto', href: '/contact' }
      ]
    },
    {
      title: 'Soporte',
      links: [
        { name: 'Centro de Ayuda', href: '/help' },
        { name: 'Estado del Sistema', href: '/status' },
        { name: 'Comunidad', href: '/community' },
        { name: 'Seguridad', href: '/security' }
      ]
    }
  ];

  const socialLinks = [
    { icon: <Twitter className="w-5 h-5" />, href: "https://twitter.com/hostreamly", color: "brand-primary", label: "Twitter" },
    { icon: <Github className="w-5 h-5" />, href: "https://github.com/hostreamly", color: "brand-secondary", label: "GitHub" },
    { icon: <Linkedin className="w-5 h-5" />, href: "https://linkedin.com/company/hostreamly", color: "brand-accent", label: "LinkedIn" },
    { icon: <Mail className="w-5 h-5" />, href: "mailto:contacto@hostreamly.com", color: "brand-primary", label: "Email" }
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-t from-background via-background/95 to-background/90 border-t border-brand-accent/20 overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-brand-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-brand-secondary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-accent/3 rounded-full blur-3xl" />
        
        {/* Grid minimalista */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-8 grid-rows-4 h-full w-full">
            {Array.from({length: 32}).map((_, i) => (
              <div key={i} className="border border-brand-accent/10" />
            ))}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        {/* Header del Footer */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-brand-primary/10 via-brand-secondary/10 to-brand-accent/10 border border-brand-accent/20 backdrop-blur-xl mb-6">
            <Sparkles className="w-5 h-5 mr-2 text-brand-accent animate-pulse" />
            <span className="text-sm font-black text-brand-accent tracking-widest">CONECTA CON NOSOTROS</span>
          </div>
          
          <h3 className="text-4xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
              HOSTREAMLY
            </span>
          </h3>
          
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            La plataforma de video hosting más 
            <span className="text-brand-accent font-bold">avanzada</span> y 
            <span className="text-brand-primary font-bold">confiable</span> del mercado.
          </p>
        </div>

        {/* Secciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {footerSections.map((section, index) => (
            <div key={index} className="group">
              <div className="flex items-center mb-6">
                <div className={`w-10 h-10 bg-gradient-to-br from-${section.color}/30 to-${section.color}/10 rounded-xl flex items-center justify-center mr-3 shadow-glow group-hover:scale-110 transition-all duration-300`}>
                  <div className={`text-${section.color}`}>
                    {section.icon}
                  </div>
                </div>
                <h4 className={`font-black text-${section.color} tracking-wider text-sm`}>
                  {section.title}
                </h4>
              </div>
              
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href} 
                      className={`group/link flex items-center text-muted-foreground hover:text-${section.color} transition-all duration-300 text-sm font-medium`}
                    >
                      <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover/link:opacity-100 transform -translate-x-2 group-hover/link:translate-x-0 transition-all duration-300" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Sección social y legal */}
        <div className="border-t border-brand-accent/20 pt-12">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-8 lg:space-y-0">
            {/* Social Links */}
            <div className="flex items-center space-x-6">
              <span className="text-sm font-black text-muted-foreground tracking-wider">SÍGUENOS</span>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.href} 
                    className={`group w-12 h-12 bg-gradient-to-br from-${social.color}/20 to-${social.color}/10 rounded-xl flex items-center justify-center border border-${social.color}/30 hover:border-${social.color}/50 shadow-glow hover:shadow-electric transition-all duration-300 transform hover:scale-110 hover:-translate-y-1`}
                  >
                    <div className={`text-${social.color} group-hover:scale-110 transition-transform duration-300`}>
                      {social.icon}
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            {/* Legal y Copyright */}
            <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-8">
              <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                <a href="/privacy" className="hover:text-brand-accent transition-colors duration-300">Privacidad</a>
                <span className="w-px h-4 bg-border" />
                <a href="/terms" className="hover:text-brand-accent transition-colors duration-300">Términos</a>
                <span className="w-px h-4 bg-border" />
                <a href="/support" className="hover:text-brand-accent transition-colors duration-300">Cookies</a>
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground">
                <span>© 2024 Hostreamly.com</span>
                <Heart className="w-3 h-3 mx-2 text-brand-primary animate-pulse" />
                <span>Hecho con pasión</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Botón scroll to top */}
        <div className="absolute bottom-8 right-8">
          <button 
            onClick={scrollToTop}
            className="group w-14 h-14 bg-gradient-to-br from-brand-accent/30 to-brand-accent/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-brand-accent/30 hover:border-brand-accent/50 shadow-electric hover:shadow-glow transition-all duration-300 transform hover:scale-110 hover:-translate-y-2"
          >
            <ArrowUp className="w-6 h-6 text-brand-accent group-hover:scale-110 transition-transform duration-300" />
          </button>
        </div>
        
        {/* Stats minimalistas */}
        <div className="mt-16 pt-8 border-t border-brand-accent/10">
          <div className="flex justify-center items-center space-x-12">
            <div className="text-center">
              <div className="text-2xl font-black text-brand-primary mb-1">99.9%</div>
              <div className="text-xs text-muted-foreground font-medium tracking-wider">UPTIME</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-black text-brand-secondary mb-1">150+</div>
              <div className="text-xs text-muted-foreground font-medium tracking-wider">PAÍSES</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-black text-brand-accent mb-1">24/7</div>
              <div className="text-xs text-muted-foreground font-medium tracking-wider">SOPORTE</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

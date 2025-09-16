import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Play, Shield, Zap, Users, ChevronRight, Home, Star, DollarSign, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/register');
  };

  const handleNavigation = (itemId: string) => {
    setActiveSection(itemId);
    
    switch (itemId) {
      case 'home':
        navigate('/');
        break;
      case 'features':
        // If we're already on the home page, scroll to features section
        if (window.location.pathname === '/') {
          const featuresElement = document.getElementById('features');
          if (featuresElement) {
            featuresElement.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          // Navigate to home page and then scroll to features
          navigate('/');
          setTimeout(() => {
            const featuresElement = document.getElementById('features');
            if (featuresElement) {
              featuresElement.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        }
        break;
      case 'pricing':
        // If we're already on the home page, scroll to pricing section
        if (window.location.pathname === '/') {
          const pricingElement = document.getElementById('pricing');
          if (pricingElement) {
            pricingElement.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          // Navigate to home page and then scroll to pricing
          navigate('/');
          setTimeout(() => {
            const pricingElement = document.getElementById('pricing');
            if (pricingElement) {
              pricingElement.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        }
        break;
      case 'support':
        navigate('/support');
        break;
      default:
        break;
    }
  };

  const navigationItems = [
    { id: 'home', label: 'Inicio', icon: Home, color: 'brand-primary' },
    { id: 'features', label: 'Características', icon: Star, color: 'brand-secondary' },
    { id: 'pricing', label: 'Precios', icon: DollarSign, color: 'brand-accent' },
    { id: 'support', label: 'Soporte', icon: HelpCircle, color: 'brand-primary' }
  ];

  return (
    <>
      {/* Header horizontal principal - Desktop */}
      <header className={`hidden lg:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur-xl border-b border-brand-accent/20 shadow-lg' 
          : 'bg-background/80 backdrop-blur-md border-b border-brand-accent/10'
      }`}>
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y marca */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-accent rounded-xl flex items-center justify-center shadow-electric hover:shadow-glow transition-all duration-300 transform hover:scale-110">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-accent rounded-full animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent brand-font-heading">
                Hostreamly
              </span>
            </div>

            {/* Navegación horizontal */}
            <nav className="flex items-center space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 group ${
                      isActive 
                        ? `bg-gradient-to-r from-${item.color}/20 to-${item.color}/10 border border-${item.color}/30 shadow-glow` 
                        : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-colors duration-300 ${
                      isActive ? `text-${item.color}` : 'text-gray-400 group-hover:text-white'
                    }`} />
                    <span className={`text-sm font-medium transition-colors duration-300 brand-font-body ${
                      isActive ? `text-${item.color}` : 'text-gray-400 group-hover:text-white'
                    }`}>
                      {item.label}
                    </span>
                    {/* Indicador activo */}
                    {isActive && (
                      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-${item.color} rounded-full animate-pulse`} />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Botones de acción */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleLogin}
                className="px-4 py-2 bg-transparent border border-brand-accent/40 text-brand-accent hover:bg-brand-accent/10 hover:border-brand-accent rounded-lg transition-all duration-300 brand-font-body"
              >
                <Users className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Header móvil */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-brand-accent/20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo móvil */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                Hostreamly
              </span>
            </div>

            {/* Botón menú móvil */}
            <button
              className="p-2 rounded-xl hover:bg-brand-accent/10 border border-brand-accent/30 transition-all duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6 text-brand-accent" /> : <Menu className="w-6 h-6 text-brand-accent" />}
            </button>
          </div>
        </div>

        {/* Menú móvil expandido */}
        {isMenuOpen && (
          <div className="bg-background/98 backdrop-blur-xl border-t border-brand-accent/20">
            <div className="px-4 py-6 space-y-6">
              {/* Navegación móvil */}
              <div className="grid grid-cols-2 gap-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleNavigation(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        activeSection === item.id
                          ? `bg-gradient-to-br from-${item.color}/20 to-${item.color}/5 border-${item.color}/40`
                          : 'border-white/10 hover:border-brand-accent/30 hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${
                        activeSection === item.id ? `text-${item.color}` : 'text-gray-400'
                      }`} />
                      <div className="text-sm font-medium">{item.label}</div>
                    </button>
                  );
                })}
              </div>
              
              {/* Botones de acción móvil */}
              <div className="space-y-3 pt-4 border-t border-brand-accent/20">
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-transparent border border-brand-accent/40 text-brand-accent hover:bg-brand-accent/10 rounded-xl py-3"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Iniciar Sesión
                </Button>
                <Button 
                  onClick={handleSignUp}
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl py-3 shadow-electric"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Comenzar Gratis
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;

import React from 'react';
import { Play, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'brand' | 'minimal';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'default',
  text 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-slate-200 border-t-brand-primary`} />
        {text && <span className="ml-3 text-slate-600">{text}</span>}
      </div>
    );
  }

  if (variant === 'brand') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className={`${containerSizeClasses[size]} bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg animate-pulse`}>
            <Play className={`${sizeClasses[size]} text-white`} />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent rounded-full animate-ping" />
        </div>
        {text && (
          <div className="text-center">
            <p className="text-slate-600 font-medium">{text}</p>
            <div className="flex items-center justify-center mt-2 space-x-1">
              <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className={`${containerSizeClasses[size]} border-4 border-slate-200 rounded-full animate-spin`}>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-brand-primary rounded-full" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="w-4 h-4 text-brand-accent animate-pulse" />
        </div>
      </div>
      {text && <span className="ml-4 text-slate-600 font-medium">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
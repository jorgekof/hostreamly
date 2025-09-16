import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, Share2 } from 'lucide-react';

interface BunnyStreamPlayerProps {
  embedUrl: string;
  playUrl?: string;
  title?: string;
  videoId: string;
  libraryId: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  responsive?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

const BunnyStreamPlayer = ({
  embedUrl,
  playUrl,
  title,
  videoId,
  libraryId,
  width = 854,
  height = 480,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  responsive = true,
  onLoad,
  onError
}: BunnyStreamPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Construir URL del iframe con parámetros
  const buildIframeUrl = () => {
    if (!embedUrl) return '';
    
    const url = new URL(embedUrl);
    
    // Agregar parámetros de configuración
    if (autoplay) url.searchParams.set('autoplay', 'true');
    if (muted) url.searchParams.set('muted', 'true');
    if (loop) url.searchParams.set('loop', 'true');
    if (!controls) url.searchParams.set('controls', 'false');
    
    return url.toString();
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleIframeError = () => {
    const errorMsg = 'Error loading video player';
    setError(errorMsg);
    setIsLoading(false);
    onError?.(errorMsg);
  };

  const toggleFullscreen = () => {
    if (!iframeRef.current) return;

    if (!isFullscreen) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && embedUrl) {
      try {
        await navigator.share({
          title: title || 'Video',
          url: embedUrl
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(embedUrl);
      }
    } else if (embedUrl) {
      navigator.clipboard.writeText(embedUrl);
    }
  };

  const handleDownload = () => {
    if (playUrl) {
      const link = document.createElement('a');
      link.href = playUrl;
      link.download = title || 'video';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-500 mb-4">
          <ExternalLink className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">Error Loading Video</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Retry
        </Button>
      </Card>
    );
  }

  const containerStyle = responsive ? {
    position: 'relative' as const,
    paddingBottom: `${(height / width) * 100}%`,
    height: 0,
    overflow: 'hidden'
  } : {
    width,
    height
  };

  const iframeStyle = responsive ? {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  } : {
    width: '100%',
    height: '100%'
  };

  return (
    <div className="bunny-stream-player">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex gap-2">
            <Badge variant="secondary">Bunny Stream</Badge>
            {playUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              className="flex items-center gap-1"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      )}
      
      <Card className="overflow-hidden">
        <div style={containerStyle}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading video...</p>
              </div>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            src={buildIframeUrl()}
            style={iframeStyle}
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={title || `Bunny Stream Video ${videoId}`}
          />
        </div>
      </Card>
      
      {/* Información del video */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>Video ID: {videoId}</span>
        <span>Library: {libraryId}</span>
      </div>
    </div>
  );
};

export default BunnyStreamPlayer;

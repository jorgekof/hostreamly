import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Image, 
  Type, 
  Move, 
  RotateCw, 
  Eye, 
  EyeOff, 
  Upload, 
  Download,
  Palette,
  Clock,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient as api } from '@/lib/api';

interface WatermarkConfig {
  enabled: boolean;
  type: 'text' | 'image' | 'both';
  
  // Text watermark
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  textColor: string;
  textOpacity: number;
  textShadow: boolean;
  
  // Image watermark
  imageUrl: string;
  imageSize: number;
  imageOpacity: number;
  
  // Position
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';
  customX: number;
  customY: number;
  margin: number;
  
  // Animation
  animated: boolean;
  animationType: 'fade' | 'slide' | 'bounce' | 'rotate';
  animationDuration: number;
  
  // Timing
  showAlways: boolean;
  showInterval: number; // seconds
  hideInterval: number; // seconds
  
  // Advanced
  rotation: number;
  scale: number;
  blur: number;
  
  // Dynamic content
  showTimestamp: boolean;
  showUserInfo: boolean;
  showVideoTitle: boolean;
  customVariables: { [key: string]: string };
}

const defaultConfig: WatermarkConfig = {
  enabled: false,
  type: 'text',
  text: 'Hostrambly.com',
  fontSize: 24,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  textColor: '#ffffff',
  textOpacity: 70,
  textShadow: true,
  imageUrl: '',
  imageSize: 100,
  imageOpacity: 70,
  position: 'bottom-right',
  customX: 50,
  customY: 50,
  margin: 20,
  animated: false,
  animationType: 'fade',
  animationDuration: 2,
  showAlways: true,
  showInterval: 10,
  hideInterval: 5,
  rotation: 0,
  scale: 100,
  blur: 0,
  showTimestamp: false,
  showUserInfo: false,
  showVideoTitle: false,
  customVariables: {}
};

export const WatermarkSettings = () => {
  const [config, setConfig] = useState<WatermarkConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWatermarkConfig();
  }, []);

  const loadWatermarkConfig = async () => {
    try {
  
        const data = null, error = null;

      if (data && !error) {
        setConfig({ ...defaultConfig, ...data.config });
      }
    } catch (error) {
      console.error('Error loading watermark config:', error);
    }
  };

  const saveWatermarkConfig = async () => {
    setLoading(true);
    try {
      

      toast({
        title: "Configuración guardada",
        description: "La marca de agua se aplicará a nuevos videos",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadWatermarkImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/watermarks/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const publicUrl = response.data.fileUrl;

      updateConfig('imageUrl', publicUrl);
      
      toast({
        title: "Imagen subida",
        description: "La imagen de marca de agua se ha guardado correctamente",
      });
    } catch (error: unknown) {
      toast({
        title: "Error al subir imagen",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const updateConfig = (key: keyof WatermarkConfig, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getPreviewStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      opacity: config.textOpacity / 100,
      fontSize: `${config.fontSize}px`,
      fontFamily: config.fontFamily,
      fontWeight: config.fontWeight,
      color: config.textColor,
      textShadow: config.textShadow ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none',
      transform: `rotate(${config.rotation}deg) scale(${config.scale / 100})`,
      filter: config.blur > 0 ? `blur(${config.blur}px)` : 'none',
      pointerEvents: 'none',
      zIndex: 1000
    };

    // Position calculation
    switch (config.position) {
      case 'top-left':
        return { ...baseStyle, top: config.margin, left: config.margin };
      case 'top-right':
        return { ...baseStyle, top: config.margin, right: config.margin };
      case 'bottom-left':
        return { ...baseStyle, bottom: config.margin, left: config.margin };
      case 'bottom-right':
        return { ...baseStyle, bottom: config.margin, right: config.margin };
      case 'center':
        return { ...baseStyle, top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${config.rotation}deg) scale(${config.scale / 100})` };
      case 'custom':
        return { ...baseStyle, top: `${config.customY}%`, left: `${config.customX}%` };
      default:
        return baseStyle;
    }
  };

  const generatePreviewText = () => {
    let text = config.text;
    
    if (config.showTimestamp) {
      text += ` • ${new Date().toLocaleTimeString()}`;
    }
    
    if (config.showUserInfo) {
      text += ` • Usuario Demo`;
    }
    
    if (config.showVideoTitle) {
      text += ` • Video de Prueba`;
    }
    
    return text;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image className="w-6 h-6 text-purple-500" />
          <div>
            <h2 className="text-2xl font-bold">Marca de Agua</h2>
            <p className="text-muted-foreground">Configura overlays de protección para tus videos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {previewMode ? 'Ocultar Vista Previa' : 'Vista Previa'}
          </Button>
          <Badge variant={config.enabled ? "default" : "secondary"}>
            {config.enabled ? "Activo" : "Inactivo"}
          </Badge>
          <Button onClick={saveWatermarkConfig} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </div>

      {/* Preview */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-black rounded-lg" style={{ height: '300px', overflow: 'hidden' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center text-white/30 text-6xl font-bold">
                VIDEO DEMO
              </div>
              
              {config.enabled && config.type !== 'image' && (
                <div style={getPreviewStyle()}>
                  {generatePreviewText()}
                </div>
              )}
              
              {config.enabled && config.type !== 'text' && config.imageUrl && (
                <img
                  src={config.imageUrl}
                  alt="Watermark"
                  style={{
                    ...getPreviewStyle(),
                    width: `${config.imageSize}px`,
                    height: 'auto',
                    opacity: config.imageOpacity / 100
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="text">Texto</TabsTrigger>
          <TabsTrigger value="image">Imagen</TabsTrigger>
          <TabsTrigger value="position">Posición</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Habilitar Marca de Agua</Label>
                  <p className="text-sm text-muted-foreground">Activa overlays de protección en todos los videos</p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => updateConfig('enabled', checked)}
                />
              </div>

              <div className="space-y-3">
                <Label>Tipo de Marca de Agua</Label>
                <Select value={config.type} onValueChange={(value) => updateConfig('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Solo Texto</SelectItem>
                    <SelectItem value="image">Solo Imagen</SelectItem>
                    <SelectItem value="both">Texto + Imagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Mostrar Siempre</Label>
                    <p className="text-sm text-muted-foreground">La marca de agua será visible durante toda la reproducción</p>
                  </div>
                  <Switch
                    checked={config.showAlways}
                    onCheckedChange={(checked) => updateConfig('showAlways', checked)}
                  />
                </div>
                
                {!config.showAlways && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mostrar por (segundos)</Label>
                      <Input
                        type="number"
                        value={config.showInterval}
                        onChange={(e) => updateConfig('showInterval', parseInt(e.target.value))}
                        min="1"
                        max="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ocultar por (segundos)</Label>
                      <Input
                        type="number"
                        value={config.hideInterval}
                        onChange={(e) => updateConfig('hideInterval', parseInt(e.target.value))}
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Settings */}
        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Configuración de Texto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Texto de la Marca de Agua</Label>
                <Textarea
                  value={config.text}
                  onChange={(e) => updateConfig('text', e.target.value)}
                  placeholder="Ingresa el texto de la marca de agua"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Tamaño de Fuente</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[config.fontSize]}
                      onValueChange={([value]) => updateConfig('fontSize', value)}
                      min={12}
                      max={72}
                      step={1}
                    />
                    <div className="text-sm text-muted-foreground text-center">{config.fontSize}px</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Opacidad</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[config.textOpacity]}
                      onValueChange={([value]) => updateConfig('textOpacity', value)}
                      min={10}
                      max={100}
                      step={5}
                    />
                    <div className="text-sm text-muted-foreground text-center">{config.textOpacity}%</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Familia de Fuente</Label>
                  <Select value={config.fontFamily} onValueChange={(value) => updateConfig('fontFamily', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                      <SelectItem value="Courier New">Courier New</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Peso de Fuente</Label>
                  <Select value={config.fontWeight} onValueChange={(value) => updateConfig('fontWeight', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Negrita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Color del Texto</Label>
                  <Input
                    type="color"
                    value={config.textColor}
                    onChange={(e) => updateConfig('textColor', e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Sombra de Texto</Label>
                    <p className="text-sm text-muted-foreground">Añade sombra para mejor legibilidad</p>
                  </div>
                  <Switch
                    checked={config.textShadow}
                    onCheckedChange={(checked) => updateConfig('textShadow', checked)}
                  />
                </div>
              </div>

              {/* Dynamic Content */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Contenido Dinámico</Label>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between">
                    <Label>Mostrar Timestamp</Label>
                    <Switch
                      checked={config.showTimestamp}
                      onCheckedChange={(checked) => updateConfig('showTimestamp', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Mostrar Info de Usuario</Label>
                    <Switch
                      checked={config.showUserInfo}
                      onCheckedChange={(checked) => updateConfig('showUserInfo', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Mostrar Título del Video</Label>
                    <Switch
                      checked={config.showVideoTitle}
                      onCheckedChange={(checked) => updateConfig('showVideoTitle', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Image Settings */}
        <TabsContent value="image" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Configuración de Imagen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Imagen de Marca de Agua</Label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? 'Subiendo...' : 'Subir Imagen'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadWatermarkImage(file);
                    }}
                  />
                  {config.imageUrl && (
                    <img
                      src={config.imageUrl}
                      alt="Watermark preview"
                      className="w-16 h-16 object-contain border rounded"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: PNG, JPG, SVG. Recomendado: PNG con transparencia
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Tamaño de Imagen</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[config.imageSize]}
                      onValueChange={([value]) => updateConfig('imageSize', value)}
                      min={20}
                      max={300}
                      step={10}
                    />
                    <div className="text-sm text-muted-foreground text-center">{config.imageSize}px</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Opacidad de Imagen</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[config.imageOpacity]}
                      onValueChange={([value]) => updateConfig('imageOpacity', value)}
                      min={10}
                      max={100}
                      step={5}
                    />
                    <div className="text-sm text-muted-foreground text-center">{config.imageOpacity}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Position Settings */}
        <TabsContent value="position" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Move className="w-5 h-5" />
                Posición y Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Posición Predefinida</Label>
                <Select value={config.position} onValueChange={(value) => updateConfig('position', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Superior Izquierda</SelectItem>
                    <SelectItem value="top-right">Superior Derecha</SelectItem>
                    <SelectItem value="bottom-left">Inferior Izquierda</SelectItem>
                    <SelectItem value="bottom-right">Inferior Derecha</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="custom">Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.position === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Posición X (%)</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[config.customX]}
                        onValueChange={([value]) => updateConfig('customX', value)}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground text-center">{config.customX}%</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Posición Y (%)</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[config.customY]}
                        onValueChange={([value]) => updateConfig('customY', value)}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground text-center">{config.customY}%</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Margen desde el Borde</Label>
                <div className="space-y-2">
                  <Slider
                    value={[config.margin]}
                    onValueChange={([value]) => updateConfig('margin', value)}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <div className="text-sm text-muted-foreground text-center">{config.margin}px</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Configuración Avanzada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                  <Label>Rotación (grados)</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[config.rotation]}
                      onValueChange={([value]) => updateConfig('rotation', value)}
                      min={-180}
                      max={180}
                      step={5}
                    />
                    <div className="text-sm text-muted-foreground text-center">{config.rotation}°</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Escala (%)</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[config.scale]}
                      onValueChange={([value]) => updateConfig('scale', value)}
                      min={50}
                      max={200}
                      step={5}
                    />
                    <div className="text-sm text-muted-foreground text-center">{config.scale}%</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Desenfoque (px)</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[config.blur]}
                      onValueChange={([value]) => updateConfig('blur', value)}
                      min={0}
                      max={10}
                      step={1}
                    />
                    <div className="text-sm text-muted-foreground text-center">{config.blur}px</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Animación</Label>
                    <p className="text-sm text-muted-foreground">Añade efectos de animación a la marca de agua</p>
                  </div>
                  <Switch
                    checked={config.animated}
                    onCheckedChange={(checked) => updateConfig('animated', checked)}
                  />
                </div>
                
                {config.animated && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label>Tipo de Animación</Label>
                      <Select value={config.animationType} onValueChange={(value) => updateConfig('animationType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fade">Fade In/Out</SelectItem>
                          <SelectItem value="slide">Deslizar</SelectItem>
                          <SelectItem value="bounce">Rebote</SelectItem>
                          <SelectItem value="rotate">Rotación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Duración (segundos)</Label>
                      <Input
                        type="number"
                        value={config.animationDuration}
                        onChange={(e) => updateConfig('animationDuration', parseFloat(e.target.value))}
                        min="0.5"
                        max="10"
                        step="0.5"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

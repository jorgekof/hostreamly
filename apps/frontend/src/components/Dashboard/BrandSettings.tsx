import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  Image as ImageIcon, 
  Palette, 
  Type, 
  Eye,
  Download,
  Trash2,
  Globe,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Settings,
  Monitor,
  Smartphone,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import { useWhiteLabelConfig, WhiteLabelConfig } from '@/hooks/useWhiteLabelConfig';

interface DNSRecord {
  type: string;
  name: string;
  value: string;
}

interface LocalConfigUpdate {
  [key: string]: string | boolean | number | File | object;
}

export const BrandSettings = () => {
  const {
    config,
    themes,
    assets,
    domainVerification,
    loading,
    saveConfig,
    applyTheme,
    uploadAsset,
    deleteAsset,
    setupCustomDomain,
    verifyCustomDomain,
    generateCSS,
    refetch
  } = useWhiteLabelConfig();

  const [activeTab, setActiveTab] = useState('general');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [customDomain, setCustomDomain] = useState('');
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);

  useEffect(() => {
    refetch();
  }, []);

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon' | 'watermark' | 'background' | 'og_image') => {
    try {
      await uploadAsset(file, type);
      toast.success(`${type} subido correctamente`);
    } catch (error) {
      toast.error(`Error al subir ${type}`);
    }
  };

  const [localConfig, setLocalConfig] = useState<LocalConfigUpdate>({});

  const handleConfigChange = (key: string, value: string | boolean | number | File) => {
    setLocalConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await saveConfig(localConfig);
      setLocalConfig({});
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    }
  };

  const handleThemeApply = async (theme: { primary: string; secondary: string; accent: string }) => {
    try {
      await applyTheme(theme);
      toast.success('Tema aplicado correctamente');
    } catch (error) {
      toast.error('Error al aplicar el tema');
    }
  };

  const handleDomainSetup = async () => {
    try {
      const domainData = await setupCustomDomain(customDomain);
      setDnsRecords(domainData.dns_records || []);
      toast.success('Configuración de dominio iniciada. Por favor configura los registros DNS.');
    } catch (error) {
      toast.error('Error al configurar el dominio personalizado');
    }
  };

  const handleDomainVerification = async () => {
    try {
      await verifyCustomDomain(customDomain);
      toast.success('Dominio verificado correctamente');
    } catch (error) {
      toast.error('Error en la verificación del dominio');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">White Label Configuration</h2>
          <p className="text-muted-foreground">
            Customize your platform's branding and appearance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}>
            {previewMode === 'desktop' ? <Monitor className="h-4 w-4 mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
            {previewMode === 'desktop' ? 'Desktop' : 'Mobile'} Preview
          </Button>
          <Button onClick={handleSaveSettings}>
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="player">Player</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Brand Identity</span>
                </CardTitle>
                <CardDescription>
                  Configure your platform's core branding elements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={config?.company_name || ''}
                    onChange={(e) => handleConfigChange('company_name', e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Custom Domain</Label>
                  <Input
                    value={config?.custom_domain || ''}
                    onChange={(e) => handleConfigChange('custom_domain', e.target.value)}
                    placeholder="your-domain.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={config?.primary_color || '#3b82f6'}
                        onChange={(e) => handleConfigChange('primary_color', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config?.primary_color || '#3b82f6'}
                        onChange={(e) => handleConfigChange('primary_color', e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={config?.secondary_color || '#1d4ed8'}
                        onChange={(e) => handleConfigChange('secondary_color', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config?.secondary_color || '#1d4ed8'}
                        onChange={(e) => handleConfigChange('secondary_color', e.target.value)}
                        placeholder="#1d4ed8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Watermark Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure watermark appearance and behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config?.player_settings?.watermark_enabled || false}
                    onCheckedChange={(checked) => handleConfigChange('player_settings', {
                      ...config?.player_settings,
                      watermark_enabled: checked
                    })}
                  />
                  <Label>Enable watermark</Label>
                </div>

                {config?.player_settings?.watermark_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select
                        value={config?.player_settings?.watermark_position || 'bottom-right'}
                        onValueChange={(value) => handleConfigChange('player_settings', {
                          ...config?.player_settings,
                          watermark_position: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-left">Top Left</SelectItem>
                          <SelectItem value="top-right">Top Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Opacity: {config?.player_settings?.watermark_opacity || 50}%</Label>
                      <Slider
                        value={[config?.player_settings?.watermark_opacity || 50]}
                        onValueChange={([value]) => handleConfigChange('player_settings', {
                          ...config?.player_settings,
                          watermark_opacity: value
                        })}
                        max={100}
                        min={10}
                        step={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Size: {config?.watermark_size || 100}%</Label>
                      <Slider
                        value={[config?.watermark_size || 100]}
                        onValueChange={([value]) => handleConfigChange('watermark_size', value)}
                        max={200}
                        min={50}
                        step={10}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Pre-built Themes</span>
              </CardTitle>
              <CardDescription>
                Choose from professionally designed themes or create your own
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map((theme) => (
                  <Card key={theme.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-gradient-to-br rounded-lg mb-3" 
                           style={{ 
                             background: `linear-gradient(135deg, ${theme.primary_color}, ${theme.secondary_color})` 
                           }}>
                        <div className="h-full flex items-center justify-center text-white font-medium">
                          {theme.name}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{theme.name}</h4>
                          {theme.is_premium && (
                            <Badge variant="secondary">Premium</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{theme.description}</p>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleThemeApply(theme.id)}
                        >
                          Apply Theme
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="player" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Type className="h-5 w-5" />
                <span>Player Customization</span>
              </CardTitle>
              <CardDescription>
                Customize the video player appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Colors & Styling</h4>
                  
                  <div className="space-y-2">
                    <Label>Control Bar Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={config?.player_control_color || '#000000'}
                        onChange={(e) => handleConfigChange('player_control_color', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config?.player_control_color || '#000000'}
                        onChange={(e) => handleConfigChange('player_control_color', e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Progress Bar Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={config?.player_progress_color || config?.primary_color || '#3b82f6'}
                        onChange={(e) => handleConfigChange('player_progress_color', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config?.player_progress_color || config?.primary_color || '#3b82f6'}
                        onChange={(e) => handleConfigChange('player_progress_color', e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Control Style</Label>
                    <Select
                      value={config?.player_control_style || 'modern'}
                      onValueChange={(value) => handleConfigChange('player_control_style', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Features & Behavior</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config?.player_show_logo || false}
                        onCheckedChange={(checked) => handleConfigChange('player_show_logo', checked)}
                      />
                      <Label>Show logo in player</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config?.player_auto_hide_controls || true}
                        onCheckedChange={(checked) => handleConfigChange('player_auto_hide_controls', checked)}
                      />
                      <Label>Auto-hide controls</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config?.player_show_quality_selector || true}
                        onCheckedChange={(checked) => handleConfigChange('player_show_quality_selector', checked)}
                      />
                      <Label>Show quality selector</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config?.player_show_speed_controls || true}
                        onCheckedChange={(checked) => handleConfigChange('player_show_speed_controls', checked)}
                      />
                      <Label>Show playback speed controls</Label>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Custom CSS</Label>
                <Textarea
                  value={config?.custom_css || ''}
                  onChange={(e) => handleConfigChange('custom_css', e.target.value)}
                  placeholder="/* Custom CSS for player styling */\n.video-player {\n  /* Your custom styles here */\n}"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Add custom CSS to further customize the player appearance
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['logo', 'watermark', 'favicon', 'background'].map((assetType) => {
              const asset = assets.find(a => a.asset_type === assetType);
              return (
                <Card key={assetType}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4" />
                      <span className="capitalize">{assetType}</span>
                    </CardTitle>
                    <CardDescription>
                      {assetType === 'logo' && 'Your platform logo (recommended: 200x60px)'}
                      {assetType === 'watermark' && 'Watermark image (recommended: 100x100px)'}
                      {assetType === 'favicon' && 'Browser favicon (recommended: 32x32px)'}
                      {assetType === 'background' && 'Background image for login/landing pages'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {asset ? (
                        <div className="space-y-3">
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                            <img 
                              src={asset.file_url} 
                              alt={assetType}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Size: {asset.file_size ? `${Math.round(asset.file_size / 1024)}KB` : 'Unknown'}</span>
                              <span>Uploaded: {new Date(asset.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="flex-1" asChild>
                                <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View
                                </a>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => deleteAsset(asset.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Upload {assetType}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = assetType === 'favicon' ? '.ico,.png' : 'image/*';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) handleFileUpload(assetType, file);
                              };
                              input.click();
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload {assetType}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Custom Domains</span>
              </CardTitle>
              <CardDescription>
                Configure custom domains for your white-label platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="yourdomain.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleDomainSetup}>
                    Setup Domain
                  </Button>
                </div>

                {config?.custom_domain && (
                  <Alert>
                    <Globe className="h-4 w-4" />
                    <AlertDescription>
                      Current domain: <strong>{config.custom_domain}</strong>
                      {domainVerification?.verified ? (
                        <Badge variant="default" className="ml-2">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-2">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {dnsRecords.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">DNS Configuration</h4>
                  <p className="text-sm text-muted-foreground">
                    Add these DNS records to your domain provider:
                  </p>
                  
                  <div className="space-y-3">
                    {dnsRecords.map((record, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <Label className="text-xs text-muted-foreground">Type</Label>
                              <p className="font-mono">{record.type}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Name</Label>
                              <p className="font-mono">{record.name}</p>
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs text-muted-foreground">Value</Label>
                              <div className="flex items-center space-x-2">
                                <p className="font-mono text-xs break-all">{record.value}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(record.value)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button onClick={handleDomainVerification} className="w-full">
                    Verify Domain Configuration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="h-5 w-5" />
                  <span>Custom CSS Generator</span>
                </CardTitle>
                <CardDescription>
                  Generate and preview custom CSS for your platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={async () => {
                    try {
                      const css = await generateCSS(config);
                      copyToClipboard(css);
                      toast.success('CSS generated and copied to clipboard');
                    } catch (error) {
                      toast.error('Failed to generate CSS');
                    }
                  }}
                  className="w-full"
                >
                  Generate & Copy CSS
                </Button>
                
                <div className="space-y-2">
                  <Label>CSS Preview</Label>
                  <Textarea
                    value={config?.generated_css || ''}
                    readOnly
                    rows={10}
                    className="font-mono text-xs"
                    placeholder="Generated CSS will appear here..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Advanced Settings</span>
                </CardTitle>
                <CardDescription>
                  Additional configuration options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config?.enable_custom_fonts || false}
                      onCheckedChange={(checked) => handleConfigChange('enable_custom_fonts', checked)}
                    />
                    <Label>Enable custom fonts</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config?.enable_dark_mode || false}
                      onCheckedChange={(checked) => handleConfigChange('enable_dark_mode', checked)}
                    />
                    <Label>Enable dark mode toggle</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config?.hide_powered_by || false}
                      onCheckedChange={(checked) => handleConfigChange('hide_powered_by', checked)}
                    />
                    <Label>Hide "Powered by" branding</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config?.enable_custom_email_templates || false}
                      onCheckedChange={(checked) => handleConfigChange('enable_custom_email_templates', checked)}
                    />
                    <Label>Custom email templates</Label>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Custom JavaScript</Label>
                  <Textarea
                    value={config?.custom_js || ''}
                    onChange={(e) => handleConfigChange('custom_js', e.target.value)}
                    placeholder="// Custom JavaScript code\nconsole.log('Custom JS loaded');"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add custom JavaScript for advanced functionality
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

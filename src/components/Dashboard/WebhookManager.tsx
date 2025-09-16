import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Webhook, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Globe, 
  Shield,
  Zap,
  Copy,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useWebhooks } from '@/hooks/useVideoAPI';
import { toast } from 'sonner';

export const WebhookManager = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[],
    secret: ''
  });
  
  const { webhooks, loading, createWebhook, deleteWebhook } = useWebhooks();

  const availableEvents = [
    { value: 'video.created', label: 'Video Creado', description: 'Cuando se sube un nuevo video' },
    { value: 'video.updated', label: 'Video Actualizado', description: 'Cuando se actualiza información del video' },
    { value: 'video.deleted', label: 'Video Eliminado', description: 'Cuando se elimina un video' },
    { value: 'video.processed', label: 'Video Procesado', description: 'Cuando termina el procesamiento' },
    { value: 'analytics.play', label: 'Reproducción', description: 'Cuando se reproduce un video' },
    { value: 'analytics.complete', label: 'Reproducción Completa', description: 'Cuando se completa la reproducción' }
  ];

  const handleEventToggle = (eventValue: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter(e => e !== eventValue)
        : [...prev.events, eventValue]
    }));
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.url) {
      toast.error('La URL del webhook es requerida');
      return;
    }

    if (newWebhook.events.length === 0) {
      toast.error('Selecciona al menos un evento');
      return;
    }

    try {
      await createWebhook({
        name: `Webhook ${new Date().toLocaleDateString()}`,
        active: true,
        ...newWebhook
      });
      setNewWebhook({ url: '', events: [], secret: '' });
      setIsCreateModalOpen(false);
    } catch (error) {
      // Error manejado en el hook
    }
  };

  const handleDeleteWebhook = async (webhookId: string, url: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el webhook ${url}?`)) {
      await deleteWebhook(webhookId);
    }
  };

  const generateSecret = () => {
    const secret = crypto.randomUUID().replace(/-/g, '');
    setNewWebhook(prev => ({ ...prev, secret }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Webhooks</h2>
          <p className="text-muted-foreground mt-1">
            Configura notificaciones automáticas para eventos de video
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Webhook</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL del Endpoint</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://tu-servidor.com/webhooks"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  URL donde se enviarán las notificaciones
                </p>
              </div>

              <div className="space-y-3">
                <Label>Eventos a Escuchar</Label>
                <div className="grid grid-cols-1 gap-3">
                  {availableEvents.map((event) => (
                    <div key={event.value} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        id={event.value}
                        checked={newWebhook.events.includes(event.value)}
                        onChange={() => handleEventToggle(event.value)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor={event.value} className="font-medium cursor-pointer">
                          {event.label}
                        </label>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Clave Secreta (Opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-secret"
                    placeholder="Clave para verificar la firma HMAC"
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                  />
                  <Button variant="outline" onClick={generateSecret}>
                    Generar
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Se usa para firmar los payloads con HMAC-SHA256
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleCreateWebhook}
                  disabled={!newWebhook.url || newWebhook.events.length === 0}
                  className="flex-1"
                >
                  Crear Webhook
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Cargando webhooks...</span>
        </div>
      )}

      {!loading && webhooks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Webhook className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay webhooks configurados</h3>
            <p className="text-muted-foreground mb-4">
              Los webhooks te permiten recibir notificaciones automáticas cuando ocurren eventos en tus videos.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear tu primer webhook
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && webhooks.length > 0 && (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-mono">
                        {webhook.url}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(webhook.url)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(webhook.url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={webhook.active ? "default" : "secondary"}>
                        {webhook.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Creado {new Date(webhook.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteWebhook(webhook.id, webhook.url)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Eventos:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {availableEvents.find(e => e.value === event)?.label || event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {webhook.secret && (
                    <div>
                      <Label className="text-sm font-medium">Clave Secreta:</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {webhook.secret.substring(0, 8)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(webhook.secret || '')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documentation section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Ejemplo de Payload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Ejemplo de lo que recibirás en tu endpoint cuando ocurra un evento:
          </p>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "event": "video.created",
  "timestamp": "2025-08-23T00:15:30.123Z",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Mi Video Awesome",
    "status": "processing",
    "user_id": "user-uuid",
    "created_at": "2025-08-23T00:15:30.123Z"
  }
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookManager;

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Eye, EyeOff, ExternalLink, CheckCircle2, XCircle } from "lucide-react";

import { useAuth } from '@/contexts/AuthContext';
import { apiClient as api } from '@/lib/api';
interface StripeConfig {
  secret_key: string;
  webhook_secret?: string;
}

const StripeSettings = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<StripeConfig>({ secret_key: "", webhook_secret: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    setLoading(true);
    try {
  
        const data = null, error = null;

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig({
          secret_key: data.api_key_encrypted || "",
          webhook_secret: ""
        });
      }
    } catch (error) {
      console.error('Error fetching Stripe configuration:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración de Stripe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config.secret_key.trim()) {
      toast({
        title: "Error",
        description: "La Secret Key de Stripe es requerida",
        variant: "destructive",
      });
      return;
    }

    if (!config.secret_key.startsWith('sk_')) {
      toast({
        title: "Error",
        description: "La Secret Key debe comenzar con 'sk_'",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (!user) throw new Error('No authenticated user');


      const data = null, error = null;

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Configuración de Stripe guardada correctamente",
      });

      // Test connection after saving
      await testStripeConnection();
    } catch (error) {
      console.error('Error saving Stripe configuration:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testStripeConnection = async () => {
    if (!config.secret_key.trim()) {
      toast({
        title: "Error",
        description: "Configuración de Stripe no encontrada",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://api.stripe.com/v1/customers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.secret_key}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: "Conexión exitosa con Stripe"
        });
        toast({
          title: "Éxito",
          description: "Conexión exitosa con Stripe",
        });
      } else {
        const errorData = await response.json();
        setTestResult({
          success: false,
          message: `Error: ${errorData.error?.message || 'Error desconocido'}`
        });
      }
    } catch (error) {
      console.error('Error testing Stripe connection:', error);
      setTestResult({
        success: false,
        message: "Error de conexión con Stripe"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Configuración de Stripe</h2>
          <p className="text-muted-foreground">
            Configura tu integración con Stripe para procesar pagos
          </p>
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="test">Prueba de Conexión</TabsTrigger>
          <TabsTrigger value="guide">Guía</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Credenciales de API</CardTitle>
              <CardDescription>
                Configura tus credenciales de Stripe para habilitar los pagos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secret_key">Secret Key *</Label>
                <div className="relative">
                  <Input
                    id="secret_key"
                    type={showSecretKey ? "text" : "password"}
                    value={config.secret_key}
                    onChange={(e) => setConfig({ ...config, secret_key: e.target.value })}
                    placeholder="sk_test_... o sk_live_..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                  >
                    {showSecretKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tu Secret Key de Stripe (comienza con sk_)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_secret">Webhook Secret (Opcional)</Label>
                <Input
                  id="webhook_secret"
                  type="password"
                  value={config.webhook_secret}
                  onChange={(e) => setConfig({ ...config, webhook_secret: e.target.value })}
                  placeholder="whsec_..."
                />
                <p className="text-sm text-muted-foreground">
                  Para verificar webhooks de Stripe (recomendado para producción)
                </p>
              </div>

              <Button 
                onClick={handleSaveConfig} 
                disabled={saving || loading}
                className="w-full"
              >
                {saving ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Prueba de Conexión</CardTitle>
              <CardDescription>
                Verifica que tu configuración de Stripe funcione correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testStripeConnection} 
                disabled={loading || !config.secret_key}
                className="w-full"
              >
                {loading ? "Probando..." : "Probar Conexión"}
              </Button>

              {testResult && (
                <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                      {testResult.message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="space-y-3">
                <h4 className="font-medium">Estado del Sistema</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Configuración guardada</span>
                    {config.secret_key ? (
                      <Badge variant="default">Configurado</Badge>
                    ) : (
                      <Badge variant="secondary">No configurado</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conexión a Stripe</span>
                    {testResult ? (
                      <Badge variant={testResult.success ? "default" : "destructive"}>
                        {testResult.success ? "Conectado" : "Error"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No probado</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide">
          <Card>
            <CardHeader>
              <CardTitle>Guía de Configuración</CardTitle>
              <CardDescription>
                Sigue estos pasos para configurar Stripe correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                    Crear cuenta en Stripe
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Ve a{" "}
                    <a 
                      href="https://stripe.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      stripe.com <ExternalLink className="h-3 w-3" />
                    </a>
                    {" "}y crea una cuenta
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                    Obtener las API Keys
                  </h4>
                  <div className="ml-8 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Ve al{" "}
                      <a 
                        href="https://dashboard.stripe.com/apikeys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Dashboard de Stripe <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Copia la "Secret key" (comienza con sk_test_ o sk_live_)</li>
                      <li>Para testing usa las keys de prueba (sk_test_)</li>
                      <li>Para producción usa las keys en vivo (sk_live_)</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                    Configurar Webhooks (Opcional)
                  </h4>
                  <div className="ml-8 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Para recibir notificaciones de eventos de Stripe:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Ve a "Webhooks" en el dashboard de Stripe</li>
                      <li>Crea un nuevo endpoint con tu URL</li>
                      <li>Selecciona los eventos que quieres recibir</li>
                      <li>Copia el "Signing secret" (whsec_...)</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">4</span>
                    Pegar las credenciales
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Copia y pega tus credenciales en la pestaña "Configuración" y guarda los cambios.
                  </p>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Importante:</strong> Nunca compartas tus Secret Keys. Mantenlas seguras y usa las keys de prueba durante el desarrollo.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StripeSettings;

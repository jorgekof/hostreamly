import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, Video, Bell } from 'lucide-react';
import { VideoCDNSettings } from './BunnyStreamSettings';
import { UserSettings } from './UserSettings';

interface UserConfigurationProps {
  onClose?: () => void;
}

const UserConfiguration: React.FC<UserConfigurationProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Configuración de Usuario
          </h2>
          <p className="text-muted-foreground">
            Gestiona tu perfil, configuraciones de video y preferencias
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="video-cdn" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Video CDN
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <UserSettings />
        </TabsContent>

        <TabsContent value="video-cdn">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Video CDN (Bunny Stream)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configura tu cuenta de Bunny Stream para habilitar el hosting de videos profesional.
              </p>
            </CardHeader>
            <CardContent>
              <VideoCDNSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configura cómo y cuándo quieres recibir notificaciones.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Las configuraciones de notificaciones estarán disponibles próximamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserConfiguration;
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Download, 
  AlertTriangle, 
  Info, 
  XCircle, 
  CheckCircle,
  Zap,
  Database,
  Globe,
  User,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'api' | 'upload' | 'user' | 'security';
  message: string;
  details?: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
}

export const SystemLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  // Mock logs data
  const [logs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '2024-01-21T14:30:15Z',
      level: 'info',
      category: 'upload',
      message: 'Video uploaded successfully',
      details: 'video_1.mp4 - 250MB - Processing started',
      userId: 'user_123',
      userEmail: 'juan@empresa.com',
      ipAddress: '192.168.1.1'
    },
    {
      id: '2',
      timestamp: '2024-01-21T14:25:42Z',
      level: 'warning',
      category: 'system',
      message: 'High storage usage detected',
      details: 'Storage usage at 85% capacity (850GB/1TB)',
      ipAddress: 'system'
    },
    {
      id: '3',
      timestamp: '2024-01-21T14:20:18Z',
      level: 'error',
      category: 'api',
      message: 'CDN connection timeout',
      details: 'Failed to connect to Bunny CDN after 3 retries',
      ipAddress: 'cdn.server'
    },
    {
      id: '4',
      timestamp: '2024-01-21T14:15:33Z',
      level: 'success',
      category: 'user',
      message: 'User login successful',
      details: 'Two-factor authentication verified',
      userId: 'user_456',
      userEmail: 'ana@startup.com',
      ipAddress: '10.0.0.15'
    },
    {
      id: '5',
      timestamp: '2024-01-21T14:10:07Z',
      level: 'error',
      category: 'security',
      message: 'Failed login attempt',
      details: 'Invalid credentials - 3rd attempt from same IP',
      userEmail: 'invalid@test.com',
      ipAddress: '203.0.113.1'
    },
    {
      id: '6',
      timestamp: '2024-01-21T14:05:52Z',
      level: 'info',
      category: 'system',
      message: 'Automated backup completed',
      details: 'Daily backup completed successfully - 2.4TB backed up',
      ipAddress: 'backup.server'
    },
    {
      id: '7',
      timestamp: '2024-01-21T13:58:21Z',
      level: 'warning',
      category: 'upload',
      message: 'Video processing slow',
      details: 'Processing queue has 15 videos pending - estimated delay 45 minutes',
      ipAddress: 'processing.server'
    },
    {
      id: '8',
      timestamp: '2024-01-21T13:45:14Z',
      level: 'info',
      category: 'api',
      message: 'Webhook delivered successfully',
      details: 'video.created event sent to https://cliente.com/webhook',
      userId: 'user_789',
      ipAddress: 'webhook.server'
    }
  ]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'success': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Zap className="w-4 h-4" />;
      case 'api': return <Globe className="w-4 h-4" />;
      case 'upload': return <Database className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      case 'security': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportLogs = () => {
    toast.success('Logs exportados correctamente');
  };

  const refreshLogs = () => {
    toast.success('Logs actualizados');
  };

  const logStats = {
    total: logs.length,
    errors: logs.filter(l => l.level === 'error').length,
    warnings: logs.filter(l => l.level === 'warning').length,
    info: logs.filter(l => l.level === 'info').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-3xl font-bold">Logs del Sistema</h2>
          <p className="text-muted-foreground mt-1">
            Monitoreo y registro de actividad del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="text-2xl font-bold">{logStats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errores</p>
                <p className="text-2xl font-bold text-red-500">{logStats.errors}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Advertencias</p>
                <p className="text-2xl font-bold text-yellow-500">{logStats.warnings}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Información</p>
                <p className="text-2xl font-bold text-blue-500">{logStats.info}</p>
              </div>
              <Info className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar en logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="error">Errores</SelectItem>
                <SelectItem value="warning">Advertencias</SelectItem>
                <SelectItem value="info">Información</SelectItem>
                <SelectItem value="success">Éxito</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="upload">Uploads</SelectItem>
                <SelectItem value="user">Usuarios</SelectItem>
                <SelectItem value="security">Seguridad</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="all">Todo el tiempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredLogs.map((log, index) => (
              <div 
                key={log.id} 
                className={`p-4 border-b last:border-b-0 hover:bg-muted/50 ${
                  log.level === 'error' ? 'border-l-4 border-l-red-500' :
                  log.level === 'warning' ? 'border-l-4 border-l-yellow-500' :
                  log.level === 'success' ? 'border-l-4 border-l-green-500' :
                  'border-l-4 border-l-blue-500'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2 mt-1">
                      {getLevelIcon(log.level)}
                      {getCategoryIcon(log.category)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getLevelColor(log.level)}>
                          {log.level}
                        </Badge>
                        <Badge variant="outline">
                          {log.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      
                      <p className="font-medium text-sm mb-1">{log.message}</p>
                      
                      {log.details && (
                        <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {log.userEmail && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.userEmail}
                          </span>
                        )}
                        {log.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {log.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* No results */}
      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron logs</h3>
            <p className="text-muted-foreground">
              Prueba con otros términos de búsqueda o filtros.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

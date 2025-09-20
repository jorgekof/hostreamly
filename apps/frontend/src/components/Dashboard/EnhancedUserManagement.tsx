import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Shield,
  Crown,
  User,
  Mail,
  Calendar,
  Activity,
  Download,
  Upload,
  Settings,
  Eye,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  AlertTriangle,
  Clock,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'users' | 'billing' | 'system' | 'analytics';
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  roleId: string;
  roleName: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  // Subscription info
  planName?: string;
  planStatus?: 'active' | 'cancelled' | 'expired';
  // Usage stats
  storageUsed: number;
  bandwidthUsed: number;
  videosCount: number;
  // Location
  country?: string;
  timezone?: string;
  // Notes
  notes?: string;
}

interface UserActivity {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

const defaultPermissions: Permission[] = [
  // Content permissions
  { id: 'content.view', name: 'Ver Contenido', description: 'Ver videos y contenido', category: 'content' },
  { id: 'content.create', name: 'Crear Contenido', description: 'Subir y crear videos', category: 'content' },
  { id: 'content.edit', name: 'Editar Contenido', description: 'Editar videos propios', category: 'content' },
  { id: 'content.delete', name: 'Eliminar Contenido', description: 'Eliminar videos propios', category: 'content' },
  { id: 'content.moderate', name: 'Moderar Contenido', description: 'Moderar contenido de otros usuarios', category: 'content' },
  
  // User permissions
  { id: 'users.view', name: 'Ver Usuarios', description: 'Ver lista de usuarios', category: 'users' },
  { id: 'users.create', name: 'Crear Usuarios', description: 'Crear nuevos usuarios', category: 'users' },
  { id: 'users.edit', name: 'Editar Usuarios', description: 'Editar información de usuarios', category: 'users' },
  { id: 'users.delete', name: 'Eliminar Usuarios', description: 'Eliminar usuarios', category: 'users' },
  { id: 'users.suspend', name: 'Suspender Usuarios', description: 'Suspender/reactivar usuarios', category: 'users' },
  
  // Billing permissions
  { id: 'billing.view', name: 'Ver Facturación', description: 'Ver información de facturación', category: 'billing' },
  { id: 'billing.manage', name: 'Gestionar Facturación', description: 'Gestionar facturas y pagos', category: 'billing' },
  { id: 'billing.refund', name: 'Procesar Reembolsos', description: 'Procesar reembolsos', category: 'billing' },
  
  // System permissions
  { id: 'system.settings', name: 'Configuración Sistema', description: 'Acceder a configuración del sistema', category: 'system' },
  { id: 'system.logs', name: 'Ver Logs', description: 'Ver logs del sistema', category: 'system' },
  { id: 'system.backup', name: 'Gestionar Backups', description: 'Crear y restaurar backups', category: 'system' },
  
  // Analytics permissions
  { id: 'analytics.view', name: 'Ver Analytics', description: 'Ver reportes y analytics', category: 'analytics' },
  { id: 'analytics.export', name: 'Exportar Analytics', description: 'Exportar reportes', category: 'analytics' }
];

const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acceso completo al sistema',
    color: 'red',
    permissions: defaultPermissions.map(p => p.id),
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'moderator',
    name: 'Moderador',
    description: 'Puede moderar contenido y usuarios',
    color: 'orange',
    permissions: [
      'content.view', 'content.moderate',
      'users.view', 'users.suspend',
      'analytics.view'
    ],
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'creator',
    name: 'Creador',
    description: 'Usuario premium con funciones avanzadas',
    color: 'blue',
    permissions: [
      'content.view', 'content.create', 'content.edit', 'content.delete',
      'analytics.view'
    ],
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user',
    name: 'Usuario',
    description: 'Usuario básico',
    color: 'green',
    permissions: ['content.view', 'content.create', 'content.edit', 'content.delete'],
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const EnhancedUserManagement = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [permissions] = useState<Permission[]>(defaultPermissions);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    username: '',
    roleId: 'user',
    sendWelcomeEmail: true
  });
  
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    color: 'blue',
    permissions: [] as string[]
  });

  // Mock data - replace with API calls
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@hostreamly.com',
        firstName: 'Admin',
        lastName: 'Sistema',
        username: 'admin',
        roleId: 'admin',
        roleName: 'Administrador',
        status: 'active',
        emailVerified: true,
        twoFactorEnabled: true,
        lastLoginAt: '2024-01-20T10:30:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
        planName: 'Enterprise',
        planStatus: 'active',
        storageUsed: 0,
        bandwidthUsed: 0,
        videosCount: 0,
        country: 'ES',
        timezone: 'Europe/Madrid'
      },
      {
        id: '2',
        email: 'juan@example.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        username: 'juanperez',
        roleId: 'creator',
        roleName: 'Creador',
        status: 'active',
        emailVerified: true,
        twoFactorEnabled: false,
        lastLoginAt: '2024-01-19T15:45:00Z',
        createdAt: '2024-01-10T12:00:00Z',
        updatedAt: '2024-01-19T15:45:00Z',
        planName: 'Professional',
        planStatus: 'active',
        storageUsed: 2.5,
        bandwidthUsed: 15.2,
        videosCount: 12,
        country: 'MX',
        timezone: 'America/Mexico_City'
      },
      {
        id: '3',
        email: 'ana@example.com',
        firstName: 'Ana',
        lastName: 'García',
        username: 'anagarcia',
        roleId: 'user',
        roleName: 'Usuario',
        status: 'suspended',
        emailVerified: true,
        twoFactorEnabled: false,
        lastLoginAt: '2024-01-15T09:20:00Z',
        createdAt: '2024-01-05T14:30:00Z',
        updatedAt: '2024-01-18T11:15:00Z',
        planName: 'Starter',
        planStatus: 'active',
        storageUsed: 0.8,
        bandwidthUsed: 3.1,
        videosCount: 5,
        country: 'AR',
        timezone: 'America/Argentina/Buenos_Aires',
        notes: 'Usuario suspendido por violación de términos de servicio'
      },
      {
        id: '4',
        email: 'carlos@example.com',
        firstName: 'Carlos',
        lastName: 'López',
        username: 'carloslopez',
        roleId: 'user',
        roleName: 'Usuario',
        status: 'pending',
        emailVerified: false,
        twoFactorEnabled: false,
        createdAt: '2024-01-20T16:00:00Z',
        updatedAt: '2024-01-20T16:00:00Z',
        storageUsed: 0,
        bandwidthUsed: 0,
        videosCount: 0,
        country: 'CO',
        timezone: 'America/Bogota'
      }
    ];

    const mockActivities: UserActivity[] = [
      {
        id: '1',
        userId: '2',
        action: 'login',
        description: 'Usuario inició sesión',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: '2024-01-19T15:45:00Z'
      },
      {
        id: '2',
        userId: '2',
        action: 'video_upload',
        description: 'Subió un nuevo video: "Tutorial React"',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: '2024-01-19T16:20:00Z'
      },
      {
        id: '3',
        userId: '3',
        action: 'account_suspended',
        description: 'Cuenta suspendida por administrador',
        ipAddress: '10.0.0.1',
        userAgent: 'Admin Panel',
        createdAt: '2024-01-18T11:15:00Z'
      }
    ];

    setUsers(mockUsers);
    setActivities(mockActivities);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.roleId === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName) {
      toast.error('Email, nombre y apellido son requeridos');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      toast.error('El email ya está en uso');
      return;
    }

    setLoading(true);
    try {
      const user: User = {
        id: Date.now().toString(),
        ...newUser,
        username: newUser.username || newUser.email.split('@')[0],
        roleName: roles.find(r => r.id === newUser.roleId)?.name || 'Usuario',
        status: 'pending',
        emailVerified: false,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        storageUsed: 0,
        bandwidthUsed: 0,
        videosCount: 0
      };

      setUsers(prev => [...prev, user]);
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        username: '',
        roleId: 'user',
        sendWelcomeEmail: true
      });
      setIsCreateUserModalOpen(false);
      toast.success('Usuario creado exitosamente');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setLoading(true);
    try {
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...editingUser, updatedAt: new Date().toISOString() }
          : u
      ));
      setEditingUser(null);
      toast.success('Usuario actualizado exitosamente');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setLoading(true);
    try {
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
      toast.success('Usuario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('Selecciona al menos un usuario');
      return;
    }

    const actionText = {
      activate: 'activar',
      suspend: 'suspender',
      delete: 'eliminar'
    }[action] || action;

    if (!confirm(`¿Estás seguro de que quieres ${actionText} ${selectedUsers.length} usuario(s)?`)) {
      return;
    }

    setLoading(true);
    try {
      if (action === 'delete') {
        setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
      } else {
        const newStatus = action === 'activate' ? 'active' : 'suspended';
        setUsers(prev => prev.map(u => 
          selectedUsers.includes(u.id)
            ? { ...u, status: newStatus as User['status'], updatedAt: new Date().toISOString() }
            : u
        ));
      }
      
      setSelectedUsers([]);
      toast.success(`${selectedUsers.length} usuario(s) ${actionText}(s) exitosamente`);
    } catch (error) {
      console.error(`Error ${action} users:`, error);
      toast.error(`Error al ${actionText} usuarios`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name) {
      toast.error('El nombre del rol es requerido');
      return;
    }

    if (roles.some(r => r.name.toLowerCase() === newRole.name.toLowerCase())) {
      toast.error('El nombre del rol ya existe');
      return;
    }

    setLoading(true);
    try {
      const role: Role = {
        id: newRole.name.toLowerCase().replace(/\s+/g, '_'),
        ...newRole,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setRoles(prev => [...prev, role]);
      setNewRole({
        name: '',
        description: '',
        color: 'blue',
        permissions: []
      });
      setIsCreateRoleModalOpen(false);
      toast.success('Rol creado exitosamente');
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Error al crear rol');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: User['status']) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Activo', icon: CheckCircle, className: 'bg-green-500' },
      inactive: { variant: 'secondary' as const, label: 'Inactivo', icon: XCircle },
      suspended: { variant: 'destructive' as const, label: 'Suspendido', icon: Ban },
      pending: { variant: 'outline' as const, label: 'Pendiente', icon: Clock }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={'className' in config ? config.className : ''}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getRoleIcon = (roleId: string) => {
    const icons = {
      admin: Crown,
      moderator: Shield,
      creator: User,
      user: User
    };
    const Icon = icons[roleId as keyof typeof icons] || User;
    return <Icon className="w-4 h-4" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground mt-1">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button onClick={() => setIsCreateUserModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permisos</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Usuarios</span>
                </div>
                <p className="text-2xl font-bold mt-2">{users.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Usuarios Activos</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Ban className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Suspendidos</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {users.filter(u => u.status === 'suspended').length}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Pendientes</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {users.filter(u => u.status === 'pending').length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Bulk Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                    <SelectItem value="suspended">Suspendidos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>

                {selectedUsers.length > 0 && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleBulkAction('activate')}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Activar ({selectedUsers.length})
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleBulkAction('suspend')}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Suspender ({selectedUsers.length})
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleBulkAction('delete')}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar ({selectedUsers.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers(filteredUsers.map(u => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(prev => [...prev, user.id]);
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {user.emailVerified && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Verificado
                                </Badge>
                              )}
                              {user.twoFactorEnabled && (
                                <Badge variant="outline" className="text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  2FA
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.roleId)}
                          <Badge 
                            variant="outline" 
                            className={`border-${roles.find(r => r.id === user.roleId)?.color}-500`}
                          >
                            {user.roleName}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        {user.planName ? (
                          <div>
                            <p className="font-medium">{user.planName}</p>
                            <Badge 
                              variant={user.planStatus === 'active' ? 'default' : 'secondary'}
                              className={user.planStatus === 'active' ? 'bg-green-500' : ''}
                            >
                              {user.planStatus}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin plan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt ? (
                          <div>
                            <p className="text-sm">
                              {new Date(user.lastLoginAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(user.lastLoginAt).toLocaleTimeString()}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatBytes(user.storageUsed * 1024 * 1024 * 1024)} almacenamiento</p>
                          <p className="text-muted-foreground">{user.videosCount} videos</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingUser(user)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setUsers(prev => prev.map(u => 
                                    u.id === user.id 
                                      ? { ...u, status: 'suspended', updatedAt: new Date().toISOString() }
                                      : u
                                  ));
                                  toast.success('Usuario suspendido');
                                }}
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Suspender
                              </DropdownMenuItem>
                            ) : user.status === 'suspended' ? (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setUsers(prev => prev.map(u => 
                                    u.id === user.id 
                                      ? { ...u, status: 'active', updatedAt: new Date().toISOString() }
                                      : u
                                  ));
                                  toast.success('Usuario reactivado');
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Reactivar
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem 
                              onClick={() => setUserToDelete(user)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Gestión de Roles</h3>
            <Button onClick={() => setIsCreateRoleModalOpen(true)}>
              <Shield className="w-4 h-4 mr-2" />
              Nuevo Rol
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(role.id)}
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`border-${role.color}-500 text-${role.color}-700`}
                    >
                      {users.filter(u => u.roleId === role.id).length} usuarios
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Permisos ({role.permissions.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permId) => {
                        const perm = permissions.find(p => p.id === permId);
                        return perm ? (
                          <Badge key={permId} variant="secondary" className="text-xs">
                            {perm.name}
                          </Badge>
                        ) : null;
                      })}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditingRole(role)}
                      disabled={role.isSystem}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    {!role.isSystem && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (confirm(`¿Eliminar el rol "${role.name}"?`)) {
                            setRoles(prev => prev.filter(r => r.id !== role.id));
                            toast.success('Rol eliminado');
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <h3 className="text-xl font-semibold">Permisos del Sistema</h3>
          
          {['content', 'users', 'billing', 'system', 'analytics'].map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {category === 'content' ? 'Contenido' :
                   category === 'users' ? 'Usuarios' :
                   category === 'billing' ? 'Facturación' :
                   category === 'system' ? 'Sistema' : 'Analytics'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissions
                    .filter(p => p.category === category)
                    .map((permission) => (
                      <div key={permission.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium">{permission.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {permission.description}
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {permission.id}
                        </Badge>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <h3 className="text-xl font-semibold">Registro de Actividad</h3>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {activities.map((activity) => {
                  const user = users.find(u => u.id === activity.userId);
                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{activity.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {activity.action}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Usuario: {user?.email || 'Desconocido'}</span>
                          <span>IP: {activity.ipAddress}</span>
                          <span>{new Date(activity.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Modal */}
      <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Se generará automáticamente si se deja vacío"
              />
            </div>

            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={newUser.roleId} onValueChange={(value) => setNewUser(prev => ({ ...prev, roleId: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(role.id)}
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendWelcomeEmail"
                checked={newUser.sendWelcomeEmail}
                onCheckedChange={(checked) => setNewUser(prev => ({ ...prev, sendWelcomeEmail: !!checked }))}
              />
              <Label htmlFor="sendWelcomeEmail">Enviar email de bienvenida</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleCreateUser}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setNewUser({
                    email: '',
                    firstName: '',
                    lastName: '',
                    username: '',
                    roleId: 'user',
                    sendWelcomeEmail: true
                  });
                  setIsCreateUserModalOpen(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Role Modal */}
      <Dialog open={isCreateRoleModalOpen} onOpenChange={setIsCreateRoleModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Rol</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roleName">Nombre del Rol *</Label>
                <Input
                  id="roleName"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="roleColor">Color</Label>
                <Select value={newRole.color} onValueChange={(value) => setNewRole(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Azul</SelectItem>
                    <SelectItem value="green">Verde</SelectItem>
                    <SelectItem value="red">Rojo</SelectItem>
                    <SelectItem value="orange">Naranja</SelectItem>
                    <SelectItem value="purple">Morado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="roleDescription">Descripción</Label>
              <Textarea
                id="roleDescription"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label>Permisos</Label>
              <div className="space-y-4 mt-2">
                {['content', 'users', 'billing', 'system', 'analytics'].map((category) => (
                  <div key={category}>
                    <h4 className="font-medium mb-2 capitalize">
                      {category === 'content' ? 'Contenido' :
                       category === 'users' ? 'Usuarios' :
                       category === 'billing' ? 'Facturación' :
                       category === 'system' ? 'Sistema' : 'Analytics'}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {permissions
                        .filter(p => p.category === category)
                        .map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={newRole.permissions.includes(permission.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewRole(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, permission.id]
                                  }));
                                } else {
                                  setNewRole(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== permission.id)
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={permission.id} className="text-sm">
                              {permission.name}
                            </Label>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleCreateRole}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creando...' : 'Crear Rol'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setNewRole({
                    name: '',
                    description: '',
                    color: 'blue',
                    permissions: []
                  });
                  setIsCreateRoleModalOpen(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      {viewingUser && (
        <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Usuario</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-medium">
                  {viewingUser.firstName[0]}{viewingUser.lastName[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {viewingUser.firstName} {viewingUser.lastName}
                  </h3>
                  <p className="text-muted-foreground">{viewingUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(viewingUser.status)}
                    <Badge variant="outline">{viewingUser.roleName}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Nombre de Usuario</Label>
                  <p className="font-medium">{viewingUser.username}</p>
                </div>
                <div>
                  <Label>Email Verificado</Label>
                  <p className={viewingUser.emailVerified ? 'text-green-600' : 'text-red-600'}>
                    {viewingUser.emailVerified ? 'Sí' : 'No'}
                  </p>
                </div>
                <div>
                  <Label>2FA Habilitado</Label>
                  <p className={viewingUser.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}>
                    {viewingUser.twoFactorEnabled ? 'Sí' : 'No'}
                  </p>
                </div>
                <div>
                  <Label>País</Label>
                  <p>{viewingUser.country || 'No especificado'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{viewingUser.videosCount}</p>
                      <p className="text-sm text-muted-foreground">Videos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {formatBytes(viewingUser.storageUsed * 1024 * 1024 * 1024)}
                      </p>
                      <p className="text-sm text-muted-foreground">Almacenamiento</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {formatBytes(viewingUser.bandwidthUsed * 1024 * 1024 * 1024)}
                      </p>
                      <p className="text-sm text-muted-foreground">Ancho de Banda</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {viewingUser.notes && (
                <div>
                  <Label>Notas</Label>
                  <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
                    {viewingUser.notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Fecha de Registro</Label>
                  <p>{new Date(viewingUser.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Última Actualización</Label>
                  <p>{new Date(viewingUser.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">Nombre</Label>
                  <Input
                    id="editFirstName"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Apellido</Label>
                  <Input
                    id="editLastName"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>

              <div>
                <Label htmlFor="editUsername">Nombre de Usuario</Label>
                <Input
                  id="editUsername"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, username: e.target.value } : null)}
                />
              </div>

              <div>
                <Label htmlFor="editRole">Rol</Label>
                <Select 
                  value={editingUser.roleId} 
                  onValueChange={(value) => {
                    const role = roles.find(r => r.id === value);
                    setEditingUser(prev => prev ? { 
                      ...prev, 
                      roleId: value,
                      roleName: role?.name || 'Usuario'
                    } : null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role.id)}
                          {role.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editStatus">Estado</Label>
                <Select 
                  value={editingUser.status} 
                  onValueChange={(value) => setEditingUser(prev => prev ? { 
                    ...prev, 
                    status: value as User['status']
                  } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editNotes">Notas</Label>
                <Textarea
                  id="editNotes"
                  value={editingUser.notes || ''}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="Notas adicionales sobre el usuario..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleUpdateUser}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Usuario'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingUser(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Rol</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editRoleName">Nombre del Rol</Label>
                  <Input
                    id="editRoleName"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole(prev => prev ? { ...prev, name: e.target.value } : null)}
                    disabled={editingRole.isSystem}
                  />
                </div>
                <div>
                  <Label htmlFor="editRoleColor">Color</Label>
                  <Select 
                    value={editingRole.color} 
                    onValueChange={(value) => setEditingRole(prev => prev ? { ...prev, color: value } : null)}
                    disabled={editingRole.isSystem}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Azul</SelectItem>
                      <SelectItem value="green">Verde</SelectItem>
                      <SelectItem value="red">Rojo</SelectItem>
                      <SelectItem value="orange">Naranja</SelectItem>
                      <SelectItem value="purple">Morado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="editRoleDescription">Descripción</Label>
                <Textarea
                  id="editRoleDescription"
                  value={editingRole.description}
                  onChange={(e) => setEditingRole(prev => prev ? { ...prev, description: e.target.value } : null)}
                  disabled={editingRole.isSystem}
                />
              </div>

              {!editingRole.isSystem && (
                <div>
                  <Label>Permisos</Label>
                  <div className="space-y-4 mt-2">
                    {['content', 'users', 'billing', 'system', 'analytics'].map((category) => (
                      <div key={category}>
                        <h4 className="font-medium mb-2 capitalize">
                          {category === 'content' ? 'Contenido' :
                           category === 'users' ? 'Usuarios' :
                           category === 'billing' ? 'Facturación' :
                           category === 'system' ? 'Sistema' : 'Analytics'}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {permissions
                            .filter(p => p.category === category)
                            .map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`edit-${permission.id}`}
                                  checked={editingRole.permissions.includes(permission.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setEditingRole(prev => prev ? ({
                                        ...prev,
                                        permissions: [...prev.permissions, permission.id]
                                      }) : null);
                                    } else {
                                      setEditingRole(prev => prev ? ({
                                        ...prev,
                                        permissions: prev.permissions.filter(p => p !== permission.id)
                                      }) : null);
                                    }
                                  }}
                                />
                                <Label htmlFor={`edit-${permission.id}`} className="text-sm">
                                  {permission.name}
                                </Label>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => {
                    if (!editingRole) return;
                    setRoles(prev => prev.map(r => 
                      r.id === editingRole.id 
                        ? { ...editingRole, updatedAt: new Date().toISOString() }
                        : r
                    ));
                    setEditingRole(null);
                    toast.success('Rol actualizado exitosamente');
                  }}
                  disabled={loading || editingRole.isSystem}
                  className="flex-1"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Rol'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingRole(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de{' '}
              <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> y todos sus datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar Usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnhancedUserManagement;
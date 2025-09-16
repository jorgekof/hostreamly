import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Folder, FolderPlus, Trash2, Edit, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { folderService, UserFolder, CreateFolderRequest } from '@/services/folderService';

interface FolderItemProps {
  folder: UserFolder;
  level: number;
  expandedFolders: Set<string>;
  onToggleExpand: (folderId: string) => void;
  onDelete: (folderId: string) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({ 
  folder, 
  level, 
  expandedFolders, 
  onToggleExpand, 
  onDelete 
}) => {
  const hasChildren = folder.children && folder.children.length > 0;
  const isExpanded = expandedFolders.has(folder.id);
  const paddingLeft = level * 20;

  return (
    <div>
      <div 
        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <div className="flex items-center space-x-2">
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(folder.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6" /> // Spacer
          )}
          <Folder className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">{folder.name}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {/* TODO: Implement edit */}}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar carpeta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará la carpeta "{folder.name}" y todo su contenido.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(folder.id)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const UserFolderManager: React.FC = () => {
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const folderData = await folderService.getUserFolders();
      setFolders(folderData);
    } catch (error: any) {
      console.error('Error fetching folders:', error);
      toast.error(error.message || 'Error al cargar las carpetas');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('El nombre de la carpeta es requerido');
      return;
    }
    
    try {
      setCreating(true);
      const folderData: CreateFolderRequest = {
        name: newFolderName,
        parentId: selectedParentId
      };
      
      await folderService.createFolder(folderData);
      toast.success('Carpeta creada exitosamente');
      setNewFolderName('');
      setSelectedParentId(undefined);
      setCreateDialogOpen(false);
      fetchFolders(); // Recargar carpetas
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast.error(error.message || 'Error al crear la carpeta');
    } finally {
      setCreating(false);
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      await folderService.deleteFolder(folderId);
      toast.success('Carpeta eliminada exitosamente');
      fetchFolders(); // Recargar carpetas
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast.error(error.message || 'Error al eliminar la carpeta');
    }
  };

  const toggleFolderExpansion = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolderOptions = (folders: UserFolder[], level = 0): JSX.Element[] => {
    return folders.map(folder => [
      <option key={folder.id} value={folder.id}>
        {'  '.repeat(level) + folder.name}
      </option>,
      ...(folder.children ? renderFolderOptions(folder.children, level + 1) : [])
    ]).flat();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Carpetas</CardTitle>
          <CardDescription>Organizando tu contenido...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gestión de Carpetas</span>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <FolderPlus className="w-4 h-4 mr-2" />
                Nueva Carpeta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Carpeta</DialogTitle>
                <DialogDescription>
                  Crea una nueva carpeta para organizar tu contenido.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Nombre de la carpeta
                  </label>
                  <Input
                    placeholder="Ej: Mis Videos"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Carpeta padre (opcional)
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedParentId || ''}
                    onChange={(e) => setSelectedParentId(e.target.value || undefined)}
                  >
                    <option value="">Carpeta raíz</option>
                    {renderFolderOptions(folders)}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={createFolder} 
                  disabled={creating}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  {creating ? 'Creando...' : 'Crear Carpeta'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Organiza tu contenido en carpetas personalizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {folders.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No tienes carpetas creadas aún</p>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Crear tu primera carpeta
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                level={0}
                expandedFolders={expandedFolders}
                onToggleExpand={toggleFolderExpansion}
                onDelete={deleteFolder}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserFolderManager;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Brain, 
  Filter, 
  Settings, 
  BarChart3, 
  FileText, 
  Image, 
  Video, 
  MessageSquare, 
  Zap, 
  RefreshCw, 
  Download,
  Upload,
  Play,
  Pause
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { apiClient as api } from '@/lib/api';
interface ModerationRule {
  id: string;
  name: string;
  description: string;
  type: 'content' | 'image' | 'text' | 'audio' | 'metadata';
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'flag' | 'quarantine' | 'block' | 'review';
  enabled: boolean;
  confidence_threshold: number;
  auto_action: boolean;
  keywords?: string[];
  categories?: string[];
}

interface ModerationResult {
  id: string;
  content_id: string;
  content_type: 'video' | 'image' | 'text' | 'audio';
  content_title: string;
  status: 'pending' | 'approved' | 'rejected' | 'quarantined';
  confidence_score: number;
  detected_issues: string[];
  ai_analysis: {
    violence: number;
    adult_content: number;
    hate_speech: number;
    spam: number;
    copyright: number;
    fake_news: number;
  };
  created_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
}

interface ModerationStats {
  total_scanned: number;
  flagged_content: number;
  auto_approved: number;
  pending_review: number;
  accuracy_rate: number;
  processing_time_avg: number;
  categories: {
    violence: number;
    adult_content: number;
    hate_speech: number;
    spam: number;
    copyright: number;
    fake_news: number;
  };
}

const ContentModeration: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [moderationRules, setModerationRules] = useState<ModerationRule[]>([]);
  const [moderationResults, setModerationResults] = useState<ModerationResult[]>([]);
  const [moderationStats, setModerationStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [bulkScanProgress, setBulkScanProgress] = useState(0);
  const [newRule, setNewRule] = useState<Partial<ModerationRule>>({});
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    try {
      setLoading(true);
      
      // Cargar reglas de moderación
      if (!user) throw new Error('No authenticated');

      
      setModerationRules([]);

      // Cargar resultados de moderación
      
      setModerationResults([]);

      // Cargar estadísticas
      
      setModerationStats({
        total_scanned: 0,
        flagged_content: 0,
        auto_approved: 0,
        pending_review: 0,
        accuracy_rate: 95.5,
        processing_time_avg: 2.3,
        categories: {
          violence: 0,
          adult_content: 0,
          hate_speech: 0,
          spam: 0,
          copyright: 0,
          fake_news: 0
        }
      });

    } catch (error) {
      console.error('Error loading moderation data:', error);
      toast.error('Error al cargar datos de moderación');
    } finally {
      setLoading(false);
    }
  };

  const handleScanContent = async (contentId?: string) => {
    try {
      setProcessing(true);
      if (!user) throw new Error('No authenticated');

      //

      // Simular progreso de escaneo masivo
      for (let i = 0; i <= 100; i += 10) {
        setBulkScanProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast.success('Escaneo completado exitosamente');
      await loadModerationData();
      setBulkScanProgress(0);
      
    } catch (error) {
      console.error('Error scanning content:', error);
      toast.error('Error al escanear contenido');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      if (!user) throw new Error('No authenticated');

      

      setModerationRules(prev => 
        prev.map(rule => 
          rule.id === ruleId ? { ...rule, enabled } : rule
        )
      );

      toast.success(`Regla ${enabled ? 'habilitada' : 'deshabilitada'} exitosamente`);
      
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Error al cambiar estado de la regla');
    }
  };

  const handleCreateRule = async () => {
    try {
      if (!newRule.name || !newRule.type || !newRule.action) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      if (!user) throw new Error('No authenticated');

      

      const newRuleWithId = {
        ...newRule,
        id: Date.now().toString(),
        enabled: true,
        confidence_threshold: newRule.confidence_threshold || 0.7
      } as ModerationRule;

      setModerationRules(prev => [...prev, newRuleWithId]);
      setNewRule({});
      setShowNewRuleForm(false);
      toast.success('Regla creada exitosamente');
      
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Error al crear regla');
    }
  };

  const handleReviewContent = async (resultId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      if (!user) throw new Error('No authenticated');

      

      setModerationResults(prev => 
        prev.map(result => 
          result.id === resultId 
            ? { 
                ...result, 
                status: action === 'approve' ? 'approved' : 'rejected',
                reviewed_at: new Date().toISOString(),
                reviewer_notes: notes
              } 
            : result
        )
      );

      toast.success(`Contenido ${action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`);
      
    } catch (error) {
      console.error('Error reviewing content:', error);
      toast.error('Error al revisar contenido');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'quarantined': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando moderación de contenido...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Moderación de Contenido con IA</h2>
          <p className="text-muted-foreground">
            Sistema automático de moderación y revisión de contenido
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => handleScanContent()} 
            disabled={processing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {processing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            Escanear Todo
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowNewRuleForm(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Nueva Regla
          </Button>
        </div>
      </div>

      {/* Estadísticas generales */}
      {moderationStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Escaneado</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderationStats.total_scanned.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Contenido procesado por IA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contenido Marcado</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderationStats.flagged_content.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((moderationStats.flagged_content / moderationStats.total_scanned) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precisión IA</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderationStats.accuracy_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Tasa de precisión del modelo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderationStats.processing_time_avg}ms</div>
              <p className="text-xs text-muted-foreground">
                Tiempo de procesamiento
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progreso de escaneo masivo */}
      {bulkScanProgress > 0 && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Escaneando contenido con IA...</span>
                <span>{bulkScanProgress}%</span>
              </div>
              <Progress value={bulkScanProgress} className="w-full" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Categorías de detección */}
          {moderationStats && (
            <Card>
              <CardHeader>
                <CardTitle>Detecciones por Categoría</CardTitle>
                <CardDescription>
                  Distribución de contenido detectado por tipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(moderationStats.categories).map(([category, count]) => {
                    const percentage = moderationStats.total_scanned > 0 
                      ? (count / moderationStats.total_scanned) * 100 
                      : 0;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{category.replace('_', ' ')}</span>
                          <span>{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}% del total
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contenido pendiente de revisión */}
          <Card>
            <CardHeader>
              <CardTitle>Contenido Pendiente de Revisión</CardTitle>
              <CardDescription>
                Elementos que requieren revisión manual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moderationResults
                  .filter(result => result.status === 'pending')
                  .slice(0, 5)
                  .map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {result.content_type === 'video' && <Video className="h-4 w-4 text-blue-600" />}
                          {result.content_type === 'image' && <Image className="h-4 w-4 text-blue-600" />}
                          {result.content_type === 'text' && <FileText className="h-4 w-4 text-blue-600" />}
                          {result.content_type === 'audio' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{result.content_title}</p>
                          <p className="text-sm text-muted-foreground">
                            Confianza: {(result.confidence_score * 100).toFixed(1)}%
                          </p>
                          <div className="flex gap-1 mt-1">
                            {result.detected_issues.slice(0, 3).map((issue, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReviewContent(result.id, 'approve')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReviewContent(result.id, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))
                }
                {moderationResults.filter(result => result.status === 'pending').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay contenido pendiente de revisión
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados de Moderación</CardTitle>
              <CardDescription>
                Historial completo de análisis de contenido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moderationResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {result.content_type === 'video' && <Video className="h-5 w-5" />}
                          {result.content_type === 'image' && <Image className="h-5 w-5" />}
                          {result.content_type === 'text' && <FileText className="h-5 w-5" />}
                          {result.content_type === 'audio' && <MessageSquare className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{result.content_title}</h4>
                            <Badge className={getStatusColor(result.status)}>
                              {result.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Confianza: {(result.confidence_score * 100).toFixed(1)}% • 
                            {new Date(result.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex gap-1 mb-3">
                            {result.detected_issues.map((issue, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                          
                          {/* Análisis detallado de IA */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Violencia:</span>
                              <div className="flex items-center gap-2">
                                <Progress value={result.ai_analysis.violence * 100} className="h-2 flex-1" />
                                <span>{(result.ai_analysis.violence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Contenido Adulto:</span>
                              <div className="flex items-center gap-2">
                                <Progress value={result.ai_analysis.adult_content * 100} className="h-2 flex-1" />
                                <span>{(result.ai_analysis.adult_content * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Discurso de Odio:</span>
                              <div className="flex items-center gap-2">
                                <Progress value={result.ai_analysis.hate_speech * 100} className="h-2 flex-1" />
                                <span>{(result.ai_analysis.hate_speech * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Spam:</span>
                              <div className="flex items-center gap-2">
                                <Progress value={result.ai_analysis.spam * 100} className="h-2 flex-1" />
                                <span>{(result.ai_analysis.spam * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Copyright:</span>
                              <div className="flex items-center gap-2">
                                <Progress value={result.ai_analysis.copyright * 100} className="h-2 flex-1" />
                                <span>{(result.ai_analysis.copyright * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Noticias Falsas:</span>
                              <div className="flex items-center gap-2">
                                <Progress value={result.ai_analysis.fake_news * 100} className="h-2 flex-1" />
                                <span>{(result.ai_analysis.fake_news * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                          
                          {result.reviewer_notes && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                              <strong>Notas del revisor:</strong> {result.reviewer_notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {result.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReviewContent(result.id, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleReviewContent(result.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {moderationResults.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay resultados de moderación disponibles
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reglas de Moderación</CardTitle>
              <CardDescription>
                Configura las reglas automáticas de moderación de contenido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moderationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Switch 
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => handleToggleRule(rule.id, enabled)}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge className={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                          <Badge variant="outline">
                            {rule.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rule.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Acción: {rule.action}</span>
                          <span>Confianza: {(rule.confidence_threshold * 100).toFixed(0)}%</span>
                          <span>Auto: {rule.auto_action ? 'Sí' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {moderationRules.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay reglas de moderación configuradas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Moderación</CardTitle>
              <CardDescription>
                Métricas detalladas y tendencias de moderación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Gráfico de tendencias (placeholder) */}
                <div className="space-y-4">
                  <h4 className="font-medium">Tendencias de Detección</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p>Gráfico de tendencias</p>
                      <p className="text-sm">(Implementar con Chart.js)</p>
                    </div>
                  </div>
                </div>
                
                {/* Métricas de rendimiento */}
                <div className="space-y-4">
                  <h4 className="font-medium">Rendimiento del Sistema</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Precisión General</span>
                      <div className="flex items-center gap-2">
                        <Progress value={moderationStats?.accuracy_rate || 0} className="w-20 h-2" />
                        <span className="text-sm font-medium">
                          {moderationStats?.accuracy_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tasa de Falsos Positivos</span>
                      <div className="flex items-center gap-2">
                        <Progress value={5.2} className="w-20 h-2" />
                        <span className="text-sm font-medium">5.2%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tasa de Falsos Negativos</span>
                      <div className="flex items-center gap-2">
                        <Progress value={2.8} className="w-20 h-2" />
                        <span className="text-sm font-medium">2.8%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tiempo de Respuesta</span>
                      <span className="text-sm font-medium">
                        {moderationStats?.processing_time_avg}ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para crear nueva regla */}
      {showNewRuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Nueva Regla de Moderación</CardTitle>
              <CardDescription>
                Configura una nueva regla automática
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Nombre</Label>
                <Input
                  id="rule-name"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre de la regla"
                />
              </div>
              
              <div>
                <Label htmlFor="rule-description">Descripción</Label>
                <Textarea
                  id="rule-description"
                  value={newRule.description || ''}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la regla"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rule-type">Tipo</Label>
                  <Select 
                    value={newRule.type || ''} 
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, type: value as ModerationRule['type'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content">Contenido</SelectItem>
                      <SelectItem value="image">Imagen</SelectItem>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="metadata">Metadatos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="rule-severity">Severidad</Label>
                  <Select 
                    value={newRule.severity || ''} 
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, severity: value as ModerationRule['severity'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar severidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="rule-action">Acción</Label>
                <Select 
                  value={newRule.action || ''} 
                  onValueChange={(value) => setNewRule(prev => ({ ...prev, action: value as ModerationRule['action'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flag">Marcar</SelectItem>
                    <SelectItem value="quarantine">Cuarentena</SelectItem>
                    <SelectItem value="block">Bloquear</SelectItem>
                    <SelectItem value="review">Revisar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="confidence-threshold">Umbral de Confianza (%)</Label>
                <Input
                  id="confidence-threshold"
                  type="number"
                  min="0"
                  max="100"
                  value={(newRule.confidence_threshold || 0.7) * 100}
                  onChange={(e) => setNewRule(prev => ({ 
                    ...prev, 
                    confidence_threshold: parseInt(e.target.value) / 100 
                  }))}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-action"
                  checked={newRule.auto_action || false}
                  onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, auto_action: checked }))}
                />
                <Label htmlFor="auto-action">Acción automática</Label>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNewRuleForm(false);
                  setNewRule({});
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateRule}>
                Crear Regla
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContentModeration;

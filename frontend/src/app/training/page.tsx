'use client'

import { useEffect, useState, useRef } from 'react'
import { Upload, RefreshCw, AlertCircle, CheckCircle, XCircle, Play, Trash2, Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { ProcessedContent } from '../types'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import {
  BarChart,
  MessageSquare,
  Hotel
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

export default function TrainingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [processedContent, setProcessedContent] = useState<ProcessedContent | null>(null)
  const router = useRouter()
  const { token } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    loadTrainings()
  }, [])

  const loadTrainings = async () => {
    if (!token) return;

    try {
      setIsLoading(true)
      console.log('Iniciando carga de entrenamientos')
      const data = await apiClient('/training/processed-content', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!data || !data.conversations || !data.extractedInfo) {
        throw new Error('Los datos recibidos no tienen el formato esperado')
      }

      setProcessedContent(data)
    } catch (error) {
      console.error('Error:', error)
      if (error instanceof Error &&
        !error.message.includes('Archivo de entrenamiento no encontrado')) {
        toast.error(error instanceof Error ? error.message : 'Error al cargar el contenido procesado')
      }
      setProcessedContent(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!token) {
      toast.error('No hay sesión activa. Por favor, inicia sesión.')
      return;
    }

    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/plain') {
      toast.error('Solo se permiten archivos de texto (.txt)')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      await apiClient('/training/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      toast.success('Archivo subido y procesado correctamente')
      await loadTrainings()
    } catch (error) {
      console.error('Error en carga:', error)
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el archivo')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleReset = async () => {
    if (!confirm('¿Estás seguro de que deseas reiniciar los datos de entrenamiento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await apiClient('/training/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      toast.success('Datos de entrenamiento reiniciados correctamente', {
        description: 'Se han eliminado todos los datos de entrenamiento.',
      });
      loadTrainings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al reiniciar los datos de entrenamiento', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  const handleEditItem = (category: string, index: number, value: string) => {
    setEditingCategory(category)
    setEditingIndex(index)
    setEditValue(value)
    setEditDialogOpen(true)
  }

  const handleAddItem = (category: string) => {
    setEditingCategory(category)
    setEditingIndex(null)
    setEditValue('')
    setEditDialogOpen(true)
  }

  const handleDeleteItem = async (category: string, index: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
      return
    }

    try {
      const updatedContent = { ...processedContent }
      updatedContent.extractedInfo.hotelInfo[category].splice(index, 1)

      await apiClient('/training/update-info', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelInfo: updatedContent.extractedInfo.hotelInfo
        })
      })

      setProcessedContent(updatedContent)
      toast.success('Elemento eliminado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el elemento')
    }
  }

  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      toast.error('El valor no puede estar vacío')
      return
    }

    try {
      const updatedContent = { ...processedContent }
      if (editingIndex === null) {
        // Agregar nuevo elemento
        updatedContent.extractedInfo.hotelInfo[editingCategory].push(editValue.trim())
      } else {
        // Actualizar elemento existente
        updatedContent.extractedInfo.hotelInfo[editingCategory][editingIndex] = editValue.trim()
      }

      await apiClient('/training/update-info', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelInfo: updatedContent.extractedInfo.hotelInfo
        })
      })

      setProcessedContent(updatedContent)
      setEditDialogOpen(false)
      toast.success(editingIndex === null ? 'Elemento agregado correctamente' : 'Elemento actualizado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar los cambios')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Entrenamiento</h2>
          <p className="text-muted-foreground">
            Gestiona los datos de entrenamiento del chatbot
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="destructive" disabled={isUploading}>
            <Trash2 className="mr-2 h-4 w-4" />
            Reiniciar Datos
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt"
            className="hidden"
            title="Archivo de entrenamiento"
            aria-label="Archivo de entrenamiento"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading ? 'Cargando...' : 'Cargar Archivo'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      ) : processedContent ? (
        <div className="grid gap-6">
          {/* Estadísticas Generales */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversaciones
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processedContent.conversations.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  conversaciones procesadas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Preguntas Frecuentes
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processedContent.extractedInfo.commonQuestions.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  preguntas identificadas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Información del Hotel
                </CardTitle>
                <Hotel className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(processedContent.extractedInfo.hotelInfo).flat().length}
                </div>
                <p className="text-xs text-muted-foreground">
                  datos extraídos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Preguntas Frecuentes */}
          <Card>
            <CardHeader>
              <CardTitle>Preguntas Frecuentes</CardTitle>
              <CardDescription>
                Preguntas más comunes identificadas en las conversaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {processedContent.extractedInfo.commonQuestions.map((q, i) => (
                  <Card key={i}>
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{q.question}</CardTitle>
                          <CardDescription>{q.answer}</CardDescription>
                        </div>
                        <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {q.frequency}x
                        </span>
                      </div>
                    </CardHeader>
                    {q.examples && (
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Ejemplos de respuestas:
                        </p>
                        <div className="space-y-2">
                          {q.examples.map((example, j) => (
                            <p key={j} className="text-sm text-muted-foreground">
                              {example}
                            </p>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Información del Hotel */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Hotel</CardTitle>
              <CardDescription>
                Datos extraídos sobre servicios y políticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Amenidades</h4>
                    <Button variant="outline" size="sm" onClick={() => handleAddItem('amenities')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {processedContent.extractedInfo.hotelInfo.amenities.map((item, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span>{item}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem('amenities', i, item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem('amenities', i)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Políticas</h4>
                    <Button variant="outline" size="sm" onClick={() => handleAddItem('policies')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {processedContent.extractedInfo.hotelInfo.policies.map((item, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-blue-500 mr-2" />
                          <span>{item}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem('policies', i, item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem('policies', i)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Tipos de Habitación</h4>
                    <Button variant="outline" size="sm" onClick={() => handleAddItem('roomTypes')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {processedContent.extractedInfo.hotelInfo.roomTypes.map((item, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <Hotel className="h-4 w-4 text-purple-500 mr-2" />
                          <span>{item}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem('roomTypes', i, item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem('roomTypes', i)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Servicios</h4>
                    <Button variant="outline" size="sm" onClick={() => handleAddItem('services')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {processedContent.extractedInfo.hotelInfo.services.map((item, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span>{item}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem('services', i, item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem('services', i)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversaciones de Ejemplo */}
          <Card>
            <CardHeader>
              <CardTitle>Conversaciones de Ejemplo</CardTitle>
              <CardDescription>
                Últimas 5 conversaciones procesadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processedContent.conversations.slice(0, 5).map((conv, i) => (
                  <Card key={i}>
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{conv.summary}</CardTitle>
                        <div className="flex gap-1">
                          {conv.tags.map((tag, j) => (
                            <span
                              key={j}
                              className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2">
                        {conv.messages.map((msg, j) => (
                          <div
                            key={j}
                            className={`p-3 rounded-lg ${msg.role === 'user'
                              ? 'bg-primary/10 text-primary-foreground ml-auto max-w-[80%]'
                              : 'bg-secondary/10 text-secondary-foreground mr-auto max-w-[80%]'
                              }`}
                          >
                            <p className="text-sm">
                              <span className="font-medium">
                                {msg.role === 'user' ? 'Usuario: ' : 'Asistente: '}
                              </span>
                              {msg.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No hay datos de entrenamiento
            </h3>
            <p className="text-muted-foreground mb-4">
              Sube un archivo de texto con conversaciones para comenzar el entrenamiento
            </p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'Cargando...' : 'Cargar Archivo'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIndex === null ? 'Agregar' : 'Editar'} {
                editingCategory === 'amenities' ? 'amenidad' :
                  editingCategory === 'policies' ? 'política' :
                    editingCategory === 'roomTypes' ? 'tipo de habitación' :
                      editingCategory === 'services' ? 'servicio' : ''
              }
            </DialogTitle>
            <DialogDescription>
              {editingIndex === null ? 'Agregar nuevo elemento a' : 'Modificar elemento de'} {
                editingCategory === 'amenities' ? 'amenidades' :
                  editingCategory === 'policies' ? 'políticas' :
                    editingCategory === 'roomTypes' ? 'tipos de habitación' :
                      editingCategory === 'services' ? 'servicios' : ''
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="editValue">Valor</Label>
            <Input
              id="editValue"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={`Ingrese el valor para ${editingCategory === 'amenities' ? 'la amenidad' :
                editingCategory === 'policies' ? 'la política' :
                  editingCategory === 'roomTypes' ? 'el tipo de habitación' :
                    editingCategory === 'services' ? 'el servicio' : ''
                }`}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              {editingIndex === null ? 'Agregar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Archivo: DocumentsTab.tsx
 * Ruta: src/components/documents/DocumentsTab.tsx
 * Última modificación: 2026-04-14
 * Descripción: Tab de documentos reutilizable para perfil de usuario y vista de coach.
 *   Permite subir PDFs e imágenes (máx 50MB), ver, descargar y eliminar documentos propios.
 *   Coaches pueden ver documentos de sus miembros (solo lectura).
 */
import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FileText, Upload, Trash2, Eye, Download, Loader2,
  FileImage, FileBadge, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const db = supabase as any;

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const DOC_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  medical:  { label: 'Certificado médico', emoji: '🏥' },
  contract: { label: 'Contrato / Acuerdo', emoji: '📋' },
  id:       { label: 'Documento de identidad', emoji: '🪪' },
  other:    { label: 'Otro', emoji: '📄' },
};

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <FileImage size={16} className="text-secondary" />;
  if (fileType === 'application/pdf') return <FileBadge size={16} className="text-destructive" />;
  return <FileText size={16} className="text-muted-foreground" />;
}

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentsTabProps {
  userId: string;        // user whose docs we're showing
  canUpload?: boolean;   // true for own profile, false for coach viewing member
  canDelete?: boolean;   // true for own profile only
}

export default function DocumentsTab({ userId, canUpload = true, canDelete = true }: DocumentsTabProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadDialog, setUploadDialog] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Form state
  const [fileName, setFileName]       = useState('');
  const [observations, setObservations] = useState('');
  const [docType, setDocType]         = useState('other');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);

  // ── Fetch docs ─────────────────────────────────────────────────
  const { data: docs, isLoading } = useQuery({
    queryKey: ['user-documents', userId],
    queryFn: async () => {
      const { data, error } = await db
        .from('user_documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  // ── Upload ─────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Usá PDF, Word o imágenes.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('El archivo no puede superar 50MB');
      return;
    }
    setSelectedFile(file);
    if (!fileName) setFileName(file.name.replace(/\.[^.]+$/, ''));
    setUploadDialog(true);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;
    setUploading(true);
    try {
      const ext  = selectedFile.name.split('.').pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(path, selectedFile, { upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);

      const { error: dbErr } = await db.from('user_documents').insert({
        user_id:          userId,
        file_name:        fileName.trim() || selectedFile.name,
        original_name:    selectedFile.name,
        file_path:        path,
        file_url:         urlData.publicUrl,
        file_type:        selectedFile.type,
        file_size_bytes:  selectedFile.size,
        document_type:    docType,
        observations:     observations.trim() || null,
      });
      if (dbErr) throw dbErr;

      qc.invalidateQueries({ queryKey: ['user-documents', userId] });
      toast.success('Documento subido exitosamente');
      setUploadDialog(false);
      resetForm();
    } catch (err: any) {
      toast.error('No se pudo subir el documento: ' + (err.message || ''));
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFileName(''); setObservations(''); setDocType('other');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Delete ─────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage.from('documents').remove([doc.file_path]);
      const { error } = await db.from('user_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-documents', userId] });
      toast.success('Documento eliminado');
    },
    onError: () => toast.error('No se pudo eliminar el documento'),
  });

  // ── Preview ────────────────────────────────────────────────────
  const openPreview = async (doc: any) => {
    setPreviewDoc(doc);
    setLoadingPreview(true);
    setPreviewUrl(null);
    try {
      // For private bucket use signed URL; for public bucket use file_url directly
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600);
      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch {
      // Fallback to public URL
      setPreviewUrl(doc.file_url);
    } finally {
      setLoadingPreview(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header + upload button */}
      {canUpload && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {docs?.length ?? 0} documento{docs?.length !== 1 ? 's' : ''}
          </p>
          <Button size="sm" variant="outline" className="gap-2"
            onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Subir documento
          </Button>
          <input ref={fileInputRef} type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect} className="hidden" />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : docs?.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <FileText size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {canUpload ? 'No subiste documentos aún.' : 'Este miembro no tiene documentos cargados.'}
          </p>
          {canUpload && (
            <p className="text-xs text-muted-foreground mt-1">
              Podés subir certificados médicos, contratos u otros archivos.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {docs?.map((doc: any) => (
            <div key={doc.id}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-border/80 transition-colors">
              <div className="shrink-0">{getFileIcon(doc.file_type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  <span>{DOC_TYPE_LABELS[doc.document_type]?.emoji} {DOC_TYPE_LABELS[doc.document_type]?.label}</span>
                  <span>·</span>
                  <span>{formatBytes(doc.file_size_bytes)}</span>
                  <span>·</span>
                  <span>{format(new Date(doc.uploaded_at), "d MMM yyyy", { locale: es })}</span>
                </div>
                {doc.observations && (
                  <p className="text-xs text-muted-foreground mt-1 italic truncate">
                    "{doc.observations}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                  title="Ver" onClick={() => openPreview(doc)}>
                  <Eye size={14} />
                </Button>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-secondary"
                    title="Descargar">
                    <Download size={14} />
                  </Button>
                </a>
                {canDelete && (
                  <Button variant="ghost" size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Eliminar"
                    onClick={() => deleteMutation.mutate(doc)}
                    disabled={deleteMutation.isPending}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={uploadDialog} onOpenChange={v => { if (!v) { setUploadDialog(false); resetForm(); } }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Subir documento</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-muted/40 rounded-lg p-3">
                {getFileIcon(selectedFile.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nombre del documento</Label>
                <Input value={fileName} onChange={e => setFileName(e.target.value)}
                  placeholder="Ej: Certificado médico marzo 2026"
                  className="bg-background border-border" maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Tipo de documento</Label>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground">
                  {Object.entries(DOC_TYPE_LABELS).map(([val, { label, emoji }]) => (
                    <option key={val} value={val}>{emoji} {label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Observaciones <span className="text-muted-foreground">(opcional)</span></Label>
                <Textarea value={observations} onChange={e => setObservations(e.target.value)}
                  placeholder="Ej: Vigente hasta diciembre 2026"
                  className="bg-background border-border resize-none text-sm min-h-[60px]" maxLength={300} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setUploadDialog(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button className="flex-1 gradient-primary text-primary-foreground"
                  onClick={handleUpload} disabled={uploading}>
                  {uploading ? <><Loader2 size={14} className="animate-spin mr-2" />Subiendo...</> : 'Subir'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewDoc} onOpenChange={v => { if (!v) { setPreviewDoc(null); setPreviewUrl(null); } }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2 pr-8">
              {previewDoc && getFileIcon(previewDoc.file_type)}
              <DialogTitle className="font-display text-sm truncate">{previewDoc?.file_name}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto min-h-0">
            {loadingPreview ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : previewUrl && previewDoc?.file_type?.startsWith('image/') ? (
              <img src={previewUrl} alt={previewDoc.file_name}
                className="w-full h-auto rounded-lg object-contain max-h-[60vh]" />
            ) : previewUrl && previewDoc?.file_type === 'application/pdf' ? (
              <iframe src={previewUrl} className="w-full rounded-lg" style={{ height: '60vh' }} title={previewDoc.file_name} />
            ) : (
              <div className="text-center py-12 space-y-3">
                <FileText size={40} className="mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Vista previa no disponible para este formato</p>
                {previewUrl && (
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" download>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download size={14} /> Descargar
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
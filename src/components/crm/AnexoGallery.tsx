import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, Upload, X, FileText, Film, Image as ImageIcon, Trash2, Eye, LoaderCircle, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useOportunidadeAnexos, type OportunidadeAnexo } from '@/hooks/crm/useOportunidadeAnexos';
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

interface Props {
  oppId: number;
}

const ACCEPTED_TYPES = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';

function getFileIcon(name: string | null) {
  if (!name) return <FileText className="h-8 w-8 text-muted-foreground" />;
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return null; // will show thumbnail
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return <Film className="h-8 w-8 text-muted-foreground" />;
  return <FileText className="h-8 w-8 text-muted-foreground" />;
}

function isImage(name: string | null) {
  if (!name) return false;
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}

function isVideo(name: string | null) {
  if (!name) return false;
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext);
}

const AnexoGallery: React.FC<Props> = ({ oppId }) => {
  const { anexos, isLoading, uploadAnexo, togglePublico, deleteAnexo } = useOportunidadeAnexos(oppId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter only image anexos for the image gallery navigation
  const imageAnexos = useMemo(() => anexos.filter((a) => isImage(a.nome_arquivo)), [anexos]);

  const openImagePreview = useCallback((anexo: OportunidadeAnexo) => {
    const idx = imageAnexos.findIndex((a) => a.id === anexo.id);
    if (idx !== -1) setPreviewIndex(idx);
  }, [imageAnexos]);

  const currentImage = previewIndex !== null ? imageAnexos[previewIndex] : null;

  const goNext = useCallback(() => {
    if (previewIndex !== null && previewIndex < imageAnexos.length - 1) setPreviewIndex(previewIndex + 1);
  }, [previewIndex, imageAnexos.length]);

  const goPrev = useCallback(() => {
    if (previewIndex !== null && previewIndex > 0) setPreviewIndex(previewIndex - 1);
  }, [previewIndex]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadAnexo.mutateAsync({ file: files[i], oppId });
      }
      setUploadOpen(false);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [oppId, uploadAnexo]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Anexos
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setUploadOpen(true)}
        >
          <Paperclip className="h-3.5 w-3.5" />
          Anexar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : anexos.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Nenhum anexo</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {anexos.map((anexo) => (
            <AnexoCard
              key={anexo.id}
              anexo={anexo}
              onTogglePublico={(pub) => togglePublico.mutate({ id: anexo.id, publico: pub })}
              onDelete={() => deleteAnexo.mutate({ id: anexo.id, url: anexo.url || '' })}
              onPreview={() => openImagePreview(anexo)}
            />
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Anexar Arquivos</DialogTitle>
            <DialogDescription>
              Envie imagens, vídeos ou documentos para esta oportunidade.
            </DialogDescription>
          </DialogHeader>
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Enviando...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Imagens, vídeos e documentos
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog with navigation */}
      <Dialog open={previewIndex !== null} onOpenChange={() => setPreviewIndex(null)}>
        <DialogContent className="sm:max-w-fit max-w-[95vw] max-h-[95vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="truncate text-sm">{currentImage?.nome_arquivo || 'Pré-visualização'}</DialogTitle>
            <DialogDescription className="sr-only">Pré-visualização do arquivo anexo</DialogDescription>
          </DialogHeader>

          {/* Main image area with nav buttons */}
          <div className="relative flex items-center justify-center px-4 min-h-[200px]">
            {/* Previous button */}
            {previewIndex !== null && previewIndex > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-2 z-10 rounded-full bg-background/80 border border-border p-1.5 hover:bg-muted transition-colors shadow-sm"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            )}

            {currentImage?.url && (
              <img
                src={currentImage.url}
                alt={currentImage.nome_arquivo || ''}
                className="max-w-[85vw] sm:max-w-[75vw] max-h-[65vh] object-contain rounded-lg"
              />
            )}

            {/* Next button */}
            {previewIndex !== null && previewIndex < imageAnexos.length - 1 && (
              <button
                onClick={goNext}
                className="absolute right-2 z-10 rounded-full bg-background/80 border border-border p-1.5 hover:bg-muted transition-colors shadow-sm"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {imageAnexos.length > 1 && (
            <div className="px-4 pb-4 pt-3">
              <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
                {imageAnexos.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setPreviewIndex(idx)}
                    className={`flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                      idx === previewIndex
                        ? 'border-primary ring-1 ring-primary/30 scale-105'
                        : 'border-border opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url || ''}
                      alt={img.nome_arquivo || ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Anexo Card ─── */
const AnexoCard: React.FC<{
  anexo: OportunidadeAnexo;
  onTogglePublico: (pub: boolean) => void;
  onDelete: () => void;
  onPreview: () => void;
}> = ({ anexo, onTogglePublico, onDelete, onPreview }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const imgPreview = isImage(anexo.nome_arquivo);
  const icon = getFileIcon(anexo.nome_arquivo);

  return (
    <div className="group relative rounded-lg border border-border overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors">
      {/* Thumbnail / Icon */}
      <div
        className={`aspect-square flex items-center justify-center relative overflow-hidden ${imgPreview ? 'cursor-pointer' : ''}`}
        onClick={imgPreview ? onPreview : undefined}
      >
        {imgPreview && anexo.url ? (
          <img
            src={anexo.url}
            alt={anexo.nome_arquivo || ''}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            {icon}
            <span className="text-[10px] text-muted-foreground truncate max-w-[80%] px-1">
              {anexo.nome_arquivo}
            </span>
          </div>
        )}
        {/* Hover overlay - only for images */}
        {imgPreview && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 py-1.5 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Switch
            checked={anexo.publico ?? false}
            onCheckedChange={onTogglePublico}
            className="scale-75 origin-left"
          />
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {anexo.publico ? 'Público' : 'Privado'}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {!imgPreview && anexo.url && (
            <a
              href={anexo.url}
              download={anexo.nome_arquivo || true}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary p-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anexo?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDelete}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnexoGallery;

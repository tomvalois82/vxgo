import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Download, ZoomIn, ZoomOut, RotateCcw, Car,
  Check, ChevronLeft, ChevronRight, X, PackageOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import JSZip from 'jszip';

// ── Types ──────────────────────────────────────────────────────────────────────
type CanvasSize = {
  label: string;
  subtitle: string;
  width: number;
  height: number;
  ratio: string;
  icon: string;
};

type PageState = {
  id: string;
  photoUrl: string;
  imgScale: number;
  imgPos: { x: number; y: number };
  photoImg: HTMLImageElement | null;
};

type StockVehicle = {
  id: number;
  fabricante: string | null;
  modelo: string | null;
  ano: string | null;
  fotos: string[] | null;
  foto: string | null;
  valor: string | null;
};

// ── Constants ──────────────────────────────────────────────────────────────────
const CANVAS_SIZES: CanvasSize[] = [
  { label: 'Feed Retrato', subtitle: 'Posts no Feed', width: 1080, height: 1440, ratio: '3:4', icon: '📸' },
  { label: 'Feed Quadrado', subtitle: 'Posts no Feed', width: 1080, height: 1080, ratio: '1:1', icon: '⬛' },
  { label: 'Reels e Stories', subtitle: 'Stories / Reels', width: 1080, height: 1920, ratio: '9:16', icon: '📱' },
];

const STEPS = ['Tamanho', 'Moldura', 'Fotos', 'Editor'];

const PREVIEW_MAX_W = 380;
const PREVIEW_MAX_H = 520;

function getPreviewDimensions(width: number, height: number) {
  const scaleW = PREVIEW_MAX_W / width;
  const scaleH = PREVIEW_MAX_H / height;
  const scale = Math.min(scaleW, scaleH, 1);
  return { w: Math.round(width * scale), h: Math.round(height * scale), scale };
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ── Page Canvas Component ──────────────────────────────────────────────────────
type PageCanvasProps = {
  page: PageState;
  size: CanvasSize;
  frameImg: HTMLImageElement | null;
  onChange: (updated: Partial<PageState>) => void;
  onRemove: () => void;
  index: number;
  total: number;
};

const PageCanvas: React.FC<PageCanvasProps> = ({ page, size, frameImg, onChange, onRemove, index, total }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, imgX: 0, imgY: 0 });

  const { w, h, scale } = getPreviewDimensions(size.width, size.height);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    if (page.photoImg) {
      const img = page.photoImg;
      ctx.drawImage(
        img,
        page.imgPos.x * scale,
        page.imgPos.y * scale,
        img.naturalWidth * page.imgScale * scale,
        img.naturalHeight * page.imgScale * scale,
      );
    }

    if (frameImg) {
      ctx.drawImage(frameImg, 0, 0, w, h);
    }
  }, [page.photoImg, page.imgPos, page.imgScale, frameImg, w, h, scale]);

  useEffect(() => { draw(); }, [draw]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    dragRef.current = {
      isDragging: true,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      imgX: page.imgPos.x,
      imgY: page.imgPos.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - rect.left - dragRef.current.startX) / scale;
    const dy = (e.clientY - rect.top - dragRef.current.startY) / scale;
    onChange({ imgPos: { x: dragRef.current.imgX + dx, y: dragRef.current.imgY + dy } });
  };

  const onPointerUp = () => { dragRef.current.isDragging = false; };

  const centerPhoto = () => {
    if (!page.photoImg) return;
    const img = page.photoImg;
    const s = Math.max(size.width / img.naturalWidth, size.height / img.naturalHeight);
    onChange({
      imgScale: s,
      imgPos: { x: (size.width - img.naturalWidth * s) / 2, y: (size.height - img.naturalHeight * s) / 2 },
    });
  };

  const downloadPage = (format: 'png' | 'jpg') => {
    if (!page.photoImg) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = size.width;
    offscreen.height = size.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, size.width, size.height);
    const img = page.photoImg;
    ctx.drawImage(img, page.imgPos.x, page.imgPos.y, img.naturalWidth * page.imgScale, img.naturalHeight * page.imgScale);
    if (frameImg) ctx.drawImage(frameImg, 0, 0, size.width, size.height);
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = offscreen.toDataURL(mimeType, 0.92);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `pagina_${index + 1}_${size.label.replace(/\s/g, '_')}.${format}`;
    a.click();
  };

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <span className="text-sm font-semibold text-foreground">
          Página {index + 1}
          {total > 1 && <span className="text-muted-foreground font-normal"> de {total}</span>}
        </span>
        {total > 1 && (
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
            title="Remover página"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col items-center gap-3 p-4">
          <div className="relative select-none">
            <canvas
              ref={canvasRef}
              style={{ width: w, height: h, cursor: 'grab', borderRadius: 8, border: '1px solid hsl(var(--border))', display: 'block' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
          </div>
          <p className="text-xs text-muted-foreground">Arraste para reposicionar • Moldura na frente</p>
        </div>

        {/* Controls sidebar */}
        <div className="flex flex-col gap-4 p-4 lg:w-52 border-t lg:border-t-0 lg:border-l border-border">
          {/* Zoom */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Zoom</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8"
                onClick={() => onChange({ imgScale: Math.max(0.05, page.imgScale - 0.05) })}>
                <ZoomOut size={13} />
              </Button>
              <span className="text-sm text-foreground flex-1 text-center tabular-nums">
                {Math.round(page.imgScale * 100)}%
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8"
                onClick={() => onChange({ imgScale: Math.min(8, page.imgScale + 0.05) })}>
                <ZoomIn size={13} />
              </Button>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={centerPhoto} className="gap-2 text-xs">
            <RotateCcw size={12} />
            Centralizar
          </Button>

          {/* Download individual */}
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Baixar</p>
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={() => downloadPage('png')} className="gap-2 text-xs">
                <Download size={12} />
                PNG
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadPage('jpg')} className="gap-2 text-xs">
                <Download size={12} />
                JPG
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to render a page to blob for ZIP
async function renderPageToBlob(
  page: PageState,
  size: CanvasSize,
  frameImg: HTMLImageElement | null,
  format: 'png' | 'jpg'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const offscreen = document.createElement('canvas');
    offscreen.width = size.width;
    offscreen.height = size.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return reject(new Error('no ctx'));
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, size.width, size.height);
    if (page.photoImg) {
      const img = page.photoImg;
      ctx.drawImage(img, page.imgPos.x, page.imgPos.y, img.naturalWidth * page.imgScale, img.naturalHeight * page.imgScale);
    }
    if (frameImg) ctx.drawImage(frameImg, 0, 0, size.width, size.height);
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    offscreen.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('toBlob failed'));
    }, mimeType, 0.92);
  });
}

// ── Main Component ─────────────────────────────────────────────────────────────
const Canva: React.FC = () => {
  const { profile } = useAuth();

  const [step, setStep] = useState(0);
  const [selectedSize, setSelectedSize] = useState<CanvasSize | null>(null);

  // Frame
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [frameFile, setFrameFile] = useState<File | null>(null);
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);

  // Pages (multiple photos)
  const [pages, setPages] = useState<PageState[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Stock
  const [stockVehicles, setStockVehicles] = useState<StockVehicle[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [showStock, setShowStock] = useState(false);

  // Zip download state
  const [downloadingZip, setDownloadingZip] = useState(false);

  // ── Stock fetch ─────────────────────────────────────────────────────────────
  const fetchStockVehicles = useCallback(async () => {
    if (!profile?.tbEstoque) return;
    setLoadingStock(true);
    try {
      const { data, error } = await (supabase as any)
        .from(profile.tbEstoque)
        .select('id, fabricante, modelo, ano, fotos, foto, valor')
        .limit(60);
      if (error) throw error;
      setStockVehicles(data || []);
    } catch {
      toast({ title: 'Erro ao carregar estoque', variant: 'destructive' });
    } finally {
      setLoadingStock(false);
    }
  }, [profile?.tbEstoque]);

  useEffect(() => {
    if (step === 2 && showStock) fetchStockVehicles();
  }, [step, showStock, fetchStockVehicles]);

  // ── Load frame ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!frameUrl) { setFrameImg(null); return; }
    loadImage(frameUrl).then(setFrameImg).catch(() => setFrameImg(null));
  }, [frameUrl]);

  // ── Add photo URLs to pages ─────────────────────────────────────────────────
  const addPhotoUrls = useCallback(async (urls: string[]) => {
    const newPages: PageState[] = [];
    for (const url of urls) {
      try {
        const img = await loadImage(url);
        const s = selectedSize
          ? Math.max(selectedSize.width / img.naturalWidth, selectedSize.height / img.naturalHeight)
          : 1;
        newPages.push({
          id: uid(),
          photoUrl: url,
          photoImg: img,
          imgScale: s,
          imgPos: selectedSize
            ? { x: (selectedSize.width - img.naturalWidth * s) / 2, y: (selectedSize.height - img.naturalHeight * s) / 2 }
            : { x: 0, y: 0 },
        });
      } catch {
        toast({ title: `Erro ao carregar imagem`, variant: 'destructive' });
      }
    }
    setPages(prev => [...prev, ...newPages]);
  }, [selectedSize]);

  // ── Photo upload (multiple) ─────────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    await addPhotoUrls(urls);
    setShowStock(false);
    // Reset input so same files can be re-selected
    e.target.value = '';
  };

  const handleSelectStockPhoto = async (url: string) => {
    await addPhotoUrls([url]);
  };

  // ── Page updates ─────────────────────────────────────────────────────────────
  const updatePage = (id: string, updates: Partial<PageState>) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };

  // ── Frame upload ────────────────────────────────────────────────────────────
  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrameFile(file);
    setFrameUrl(URL.createObjectURL(file));
  };

  // ── Download ZIP ─────────────────────────────────────────────────────────────
  const downloadAllZip = async (format: 'png' | 'jpg') => {
    if (!selectedSize || pages.length === 0) return;
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('criativos') ?? zip;
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const blob = await renderPageToBlob(page, selectedSize, frameImg, format);
        folder.file(`pagina_${i + 1}_${selectedSize.label.replace(/\s/g, '_')}.${format}`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `criativos_${selectedSize.label.replace(/\s/g, '_')}.zip`;
      a.click();
    } catch (err) {
      toast({ title: 'Erro ao gerar ZIP', variant: 'destructive' });
    } finally {
      setDownloadingZip(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const canAdvance = () => {
    if (step === 0) return !!selectedSize;
    if (step === 1) return !!frameUrl;
    if (step === 2) return pages.length > 0;
    return true;
  };

  const previewDims = selectedSize ? getPreviewDimensions(selectedSize.width, selectedSize.height) : null;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Canva de Criativos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Crie artes para Instagram com moldura personalizada
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-colors',
                i === step ? 'bg-primary text-primary-foreground'
                  : i < step ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                  : 'bg-muted text-muted-foreground cursor-default'
              )}
            >
              {i < step && <Check size={12} />}
              {s}
            </button>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 0: Tamanho ── */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Escolha o tamanho</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CANVAS_SIZES.map((size) => (
              <button
                key={size.label}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  'p-5 rounded-xl border-2 text-left transition-all hover:border-primary/60',
                  selectedSize?.label === size.label ? 'border-primary bg-primary/10' : 'border-border bg-card'
                )}
              >
                <div className="text-3xl mb-2">{size.icon}</div>
                <div className="font-semibold text-foreground">{size.label}</div>
                <div className="text-xs text-muted-foreground">{size.subtitle}</div>
                <div className="mt-2 text-xs font-mono text-primary">{size.width} × {size.height} · {size.ratio}</div>
                <div className="mt-3 flex justify-center">
                  <div
                    className={cn('border-2 rounded-sm', selectedSize?.label === size.label ? 'border-primary' : 'border-muted-foreground/40')}
                    style={{ width: size.ratio === '9:16' ? 24 : size.ratio === '1:1' ? 40 : 30, height: size.ratio === '9:16' ? 42 : size.ratio === '1:1' ? 40 : 40 }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Moldura ── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Escolha a Moldura</h2>
          <p className="text-sm text-muted-foreground">
            Faça upload de um arquivo PNG com transparência. A moldura será usada em todas as páginas.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <button
              onClick={() => frameInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-3 w-full sm:w-56 h-44 border-2 border-dashed rounded-xl transition-colors',
                frameUrl ? 'border-primary/60 bg-primary/5' : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
              )}
            >
              {frameUrl ? (
                <>
                  <img src={frameUrl} alt="Moldura" className="max-h-28 max-w-full object-contain"
                    style={{ background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px' }} />
                  <span className="text-xs text-primary font-medium">{frameFile?.name || 'Moldura carregada'}</span>
                </>
              ) : (
                <>
                  <Upload size={28} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para enviar moldura</span>
                  <span className="text-xs text-muted-foreground">PNG com transparência</span>
                </>
              )}
            </button>
            <input ref={frameInputRef} type="file" accept="image/png,image/webp" className="hidden" onChange={handleFrameUpload} />

            {frameUrl && previewDims && (
              <div className="space-y-2">
                <p className="text-sm text-foreground font-medium">Pré-visualização</p>
                <div
                  className="relative rounded-lg overflow-hidden border border-border"
                  style={{
                    width: Math.min(previewDims.w, 160),
                    height: Math.min(previewDims.h, 160),
                    background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px',
                  }}
                >
                  <img src={frameUrl} alt="Preview moldura" className="absolute inset-0 w-full h-full object-contain" />
                </div>
                <button onClick={() => { setFrameUrl(null); setFrameFile(null); setFrameImg(null); }} className="text-xs text-destructive hover:underline">
                  Remover
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Fotos ── */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Escolha as Fotos</h2>
          <p className="text-sm text-muted-foreground">
            Adicione uma ou mais fotos. Cada foto será uma <strong>Página</strong> no editor.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => photoInputRef.current?.click()}>
              <Upload size={16} className="mr-2" />
              Enviar Fotos
            </Button>
            <Button variant="outline" onClick={() => { setShowStock(!showStock); if (!showStock) fetchStockVehicles(); }}>
              <Car size={16} className="mr-2" />
              Escolher do Estoque
            </Button>
          </div>

          <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />

          {/* Selected photos preview */}
          {pages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{pages.length} foto{pages.length > 1 ? 's' : ''} selecionada{pages.length > 1 ? 's' : ''}</p>
              <div className="flex flex-wrap gap-3">
                {pages.map((page, i) => (
                  <div key={page.id} className="relative group">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary">
                      <img src={page.photoUrl} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
                      P{i + 1}
                    </span>
                    <button
                      onClick={() => removePage(page.id)}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock grid */}
          {showStock && (
            <div className="space-y-3">
              {loadingStock ? (
                <p className="text-sm text-muted-foreground">Carregando estoque...</p>
              ) : stockVehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum veículo encontrado no estoque.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-h-80 overflow-y-auto pr-1">
                  {stockVehicles.map((v) => {
                    const photos = v.fotos?.length ? v.fotos : v.foto ? [v.foto] : [];
                    if (!photos.length) return null;
                    return photos.map((url, pi) => {
                      const alreadyAdded = pages.some(p => p.photoUrl === url);
                      return (
                        <button
                          key={`${v.id}-${pi}`}
                          onClick={() => !alreadyAdded && handleSelectStockPhoto(url)}
                          className={cn(
                            'relative rounded-lg overflow-hidden border-2 transition-all',
                            alreadyAdded ? 'border-primary opacity-60 cursor-default' : 'border-border hover:border-primary'
                          )}
                        >
                          <img src={url} alt={`${v.fabricante} ${v.modelo}`} className="w-full h-24 object-cover" />
                          {pi === 0 && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5">
                              <p className="text-white text-[10px] truncate">{v.fabricante} {v.modelo}</p>
                            </div>
                          )}
                          {alreadyAdded && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check size={18} className="text-primary" />
                            </div>
                          )}
                        </button>
                      );
                    });
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Editor ── */}
      {step === 3 && selectedSize && (
        <div className="space-y-4">
          {/* Download all toolbar */}
          {pages.length > 1 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
              <PackageOpen size={18} className="text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Baixar todas as páginas</p>
                <p className="text-xs text-muted-foreground">{pages.length} imagens compactadas em .zip</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" loading={downloadingZip} onClick={() => downloadAllZip('png')} className="gap-2">
                  <Download size={12} />
                  ZIP PNG
                </Button>
                <Button size="sm" variant="outline" loading={downloadingZip} onClick={() => downloadAllZip('jpg')} className="gap-2">
                  <Download size={12} />
                  ZIP JPG
                </Button>
              </div>
            </div>
          )}

          {/* Pages list */}
          <div className="space-y-6">
            {pages.map((page, i) => (
              <PageCanvas
                key={page.id}
                page={page}
                size={selectedSize}
                frameImg={frameImg}
                onChange={(updates) => updatePage(page.id, updates)}
                onRemove={() => removePage(page.id)}
                index={i}
                total={pages.length}
              />
            ))}
          </div>

          {pages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <PackageOpen size={32} />
              <p className="text-sm">Nenhuma página. Volte e adicione fotos.</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2 border-t border-border">
        <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="gap-2">
          <ChevronLeft size={16} />
          Voltar
        </Button>
        {step < STEPS.length - 1 && (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} className="gap-2">
            Avançar
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Canva;

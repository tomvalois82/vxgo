import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Image as ImageIcon, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, RotateCcw, Car, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

// ── Types ──────────────────────────────────────────────────────────────────────
type CanvasSize = {
  label: string;
  subtitle: string;
  width: number;
  height: number;
  ratio: string;
  icon: string;
};

type DragState = {
  isDragging: boolean;
  startX: number;
  startY: number;
  imgX: number;
  imgY: number;
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
  {
    label: 'Feed Retrato',
    subtitle: 'Posts no Feed',
    width: 1080,
    height: 1440,
    ratio: '3:4',
    icon: '📸',
  },
  {
    label: 'Feed Quadrado',
    subtitle: 'Posts no Feed',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    icon: '⬛',
  },
  {
    label: 'Reels e Stories',
    subtitle: 'Stories / Reels',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    icon: '📱',
  },
];

const PREVIEW_MAX_W = 420;
const PREVIEW_MAX_H = 560;

function getPreviewDimensions(width: number, height: number) {
  const scaleW = PREVIEW_MAX_W / width;
  const scaleH = PREVIEW_MAX_H / height;
  const scale = Math.min(scaleW, scaleH, 1);
  return { w: Math.round(width * scale), h: Math.round(height * scale), scale };
}

// ── Steps ──────────────────────────────────────────────────────────────────────
const STEPS = ['Tamanho', 'Moldura', 'Foto', 'Editor'];

// ── Main Component ─────────────────────────────────────────────────────────────
const Canva: React.FC = () => {
  const { profile } = useAuth();

  // Step
  const [step, setStep] = useState(0);

  // Step 1 – size
  const [selectedSize, setSelectedSize] = useState<CanvasSize | null>(null);

  // Step 2 – frame (moldura)
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [frameFile, setFrameFile] = useState<File | null>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);

  // Step 3 – photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [stockVehicles, setStockVehicles] = useState<StockVehicle[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [showStock, setShowStock] = useState(false);

  // Step 4 – editor canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [imgScale, setImgScale] = useState(1);
  const dragRef = useRef<DragState>({ isDragging: false, startX: 0, startY: 0, imgX: 0, imgY: 0 });
  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const photoImgRef = useRef<HTMLImageElement | null>(null);

  // ── Stock vehicles ────────────────────────────────────────────────────────────
  const fetchStockVehicles = useCallback(async () => {
    if (!profile?.tbEstoque) return;
    setLoadingStock(true);
    try {
      const { data, error } = await (supabase as any)
        .from(profile.tbEstoque)
        .select('id, fabricante, modelo, ano, fotos, foto, valor')
        .limit(50);
      if (error) throw error;
      setStockVehicles(data || []);
    } catch (e) {
      toast({ title: 'Erro ao carregar estoque', variant: 'destructive' });
    } finally {
      setLoadingStock(false);
    }
  }, [profile?.tbEstoque]);

  useEffect(() => {
    if (step === 2 && showStock) fetchStockVehicles();
  }, [step, showStock, fetchStockVehicles]);

  // ── Image loader helper ───────────────────────────────────────────────────────
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  // ── Draw canvas ───────────────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const size = selectedSize;
    if (!canvas || !size) return;
    const { w, h, scale } = getPreviewDimensions(size.width, size.height);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    // Draw photo behind frame
    if (photoImgRef.current) {
      const img = photoImgRef.current;
      const baseW = img.naturalWidth * imgScale * scale;
      const baseH = img.naturalHeight * imgScale * scale;
      ctx.drawImage(img, imgPos.x * scale, imgPos.y * scale, baseW, baseH);
    }

    // Draw frame on top
    if (frameImgRef.current) {
      ctx.drawImage(frameImgRef.current, 0, 0, w, h);
    }
  }, [imgPos, imgScale, selectedSize]);

  useEffect(() => {
    if (step === 3) drawCanvas();
  }, [step, drawCanvas]);

  // ── Load frame image ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!frameUrl) { frameImgRef.current = null; return; }
    loadImage(frameUrl)
      .then(img => { frameImgRef.current = img; drawCanvas(); })
      .catch(() => { frameImgRef.current = null; });
  }, [frameUrl]);

  // ── Load photo image ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!photoUrl) { photoImgRef.current = null; return; }
    loadImage(photoUrl)
      .then(img => {
        photoImgRef.current = img;
        // Center the photo initially
        if (selectedSize) {
          const scaleToFit = Math.max(
            selectedSize.width / img.naturalWidth,
            selectedSize.height / img.naturalHeight
          );
          setImgScale(scaleToFit);
          setImgPos({
            x: (selectedSize.width - img.naturalWidth * scaleToFit) / 2,
            y: (selectedSize.height - img.naturalHeight * scaleToFit) / 2,
          });
        }
        drawCanvas();
      })
      .catch(() => { photoImgRef.current = null; });
  }, [photoUrl]);

  // ── Pointer events for drag ───────────────────────────────────────────────────
  const getCanvasScale = () => {
    if (!selectedSize) return 1;
    return getPreviewDimensions(selectedSize.width, selectedSize.height).scale;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    dragRef.current = {
      isDragging: true,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      imgX: imgPos.x,
      imgY: imgPos.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    const cScale = getCanvasScale();
    const dx = (curX - dragRef.current.startX) / cScale;
    const dy = (curY - dragRef.current.startY) / cScale;
    setImgPos({ x: dragRef.current.imgX + dx, y: dragRef.current.imgY + dy });
  };

  const onPointerUp = () => { dragRef.current.isDragging = false; };

  // ── Frame upload ──────────────────────────────────────────────────────────────
  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrameFile(file);
    const url = URL.createObjectURL(file);
    setFrameUrl(url);
  };

  // ── Photo upload ──────────────────────────────────────────────────────────────
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setShowStock(false);
  };

  const handleSelectStockPhoto = (url: string) => {
    setPhotoUrl(url);
    setShowStock(false);
  };

  // ── Download ──────────────────────────────────────────────────────────────────
  const download = async (format: 'png' | 'jpg') => {
    if (!selectedSize || !photoImgRef.current) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = selectedSize.width;
    offscreen.height = selectedSize.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, selectedSize.width, selectedSize.height);

    // Photo
    const img = photoImgRef.current;
    ctx.drawImage(
      img,
      imgPos.x,
      imgPos.y,
      img.naturalWidth * imgScale,
      img.naturalHeight * imgScale
    );

    // Frame
    if (frameImgRef.current) {
      ctx.drawImage(frameImgRef.current, 0, 0, selectedSize.width, selectedSize.height);
    }

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpg' ? 0.92 : undefined;
    const dataUrl = offscreen.toDataURL(mimeType, quality);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `criativo_${selectedSize.label.replace(/\s/g, '_')}.${format}`;
    a.click();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const canAdvance = () => {
    if (step === 0) return !!selectedSize;
    if (step === 1) return !!frameUrl;
    if (step === 2) return !!photoUrl;
    return true;
  };

  const resetEditor = () => {
    if (photoImgRef.current && selectedSize) {
      const img = photoImgRef.current;
      const scaleToFit = Math.max(
        selectedSize.width / img.naturalWidth,
        selectedSize.height / img.naturalHeight
      );
      setImgScale(scaleToFit);
      setImgPos({
        x: (selectedSize.width - img.naturalWidth * scaleToFit) / 2,
        y: (selectedSize.height - img.naturalHeight * scaleToFit) / 2,
      });
    }
  };

  // ── Render Steps ──────────────────────────────────────────────────────────────
  const previewDims = selectedSize
    ? getPreviewDimensions(selectedSize.width, selectedSize.height)
    : null;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Canva de Criativos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Crie artes para Instagram com moldura personalizada
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-colors',
                i === step
                  ? 'bg-primary text-primary-foreground'
                  : i < step
                  ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                  : 'bg-muted text-muted-foreground cursor-default'
              )}
            >
              {i < step && <Check size={12} />}
              {s}
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
            )}
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
                  selectedSize?.label === size.label
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                )}
              >
                <div className="text-3xl mb-2">{size.icon}</div>
                <div className="font-semibold text-foreground">{size.label}</div>
                <div className="text-xs text-muted-foreground">{size.subtitle}</div>
                <div className="mt-2 text-xs font-mono text-primary">
                  {size.width} × {size.height} · {size.ratio}
                </div>
                {/* Mini aspect ratio preview */}
                <div className="mt-3 flex justify-center">
                  <div
                    className={cn(
                      'border-2 rounded-sm',
                      selectedSize?.label === size.label ? 'border-primary' : 'border-muted-foreground/40'
                    )}
                    style={{
                      width: size.ratio === '9:16' ? 24 : size.ratio === '1:1' ? 40 : 30,
                      height: size.ratio === '9:16' ? 42 : size.ratio === '1:1' ? 40 : 40,
                    }}
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
            Faça upload de um arquivo PNG com transparência. A moldura será exibida na frente da foto.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Upload area */}
            <button
              onClick={() => frameInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-3 w-full sm:w-56 h-44 border-2 border-dashed rounded-xl transition-colors',
                frameUrl
                  ? 'border-primary/60 bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
              )}
            >
              {frameUrl ? (
                <>
                  <img
                    src={frameUrl}
                    alt="Moldura"
                    className="max-h-28 max-w-full object-contain"
                    style={{ background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px' }}
                  />
                  <span className="text-xs text-primary font-medium">
                    {frameFile?.name || 'Moldura carregada'}
                  </span>
                </>
              ) : (
                <>
                  <Upload size={28} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para enviar moldura</span>
                  <span className="text-xs text-muted-foreground">PNG com transparência</span>
                </>
              )}
            </button>
            <input
              ref={frameInputRef}
              type="file"
              accept="image/png,image/webp"
              className="hidden"
              onChange={handleFrameUpload}
            />
            {frameUrl && (
              <div className="space-y-2">
                <p className="text-sm text-foreground font-medium">Pré-visualização</p>
                <div
                  className="relative rounded-lg overflow-hidden border border-border"
                  style={{
                    width: previewDims ? Math.min(previewDims.w, 160) : 160,
                    height: previewDims ? Math.min(previewDims.h, 160) : 160,
                    background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px',
                  }}
                >
                  <img
                    src={frameUrl}
                    alt="Preview moldura"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={() => { setFrameUrl(null); setFrameFile(null); }}
                  className="text-xs text-destructive hover:underline"
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Foto ── */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Escolha a Foto</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => photoInputRef.current?.click()}>
              <Upload size={16} className="mr-2" />
              Enviar Foto
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowStock(!showStock); if (!showStock) fetchStockVehicles(); }}
            >
              <Car size={16} className="mr-2" />
              Escolher do Estoque
            </Button>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          {photoUrl && !showStock && (
            <div className="flex items-start gap-4">
              <div className="relative rounded-lg overflow-hidden border border-border w-32 h-32">
                <img src={photoUrl} alt="Foto selecionada" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Foto selecionada</p>
                <button
                  onClick={() => setPhotoUrl(null)}
                  className="text-xs text-destructive hover:underline"
                >
                  Remover
                </button>
              </div>
            </div>
          )}
          {showStock && (
            <div className="space-y-3">
              {loadingStock ? (
                <p className="text-sm text-muted-foreground">Carregando estoque...</p>
              ) : stockVehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum veículo encontrado no estoque.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                  {stockVehicles.map((v) => {
                    const photos = v.fotos?.length ? v.fotos : v.foto ? [v.foto] : [];
                    if (!photos.length) return null;
                    return photos.map((url, pi) => (
                      <button
                        key={`${v.id}-${pi}`}
                        onClick={() => handleSelectStockPhoto(url)}
                        className={cn(
                          'relative rounded-lg overflow-hidden border-2 transition-all hover:border-primary',
                          photoUrl === url ? 'border-primary' : 'border-border'
                        )}
                      >
                        <img
                          src={url}
                          alt={`${v.fabricante} ${v.modelo}`}
                          className="w-full h-24 object-cover"
                        />
                        {pi === 0 && (
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5">
                            <p className="text-white text-[10px] truncate">
                              {v.fabricante} {v.modelo}
                            </p>
                          </div>
                        )}
                        {photoUrl === url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check size={20} className="text-primary" />
                          </div>
                        )}
                      </button>
                    ));
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
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Canvas */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <div className="relative select-none">
                <canvas
                  ref={canvasRef}
                  style={{
                    width: previewDims?.w,
                    height: previewDims?.h,
                    cursor: 'grab',
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    display: 'block',
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Arraste para reposicionar a foto • Moldura sempre na frente
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 lg:w-56">
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Zoom da Foto</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImgScale(s => Math.max(0.1, s - 0.1))}
                  >
                    <ZoomOut size={14} />
                  </Button>
                  <span className="text-sm text-foreground flex-1 text-center">
                    {Math.round(imgScale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImgScale(s => Math.min(5, s + 0.1))}
                  >
                    <ZoomIn size={14} />
                  </Button>
                </div>
              </div>
              <Button variant="outline" onClick={resetEditor} className="gap-2">
                <RotateCcw size={14} />
                Centralizar
              </Button>
              <div className="border-t border-border pt-3">
                <p className="text-sm font-semibold text-foreground mb-2">Baixar</p>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => download('png')} className="gap-2">
                    <Download size={14} />
                    Baixar PNG
                  </Button>
                  <Button variant="outline" onClick={() => download('jpg')} className="gap-2">
                    <Download size={14} />
                    Baixar JPG
                  </Button>
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-1">
                <p className="text-xs text-muted-foreground">Tamanho final</p>
                <p className="text-xs font-mono text-foreground">
                  {selectedSize.width} × {selectedSize.height} px
                </p>
                <p className="text-xs text-muted-foreground">{selectedSize.label}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2 border-t border-border">
        <Button
          variant="outline"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="gap-2"
        >
          <ChevronLeft size={16} />
          Voltar
        </Button>
        {step < STEPS.length - 1 && (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance()}
            className="gap-2"
          >
            Avançar
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Canva;

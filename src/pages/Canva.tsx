import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Download, Car,
  Check, ChevronLeft, ChevronRight, X, PackageOpen,
  Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Plus, Trash2,
  ChevronDown, ChevronUp, Image, Link, Unlink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import JSZip from 'jszip';

// ── Types ──────────────────────────────────────────────────────────────────────
type CanvasSize = { label: string; subtitle: string; width: number; height: number; ratio: string; icon: string };
type StrokeDash = 'solid' | 'dotted' | 'dashed' | 'dash-dot';

type TextShadow = { enabled: boolean; color: string; opacity: number; angle: number; distance: number; spread: number; size: number };
type TextGlow   = { enabled: boolean; color: string; opacity: number; spread: number; size: number };
type TextStroke = { enabled: boolean; color: string; width: number; dash: StrokeDash };

type TextLayer = {
  id: string; text: string; x: number; y: number;
  fontSize: number; fontFamily: string; color: string;
  bold: boolean; italic: boolean; underline: boolean;
  align: 'left' | 'center' | 'right';
  opacity: number;
  shadow: TextShadow; glow: TextGlow; stroke: TextStroke;
};

// Border radii per corner (canvas units)
type CornerRadius = { tl: number; tr: number; br: number; bl: number };
type ImgLayerShadow  = { enabled: boolean; color: string; opacity: number; angle: number; distance: number; spread: number; size: number };
type ImgLayerGlow    = { enabled: boolean; color: string; opacity: number; spread: number; size: number };
type ImgLayerStroke  = { enabled: boolean; color: string; width: number; dash: StrokeDash };

type ImageLayer = {
  id: string;
  url: string;
  imgEl: HTMLImageElement | null;
  x: number; y: number;
  width: number; height: number;
  rotation: number;
  opacity: number;
  radius: CornerRadius;
  linkedRadius: boolean;  // true = all corners move together
  shadow: ImgLayerShadow;
  glow: ImgLayerGlow;
  stroke: ImgLayerStroke;
};

type PageState = {
  id: string;
  photoUrl: string;
  imgScale: number;
  imgPos: { x: number; y: number };
  imgRotation: number;
  photoImg: HTMLImageElement | null;
  textLayers: TextLayer[];
  imageLayers: ImageLayer[];
};

type StockVehicle = { id: number; fabricante: string | null; modelo: string | null; ano: string | null; fotos: string[] | null; foto: string | null; valor: string | null };

type HandleType =
  | 'move'
  | 'resize-nw' | 'resize-n' | 'resize-ne'
  | 'resize-e'  | 'resize-se' | 'resize-s'
  | 'resize-sw' | 'resize-w'
  | 'rotate';

// ── Constants ──────────────────────────────────────────────────────────────────
const CANVAS_SIZES: CanvasSize[] = [
  { label: 'Feed Retrato',    subtitle: 'Posts no Feed',       width: 1080, height: 1440, ratio: '3:4',        icon: '📸' },
  { label: 'Feed Quadrado',   subtitle: 'Posts no Feed',       width: 1080, height: 1080, ratio: '1:1',        icon: '⬛' },
  { label: 'Reels e Stories', subtitle: 'Stories / Reels',     width: 1080, height: 1920, ratio: '9:16',       icon: '📱' },
  { label: 'Classificados',   subtitle: 'Classificados / Site', width: 864,  height: 648,  ratio: '4:3',        icon: '🖼️' },
];

const STEPS = ['Tamanho', 'Moldura', 'Fotos', 'Editor'];

const PREVIEW_MAX_W = 380;
const PREVIEW_MAX_H = 520;

const H = 10; // handle size

const FONT_FAMILIES = [
  'Arial', 'Georgia', 'Times New Roman', 'Verdana', 'Trebuchet MS',
  'Impact', 'Courier New', 'Comic Sans MS', 'Palatino', 'Tahoma',
];

const STROKE_DASHES: { value: StrokeDash; label: string }[] = [
  { value: 'solid',    label: 'Contínuo'    },
  { value: 'dotted',   label: 'Pontilhado'  },
  { value: 'dashed',   label: 'Traço'       },
  { value: 'dash-dot', label: 'Traço-Ponto' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function getPreviewDimensions(width: number, height: number) {
  const scaleW = PREVIEW_MAX_W / width;
  const scaleH = PREVIEW_MAX_H / height;
  const scale = Math.min(scaleW, scaleH, 1);
  return { w: Math.round(width * scale), h: Math.round(height * scale), scale };
}

function uid() { return Math.random().toString(36).slice(2); }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function degToRad(deg: number) { return (deg * Math.PI) / 180; }

function getRotatedCorners(cx: number, cy: number, w: number, h: number, angleDeg: number) {
  const r = degToRad(angleDeg);
  const cos = Math.cos(r), sin = Math.sin(r);
  const hw = w / 2, hh = h / 2;
  return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([lx,ly]) => ({
    x: cx + lx! * cos - ly! * sin,
    y: cy + lx! * sin + ly! * cos,
  }));
}

function hexWithOpacity(hex: string, opacity: number): string {
  const alpha = Math.round((opacity / 100) * 255).toString(16).padStart(2, '0');
  return `${hex}${alpha}`;
}

function getDashArray(dash: StrokeDash, lineWidth: number): number[] {
  switch (dash) {
    case 'dotted':   return [lineWidth, lineWidth * 2];
    case 'dashed':   return [lineWidth * 4, lineWidth * 2];
    case 'dash-dot': return [lineWidth * 4, lineWidth * 2, lineWidth, lineWidth * 2];
    default:         return [];
  }
}

// ── Default factories ──────────────────────────────────────────────────────────
function defaultTextShadow(): TextShadow { return { enabled: false, color: '#000000', opacity: 60, angle: 45, distance: 4, spread: 2, size: 8 }; }
function defaultTextGlow():   TextGlow   { return { enabled: false, color: '#ffffff', opacity: 80, spread: 4, size: 12 }; }
function defaultTextStroke(): TextStroke { return { enabled: false, color: '#000000', width: 2, dash: 'solid' }; }

function defaultImgLayerShadow(): ImgLayerShadow { return { enabled: false, color: '#000000', opacity: 60, angle: 45, distance: 8, spread: 4, size: 16 }; }
function defaultImgLayerGlow():   ImgLayerGlow   { return { enabled: false, color: '#ffffff', opacity: 80, spread: 4, size: 20 }; }
function defaultImgLayerStroke(): ImgLayerStroke { return { enabled: false, color: '#ffffff', width: 4, dash: 'solid' }; }
function defaultCornerRadius():   CornerRadius   { return { tl: 0, tr: 0, br: 0, bl: 0 }; }

function defaultTextLayer(size: CanvasSize): TextLayer {
  return {
    id: uid(), text: 'Seu texto aqui',
    x: size.width / 2, y: size.height / 2,
    fontSize: Math.round(size.width * 0.06),
    fontFamily: 'Arial', color: '#ffffff',
    bold: true, italic: false, underline: false, align: 'center',
    opacity: 100,
    shadow: defaultTextShadow(), glow: defaultTextGlow(), stroke: defaultTextStroke(),
  };
}

// ── Rounded-rect path helper ───────────────────────────────────────────────────
function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: CornerRadius) {
  const { tl, tr, br, bl } = r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

// ── Draw a single image layer ──────────────────────────────────────────────────
function drawImageLayer(ctx: CanvasRenderingContext2D, layer: ImageLayer, scale: number) {
  if (!layer.imgEl) return;
  ctx.save();

  const x  = layer.x  * scale;
  const y  = layer.y  * scale;
  const w  = layer.width  * scale;
  const h  = layer.height * scale;
  const cx = x + w / 2;
  const cy = y + h / 2;

  const scaledR: CornerRadius = {
    tl: layer.radius.tl * scale,
    tr: layer.radius.tr * scale,
    br: layer.radius.br * scale,
    bl: layer.radius.bl * scale,
  };

  ctx.translate(cx, cy);
  ctx.rotate(degToRad(layer.rotation));
  ctx.globalAlpha = layer.opacity / 100;

  // Glow
  if (layer.glow?.enabled) {
    const g = layer.glow;
    ctx.save();
    ctx.globalAlpha = (g.opacity / 100) * (layer.opacity / 100);
    ctx.shadowColor = g.color;
    ctx.shadowBlur  = (g.size + g.spread) * scale;
    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    for (let i = 0; i < 3; i++) {
      roundedRectPath(ctx, -w/2, -h/2, w, h, scaledR);
      ctx.fillStyle = g.color;
      ctx.fill();
    }
    ctx.restore();
  }

  // Shadow
  if (layer.shadow?.enabled) {
    const s = layer.shadow;
    const rad = degToRad(s.angle);
    ctx.shadowColor   = hexWithOpacity(s.color, s.opacity);
    ctx.shadowBlur    = (s.size + s.spread) * scale;
    ctx.shadowOffsetX = Math.cos(rad) * s.distance * scale;
    ctx.shadowOffsetY = Math.sin(rad) * s.distance * scale;
  }

  // Clip to rounded rect
  roundedRectPath(ctx, -w/2, -h/2, w, h, scaledR);
  ctx.clip();

  // Draw image
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  ctx.drawImage(layer.imgEl, -w/2, -h/2, w, h);

  ctx.restore();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(degToRad(layer.rotation));
  ctx.globalAlpha = layer.opacity / 100;

  // Stroke (drawn after, no clip)
  if (layer.stroke?.enabled) {
    const st = layer.stroke;
    ctx.strokeStyle = st.color;
    ctx.lineWidth   = st.width * scale;
    ctx.setLineDash(getDashArray(st.dash, st.width * scale));
    roundedRectPath(ctx, -w/2, -h/2, w, h, scaledR);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// ── Draw text layers ───────────────────────────────────────────────────────────
function drawTextLayers(ctx: CanvasRenderingContext2D, layers: TextLayer[], scale: number) {
  for (const layer of layers) {
    ctx.save();
    const fontSize = layer.fontSize * scale;
    const parts: string[] = [];
    if (layer.italic) parts.push('italic');
    if (layer.bold)   parts.push('bold');
    parts.push(`${fontSize}px`);
    parts.push(`\"${layer.fontFamily}\", sans-serif`);
    ctx.font = parts.join(' ');
    ctx.textAlign    = layer.align;
    ctx.textBaseline = 'middle';
    ctx.globalAlpha  = (layer.opacity ?? 100) / 100;
    const x = layer.x * scale;
    const y = layer.y * scale;

    if (layer.glow?.enabled) {
      const g = layer.glow;
      ctx.save();
      ctx.globalAlpha  = (g.opacity / 100) * (layer.opacity / 100);
      ctx.shadowColor  = g.color;
      ctx.shadowBlur   = (g.size + g.spread) * scale;
      ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
      for (let i = 0; i < 3; i++) { ctx.fillStyle = g.color; ctx.fillText(layer.text, x, y); }
      ctx.restore();
    }

    if (layer.shadow?.enabled) {
      const s   = layer.shadow;
      const rad = degToRad(s.angle);
      ctx.shadowColor   = hexWithOpacity(s.color, s.opacity);
      ctx.shadowBlur    = (s.size + s.spread) * scale;
      ctx.shadowOffsetX = Math.cos(rad) * s.distance * scale;
      ctx.shadowOffsetY = Math.sin(rad) * s.distance * scale;
    } else {
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    }

    ctx.fillStyle = layer.color;
    ctx.fillText(layer.text, x, y);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

    if (layer.stroke?.enabled) {
      const st = layer.stroke;
      ctx.strokeStyle = st.color;
      ctx.lineWidth   = st.width * scale;
      ctx.setLineDash(getDashArray(st.dash, st.width * scale));
      ctx.strokeText(layer.text, x, y);
      ctx.setLineDash([]);
    }

    if (layer.underline) {
      const metrics = ctx.measureText(layer.text);
      const textW   = metrics.width;
      let startX    = x;
      if (layer.align === 'center') startX = x - textW / 2;
      else if (layer.align === 'right') startX = x - textW;
      ctx.strokeStyle = layer.color;
      ctx.lineWidth   = Math.max(1, fontSize * 0.05);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(startX, y + fontSize * 0.55);
      ctx.lineTo(startX + textW, y + fontSize * 0.55);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ── Collapsible section ────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; enabled?: boolean; onToggleEnabled?: (v: boolean) => void; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, enabled, onToggleEnabled, children, defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button type="button"
        className="flex items-center justify-between w-full px-3 py-2 bg-muted/40 hover:bg-muted/70 transition-colors"
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          {onToggleEnabled !== undefined && (
            <span onClick={e => { e.stopPropagation(); onToggleEnabled(!enabled); }}
              className={cn('w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0',
                enabled ? 'bg-primary border-primary' : 'border-border bg-background')}>
              {enabled && <Check size={10} className="text-primary-foreground" />}
            </span>
          )}
          <span className="text-xs font-semibold text-foreground">{title}</span>
        </div>
        {open ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>
      {open && <div className="p-3 space-y-3 bg-background">{children}</div>}
    </div>
  );
};

const SliderRow: React.FC<{ label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }> = ({
  label, value, min, max, step = 1, unit = '', onChange,
}) => (
  <div>
    <div className="flex justify-between items-center mb-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-primary h-1.5" />
  </div>
);

const ColorRow: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <span className="text-xs text-muted-foreground block mb-1">{label}</span>
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-8 h-7 rounded border border-border cursor-pointer bg-background p-0.5 flex-shrink-0" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} maxLength={7}
        className="flex-1 text-xs border border-border rounded px-2 py-1 bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring" />
    </div>
  </div>
);

// ── Image Layer Sidebar ────────────────────────────────────────────────────────
const ImageLayerSidebar: React.FC<{
  layer: ImageLayer;
  onChange: (updates: Partial<ImageLayer>) => void;
  onRemove: () => void;
}> = ({ layer, onChange, onRemove }) => {
  const updShadow = (u: Partial<ImgLayerShadow>) => onChange({ shadow: { ...layer.shadow, ...u } });
  const updGlow   = (u: Partial<ImgLayerGlow>)   => onChange({ glow:   { ...layer.glow,   ...u } });
  const updStroke = (u: Partial<ImgLayerStroke>)  => onChange({ stroke: { ...layer.stroke, ...u } });
  const updRadius = (u: Partial<CornerRadius>) => {
    if (layer.linkedRadius) {
      const val = Object.values(u)[0] as number;
      onChange({ radius: { tl: val, tr: val, br: val, bl: val } });
    } else {
      onChange({ radius: { ...layer.radius, ...u } });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Imagem</p>
        <button onClick={onRemove} className="text-destructive hover:text-destructive/80 transition-colors" title="Remover imagem">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Size & Rotation */}
      <Section title="Tamanho e Rotação" defaultOpen>
        <SliderRow label="Largura" value={Math.round(layer.width)} min={10} max={5000} unit="px"
          onChange={v => onChange({ width: v })} />
        <SliderRow label="Altura" value={Math.round(layer.height)} min={10} max={5000} unit="px"
          onChange={v => onChange({ height: v })} />
        <SliderRow label="Rotação" value={Math.round(layer.rotation)} min={-180} max={180} unit="°"
          onChange={v => onChange({ rotation: v })} />
        <SliderRow label="Opacidade" value={layer.opacity} min={0} max={100} unit="%"
          onChange={v => onChange({ opacity: v })} />
      </Section>

      {/* Border Radius */}
      <Section title="Arredondamento" defaultOpen>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Vincular cantos</span>
          <button
            onClick={() => onChange({ linkedRadius: !layer.linkedRadius })}
            className={cn('p-1 rounded border transition-colors',
              layer.linkedRadius ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/60')}
            title={layer.linkedRadius ? 'Desacoplar cantos' : 'Acoplar cantos'}
          >
            {layer.linkedRadius ? <Link size={12} /> : <Unlink size={12} />}
          </button>
        </div>
        {layer.linkedRadius ? (
          <SliderRow label="Todos os cantos" value={layer.radius.tl} min={0} max={500} unit="px"
            onChange={v => updRadius({ tl: v })} />
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground">↖ Superior Esq.</span>
                <input type="number" min={0} max={500} value={layer.radius.tl}
                  onChange={e => updRadius({ tl: Number(e.target.value) })}
                  className="w-full text-xs border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">↗ Superior Dir.</span>
                <input type="number" min={0} max={500} value={layer.radius.tr}
                  onChange={e => updRadius({ tr: Number(e.target.value) })}
                  className="w-full text-xs border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">↙ Inferior Esq.</span>
                <input type="number" min={0} max={500} value={layer.radius.bl}
                  onChange={e => updRadius({ bl: Number(e.target.value) })}
                  className="w-full text-xs border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">↘ Inferior Dir.</span>
                <input type="number" min={0} max={500} value={layer.radius.br}
                  onChange={e => updRadius({ br: Number(e.target.value) })}
                  className="w-full text-xs border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Stroke */}
      <Section title="Contorno"
        enabled={layer.stroke?.enabled ?? false}
        onToggleEnabled={v => updStroke({ enabled: v })}>
        <ColorRow label="Cor do contorno" value={layer.stroke?.color ?? '#ffffff'}
          onChange={v => updStroke({ color: v })} />
        <SliderRow label="Espessura" value={layer.stroke?.width ?? 4} min={1} max={60} unit="px"
          onChange={v => updStroke({ width: v })} />
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Tipo</span>
          <select value={layer.stroke?.dash ?? 'solid'}
            onChange={e => updStroke({ dash: e.target.value as StrokeDash })}
            className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background text-foreground focus:outline-none">
            {STROKE_DASHES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
      </Section>

      {/* Shadow */}
      <Section title="Sombra"
        enabled={layer.shadow?.enabled ?? false}
        onToggleEnabled={v => updShadow({ enabled: v })}>
        <ColorRow label="Cor da sombra" value={layer.shadow?.color ?? '#000000'}
          onChange={v => updShadow({ color: v })} />
        <SliderRow label="Opacidade" value={layer.shadow?.opacity ?? 60} min={0} max={100} unit="%"
          onChange={v => updShadow({ opacity: v })} />
        <SliderRow label="Ângulo" value={layer.shadow?.angle ?? 45} min={0} max={360} unit="°"
          onChange={v => updShadow({ angle: v })} />
        <SliderRow label="Distância" value={layer.shadow?.distance ?? 8} min={0} max={100} unit="px"
          onChange={v => updShadow({ distance: v })} />
        <SliderRow label="Expansão" value={layer.shadow?.spread ?? 4} min={0} max={60} unit="px"
          onChange={v => updShadow({ spread: v })} />
        <SliderRow label="Tamanho (blur)" value={layer.shadow?.size ?? 16} min={0} max={100} unit="px"
          onChange={v => updShadow({ size: v })} />
      </Section>

      {/* Glow */}
      <Section title="Brilho (Glow)"
        enabled={layer.glow?.enabled ?? false}
        onToggleEnabled={v => updGlow({ enabled: v })}>
        <ColorRow label="Cor do brilho" value={layer.glow?.color ?? '#ffffff'}
          onChange={v => updGlow({ color: v })} />
        <SliderRow label="Opacidade" value={layer.glow?.opacity ?? 80} min={0} max={100} unit="%"
          onChange={v => updGlow({ opacity: v })} />
        <SliderRow label="Expansão" value={layer.glow?.spread ?? 4} min={0} max={60} unit="px"
          onChange={v => updGlow({ spread: v })} />
        <SliderRow label="Tamanho (blur)" value={layer.glow?.size ?? 20} min={0} max={100} unit="px"
          onChange={v => updGlow({ size: v })} />
      </Section>
    </div>
  );
};

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
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgLayerInputRef = useRef<HTMLInputElement>(null);

  const [selected,        setSelected]        = useState(false);
  const [selectedTextId,  setSelectedTextId]  = useState<string | null>(null);
  const [selectedImgLayId, setSelectedImgLayId] = useState<string | null>(null);

  const { w: previewW, h: previewH, scale } = getPreviewDimensions(size.width, size.height);

  const imgW = page.photoImg ? page.photoImg.naturalWidth  * page.imgScale * scale : 0;
  const imgH = page.photoImg ? page.photoImg.naturalHeight * page.imgScale * scale : 0;
  const imgX = page.imgPos.x * scale;
  const imgY = page.imgPos.y * scale;
  const cx   = imgX + imgW / 2;
  const cy   = imgY + imgH / 2;

  const selectedText   = page.textLayers.find(l => l.id === selectedTextId) ?? null;
  const selectedImgLay = page.imageLayers.find(l => l.id === selectedImgLayId) ?? null;

  // ── Draw canvas ──────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = previewW;
    canvas.height = previewH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, previewW, previewH);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, previewW, previewH);

    // Background photo
    if (page.photoImg) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(degToRad(page.imgRotation));
      ctx.drawImage(page.photoImg, -imgW / 2, -imgH / 2, imgW, imgH);
      ctx.restore();
    }

    // Frame
    if (frameImg) ctx.drawImage(frameImg, 0, 0, previewW, previewH);

    // Image layers (above frame)
    for (const layer of page.imageLayers) {
      drawImageLayer(ctx, layer, scale);
    }

    // Text layers (topmost)
    drawTextLayers(ctx, page.textLayers, scale);
  }, [page, frameImg, previewW, previewH, cx, cy, imgW, imgH, scale]);

  useEffect(() => { draw(); }, [draw]);

  // ── BG photo interaction ─────────────────────────────────────────────────────
  const interactRef = useRef<{
    active: boolean; handle: HandleType;
    startX: number; startY: number;
    origPos: { x: number; y: number };
    origScale: number; origRot: number; origW: number; origH: number;
  } | null>(null);

  const getCursor = (handle: HandleType): string => {
    const cursors: Record<HandleType, string> = {
      'move': 'move',
      'resize-nw': 'nwse-resize', 'resize-n': 'ns-resize',   'resize-ne': 'nesw-resize',
      'resize-e':  'ew-resize',   'resize-se': 'nwse-resize', 'resize-s':  'ns-resize',
      'resize-sw': 'nesw-resize', 'resize-w':  'ew-resize',   'rotate':    'crosshair',
    };
    return cursors[handle] || 'default';
  };

  const onHandlePointerDown = (e: React.PointerEvent, handle: HandleType) => {
    e.stopPropagation(); e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelected(true); setSelectedTextId(null); setSelectedImgLayId(null);
    interactRef.current = {
      active: true, handle,
      startX: e.clientX, startY: e.clientY,
      origPos: { ...page.imgPos },
      origScale: page.imgScale, origRot: page.imgRotation, origW: imgW, origH: imgH,
    };
  };

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const ref = interactRef.current;
    if (!ref || !ref.active || !page.photoImg) return;
    const dx = e.clientX - ref.startX;
    const dy = e.clientY - ref.startY;

    if (ref.handle === 'move') {
      onChange({ imgPos: { x: ref.origPos.x + dx / scale, y: ref.origPos.y + dy / scale } });
      return;
    }
    if (ref.handle === 'rotate') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const originX = rect.left + cx;
      const originY = rect.top  + cy;
      const startAngle   = Math.atan2(ref.startY - originY, ref.startX   - originX);
      const currentAngle = Math.atan2(e.clientY  - originY, e.clientX    - originX);
      onChange({ imgRotation: ref.origRot + ((currentAngle - startAngle) * 180) / Math.PI });
      return;
    }
    const r = degToRad(ref.origRot);
    const cos = Math.cos(r), sin = Math.sin(r);
    const localDx = dx * cos + dy * sin;
    const localDy = -dx * sin + dy * cos;
    const origNatW = page.photoImg.naturalWidth;
    const origNatH = page.photoImg.naturalHeight;
    const origS = ref.origScale;
    let newScale = origS, newPosX = ref.origPos.x, newPosY = ref.origPos.y;
    const MIN_SCALE = 0.01;
    switch (ref.handle) {
      case 'resize-se': { const ds = (localDx / ref.origW + localDy / ref.origH) / 2; newScale = Math.max(MIN_SCALE, origS + ds * origS); break; }
      case 'resize-nw': { const ds = (-localDx / ref.origW + -localDy / ref.origH) / 2; newScale = Math.max(MIN_SCALE, origS + ds * origS); const dW = (newScale - origS) * origNatW * scale; const dH = (newScale - origS) * origNatH * scale; newPosX = ref.origPos.x - dW / scale; newPosY = ref.origPos.y - dH / scale; break; }
      case 'resize-ne': { const ds = (localDx / ref.origW + -localDy / ref.origH) / 2; newScale = Math.max(MIN_SCALE, origS + ds * origS); const dH = (newScale - origS) * origNatH * scale; newPosX = ref.origPos.x; newPosY = ref.origPos.y - dH / scale; break; }
      case 'resize-sw': { const ds = (-localDx / ref.origW + localDy / ref.origH) / 2; newScale = Math.max(MIN_SCALE, origS + ds * origS); const dW = (newScale - origS) * origNatW * scale; newPosX = ref.origPos.x - dW / scale; newPosY = ref.origPos.y; break; }
      case 'resize-e':  { const ds = localDx / ref.origW; newScale = Math.max(MIN_SCALE, origS + ds * origS); newPosY = ref.origPos.y + ((origS - newScale) * origNatH * scale) / (2 * scale); break; }
      case 'resize-w':  { const ds = -localDx / ref.origW; newScale = Math.max(MIN_SCALE, origS + ds * origS); const dW = (newScale - origS) * origNatW * scale; newPosX = ref.origPos.x - dW / scale; newPosY = ref.origPos.y + ((origS - newScale) * origNatH * scale) / (2 * scale); break; }
      case 'resize-s':  { const ds = localDy / ref.origH; newScale = Math.max(MIN_SCALE, origS + ds * origS); newPosX = ref.origPos.x + ((origS - newScale) * origNatW * scale) / (2 * scale); break; }
      case 'resize-n':  { const ds = -localDy / ref.origH; newScale = Math.max(MIN_SCALE, origS + ds * origS); const dH = (newScale - origS) * origNatH * scale; newPosX = ref.origPos.x + ((origS - newScale) * origNatW * scale) / (2 * scale); newPosY = ref.origPos.y - dH / scale; break; }
    }
    onChange({ imgScale: newScale, imgPos: { x: newPosX, y: newPosY } });
  }, [page, scale, cx, cy, onChange]);

  const onPointerUp = () => { if (interactRef.current) interactRef.current.active = false; };

  // ── Image Layer drag/resize/rotate ───────────────────────────────────────────
  const imgLayDragRef = useRef<{
    id: string; handle: HandleType;
    startX: number; startY: number;
    origX: number; origY: number;
    origW: number; origH: number;
    origRot: number;
  } | null>(null);

  const onImgLayHandleDown = (e: React.PointerEvent, layer: ImageLayer, handle: HandleType) => {
    e.stopPropagation(); e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedImgLayId(layer.id);
    setSelected(false); setSelectedTextId(null);
    imgLayDragRef.current = {
      id: layer.id, handle,
      startX: e.clientX, startY: e.clientY,
      origX: layer.x, origY: layer.y,
      origW: layer.width, origH: layer.height,
      origRot: layer.rotation,
    };
  };

  const onImgLayPointerMove = useCallback((e: React.PointerEvent) => {
    const ref = imgLayDragRef.current;
    if (!ref) return;
    const dx = (e.clientX - ref.startX) / scale;
    const dy = (e.clientY - ref.startY) / scale;
    const layer = page.imageLayers.find(l => l.id === ref.id);
    if (!layer) return;

    if (ref.handle === 'move') {
      updateImageLayer(ref.id, { x: ref.origX + dx, y: ref.origY + dy });
      return;
    }
    if (ref.handle === 'rotate') {
      const cx2 = (ref.origX + ref.origW / 2) * scale;
      const cy2 = (ref.origY + ref.origH / 2) * scale;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ox = rect.left + cx2, oy = rect.top + cy2;
      const sa = Math.atan2(ref.startY - oy, ref.startX - ox);
      const ca = Math.atan2(e.clientY  - oy, e.clientX  - ox);
      updateImageLayer(ref.id, { rotation: ref.origRot + (ca - sa) * 180 / Math.PI });
      return;
    }
    // Resize
    const r = degToRad(ref.origRot);
    const cos = Math.cos(r), sin = Math.sin(r);
    const ldx = dx * cos + dy * sin;
    const ldy = -dx * sin + dy * cos;
    const MIN = 10;
    switch (ref.handle) {
      case 'resize-se': updateImageLayer(ref.id, { width: Math.max(MIN, ref.origW + ldx), height: Math.max(MIN, ref.origH + ldy) }); break;
      case 'resize-nw': updateImageLayer(ref.id, { width: Math.max(MIN, ref.origW - ldx), height: Math.max(MIN, ref.origH - ldy), x: ref.origX + ldx, y: ref.origY + ldy }); break;
      case 'resize-ne': updateImageLayer(ref.id, { width: Math.max(MIN, ref.origW + ldx), height: Math.max(MIN, ref.origH - ldy), y: ref.origY + ldy }); break;
      case 'resize-sw': updateImageLayer(ref.id, { width: Math.max(MIN, ref.origW - ldx), height: Math.max(MIN, ref.origH + ldy), x: ref.origX + ldx }); break;
      case 'resize-e':  updateImageLayer(ref.id, { width: Math.max(MIN, ref.origW + ldx) }); break;
      case 'resize-w':  updateImageLayer(ref.id, { width: Math.max(MIN, ref.origW - ldx), x: ref.origX + ldx }); break;
      case 'resize-s':  updateImageLayer(ref.id, { height: Math.max(MIN, ref.origH + ldy) }); break;
      case 'resize-n':  updateImageLayer(ref.id, { height: Math.max(MIN, ref.origH - ldy), y: ref.origY + ldy }); break;
    }
  }, [page.imageLayers, scale]);

  const onImgLayPointerUp = () => { imgLayDragRef.current = null; };

  // ── Text layer drag ──────────────────────────────────────────────────────────
  const textDragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onTextPointerDown = (e: React.PointerEvent, layer: TextLayer) => {
    e.stopPropagation(); e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedTextId(layer.id);
    setSelected(false); setSelectedImgLayId(null);
    textDragRef.current = { id: layer.id, startX: e.clientX, startY: e.clientY, origX: layer.x, origY: layer.y };
  };

  const onTextPointerMove = (e: React.PointerEvent) => {
    const ref = textDragRef.current;
    if (!ref) return;
    const dx = (e.clientX - ref.startX) / scale;
    const dy = (e.clientY - ref.startY) / scale;
    updateTextLayer(ref.id, { x: ref.origX + dx, y: ref.origY + dy });
  };
  const onTextPointerUp = () => { textDragRef.current = null; };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const addTextLayer = () => {
    const layer = defaultTextLayer(size);
    onChange({ textLayers: [...page.textLayers, layer] });
    setSelectedTextId(layer.id); setSelected(false); setSelectedImgLayId(null);
  };

  const updateTextLayer = (id: string, updates: Partial<TextLayer>) => {
    onChange({ textLayers: page.textLayers.map(l => l.id === id ? { ...l, ...updates } : l) });
  };

  const removeTextLayer = (id: string) => {
    onChange({ textLayers: page.textLayers.filter(l => l.id !== id) });
    if (selectedTextId === id) setSelectedTextId(null);
  };

  const updateImageLayer = (id: string, updates: Partial<ImageLayer>) => {
    onChange({ imageLayers: page.imageLayers.map(l => l.id === id ? { ...l, ...updates } : l) });
  };

  const removeImageLayer = (id: string) => {
    onChange({ imageLayers: page.imageLayers.filter(l => l.id !== id) });
    if (selectedImgLayId === id) setSelectedImgLayId(null);
  };

  const handleAddImageLayer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      // Default: 30% of canvas width, keep aspect ratio
      const defaultW = size.width * 0.3;
      const defaultH = (natH / natW) * defaultW;
      const newLayer: ImageLayer = {
        id: uid(), url, imgEl: img,
        x: (size.width  - defaultW) / 2,
        y: (size.height - defaultH) / 2,
        width: defaultW, height: defaultH,
        rotation: 0, opacity: 100,
        radius: defaultCornerRadius(),
        linkedRadius: true,
        shadow: defaultImgLayerShadow(),
        glow:   defaultImgLayerGlow(),
        stroke: defaultImgLayerStroke(),
      };
      onChange({ imageLayers: [...page.imageLayers, newLayer] });
      setSelectedImgLayId(newLayer.id);
      setSelected(false); setSelectedTextId(null);
    } catch {
      toast({ title: 'Erro ao carregar imagem', variant: 'destructive' });
    }
    e.target.value = '';
  };

  // ── Download ──────────────────────────────────────────────────────────────────
  const downloadPage = (format: 'png' | 'jpg') => {
    if (!page.photoImg) return;
    const offscreen = document.createElement('canvas');
    offscreen.width  = size.width;
    offscreen.height = size.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, size.width, size.height);
    const img = page.photoImg;
    const fullW = img.naturalWidth  * page.imgScale;
    const fullH = img.naturalHeight * page.imgScale;
    const fcx   = page.imgPos.x + fullW / 2;
    const fcy   = page.imgPos.y + fullH / 2;
    ctx.save();
    ctx.translate(fcx, fcy);
    ctx.rotate(degToRad(page.imgRotation));
    ctx.drawImage(img, -fullW / 2, -fullH / 2, fullW, fullH);
    ctx.restore();
    if (frameImg) ctx.drawImage(frameImg, 0, 0, size.width, size.height);
    for (const layer of page.imageLayers) drawImageLayer(ctx, layer, 1);
    drawTextLayers(ctx, page.textLayers, 1);
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl  = offscreen.toDataURL(mimeType, 0.92);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `pagina_${index + 1}_${size.label.replace(/\s/g, '_')}.${format}`;
    a.click();
  };

  // ── SVG handles for BG photo ──────────────────────────────────────────────────
  const corners = page.photoImg ? getRotatedCorners(cx, cy, imgW, imgH, page.imgRotation) : [];
  const midpoints = corners.length === 4 ? [
    { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2, handle: 'resize-n' as HandleType },
    { x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2, handle: 'resize-e' as HandleType },
    { x: (corners[2].x + corners[3].x) / 2, y: (corners[2].y + corners[3].y) / 2, handle: 'resize-s' as HandleType },
    { x: (corners[3].x + corners[0].x) / 2, y: (corners[3].y + corners[0].y) / 2, handle: 'resize-w' as HandleType },
  ] : [];
  const cornerHandles: { x: number; y: number; handle: HandleType }[] = corners.length === 4 ? [
    { ...corners[0], handle: 'resize-nw' as HandleType },
    { ...corners[1], handle: 'resize-ne' as HandleType },
    { ...corners[2], handle: 'resize-se' as HandleType },
    { ...corners[3], handle: 'resize-sw' as HandleType },
  ] : [];
  const ROTATE_OFFSET = 28;
  const rotateHandle = corners.length === 4 ? (() => {
    const topMid = { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 };
    const r = degToRad(page.imgRotation);
    return { x: topMid.x - Math.sin(r) * ROTATE_OFFSET, y: topMid.y - Math.cos(r) * ROTATE_OFFSET };
  })() : null;
  const polygonPoints = corners.map(c => `${c.x},${c.y}`).join(' ');

  // ── SVG handles for image layers ─────────────────────────────────────────────
  const getImgLayHandles = (layer: ImageLayer) => {
    const lx   = layer.x      * scale;
    const ly   = layer.y      * scale;
    const lw   = layer.width  * scale;
    const lh   = layer.height * scale;
    const lcx  = lx + lw / 2;
    const lcy  = ly + lh / 2;
    const crns = getRotatedCorners(lcx, lcy, lw, lh, layer.rotation);
    const mids = crns.length === 4 ? [
      { x: (crns[0].x + crns[1].x) / 2, y: (crns[0].y + crns[1].y) / 2, handle: 'resize-n' as HandleType },
      { x: (crns[1].x + crns[2].x) / 2, y: (crns[1].y + crns[2].y) / 2, handle: 'resize-e' as HandleType },
      { x: (crns[2].x + crns[3].x) / 2, y: (crns[2].y + crns[3].y) / 2, handle: 'resize-s' as HandleType },
      { x: (crns[3].x + crns[0].x) / 2, y: (crns[3].y + crns[0].y) / 2, handle: 'resize-w' as HandleType },
    ] : [];
    const cHandles: { x: number; y: number; handle: HandleType }[] = crns.length === 4 ? [
      { ...crns[0], handle: 'resize-nw' as HandleType },
      { ...crns[1], handle: 'resize-ne' as HandleType },
      { ...crns[2], handle: 'resize-se' as HandleType },
      { ...crns[3], handle: 'resize-sw' as HandleType },
    ] : [];
    const r2 = degToRad(layer.rotation);
    const topMid = crns.length === 4 ? { x: (crns[0].x + crns[1].x) / 2, y: (crns[0].y + crns[1].y) / 2 } : null;
    const rotH   = topMid ? { x: topMid.x - Math.sin(r2) * ROTATE_OFFSET, y: topMid.y - Math.cos(r2) * ROTATE_OFFSET } : null;
    const poly   = crns.map(c => `${c.x},${c.y}`).join(' ');
    return { crns, mids, cHandles, rotH, poly, lcx, lcy };
  };

  const sidebarMode: 'none' | 'image' | 'text' | 'imgLayer' =
    selectedImgLayId ? 'imgLayer' : selectedTextId ? 'text' : selected ? 'image' : 'none';

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <span className="text-sm font-semibold text-foreground">
          Página {index + 1}
          {total > 1 && <span className="text-muted-foreground font-normal"> de {total}</span>}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={addTextLayer}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/10 border border-primary/30"
            title="Adicionar texto">
            <Type size={12} />+ Texto
          </button>
          <button onClick={() => imgLayerInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/10 border border-primary/30"
            title="Adicionar imagem">
            <Image size={12} />+ Imagem
          </button>
          <input ref={imgLayerInputRef} type="file" accept="image/*" className="hidden" onChange={handleAddImageLayer} />
          {total > 1 && (
            <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded" title="Remover página">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col items-center gap-3 p-4">
          <div ref={containerRef}
            className="relative select-none"
            style={{ width: previewW, height: previewH }}
            onPointerMove={e => { onPointerMove(e); onTextPointerMove(e); onImgLayPointerMove(e); }}
            onPointerUp={() => { onPointerUp(); onTextPointerUp(); onImgLayPointerUp(); }}
            onPointerLeave={() => { onPointerUp(); onTextPointerUp(); onImgLayPointerUp(); }}>

            <canvas ref={canvasRef}
              style={{ width: previewW, height: previewH, display: 'block', borderRadius: 8, border: '1px solid hsl(var(--border))' }}
              onClick={() => { setSelected(false); setSelectedTextId(null); setSelectedImgLayId(null); }} />

            {/* Hit area for bg photo move */}
            {page.photoImg && corners.length === 4 && (
              <svg className="absolute inset-0 overflow-visible"
                style={{ zIndex: 2, width: previewW, height: previewH, pointerEvents: selected ? 'none' : 'auto' }}>
                <polygon points={polygonPoints} fill="transparent" stroke="transparent"
                  style={{ cursor: 'move', pointerEvents: 'all' }}
                  onPointerDown={e => { setSelected(true); setSelectedTextId(null); setSelectedImgLayId(null); onHandlePointerDown(e as any, 'move'); }} />
              </svg>
            )}

            {/* BG photo handles */}
            {selected && page.photoImg && corners.length === 4 && (
              <svg className="absolute inset-0 overflow-visible"
                style={{ zIndex: 3, width: previewW, height: previewH, pointerEvents: 'none' }}>
                <polygon points={polygonPoints} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="5 3" style={{ pointerEvents: 'none' }} />
                {rotateHandle && (
                  <line x1={(corners[0].x + corners[1].x) / 2} y1={(corners[0].y + corners[1].y) / 2}
                    x2={rotateHandle.x} y2={rotateHandle.y}
                    stroke="hsl(var(--primary))" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />
                )}
                {rotateHandle && (
                  <circle cx={rotateHandle.x} cy={rotateHandle.y} r={H} fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5"
                    style={{ cursor: 'crosshair', pointerEvents: 'all' }}
                    onPointerDown={e => onHandlePointerDown(e as any, 'rotate')} />
                )}
                {midpoints.map(({ x, y, handle }) => (
                  <rect key={handle} x={x - H / 2} y={y - H / 2} width={H} height={H} rx={2}
                    fill="white" stroke="hsl(var(--primary))" strokeWidth="1.5"
                    style={{ cursor: getCursor(handle), pointerEvents: 'all' }}
                    onPointerDown={e => onHandlePointerDown(e as any, handle)} />
                ))}
                {cornerHandles.map(({ x, y, handle }) => (
                  <rect key={handle} x={x - (H + 2) / 2} y={y - (H + 2) / 2} width={H + 2} height={H + 2} rx={2}
                    fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5"
                    style={{ cursor: getCursor(handle), pointerEvents: 'all' }}
                    onPointerDown={e => onHandlePointerDown(e as any, handle)} />
                ))}
              </svg>
            )}

            {/* Image layer hit areas + handles */}
            {page.imageLayers.map(layer => {
              const { crns, mids, cHandles, rotH, poly, lcx: lCx, lcy: lCy } = getImgLayHandles(layer);
              const isSelected = selectedImgLayId === layer.id;
              return (
                <React.Fragment key={layer.id}>
                  {/* Hit area */}
                  <svg className="absolute inset-0 overflow-visible"
                    style={{ zIndex: 5, width: previewW, height: previewH, pointerEvents: isSelected ? 'none' : 'auto' }}>
                    <polygon points={poly} fill="transparent" stroke="transparent"
                      style={{ cursor: 'move', pointerEvents: 'all' }}
                      onPointerDown={e => onImgLayHandleDown(e as any, layer, 'move')} />
                  </svg>
                  {/* Handles when selected */}
                  {isSelected && (
                    <svg className="absolute inset-0 overflow-visible"
                      style={{ zIndex: 6, width: previewW, height: previewH, pointerEvents: 'none' }}>
                      <polygon points={poly} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="5 3" style={{ pointerEvents: 'none' }} />
                      {rotH && (
                        <line x1={(crns[0].x + crns[1].x) / 2} y1={(crns[0].y + crns[1].y) / 2}
                          x2={rotH.x} y2={rotH.y} stroke="hsl(var(--primary))" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />
                      )}
                      {rotH && (
                        <circle cx={rotH.x} cy={rotH.y} r={H} fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5"
                          style={{ cursor: 'crosshair', pointerEvents: 'all' }}
                          onPointerDown={e => onImgLayHandleDown(e as any, layer, 'rotate')} />
                      )}
                      {mids.map(({ x, y, handle }) => (
                        <rect key={handle} x={x - H / 2} y={y - H / 2} width={H} height={H} rx={2}
                          fill="white" stroke="hsl(var(--primary))" strokeWidth="1.5"
                          style={{ cursor: getCursor(handle), pointerEvents: 'all' }}
                          onPointerDown={e => onImgLayHandleDown(e as any, layer, handle)} />
                      ))}
                      {cHandles.map(({ x, y, handle }) => (
                        <rect key={handle} x={x - (H + 2) / 2} y={y - (H + 2) / 2} width={H + 2} height={H + 2} rx={2}
                          fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5"
                          style={{ cursor: getCursor(handle), pointerEvents: 'all' }}
                          onPointerDown={e => onImgLayHandleDown(e as any, layer, handle)} />
                      ))}
                    </svg>
                  )}
                </React.Fragment>
              );
            })}

            {/* Text hit areas */}
            {page.textLayers.map(layer => {
              const tx       = layer.x * scale;
              const ty       = layer.y * scale;
              const fs       = layer.fontSize * scale;
              const isSelText = selectedTextId === layer.id;
              const approxW  = layer.text.length * fs * 0.6;
              let boxX = tx;
              if (layer.align === 'center') boxX = tx - approxW / 2;
              else if (layer.align === 'right') boxX = tx - approxW;
              return (
                <div key={layer.id}
                  style={{
                    position: 'absolute', left: boxX - 4, top: ty - fs / 2 - 4,
                    width: approxW + 8, height: fs + 8,
                    zIndex: 7, cursor: 'move',
                    border: isSelText ? '1.5px dashed hsl(var(--primary))' : '1.5px dashed transparent',
                    borderRadius: 3, boxSizing: 'border-box',
                  }}
                  onPointerDown={e => onTextPointerDown(e, layer)} />
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            {sidebarMode === 'text'     ? 'Arraste o texto para reposicionar • Edite à direita'
            : sidebarMode === 'imgLayer' ? 'Arraste • Redimensione pelas bordas • Rotacione pelo círculo'
            : sidebarMode === 'image'   ? 'Arraste • Redimensione pelas bordas • Rotacione pelo círculo'
            : 'Clique na imagem ou texto para selecionar'}
          </p>
        </div>

        {/* Controls sidebar */}
        <div className="flex flex-col gap-3 p-4 lg:w-72 border-t lg:border-t-0 lg:border-l border-border min-h-[200px] overflow-y-auto"
          style={{ maxHeight: previewH + 80 }}>

          {/* IMAGE LAYER CONTROLS */}
          {sidebarMode === 'imgLayer' && selectedImgLay && (
            <ImageLayerSidebar
              layer={selectedImgLay}
              onChange={updates => updateImageLayer(selectedImgLay.id, updates)}
              onRemove={() => removeImageLayer(selectedImgLay.id)}
            />
          )}

          {/* TEXT CONTROLS */}
          {sidebarMode === 'text' && selectedText && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Texto</p>
                <button onClick={() => removeTextLayer(selectedText.id)} className="text-destructive hover:text-destructive/80 transition-colors" title="Remover texto">
                  <Trash2 size={14} />
                </button>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Conteúdo</p>
                <textarea value={selectedText.text}
                  onChange={e => updateTextLayer(selectedText.id, { text: e.target.value })}
                  className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={2} />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Fonte</p>
                <select value={selectedText.fontFamily}
                  onChange={e => updateTextLayer(selectedText.id, { fontFamily: e.target.value })}
                  className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Tamanho <span className="text-foreground font-medium">{selectedText.fontSize}px</span></p>
                <div className="flex items-center gap-2">
                  <input type="range" min={12} max={400} step={2} value={selectedText.fontSize}
                    onChange={e => updateTextLayer(selectedText.id, { fontSize: Number(e.target.value) })}
                    className="flex-1 accent-primary" />
                  <input type="number" min={12} max={400} value={selectedText.fontSize}
                    onChange={e => updateTextLayer(selectedText.id, { fontSize: Number(e.target.value) })}
                    className="w-16 text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-center" />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Cor</p>
                <div className="flex items-center gap-2">
                  <input type="color" value={selectedText.color}
                    onChange={e => updateTextLayer(selectedText.id, { color: e.target.value })}
                    className="w-10 h-8 rounded border border-border cursor-pointer bg-background p-0.5" />
                  <input type="text" value={selectedText.color}
                    onChange={e => updateTextLayer(selectedText.id, { color: e.target.value })}
                    className="flex-1 text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                    maxLength={9} />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Estilo</p>
                <div className="flex gap-1">
                  {[
                    { icon: <Bold size={13} />, key: 'bold', active: selectedText.bold },
                    { icon: <Italic size={13} />, key: 'italic', active: selectedText.italic },
                    { icon: <Underline size={13} />, key: 'underline', active: selectedText.underline },
                  ].map(({ icon, key, active }) => (
                    <button key={key}
                      onClick={() => updateTextLayer(selectedText.id, { [key]: !active } as any)}
                      className={cn('p-2 rounded border transition-colors', active ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/60')}>
                      {icon}
                    </button>
                  ))}
                  <div className="flex gap-1 ml-2">
                    {[
                      { icon: <AlignLeft size={13} />, val: 'left' },
                      { icon: <AlignCenter size={13} />, val: 'center' },
                      { icon: <AlignRight size={13} />, val: 'right' },
                    ].map(({ icon, val }) => (
                      <button key={val}
                        onClick={() => updateTextLayer(selectedText.id, { align: val as any })}
                        className={cn('p-2 rounded border transition-colors', selectedText.align === val ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/60')}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Section title="Efeitos" defaultOpen>
                  <SliderRow label="Opacidade" value={selectedText.opacity ?? 100} min={0} max={100} unit="%"
                    onChange={v => updateTextLayer(selectedText.id, { opacity: v })} />
                </Section>

                <Section title="Contorno"
                  enabled={selectedText.stroke?.enabled ?? false}
                  onToggleEnabled={v => updateTextLayer(selectedText.id, { stroke: { ...(selectedText.stroke ?? defaultTextStroke()), enabled: v } })}>
                  <ColorRow label="Cor do contorno" value={selectedText.stroke?.color ?? '#000000'}
                    onChange={v => updateTextLayer(selectedText.id, { stroke: { ...(selectedText.stroke ?? defaultTextStroke()), color: v } })} />
                  <SliderRow label="Espessura" value={selectedText.stroke?.width ?? 2} min={1} max={30} unit="px"
                    onChange={v => updateTextLayer(selectedText.id, { stroke: { ...(selectedText.stroke ?? defaultTextStroke()), width: v } })} />
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Tipo</span>
                    <select value={selectedText.stroke?.dash ?? 'solid'}
                      onChange={e => updateTextLayer(selectedText.id, { stroke: { ...(selectedText.stroke ?? defaultTextStroke()), dash: e.target.value as StrokeDash } })}
                      className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background text-foreground focus:outline-none">
                      {STROKE_DASHES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                </Section>

                <Section title="Sombra"
                  enabled={selectedText.shadow?.enabled ?? false}
                  onToggleEnabled={v => updateTextLayer(selectedText.id, { shadow: { ...(selectedText.shadow ?? defaultTextShadow()), enabled: v } })}>
                  <ColorRow label="Cor da sombra" value={selectedText.shadow?.color ?? '#000000'}
                    onChange={v => updateTextLayer(selectedText.id, { shadow: { ...(selectedText.shadow ?? defaultTextShadow()), color: v } })} />
                  <SliderRow label="Opacidade" value={selectedText.shadow?.opacity ?? 60} min={0} max={100} unit="%"
                    onChange={v => updateTextLayer(selectedText.id, { shadow: { ...(selectedText.shadow ?? defaultTextShadow()), opacity: v } })} />
                  <SliderRow label="Ângulo" value={selectedText.shadow?.angle ?? 45} min={0} max={360} unit="°"
                    onChange={v => updateTextLayer(selectedText.id, { shadow: { ...(selectedText.shadow ?? defaultTextShadow()), angle: v } })} />
                  <SliderRow label="Distância" value={selectedText.shadow?.distance ?? 4} min={0} max={60} unit="px"
                    onChange={v => updateTextLayer(selectedText.id, { shadow: { ...(selectedText.shadow ?? defaultTextShadow()), distance: v } })} />
                  <SliderRow label="Expansão" value={selectedText.shadow?.spread ?? 2} min={0} max={50} unit="px"
                    onChange={v => updateTextLayer(selectedText.id, { shadow: { ...(selectedText.shadow ?? defaultTextShadow()), spread: v } })} />
                  <SliderRow label="Tamanho (blur)" value={selectedText.shadow?.size ?? 8} min={0} max={80} unit="px"
                    onChange={v => updateTextLayer(selectedText.id, { shadow: { ...(selectedText.shadow ?? defaultTextShadow()), size: v } })} />
                </Section>

                <Section title="Brilho (Glow)"
                  enabled={selectedText.glow?.enabled ?? false}
                  onToggleEnabled={v => updateTextLayer(selectedText.id, { glow: { ...(selectedText.glow ?? defaultTextGlow()), enabled: v } })}>
                  <ColorRow label="Cor do brilho" value={selectedText.glow?.color ?? '#ffffff'}
                    onChange={v => updateTextLayer(selectedText.id, { glow: { ...(selectedText.glow ?? defaultTextGlow()), color: v } })} />
                  <SliderRow label="Opacidade" value={selectedText.glow?.opacity ?? 80} min={0} max={100} unit="%"
                    onChange={v => updateTextLayer(selectedText.id, { glow: { ...(selectedText.glow ?? defaultTextGlow()), opacity: v } })} />
                  <SliderRow label="Expansão" value={selectedText.glow?.spread ?? 4} min={0} max={50} unit="px"
                    onChange={v => updateTextLayer(selectedText.id, { glow: { ...(selectedText.glow ?? defaultTextGlow()), spread: v } })} />
                  <SliderRow label="Tamanho (blur)" value={selectedText.glow?.size ?? 12} min={0} max={80} unit="px"
                    onChange={v => updateTextLayer(selectedText.id, { glow: { ...(selectedText.glow ?? defaultTextGlow()), size: v } })} />
                </Section>
              </div>
            </>
          )}

          {/* BG IMAGE selected */}
          {sidebarMode === 'image' && (
            <div className="flex flex-col gap-2 items-center justify-center flex-1 text-center text-muted-foreground py-4">
              <p className="text-xs leading-relaxed">
                Use as <strong>alças</strong> na imagem para redimensionar e rotacionar.
              </p>
            </div>
          )}

          {/* Nothing selected */}
          {sidebarMode === 'none' && (
            <div className="flex flex-col gap-3 items-center justify-center flex-1 text-center text-muted-foreground py-4">
              <Type size={20} className="opacity-40" />
              <p className="text-xs leading-relaxed">Clique na imagem ou em um texto para ver os controles</p>
              <button onClick={addTextLayer}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md border border-primary/40 hover:bg-primary/10">
                <Plus size={12} />Adicionar Texto
              </button>
              <button onClick={() => imgLayerInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md border border-primary/40 hover:bg-primary/10">
                <Image size={12} />Adicionar Imagem
              </button>
            </div>
          )}

          {/* Download */}
          <div className="border-t border-border pt-3 mt-auto">
            <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Baixar</p>
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={() => downloadPage('png')} className="gap-2 text-xs">
                <Download size={12} />PNG
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadPage('jpg')} className="gap-2 text-xs">
                <Download size={12} />JPG
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── renderPageToBlob (ZIP export) ──────────────────────────────────────────────
async function renderPageToBlob(page: PageState, size: CanvasSize, frameImg: HTMLImageElement | null, format: 'png' | 'jpg'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const offscreen = document.createElement('canvas');
    offscreen.width  = size.width;
    offscreen.height = size.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return reject(new Error('no ctx'));
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, size.width, size.height);
    if (page.photoImg) {
      const img   = page.photoImg;
      const fullW = img.naturalWidth  * page.imgScale;
      const fullH = img.naturalHeight * page.imgScale;
      const fcx   = page.imgPos.x + fullW / 2;
      const fcy   = page.imgPos.y + fullH / 2;
      ctx.save();
      ctx.translate(fcx, fcy);
      ctx.rotate(degToRad(page.imgRotation));
      ctx.drawImage(img, -fullW / 2, -fullH / 2, fullW, fullH);
      ctx.restore();
    }
    if (frameImg) ctx.drawImage(frameImg, 0, 0, size.width, size.height);
    for (const layer of page.imageLayers) drawImageLayer(ctx, layer, 1);
    drawTextLayers(ctx, page.textLayers, 1);
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    offscreen.toBlob(blob => { if (blob) resolve(blob); else reject(new Error('toBlob failed')); }, mimeType, 0.92);
  });
}

// ── Main Component ─────────────────────────────────────────────────────────────
const Canva: React.FC = () => {
  const { profile } = useAuth();

  const [step,         setStep]         = useState(0);
  const [selectedSize, setSelectedSize] = useState<CanvasSize | null>(null);

  const [frameUrl,  setFrameUrl]  = useState<string | null>(null);
  const [frameFile, setFrameFile] = useState<File | null>(null);
  const [frameImg,  setFrameImg]  = useState<HTMLImageElement | null>(null);
  const frameInputRef = useRef<HTMLInputElement>(null);

  const [pages,          setPages]          = useState<PageState[]>([]);
  const photoInputRef  = useRef<HTMLInputElement>(null);

  const [stockVehicles, setStockVehicles] = useState<StockVehicle[]>([]);
  const [loadingStock,  setLoadingStock]  = useState(false);
  const [showStock,     setShowStock]     = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

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

  useEffect(() => { if (step === 2 && showStock) fetchStockVehicles(); }, [step, showStock, fetchStockVehicles]);

  useEffect(() => {
    if (!frameUrl) { setFrameImg(null); return; }
    loadImage(frameUrl).then(setFrameImg).catch(() => setFrameImg(null));
  }, [frameUrl]);

  const addPhotoUrls = useCallback(async (urls: string[]) => {
    const newPages: PageState[] = [];
    for (const url of urls) {
      try {
        const img = await loadImage(url);
        const s   = selectedSize
          ? Math.max(selectedSize.width / img.naturalWidth, selectedSize.height / img.naturalHeight)
          : 1;
        newPages.push({
          id: uid(), photoUrl: url, photoImg: img,
          imgScale: s, imgRotation: 0,
          imgPos: selectedSize
            ? { x: (selectedSize.width  - img.naturalWidth  * s) / 2,
                y: (selectedSize.height - img.naturalHeight * s) / 2 }
            : { x: 0, y: 0 },
          textLayers: [], imageLayers: [],
        });
      } catch {
        toast({ title: 'Erro ao carregar imagem', variant: 'destructive' });
      }
    }
    setPages(prev => [...prev, ...newPages]);
  }, [selectedSize]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    await addPhotoUrls(urls);
    setShowStock(false);
    e.target.value = '';
  };

  const handleSelectStockPhoto = async (url: string) => { await addPhotoUrls([url]); };

  const updatePage = (id: string, updates: Partial<PageState>) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePage = (id: string) => { setPages(prev => prev.filter(p => p.id !== id)); };

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrameFile(file);
    setFrameUrl(URL.createObjectURL(file));
  };

  const downloadAllZip = async (format: 'png' | 'jpg') => {
    if (!selectedSize || pages.length === 0) return;
    setDownloadingZip(true);
    try {
      const zip    = new JSZip();
      const folder = zip.folder('criativos') ?? zip;
      for (let i = 0; i < pages.length; i++) {
        const blob = await renderPageToBlob(pages[i], selectedSize, frameImg, format);
        folder.file(`pagina_${i + 1}_${selectedSize.label.replace(/\s/g, '_')}.${format}`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `criativos_${selectedSize.label.replace(/\s/g, '_')}.zip`;
      a.click();
    } catch {
      toast({ title: 'Erro ao gerar ZIP', variant: 'destructive' });
    } finally {
      setDownloadingZip(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return !!selectedSize;
    if (step === 1) return !!frameUrl;
    if (step === 2) return pages.length > 0;
    return true;
  };

  const previewDims = selectedSize ? getPreviewDimensions(selectedSize.width, selectedSize.height) : null;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Canva de Criativos</h1>
        <p className="text-muted-foreground text-sm mt-1">Crie artes para Instagram com moldura personalizada</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-colors',
                i === step   ? 'bg-primary text-primary-foreground'
                : i < step   ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                : 'bg-muted text-muted-foreground cursor-default'
              )}>
              {i < step && <Check size={12} />}{s}
            </button>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Tamanho */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Escolha o tamanho</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CANVAS_SIZES.map(size => (
              <button key={size.label} onClick={() => setSelectedSize(size)}
                className={cn('p-5 rounded-xl border-2 text-left transition-all hover:border-primary/60',
                  selectedSize?.label === size.label ? 'border-primary bg-primary/10' : 'border-border bg-card')}>
                <div className="text-3xl mb-2">{size.icon}</div>
                <div className="font-semibold text-foreground">{size.label}</div>
                <div className="text-xs text-muted-foreground">{size.subtitle}</div>
                <div className="mt-2 text-xs font-mono text-primary">{size.width} × {size.height} · {size.ratio}</div>
                <div className="mt-3 flex justify-center">
                  <div className={cn('border-2 rounded-sm', selectedSize?.label === size.label ? 'border-primary' : 'border-muted-foreground/40')}
                    style={{ width: size.ratio === '9:16' ? 24 : size.ratio === '1:1' ? 40 : 30, height: size.ratio === '9:16' ? 42 : size.ratio === '1:1' ? 40 : 40 }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Moldura */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Escolha a Moldura</h2>
          <p className="text-sm text-muted-foreground">Faça upload de um arquivo PNG com transparência. A moldura será usada em todas as páginas.</p>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <button onClick={() => frameInputRef.current?.click()}
              className={cn('flex flex-col items-center justify-center gap-3 w-full sm:w-56 h-44 border-2 border-dashed rounded-xl transition-colors',
                frameUrl ? 'border-primary/60 bg-primary/5' : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5')}>
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
                <div className="relative rounded-lg overflow-hidden border border-border"
                  style={{ width: Math.min(previewDims.w, 160), height: Math.min(previewDims.h, 160),
                    background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px' }}>
                  <img src={frameUrl} alt="Preview moldura" className="absolute inset-0 w-full h-full object-contain" />
                </div>
                <button onClick={() => { setFrameUrl(null); setFrameFile(null); setFrameImg(null); }} className="text-xs text-destructive hover:underline">Remover</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Fotos */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Escolha as Fotos</h2>
          <p className="text-sm text-muted-foreground">Adicione uma ou mais fotos. Cada foto será uma <strong>Página</strong> no editor.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => photoInputRef.current?.click()}>
              <Upload size={16} className="mr-2" />Enviar Fotos
            </Button>
            <Button variant="outline" onClick={() => { setShowStock(!showStock); if (!showStock) fetchStockVehicles(); }}>
              <Car size={16} className="mr-2" />Escolher do Estoque
            </Button>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
          {pages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{pages.length} foto{pages.length > 1 ? 's' : ''} selecionada{pages.length > 1 ? 's' : ''}</p>
              <div className="flex flex-wrap gap-3">
                {pages.map((page, i) => (
                  <div key={page.id} className="relative group">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary">
                      <img src={page.photoUrl} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[10px] px-1 rounded">P{i + 1}</span>
                    <button onClick={() => removePage(page.id)}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                  </div>
                ))}
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
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {stockVehicles.map(vehicle => {
                    const photos = vehicle.fotos?.filter(Boolean) ?? (vehicle.foto ? [vehicle.foto] : []);
                    if (photos.length === 0) return null;
                    return (
                      <button key={vehicle.id} onClick={() => handleSelectStockPhoto(photos[0])}
                        className="relative group rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors aspect-square">
                        <img src={photos[0]} alt={vehicle.modelo ?? ''} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                          <span className="text-[10px] text-white leading-tight">{vehicle.fabricante} {vehicle.modelo}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Editor */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-foreground">Editor ({pages.length} página{pages.length > 1 ? 's' : ''})</h2>
            {pages.length > 1 && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadAllZip('png')} disabled={downloadingZip} className="gap-2 text-xs">
                  <Download size={12} />{downloadingZip ? 'Gerando...' : 'ZIP PNG'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadAllZip('jpg')} disabled={downloadingZip} className="gap-2 text-xs">
                  <Download size={12} />{downloadingZip ? 'Gerando...' : 'ZIP JPG'}
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-8">
            {pages.map((page, i) => (
              <PageCanvas key={page.id} page={page} size={selectedSize!} frameImg={frameImg}
                onChange={updates => updatePage(page.id, updates)}
                onRemove={() => removePage(page.id)}
                index={i} total={pages.length} />
            ))}
          </div>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <Plus size={14} />Adicionar mais fotos
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 3 && (
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft size={16} className="mr-1" />Voltar
          </Button>
          <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
            {step === 2 ? 'Ir para o Editor' : 'Próximo'}
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Canva;

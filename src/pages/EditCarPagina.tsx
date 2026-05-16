import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCars } from '@/contexts/CarContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Image as ImageIcon, Trash2, LoaderCircle } from 'lucide-react';
import { uploadCarImages } from '@/lib/uploadCarImages';
import { toast } from '@/components/ui/use-toast';

interface ArquivoLocal {
  file: File;
  blobUrl: string;
}

const EditCarPagina: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getCar, updateCar } = useCars();
  const navigate = useNavigate();

  const car = id ? getCar(id) : undefined;

  const [pgCapaUrls, setPgCapaUrls] = useState<string[]>(car?.pgCapa ?? []);
  const [arquivosLocais, setArquivosLocais] = useState<ArquivoLocal[]>([]);
  const [pgCaixa1, setPgCaixa1] = useState<string>(car?.pgCaixa1 ?? '');
  const [pgCaixa2, setPgCaixa2] = useState<string>(car?.pgCaixa2 ?? '');
  const [pgCaixa3, setPgCaixa3] = useState<string>(car?.pgCaixa3 ?? '');
  const [pgCaixa4, setPgCaixa4] = useState<string>(car?.pgCaixa4 ?? '');
  const [salvando, setSalvando] = useState<boolean>(false);

  // Sincroniza estados quando o veículo carrega após a montagem
  useEffect(() => {
    if (car) {
      setPgCapaUrls(car.pgCapa ?? []);
      setPgCaixa1(car.pgCaixa1 ?? '');
      setPgCaixa2(car.pgCaixa2 ?? '');
      setPgCaixa3(car.pgCaixa3 ?? '');
      setPgCaixa4(car.pgCaixa4 ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car?.id]);

  // Limpeza de blob URLs
  useEffect(() => {
    return () => {
      arquivosLocais.forEach((item) => URL.revokeObjectURL(item.blobUrl));
    };
  }, [arquivosLocais]);

  if (!car) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <h2 className="text-2xl font-bold mb-4">Carro não encontrado</h2>
        <Button onClick={() => navigate('/dashboard/estoque')}>Voltar ao Estoque</Button>
      </div>
    );
  }

  const handleArquivosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const novos: ArquivoLocal[] = Array.from(files).map((file) => ({
      file,
      blobUrl: URL.createObjectURL(file),
    }));
    setArquivosLocais((prev) => [...prev, ...novos]);
    setPgCapaUrls((prev) => [...prev, ...novos.map((n) => n.blobUrl)]);
    e.target.value = '';
  };

  const handleRemover = (index: number) => {
    const url = pgCapaUrls[index];
    setPgCapaUrls((prev) => prev.filter((_, i) => i !== index));
    const local = arquivosLocais.find((a) => a.blobUrl === url);
    if (local) {
      URL.revokeObjectURL(local.blobUrl);
      setArquivosLocais((prev) => prev.filter((a) => a.blobUrl !== url));
    }
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      // Upload das imagens novas
      const arquivosParaUpload: File[] = [];
      const blobsEmOrdem: string[] = [];
      pgCapaUrls.forEach((url) => {
        const local = arquivosLocais.find((a) => a.blobUrl === url);
        if (local) {
          arquivosParaUpload.push(local.file);
          blobsEmOrdem.push(local.blobUrl);
        }
      });

      let urlsEnviadas: string[] = [];
      if (arquivosParaUpload.length > 0) {
        urlsEnviadas = await uploadCarImages(arquivosParaUpload);
      }

      const blobParaUrl = new Map<string, string>();
      blobsEmOrdem.forEach((b, i) => blobParaUrl.set(b, urlsEnviadas[i]));
      const pgCapaFinal = pgCapaUrls.map((u) => (blobParaUrl.has(u) ? blobParaUrl.get(u)! : u));

      await updateCar(id!, {
        pgCapa: pgCapaFinal,
        pgCaixa1,
        pgCaixa2,
        pgCaixa3,
        pgCaixa4,
      });

      blobsEmOrdem.forEach((b) => URL.revokeObjectURL(b));
      setArquivosLocais((prev) => prev.filter((a) => !blobsEmOrdem.includes(a.blobUrl)));
      navigate(`/dashboard/car/${id}`);
    } catch (err) {
      toast({
        title: 'Erro ao salvar página',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-1" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          Página de venda — {car.brand} {car.model}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <label className="font-medium mb-1 flex gap-2 items-center">
            <ImageIcon size={16} /> Capa da página (múltiplas imagens)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleArquivosChange}
            className="file-input file-input-bordered w-full"
            disabled={salvando}
          />
          {pgCapaUrls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3">
              {pgCapaUrls.map((url, i) => (
                <div key={i} className="relative group border rounded aspect-square">
                  <img src={url} alt={`Capa ${i + 1}`} className="w-full h-full object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => handleRemover(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-medium mb-1 block">Caixa 1</label>
            <Textarea
              value={pgCaixa1}
              onChange={(e) => setPgCaixa1(e.target.value)}
              placeholder="Texto da caixa 1"
              className="min-h-[100px] whitespace-pre-wrap"
            />
          </div>
          <div>
            <label className="font-medium mb-1 block">Caixa 2</label>
            <Textarea
              value={pgCaixa2}
              onChange={(e) => setPgCaixa2(e.target.value)}
              placeholder="Texto da caixa 2"
              className="min-h-[100px] whitespace-pre-wrap"
            />
          </div>
          <div>
            <label className="font-medium mb-1 block">Caixa 3</label>
            <Textarea
              value={pgCaixa3}
              onChange={(e) => setPgCaixa3(e.target.value)}
              placeholder="Texto da caixa 3"
              className="min-h-[100px] whitespace-pre-wrap"
            />
          </div>
          <div>
            <label className="font-medium mb-1 block">Caixa 4</label>
            <Textarea
              value={pgCaixa4}
              onChange={(e) => setPgCaixa4(e.target.value)}
              placeholder="Texto da caixa 4"
              className="min-h-[100px] whitespace-pre-wrap"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSalvar}
          className="bg-carblue hover:bg-carblue-dark"
          disabled={salvando}
        >
          {salvando ? <LoaderCircle className="animate-spin mr-2" size={16} /> : null}
          Salvar Página
        </Button>
      </div>
    </div>
  );
};

export { EditCarPagina };
export default EditCarPagina;
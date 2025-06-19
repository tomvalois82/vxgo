
import React from 'react';
import { Image, MoveHorizontal, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ImageUploadGridProps {
  previewUrls: string[];
  onImageFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeletePhoto: (index: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  uploading: boolean;
}

const MAX_PHOTOS = 20;

const ImageUploadGrid: React.FC<ImageUploadGridProps> = ({
  previewUrls,
  onImageFilesChange,
  onDeletePhoto,
  onDragStart,
  onDragOver,
  onDrop,
  uploading,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // Verificar limite de fotos
    const totalPhotos = previewUrls.length + files.length;
    if (totalPhotos > MAX_PHOTOS) {
      toast({
        variant: 'destructive',
        title: 'Limite excedido',
        description: 'Limite de 20 fotos por veículo atingido.',
      });
      return;
    }
    
    onImageFilesChange(e);
  };

  return (
    <div>
      <label className="block font-medium mb-1 flex gap-2 items-center">
        <Image size={16} /> Fotos do veículo
      </label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="file-input file-input-bordered w-full"
        disabled={uploading || previewUrls.length >= MAX_PHOTOS}
      />
      <div className="mt-2 text-sm text-gray-500 flex items-center">
        <MoveHorizontal size={16} className="mr-1" /> Arraste para reordenar | 
        <Trash2 size={16} className="ml-2 mr-1" /> Clique para excluir
        <span className="ml-4 text-blue-600">
          {previewUrls.length}/{MAX_PHOTOS} fotos
        </span>
      </div>
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3">
          {previewUrls.map((url, i) => (
            <div 
              key={i}
              className="relative group border rounded aspect-square cursor-move"
              draggable={true}
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, i)}
            >
              <img
                src={url}
                alt={`Preview ${i + 1}`}
                className="w-full h-full object-cover rounded"
              />
              <button
                type="button"
                onClick={() => onDeletePhoto(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                aria-label="Delete photo"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadGrid;

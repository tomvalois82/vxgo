import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CarFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadCarImages } from "@/lib/uploadCarImages";
import { Image, Calendar, Car, List, Pencil, DollarSign, Palette, Gauge, FileText, Video, FileSpreadsheet, Shield, LayoutList, Trash2, MoveHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VehicleType, useFipeBrands } from '@/hooks/useFipeBrands';
import { toast } from '@/components/ui/use-toast';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1950 + 2 }, (_, i) => currentYear + 1 - i);
const engineSizes = ['1.0', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '2.0', '2.2', '2.4', '2.8', '3.0', '3.2', '3.6', '4.0', '4.2', '5.0'];
const colors = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Marrom', 'Verde', 'Amarelo'];
const categories = ['Hatch', 'Sedan', 'SUV', 'Conversível', 'Picape', 'Coupe', 'Esportivo'];

const carFormSchema = z.object({
  vehicleType: z.enum(['carros', 'motos', 'caminhoes'] as const),
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  year: z.coerce.number().int().min(1950).max(currentYear + 1),
  manufacturingYear: z.coerce.number().int().min(1950).max(currentYear + 1),
  price: z.coerce.number().positive('Preço deve ser um valor positivo'),
  color: z.string().min(1, 'Cor é obrigatória'),
  mileage: z.coerce.number().min(0, 'Quilometragem não pode ser negativa'),
  fuelType: z.string().min(1, 'Tipo de combustível é obrigatório'),
  transmission: z.string().min(1, 'Tipo de transmissão é obrigatório'),
  inStock: z.boolean().default(true),
  description: z.string().optional(),
  characteristics: z.string().optional(),
  video: z.string().optional(),
  cautionReport: z.string().optional(),
  technicalSheet: z.string().optional(),
  warranty: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  image: z.string().optional(),
});

type CarFormProps = {
  initialData?: Partial<CarFormData>;
  onSubmit: (data: CarFormData) => void;
  isEditing?: boolean;
};

// Format functions
const formatCurrency = (value: string): string => {
  // Remove non-numeric characters
  const numericValue = value.replace(/\D/g, '');
  
  // Convert to number and format
  const number = Number(numericValue) / 100;
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatMileage = (value: string): string => {
  // Remove non-numeric characters
  return value.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
};

// Helper to extract numeric value from formatted price string
const extractNumericValue = (formattedPrice: string | number): number => {
  if (formattedPrice === null || formattedPrice === undefined) return 0;
  
  // If it's already a number, return it
  if (typeof formattedPrice === 'number') return formattedPrice;
  
  // Otherwise, parse the string
  return parseFloat(formattedPrice.replace(/\D/g, '')) / 100;
};

const CarForm: React.FC<CarFormProps> = ({
  initialData = {},
  onSubmit,
  isEditing = false,
}) => {
  // Convert price format if coming from database (R$ 999.999,99 format)
  let initialPrice = initialData.price || 0;
  if (typeof initialData.price === 'string') {
    initialPrice = extractNumericValue(initialData.price);
  }

  const form = useForm<z.infer<typeof carFormSchema>>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      vehicleType: (initialData.vehicleType as VehicleType) || 'carros',
      brand: initialData.brand || '',
      model: initialData.model || '',
      year: initialData.year || currentYear,
      manufacturingYear: initialData.manufacturingYear || initialData.year || currentYear - 1,
      price: initialPrice,
      color: initialData.color || 'Branco',
      mileage: initialData.mileage || 0,
      fuelType: initialData.fuelType || '1.0',
      transmission: initialData.transmission || 'Manual',
      inStock: initialData.inStock !== undefined ? initialData.inStock : true,
      image: initialData.image || '',
      description: initialData.description || '',
      characteristics: initialData.characteristics || '',
      video: initialData.video || '',
      cautionReport: initialData.cautionReport || '',
      technicalSheet: initialData.technicalSheet || '',
      warranty: initialData.warranty || '',
      category: initialData.category || 'Sedan',
    },
  });

  const vehicleType = form.watch('vehicleType') as VehicleType;
  const selectedYear = form.watch('year');
  const { data: brands, isLoading: isLoadingBrands } = useFipeBrands(vehicleType);

  // Update manufacturingYear options when year changes
  useEffect(() => {
    const manufacturingYear = form.getValues('manufacturingYear');
    // If manufacturing year is not one of the allowed values (selected year or year-1)
    if (manufacturingYear !== selectedYear && manufacturingYear !== selectedYear - 1) {
      form.setValue('manufacturingYear', selectedYear - 1);
    }
  }, [selectedYear, form]);

  // State for photos
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    Array.isArray((initialData as any).fotos)
      ? (initialData as any).fotos.map((nome: string) =>
        supabase.storage.from("car-fotos").getPublicUrl(nome).data.publicUrl
      )
      : []
  );
  const [photoNames, setPhotoNames] = useState<string[]>(
    Array.isArray((initialData as any).fotos) ? (initialData as any).fotos : []
  );

  // Updates previews when selecting new images
  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setImageFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Create new preview URLs for the files
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
    }
  };

  // Delete a photo
  const handleDeletePhoto = (index: number) => {
    // If it's an existing photo
    if (index < photoNames.length) {
      const newPhotoNames = [...photoNames];
      newPhotoNames.splice(index, 1);
      setPhotoNames(newPhotoNames);
      
      // Remove the preview URL
      const newPreviewUrls = [...previewUrls];
      newPreviewUrls.splice(index, 1);
      setPreviewUrls(newPreviewUrls);
    } 
    // If it's a new photo
    else {
      const newFileIndex = index - photoNames.length;
      const newFiles = [...imageFiles];
      newFiles.splice(newFileIndex, 1);
      setImageFiles(newFiles);
      
      // Remove the preview URL
      const newPreviewUrls = [...previewUrls];
      newPreviewUrls.splice(index, 1);
      setPreviewUrls(newPreviewUrls);
    }
  };

  // Reorder photos with drag and drop
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    
    if (sourceIndex === targetIndex) return;

    // Update preview URLs
    const updatedPreviewUrls = [...previewUrls];
    const movedPreview = updatedPreviewUrls.splice(sourceIndex, 1)[0];
    updatedPreviewUrls.splice(targetIndex, 0, movedPreview);
    setPreviewUrls(updatedPreviewUrls);

    // Update photo names or image files depending on which is being moved
    if (sourceIndex < photoNames.length && targetIndex < photoNames.length) {
      // Both are existing photos
      const updatedPhotoNames = [...photoNames];
      const movedPhoto = updatedPhotoNames.splice(sourceIndex, 1)[0];
      updatedPhotoNames.splice(targetIndex, 0, movedPhoto);
      setPhotoNames(updatedPhotoNames);
    } else if (sourceIndex >= photoNames.length && targetIndex >= photoNames.length) {
      // Both are new file uploads
      const updatedImageFiles = [...imageFiles];
      const sourceFileIndex = sourceIndex - photoNames.length;
      const targetFileIndex = targetIndex - photoNames.length;
      const movedFile = updatedImageFiles.splice(sourceFileIndex, 1)[0];
      updatedImageFiles.splice(targetFileIndex, 0, movedFile);
      setImageFiles(updatedImageFiles);
    } else {
      // Mixed case (moving between existing and new), requires more complex handling
      toast({
        title: "Não é possível reorganizar entre fotos existentes e novas",
        description: "Salve o formulário primeiro para organizar todas as fotos.",
        variant: "destructive"
      });
    }
  };

  async function handleSubmit(values: z.infer<typeof carFormSchema>) {
    setUploading(true);
    let imageNames = [...photoNames]; // Start with existing photo names

    // If the user uploaded new images, upload them
    if (imageFiles.length > 0) {
      try {
        const newImageNames = await uploadCarImages(imageFiles);
        imageNames = [...imageNames, ...newImageNames];
      } catch (err: any) {
        toast({
          title: "Erro ao enviar imagens",
          description: err.message || "Ocorreu um erro ao enviar as imagens",
          variant: "destructive"
        });
        setUploading(false);
        return;
      }
    }

    setUploading(false);

    // Add the field fotos to the form data
    const fullData = { ...values, fotos: imageNames };
    onSubmit(fullData as CarFormData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="vehicleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Car size={16} /> Tipo de Veículo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="carros">Carros</SelectItem>
                    <SelectItem value="motos">Motos</SelectItem>
                    <SelectItem value="caminhoes">Caminhões</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><List size={16} /> Marca</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoadingBrands || !brands}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingBrands ? "Carregando..." : "Selecione a marca"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brands?.map((brand) => (
                      <SelectItem key={brand.codigo} value={brand.nome}>
                        {brand.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Pencil size={16} /> Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Civic" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Calendar size={16} /> Ano</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="manufacturingYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Calendar size={16} /> Ano de Fabricação</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano de fabricação" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={selectedYear.toString()}>{selectedYear}</SelectItem>
                    <SelectItem value={(selectedYear - 1).toString()}>{selectedYear - 1}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field: { onChange, ...rest } }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><DollarSign size={16} /> Preço (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="R$ 0,00"
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      e.target.value = formatted;
                      // Extract numeric value for the form
                      const numericValue = parseFloat(formatted.replace(/\D/g, '')) / 100;
                      onChange(numericValue);
                    }}
                    value={typeof rest.value === 'number' ? 
                      rest.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 
                      'R$ 0,00'
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Palette size={16} /> Cor</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><LayoutList size={16} /> Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="mileage"
            render={({ field: { onChange, ...rest } }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Gauge size={16} /> Quilometragem</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="0"
                    onChange={(e) => {
                      const formatted = formatMileage(e.target.value);
                      e.target.value = formatted;
                      // Extract numeric value for the form
                      const numericValue = parseInt(formatted.replace(/\./g, ''));
                      onChange(isNaN(numericValue) ? 0 : numericValue);
                    }}
                    value={typeof rest.value === 'number' ? 
                      rest.value.toLocaleString('pt-BR') : 
                      '0'
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motor</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {engineSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transmissão</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a transmissão" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Automático">Automático</SelectItem>
                    <SelectItem value="CVT">CVT</SelectItem>
                    <SelectItem value="Automatizado">Automatizado</SelectItem>
                    <SelectItem value="Semi-Automático">Semi-Automático</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="inStock"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Disponível em Estoque</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="video"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Video size={16} /> Link do Vídeo</FormLabel>
                <FormControl>
                  <Input placeholder="URL do vídeo do veículo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="warranty"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Shield size={16} /> Garantia</FormLabel>
                <FormControl>
                  <Input placeholder="Informações de garantia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="cautionReport"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><FileText size={16} /> Link para Cautelar</FormLabel>
                <FormControl>
                  <Input placeholder="URL para documento cautelar" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="technicalSheet"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><FileSpreadsheet size={16} /> Link para Ficha Técnica</FormLabel>
                <FormControl>
                  <Input placeholder="URL para ficha técnica" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <label className="block font-medium mb-1 flex gap-2 items-center">
            <Image size={16} /> Fotos do veículo
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageFilesChange}
            className="file-input file-input-bordered w-full"
            disabled={uploading}
          />
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <MoveHorizontal size={16} className="mr-1" /> Arraste para reordenar | 
            <Trash2 size={16} className="ml-2 mr-1" /> Clique para excluir
          </div>
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3">
              {previewUrls.map((url, i) => (
                <div 
                  key={i}
                  className="relative group border rounded aspect-square cursor-move"
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, i)}
                >
                  <img
                    src={url}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(i)}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva observações sobre o veículo"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="characteristics"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Características</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva características do veículo"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="bg-carblue hover:bg-carblue-dark">
          {isEditing ? 'Atualizar Veículo' : 'Adicionar Veículo'}
        </Button>
      </form>
    </Form>
  );
};

export default CarForm;

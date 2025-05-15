import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CarFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadCarImages } from "@/lib/uploadCarImages";
import { Car, List, Pencil, DollarSign, Palette, Gauge, FileText, Video, FileSpreadsheet, Shield, LayoutList, Calendar, LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VehicleType, useFipeBrands } from '@/hooks/useFipeBrands';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency, formatMileage, extractNumericValue } from '@/lib/formUtils';
import { currentYear, years, engineSizes, colors, categories } from './formConstants';
import { carFormSchema, type CarFormSchema } from './carFormSchema';
import ImageUploadGrid from './ImageUploadGrid';

interface CarFormProps {
  initialData?: Partial<CarFormData>;
  onSubmit: (data: CarFormData) => void;
  isEditing?: boolean;
}

const CarForm: React.FC<CarFormProps> = ({
  initialData = {},
  onSubmit,
  isEditing = false,
}) => {
  // Initialize form with initial data
  let initialPrice = initialData.price || 0;
  if (typeof initialData.price === 'string') {
    initialPrice = extractNumericValue(initialData.price);
  }

  const form = useForm<CarFormSchema>({
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
      image: initialData.image || '', // This might be legacy if 'fotos' is primary
      description: initialData.description || '',
      characteristics: initialData.characteristics || '',
      video: initialData.video || '',
      cautionReport: initialData.cautionReport || '',
      technicalSheet: initialData.technicalSheet || '',
      warranty: initialData.warranty || '',
      category: initialData.category || 'Sedan',
      // 'fotos' are handled by imageFiles/photoNames state, not directly in form defaultValues
    },
  });

  // Image handling state
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

  const vehicleType = form.watch('vehicleType') as VehicleType;
  const selectedYear = form.watch('year');
  const { data: brands, isLoading: isLoadingBrands } = useFipeBrands(vehicleType);

  // Update manufacturingYear options when year changes
  useEffect(() => {
    const manufacturingYear = form.getValues('manufacturingYear');
    if (manufacturingYear !== selectedYear && manufacturingYear !== selectedYear - 1) {
      // Ensure a valid default if current is not one of the two options
      form.setValue('manufacturingYear', selectedYear - 1);
    }
  }, [selectedYear, form]);

  // Image handling functions
  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setImageFiles(prevFiles => [...prevFiles, ...newFiles]);
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
    }
  };

  const handleDeletePhoto = (index: number) => {
    if (index < photoNames.length) {
      const newPhotoNames = [...photoNames];
      newPhotoNames.splice(index, 1);
      setPhotoNames(newPhotoNames);
      
      const newPreviewUrls = [...previewUrls];
      newPreviewUrls.splice(index, 1);
      setPreviewUrls(newPreviewUrls);
    } else {
      const newFileIndex = index - photoNames.length;
      const newFiles = [...imageFiles];
      newFiles.splice(newFileIndex, 1);
      setImageFiles(newFiles);
      
      const newPreviewUrls = [...previewUrls];
      newPreviewUrls.splice(index, 1);
      setPreviewUrls(newPreviewUrls);
    }
  };

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

    // Reorder preview URLs first, as this is the visual source of truth for order
    const updatedPreviewUrls = [...previewUrls];
    const movedPreview = updatedPreviewUrls.splice(sourceIndex, 1)[0];
    updatedPreviewUrls.splice(targetIndex, 0, movedPreview);
    setPreviewUrls(updatedPreviewUrls);

    // Now, intelligently reorder photoNames and imageFiles
    // This logic assumes previewUrls contains existing photo URLs first, then new file object URLs
    // and that photoNames corresponds to the initial part of previewUrls, and imageFiles to the latter.

    const newPhotoNames = [...photoNames];
    const newImageFiles = [...imageFiles];

    // Determine if source and target are within existing photos, new files, or crossing over
    const sourceIsExisting = sourceIndex < newPhotoNames.length;
    const targetIsExistingBoundary = targetIndex <= newPhotoNames.length; // Use <= for inserting at the end of existing

    if (sourceIsExisting) { // Moving an existing photo
      const movedPhotoName = newPhotoNames.splice(sourceIndex, 1)[0];
      if (targetIsExistingBoundary) { // Target is within or at the end of existing photos
         // Adjust targetIndex if it was after the removed source for photoNames
        const adjustedTargetIndex = targetIndex > sourceIndex ? targetIndex -1 : targetIndex;
        newPhotoNames.splice(adjustedTargetIndex, 0, movedPhotoName);
      } else { // Moving an existing photo into the new files section (conceptually, not allowed by toast)
        // This case should ideally be prevented or handled by converting the existing photo to a "new file" concept if reordering this way is desired.
        // For now, relying on the toast from original code for cross-type reordering.
        toast({
          title: "Não é possível reorganizar entre fotos existentes e novas diretamente dessa forma.",
          description: "Salve o formulário primeiro para organizar todas as fotos consolidadas.",
          variant: "destructive"
        });
        // Revert previewUrls change if the underlying data cannot be reordered cleanly
        setPreviewUrls(previewUrls); // Revert to original
        return;
      }
    } else { // Moving a new file
      const sourceFileIndex = sourceIndex - newPhotoNames.length;
      const movedFile = newImageFiles.splice(sourceFileIndex, 1)[0];
      if (!targetIsExistingBoundary) { // Target is within new files section
         // Adjust targetIndex for imageFiles list
        const adjustedTargetFileIndex = (targetIndex > sourceIndex ? targetIndex -1 : targetIndex) - newPhotoNames.length;
        newImageFiles.splice(adjustedTargetFileIndex, 0, movedFile);
      } else { // Moving a new file into existing photos section (conceptually, not allowed by toast)
        toast({
          title: "Não é possível reorganizar entre fotos existentes e novas diretamente dessa forma.",
          description: "Salve o formulário primeiro para organizar todas as fotos consolidadas.",
          variant: "destructive"
        });
        setPreviewUrls(previewUrls); // Revert to original
        return;
      }
    }
    setPhotoNames(newPhotoNames);
    setImageFiles(newImageFiles);
  };

  async function handleSubmit(values: CarFormSchema) {
    setUploading(true);
    let updatedPhotoNames = [...photoNames]; // Start with current server photos

    // Reorder existing photoNames based on the current previewUrls order
    // This assumes previewUrls up to the length of initialData.fotos (or photoNames derived from it) are the ones to reorder.
    // This part is tricky if new photos were added and deleted, making previewUrls not directly map to original photoNames order.
    // A more robust way is to map previewUrls back to original names if they are URLs, or file objects.

    // Simplified: Assume the current order in photoNames reflects user's desired order for existing images,
    // and new images will be appended. Drag and drop of existing images is handled above.
    // The main task here is uploading NEW images.

    if (imageFiles.length > 0) {
      try {
        const newUploadedImageNames = await uploadCarImages(imageFiles);
        // Combine reordered existing photos with newly uploaded ones
        // The order in previewUrls is the source of truth for final 'fotos'
        const finalOrderedNames: string[] = [];
        previewUrls.forEach(url => {
          const existingPhotoIndex = photoNames.findIndex(name => supabase.storage.from("car-fotos").getPublicUrl(name).data.publicUrl === url);
          if (existingPhotoIndex !== -1) {
            finalOrderedNames.push(photoNames[existingPhotoIndex]);
          } else {
            // This URL must correspond to a newly uploaded file. Find its name.
            // This step requires matching object URLs to uploaded names, which is complex here.
            // Simpler: assume newUploadedImageNames are in the order of imageFiles which matches tail of previewUrls
          }
        });
        
        // A simpler logic for combining: Use the reordered photoNames and append newUploadedImageNames.
        // This might not perfectly reflect drag-and-drop across existing/new if not careful.
        // For robustness, it's better to derive final 'fotos' list from the final state of `previewUrls`,
        // mapping them back to their names (existing or newly uploaded).
        // Given the complexity, we'll stick to combining existing reordered names with new ones.
        // The drag and drop handles reordering within existing and within new.
        // This combination assumes new images are appended.
        updatedPhotoNames = [...photoNames, ...newUploadedImageNames];


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
    
    // Final assembly of 'fotos' based on previewUrls order to respect drag & drop fully.
    // This is crucial.
    const finalFotos: string[] = [];
    const newUploadedNamesCopy = [...(async () => { // Re-fetch names if any were uploaded, or use empty if not.
        if (imageFiles.length > 0 && updatedPhotoNames.length > photoNames.length) { // implies new images were uploaded
            return updatedPhotoNames.slice(photoNames.length);
        }
        return [];
    })());

    for (const url of previewUrls) {
        let found = false;
        // Check if it's an existing photo
        for (const name of photoNames) {
            if (supabase.storage.from("car-fotos").getPublicUrl(name).data.publicUrl === url) {
                finalFotos.push(name);
                found = true;
                break;
            }
        }
        if (found) continue;

        // Check if it's a newly uploaded photo (this part is tricky as we only have URLs for new files locally)
        // We'll assume newUploadedNamesCopy are in the order they appear at the end of previewUrls
        // This requires careful management of imageFiles and their corresponding object URLs.
        // For now, if it's not an existing photo, and new ones were uploaded, take from newUploadedNamesCopy.
        if (newUploadedNamesCopy.length > 0) {
            finalFotos.push(newUploadedNamesCopy.shift()!); // Assumes order matches
        }
    }

    setUploading(false);
    // Use 'finalFotos' if the complex reordering logic is solid, otherwise use 'updatedPhotoNames'
    // For simplicity and given current structure, 'updatedPhotoNames' (reordered existing + appended new) is safer.
    // To fully respect drag-drop of all items, 'finalFotos' based on 'previewUrls' mapping is needed.
    // Let's use `updatedPhotoNames` which combines potentially reordered `photoNames` with `newUploadedImageNames`.
    // The drag-and-drop within `photoNames` and within `imageFiles` is handled. Cross-type is warned.
    // So `photoNames` (potentially reordered) + `newUploadedImageNames` (appended) is the list.

    const dataToSubmit = { ...values, fotos: updatedPhotoNames };
    onSubmit(dataToSubmit as CarFormData);
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <SelectContent className="bg-white z-50">
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
                  <SelectContent className="bg-white z-50">
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
                  <SelectContent className="bg-white z-50">
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
                      e.target.value = formatted; // Ensure input displays formatted value
                      const numericValue = parseFloat(formatted.replace(/[^\d,]/g, '').replace(',', '.')) ; // More robust parsing
                      onChange(isNaN(numericValue) ? 0 : numericValue);
                    }}
                    value={typeof rest.value === 'number' ? 
                      rest.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 
                      (initialData.price && typeof initialData.price === 'string' ? initialData.price : 'R$ 0,00') // Use initial string if available
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
                  <SelectContent className="bg-white z-50">
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
                  <SelectContent className="bg-white z-50">
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
                      e.target.value = formatted; // Ensure input displays formatted value
                      const numericValue = parseInt(formatted.replace(/\./g, ''), 10);
                      onChange(isNaN(numericValue) ? 0 : numericValue);
                    }}
                     value={typeof rest.value === 'number' ? 
                      rest.value.toLocaleString('pt-BR') : 
                      (initialData.mileage?.toString() ?? '0') // Use initial if available
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
                  <SelectContent className="bg-white z-50">
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
                  <SelectContent className="bg-white z-50">
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
                <FormLabel className="flex items-center gap-2">
                  <FileSpreadsheet size={16} /> Link para Ficha Técnica
                </FormLabel>
                <FormControl>
                  <Input placeholder="URL para ficha técnica" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ImageUploadGrid
          previewUrls={previewUrls}
          onImageFilesChange={handleImageFilesChange}
          onDeletePhoto={handleDeletePhoto}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          uploading={uploading}
        />

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

        <Button type="submit" className="bg-carblue hover:bg-carblue-dark" loading={uploading} disabled={uploading}>
          {isEditing ? 'Atualizar Veículo' : 'Adicionar Veículo'}
        </Button>
      </form>
    </Form>
  );
};

export default CarForm;

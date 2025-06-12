import React, { useEffect, useState, useCallback } from 'react';
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
import { Car, List, Pencil, DollarSign, Palette, Gauge, FileText, Video, FileSpreadsheet, Shield, LayoutList, Calendar, LoaderCircle, Tag } from "lucide-react";
import { VehicleType, useFipeBrands } from '@/hooks/useFipeBrands';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency, formatMileage, extractNumericValue } from '@/lib/formUtils';
import { numberToWords } from '@/lib/numberToWords';
import { currentYear, years, engineSizes, colors, categories } from './formConstants';
import { carFormSchema, type CarFormSchema } from './carFormSchema';
import ImageUploadGrid from './ImageUploadGrid';
import { OlxIdTagInput } from './OlxIdTagInput';

interface CarFormProps {
  initialData?: Partial<CarFormData & { fotos?: string[] }>; // fotos will be URLs
  onSubmit: (data: CarFormData & { fotos?: string[] }) => void;
  isEditing?: boolean;
}

interface LocalFileData {
  file: File;
  blobUrl: string;
}

const CarForm: React.FC<CarFormProps> = ({
  initialData = {},
  onSubmit,
  isEditing = false,
}) => {
  let initialPrice = initialData.price || 0;
  if (typeof initialData.price === 'string') {
    initialPrice = extractNumericValue(initialData.price);
  }

  // initialData.fotos are now guaranteed to be URLs by CarContext
  const initialPhotoUrlsFromProps = initialData?.fotos || [];

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
      characteristics: initialData.characteristics || '',
      idanuncioolx: initialData.idanuncioolx || [],
      video: initialData.video || '',
      cautionReport: initialData.cautionReport || '',
      technicalSheet: initialData.technicalSheet || '',
      warranty: initialData.warranty || '',
      category: initialData.category || 'Sedan',
    },
  });

  // Image handling state
  const [orderedPreviewUrls, setOrderedPreviewUrls] = useState<string[]>(initialPhotoUrlsFromProps);
  const [localFilesData, setLocalFilesData] = useState<LocalFileData[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // State for price in words
  const [priceInWords, setPriceInWords] = useState<string>('');
  
  // Watch price field changes
  const currentPrice = form.watch('price');
  
  // Update price in words when price changes
  useEffect(() => {
    if (currentPrice && currentPrice > 0) {
      setPriceInWords(numberToWords(currentPrice));
    } else {
      setPriceInWords('');
    }
  }, [currentPrice]);
  
  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      localFilesData.forEach(item => URL.revokeObjectURL(item.blobUrl));
    };
  }, [localFilesData]);

  const vehicleType = form.watch('vehicleType') as VehicleType;
  const selectedYear = form.watch('year');
  const { data: brands, isLoading: isLoadingBrands } = useFipeBrands(vehicleType);

  useEffect(() => {
    const manufacturingYear = form.getValues('manufacturingYear');
    if (manufacturingYear !== selectedYear && manufacturingYear !== selectedYear - 1) {
      form.setValue('manufacturingYear', selectedYear - 1);
    }
  }, [selectedYear, form]);

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFilesArray = Array.from(files);
      const newLocalFiles: LocalFileData[] = newFilesArray.map(file => ({
        file,
        blobUrl: URL.createObjectURL(file),
      }));
      
      setLocalFilesData(prev => [...prev, ...newLocalFiles]);
      setOrderedPreviewUrls(prev => [...prev, ...newLocalFiles.map(item => item.blobUrl)]);
      // Reset file input to allow selecting the same file again if removed
      e.target.value = ""; 
    }
  };

  const handleDeletePhoto = (indexToDelete: number) => {
    const urlToDelete = orderedPreviewUrls[indexToDelete];
    
    setOrderedPreviewUrls(prev => prev.filter((_, i) => i !== indexToDelete));
    
    const localFileMatch = localFilesData.find(item => item.blobUrl === urlToDelete);
    if (localFileMatch) {
      URL.revokeObjectURL(localFileMatch.blobUrl);
      setLocalFilesData(prev => prev.filter(item => item.blobUrl !== urlToDelete));
    }
    // If it was a DB URL, it's simply removed from `orderedPreviewUrls`.
    // `handleSubmit` will then submit the remaining `orderedPreviewUrls`.
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

    const newOrderedPreviewUrls = [...orderedPreviewUrls];
    const [movedItem] = newOrderedPreviewUrls.splice(sourceIndex, 1);
    newOrderedPreviewUrls.splice(targetIndex, 0, movedItem);
    setOrderedPreviewUrls(newOrderedPreviewUrls);

    // Note: localFilesData does not need reordering here.
    // handleSubmit will map blobUrls from the (reordered) orderedPreviewUrls
    // to their corresponding File objects from localFilesData for upload.
  };

  const characteristicsValue = form.watch('characteristics') || '';

  async function handleSubmit(values: CarFormSchema) {
    setUploading(true);

    const filesToUpload: File[] = [];
    const blobUrlsPresentInOrder: string[] = [];

    // Collect files that are new (blob URLs) in their current display order
    orderedPreviewUrls.forEach(url => {
      const localFile = localFilesData.find(item => item.blobUrl === url);
      if (localFile) {
        filesToUpload.push(localFile.file);
        blobUrlsPresentInOrder.push(localFile.blobUrl);
      }
    });
    
    let newlyUploadedPublicUrls: string[] = [];
    if (filesToUpload.length > 0) {
      try {
        newlyUploadedPublicUrls = await uploadCarImages(filesToUpload);
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

    const blobToPublicUrlMap = new Map<string, string>();
    blobUrlsPresentInOrder.forEach((blobUrl, index) => {
      blobToPublicUrlMap.set(blobUrl, newlyUploadedPublicUrls[index]);
    });

    const finalPhotoUrlsToSubmit: string[] = orderedPreviewUrls.map(previewUrl => {
      if (blobToPublicUrlMap.has(previewUrl)) {
        return blobToPublicUrlMap.get(previewUrl)!; // It's a newly uploaded file
      }
      return previewUrl; // It's an existing DB photo URL (or was passed as such)
    });
    
    setUploading(false);
    // Clean up local blob URLs that are now uploaded
    blobUrlsPresentInOrder.forEach(blobUrl => URL.revokeObjectURL(blobUrl));
    setLocalFilesData(prev => prev.filter(item => !blobUrlsPresentInOrder.includes(item.blobUrl)));
    
    const dataToSubmit = { ...values, fotos: finalPhotoUrlsToSubmit };
    onSubmit(dataToSubmit as CarFormData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Tipo de Veículo e Marca */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="vehicleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Car size={16} /> Tipo de Veículo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-carblue focus:ring-carblue">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white z-50">
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
                    <SelectTrigger className="border-carblue focus:ring-carblue">
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

        {/* Modelo, Ano, Ano de Fabricação */}
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
                    <SelectTrigger className="border-carblue focus:ring-carblue">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white z-50">
                    {years.map((yearVal) => (
                      <SelectItem key={yearVal} value={yearVal.toString()}>
                        {yearVal}
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
                  defaultValue={String(field.value)} // Ensure current value is string for Select
                >
                  <FormControl>
                    <SelectTrigger className="border-carblue focus:ring-carblue">
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
        
        {/* Preço, Cor, Categoria */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><DollarSign size={16} /> Preço (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="R$ 0,00"
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      const numericValue = parseFloat(formatted.replace(/[^\d,]/g, '').replace(',', '.')) ; 
                      onChange(isNaN(numericValue) ? 0 : numericValue);
                    }}
                    value={value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    {...rest}
                  />
                </FormControl>
                {priceInWords && (
                  <div className="text-sm text-gray-600 mt-1 italic">
                    {priceInWords}
                  </div>
                )}
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
                    <SelectTrigger className="border-carblue focus:ring-carblue">
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
                    <SelectTrigger className="border-carblue focus:ring-carblue">
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

        {/* Quilometragem, Motor, Transmissão */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="mileage"
            render={({ field: { onChange, value, ...rest } }) => ( // Destructure value
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Gauge size={16} /> Quilometragem</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="0"
                    onChange={(e) => {
                      const formatted = formatMileage(e.target.value);
                      // e.target.value = formatted; // Let React control value display
                      const numericValue = parseInt(formatted.replace(/\./g, ''), 10);
                      onChange(isNaN(numericValue) ? 0 : numericValue);
                    }}
                    value={value.toLocaleString('pt-BR')} // Display formatted value
                    {...rest}
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
                    <SelectTrigger className="border-carblue focus:ring-carblue">
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
                    <SelectTrigger className="border-carblue focus:ring-carblue">
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

        {/* Disponível em Estoque */}
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

        {/* Link do Vídeo, Garantia */}
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

        {/* Link para Cautelar, Link para Ficha Técnica */}
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

        {/* ImageUploadGrid */}
        <ImageUploadGrid
          previewUrls={orderedPreviewUrls}
          onImageFilesChange={handleImageFilesChange}
          onDeletePhoto={handleDeletePhoto}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          uploading={uploading}
        />

        {/* Características (campo único) */}
        <FormField
          control={form.control}
          name="characteristics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Características (Máx.: 250 caracteres)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva características do veículo"
                  className="min-h-[120px]"
                  maxLength={250}
                  {...field}
                />
              </FormControl>
              <div className="flex justify-end">
                <span className="text-sm text-gray-500">
                  {characteristicsValue.length}/250
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* IDs dos anúncios OLX */}
        <FormField
          control={form.control}
          name="idanuncioolx"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Tag size={16}/> IDs dos anúncios OLX</FormLabel>
              <FormControl>
                <OlxIdTagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Digite os IDs dos anúncios separados por vírgula"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="bg-carblue hover:bg-carblue-dark" loading={uploading || form.formState.isSubmitting} disabled={uploading || form.formState.isSubmitting}>
          { (uploading || form.formState.isSubmitting) ? <LoaderCircle className="animate-spin mr-2" size={16} /> : null}
          {isEditing ? 'Atualizar Veículo' : 'Adicionar Veículo'}
        </Button>
      </form>
    </Form>
  );
};

export default CarForm;

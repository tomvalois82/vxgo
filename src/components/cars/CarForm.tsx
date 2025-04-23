
import React, { useEffect } from 'react';
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
import { Image, Calendar, Car, List, Pencil, DollarSign, Palette, Gauge, FileText, Video, FileSpreadsheet, Shield, LayoutList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VehicleType, useFipeBrands } from '@/hooks/useFipeBrands';

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

const CarForm: React.FC<CarFormProps> = ({
  initialData = {},
  onSubmit,
  isEditing = false,
}) => {
  const form = useForm<z.infer<typeof carFormSchema>>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      vehicleType: (initialData.vehicleType as VehicleType) || 'carros',
      brand: initialData.brand || '',
      model: initialData.model || '',
      year: initialData.year || currentYear,
      manufacturingYear: initialData.manufacturingYear || initialData.year || currentYear - 1,
      price: initialData.price || 0,
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

  // Novo estado para fotos
  const [imageFiles, setImageFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>(
    Array.isArray((initialData as any).fotos)
      ? (initialData as any).fotos.map((nome: string) =>
        supabase.storage.from("car-fotos").getPublicUrl(nome).data.publicUrl
      )
      : []
  );

  // Atualiza previews ao selecionar novas imagens
  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImageFiles(Array.from(files));
      setPreviewUrls(Array.from(files).map(file => URL.createObjectURL(file)));
    }
  };

  async function handleSubmit(values: z.infer<typeof carFormSchema>) {
    setUploading(true);
    let imageNames: string[] = [];

    // Se o usuário subiu novas imagens, faz o upload
    if (imageFiles.length > 0) {
      try {
        imageNames = await uploadCarImages(imageFiles);
      } catch (err: any) {
        alert(err.message || "Erro ao enviar imagens");
        setUploading(false);
        return;
      }
    } else if (Array.isArray((initialData as any).fotos)) {
      // Mantém imagens antigas se não enviou novas
      imageNames = (initialData as any).fotos;
    }

    setUploading(false);

    // Ajuste: adiciona o campo fotos
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
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {previewUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="rounded border aspect-square object-cover h-24 w-full"
                />
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

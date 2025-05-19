import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCrm } from '@/hooks/useCrmData';
import { LeadData } from '@/lib/crmTypes';

const leadSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório."),
  telefone: z.string().min(1, "Telefone é obrigatório.")
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Formato de telefone inválido. Use (XX) XXXXX-XXXX."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  Origem: z.string().optional().nullable(),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

interface AddLeadFormProps {
  onLeadCreated: (newLead: LeadData) => void;
  onCancel: () => void;
}

const origemOptions = [
  "OLX",
  "Instagram/Facebook",
  "Webmotors",
  "iCarros",
  "Site da loja",
  "Cliente de Carteira",
  "Passante",
  "Outros",
];

const formatPhoneNumber = (value: string): string => {
  if (!value) return value;
  const cleaned = value.replace(/\D/g, '');
  const maxLength = 11; // (XX) XXXXX-XXXX
  const limitedCleaned = cleaned.substring(0, maxLength);

  let formatted = '';
  if (limitedCleaned.length > 0) {
    formatted = `(${limitedCleaned.substring(0, 2)}`;
  }
  if (limitedCleaned.length > 2) {
    formatted += `) ${limitedCleaned.substring(2, limitedCleaned.length > 6 ? 7 : limitedCleaned.length)}`;
  }
  if (limitedCleaned.length > 7) {
    formatted += `-${limitedCleaned.substring(7, 11)}`;
  } else if (limitedCleaned.length > 6 && limitedCleaned.length <=7) {
     // handles (XX) XXXXX case, keeps the space
  }


  return formatted.trim();
};


const AddLeadForm: React.FC<AddLeadFormProps> = ({ onLeadCreated, onCancel }) => {
  const { addLead } = useCrm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      Origem: null,
    },
  });

  const onSubmit = async (values: LeadFormValues) => {
    setIsSubmitting(true);
    const submissionData = {
      nome: values.nome,
      telefone: values.telefone, // Already formatted with mask
      email: values.email || null,
      Origem: values.Origem || null,
    };
    
    const newLead = await addLead(submissionData);
    setIsSubmitting(false);
    if (newLead) {
      form.reset();
      onLeadCreated(newLead);
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    form.setValue('telefone', formatted, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome*</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo do lead" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone*</FormLabel>
              <FormControl>
                <Input 
                  placeholder="(XX) XXXXX-XXXX" 
                  {...field} 
                  onChange={handleTelefoneChange}
                  maxLength={15} // (XX) XXXXX-XXXX
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="Origem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origem</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {origemOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Lead'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddLeadForm;

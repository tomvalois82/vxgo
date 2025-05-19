
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { useCrm } from '@/hooks/useCrmData';
import { AddLeadFormInput, LeadData, leadOrigemOptions } from '@/lib/crmTypes';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.'),
  telefone: z.string().min(10, 'Telefone é obrigatório e deve ser válido.').refine(val => /^\(\d{2}\)\d{4,5}-\d{4}$/.test(val) || /^\d{10,11}$/.test(val), {
    message: "Telefone inválido. Use (XX)XXXXX-XXXX ou apenas números." // Simple validation, mask can be client-side
  }),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  Origem: z.string().optional().or(z.literal('')),
});

interface AddLeadFormProps {
  onFormSubmit: (newLead: LeadData) => void;
  onCancel: () => void;
}

const AddLeadForm: React.FC<AddLeadFormProps> = ({ onFormSubmit, onCancel }) => {
  const { addLead } = useCrm();
  const form = useForm<AddLeadFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      Origem: '',
    },
  });

  const onSubmit = async (values: AddLeadFormInput) => {
    const newLead = await addLead(values);
    if (newLead) {
      onFormSubmit(newLead);
    }
  };
  
  // Basic phone masking logic - can be improved with a library
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
    if (value.length > 11) value = value.substring(0, 11); // Max 11 digits

    if (value.length > 2) {
      value = `(${value.substring(0, 2)})${value.substring(2)}`;
    }
    if (value.length > (value.startsWith('(90)') ? 8 : (value.length > 6 && value.charAt(6) === '9' ? 9 : 8))) { // Check for 9th digit
        if (value.length > 6 && (value.charAt(6) === '9' || value.charAt(5) === '9')) { // if it's mobile (9th digit)
             value = `${value.substring(0, value.length - 4)}-${value.substring(value.length - 4)}`;
        } else if (value.length > 5 && value.charAt(5) !== '9'){ // if it's landline
             value = `${value.substring(0, value.length - 4)}-${value.substring(value.length - 4)}`;
        }
    }
    // For 11 digits like (XX)9XXXX-XXXX or 10 digits (XX)XXXX-XXXX
    if (value.length > 6) {
        const part1Length = value.indexOf(')') + 1;
        const digitsAfterParen = value.substring(part1Length).replace('-', '');
        if (digitsAfterParen.length > 5) { // mobile with 9
             value = `${value.substring(0, part1Length + 5)}-${value.substring(part1Length + 5)}`;
        } else if (digitsAfterParen.length > 4) { // landline or mobile with 8
             value = `${value.substring(0, part1Length + 4)}-${value.substring(part1Length + 4)}`;
        }
    }
    
    // Simplified mask for entry: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
    // This is a basic implementation. A dedicated masking library is better.
    let maskedValue = value.replace(/\D/g, '');
    if (maskedValue.length > 0) {
      maskedValue = `(${maskedValue.substring(0, 2)}${maskedValue.length > 2 ? ') ' : ''}${maskedValue.substring(2, 7)}${maskedValue.length > 7 ? '-' : ''}${maskedValue.substring(7, 11)}`;
    }
    // Correctly apply formatted value back to the form state
    // This basic masking is tricky. For a robust solution, consider react-input-mask or similar.
    // For now, let's just set the raw digits or a very simple format.
    let displayValue = e.target.value.replace(/\D/g, '');
    if (displayValue.length > 0) displayValue = `(${displayValue.substring(0, 2)}) ${displayValue.substring(2, displayValue.length > 6 ? 7 : 6)}-${displayValue.substring(displayValue.length > 6 ? 7 : 6, 11)}`;
    
    form.setValue('telefone', e.target.value); // Store raw or minimally formatted value
  };


  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" {...form.register('nome')} />
        {form.formState.errors.nome && <p className="text-sm text-red-600">{form.formState.errors.nome.message}</p>}
      </div>
      <div>
        <Label htmlFor="telefone">Telefone</Label>
        <Input 
          id="telefone" 
          {...form.register('telefone')} 
          placeholder="(XX) XXXXX-XXXX"
          onChange={handlePhoneChange} // Apply mask on change
        />
        {form.formState.errors.telefone && <p className="text-sm text-red-600">{form.formState.errors.telefone.message}</p>}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register('email')} />
        {form.formState.errors.email && <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="Origem">Origem</Label>
        <Select onValueChange={(value) => form.setValue('Origem', value)} defaultValue={form.getValues('Origem') || ''}>
          <SelectTrigger id="Origem">
            <SelectValue placeholder="Selecione a origem" />
          </SelectTrigger>
          <SelectContent>
            {leadOrigemOptions.map((origem) => (
              <SelectItem key={origem} value={origem}>{origem}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Lead'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default AddLeadForm;

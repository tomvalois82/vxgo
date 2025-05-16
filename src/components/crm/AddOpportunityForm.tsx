import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { KanbanColumnData, LeadData, OpportunityData } from '@/lib/crmTypes';
import { useCrm } from '@/hooks/useCrmData';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency, extractNumericValue } from '@/lib/formUtils';

const opportunitySchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório."),
  id_lead: z.number().nullable().optional(),
  valor: z.string().optional().nullable(), // Will be string like "10.000,50"
  ultima_interacao: z.date().optional().nullable(),
  id_kanban: z.string().min(1, "Situação é obrigatória."), // Comes as string from select
  obs: z.string().optional().nullable(),
  resumo: z.string().optional().nullable(),
  // status is not part of the form, will be defaulted
});

export type OpportunityFormValues = z.infer<typeof opportunitySchema>;

interface AddOpportunityFormProps {
  onFormSubmit: () => void; // Callback to close dialog or refresh
}

const AddOpportunityForm: React.FC<AddOpportunityFormProps> = ({ onFormSubmit }) => {
  const { addOpportunity, kanbanColumns, leads, isLoading: crmLoading } = useCrm();
  const [valorField, setValorField] = useState("");
  const [leadSearchOpen, setLeadSearchOpen] = useState(false);

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      titulo: '',
      id_lead: null,
      valor: '',
      ultima_interacao: null,
      id_kanban: kanbanColumns.find(k => k.posicao === 0)?.id.toString() || kanbanColumns[0]?.id.toString() || '',
      obs: '',
      resumo: '',
    },
  });

  const onSubmit = async (values: OpportunityFormValues) => {
    const numericValor = values.valor ? extractNumericValue(values.valor).toString() : null;
    
    const submissionData: Omit<OpportunityData, "id" | "created_at" | "id_usuario" | "data_criacao"> & { id_kanban: number } = {
      titulo: values.titulo,
      id_lead: values.id_lead,
      valor: numericValor,
      ultima_interacao: values.ultima_interacao ? values.ultima_interacao.toISOString() : null,
      obs: values.obs || null,
      resumo: values.resumo || null,
      id_kanban: Number(values.id_kanban),
      status: 'Ativa', // Default status for new opportunities
      // data_criacao and id_usuario will be set in the hook
    };
    
    const result = await addOpportunity(submissionData);
    if (result) {
      form.reset();
      setValorField("");
      onFormSubmit(); // Close dialog / trigger refresh
    }
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValorField(formatted);
    form.setValue('valor', formatted);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Oportunidade*</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Venda de Produto X" {...field} className="text-base font-semibold" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="id_lead"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Lead</FormLabel>
              <Popover open={leadSearchOpen} onOpenChange={setLeadSearchOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={leadSearchOpen}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? leads.find((lead) => lead.id === field.value)?.nome
                        : "Selecione um Lead"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar lead..." />
                    <CommandList>
                      <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>
                      <CommandGroup>
                        {leads.map((lead) => (
                          <CommandItem
                            key={lead.id}
                            value={lead.nome || `Lead ID: ${lead.id}`}
                            onSelect={() => {
                              form.setValue("id_lead", lead.id);
                              setLeadSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                lead.id === field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {lead.nome || `Lead ID: ${lead.id}`} ({lead.email || lead.telefone})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="R$ 0,00" 
                  {...field} 
                  value={valorField}
                  onChange={handleValorChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="id_kanban"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Situação*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a situação" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {kanbanColumns.sort((a, b) => (a.posicao || 0) - (b.posicao || 0)).map((col) => (
                    <SelectItem key={col.id} value={col.id.toString()}>
                      {col.descricao}
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
          name="ultima_interacao"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Última Interação</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP HH:mm")
                      ) : (
                        <span>Escolha data e hora</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                        // For simplicity, this date picker doesn't have time.
                        // We'll set current time if a date is picked.
                        if (date) {
                            const now = new Date();
                            date.setHours(now.getHours());
                            date.setMinutes(now.getMinutes());
                        }
                        field.onChange(date);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resumo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumo</FormLabel>
              <FormControl>
                <Textarea placeholder="Um breve resumo da oportunidade..." {...field} value={field.value ?? ''}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="obs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes adicionais, notas..." {...field} value={field.value ?? ''}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting || crmLoading} className="w-full">
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Oportunidade'}
        </Button>
      </form>
    </Form>
  );
};

export default AddOpportunityForm;

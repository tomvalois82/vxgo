import React, { useState, useEffect } from 'react';
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
import { KanbanColumnData, LeadData } from '@/lib/crmTypes';
import { useCrm } from '@/hooks/useCrmData';
import { CalendarIcon, Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency, extractNumericValue } from '@/lib/formUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import AddLeadForm from './AddLeadForm';

type AddOpportunityHookInput = Parameters<ReturnType<typeof useCrm>['addOpportunity']>[0];

const opportunitySchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório."),
  dataCriacao: z.date().optional().nullable(),
  id_lead: z.number().nullable().optional(),
  idEstoque: z.string().nullable().optional(),
  valor: z.string().optional().nullable(),
  id_kanban: z.string().min(1, "Situação é obrigatória."),
  obs: z.string().optional().nullable(),
  resumo: z.string().optional().nullable(),
});

export type OpportunityFormValues = z.infer<typeof opportunitySchema>;

interface AddOpportunityFormProps {
  onFormSubmit: () => void;
}

const AddOpportunityForm: React.FC<AddOpportunityFormProps> = ({ onFormSubmit }) => {
  const { 
    addOpportunity, 
    kanbanColumns, 
    leads, 
    userStockVehicles,
    isUserStockLoading, 
    isLoading: crmLoading,
  } = useCrm();
  const [valorField, setValorField] = useState("");
  const [leadSearchOpen, setLeadSearchOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      titulo: '',
      dataCriacao: new Date(),
      id_lead: null,
      idEstoque: null,
      valor: '',
      id_kanban: '', // Will be set in useEffect
      obs: '',
      resumo: '',
    },
  });

  useEffect(() => {
    if (kanbanColumns.length > 0 && !form.getValues('id_kanban')) {
      const initialKanban = kanbanColumns.find(k => k.posicao === 0) || kanbanColumns[0];
      if (initialKanban) {
        form.setValue('id_kanban', initialKanban.id.toString());
      }
    }
  }, [kanbanColumns, form]);

  const onSubmit = async (values: OpportunityFormValues) => {
    const numericValor = values.valor ? extractNumericValue(values.valor).toString() : null;
    
    // Ensure submissionData matches AddOpportunityHookInput type
    const submissionData: AddOpportunityHookInput = {
      titulo: values.titulo,
      data_criacao: values.dataCriacao ? values.dataCriacao.toISOString() : null,
      id_lead: values.id_lead,
      idEstoque: values.idEstoque ? Number(values.idEstoque) : null,
      valor: numericValor,
      obs: values.obs || null,
      resumo: values.resumo || null,
      id_kanban: Number(values.id_kanban),
      status: 'Ativa', // Default status
    };
    
    const result = await addOpportunity(submissionData);
    if (result) {
      form.reset({
        titulo: '',
        dataCriacao: new Date(),
        id_lead: null,
        idEstoque: null,
        valor: '',
        id_kanban: kanbanColumns.find(k => k.posicao === 0)?.id.toString() || kanbanColumns[0]?.id.toString() || '',
        obs: '',
        resumo: '',
      });
      setValorField("");
      onFormSubmit();
    }
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValorField(formatted);
    form.setValue('valor', formatted);
  };

  const handleLeadCreated = (newLead: LeadData) => {
    form.setValue('id_lead', newLead.id, { shouldValidate: true });
    setIsAddLeadModalOpen(false);
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
          name="dataCriacao"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Criação</FormLabel>
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
                        format(field.value, "dd/MM/yyyy HH:mm")
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
                        // Preserve time if date is already set, or set current time if new date
                        let newDate = date;
                        if (newDate) {
                            const currentTime = field.value || new Date(); // Use existing time or now
                            newDate.setHours(currentTime.getHours());
                            newDate.setMinutes(currentTime.getMinutes());
                            newDate.setSeconds(currentTime.getSeconds());
                        }
                        field.onChange(newDate);
                    }}
                    initialFocus
                    className="pointer-events-auto" // Ensure calendar is interactive
                  />
                  {/* Basic time picker (could be enhanced) */}
                  {field.value && (
                    <div className="p-2 border-t flex items-center justify-center space-x-2">
                      <Input
                        type="time"
                        className="w-auto"
                        value={format(field.value, "HH:mm")}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':').map(Number);
                          const newDateWithTime = new Date(field.value!);
                          newDateWithTime.setHours(hours);
                          newDateWithTime.setMinutes(minutes);
                          field.onChange(newDateWithTime);
                        }}
                      />
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="id_lead"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <div className="flex justify-between items-center">
                <FormLabel>Lead</FormLabel>
                <Dialog open={isAddLeadModalOpen} onOpenChange={setIsAddLeadModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 h-auto">
                      <PlusCircle className="h-4 w-4 mr-1" /> Novo Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Lead</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes abaixo para criar um novo lead.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 max-h-[60vh] overflow-y-auto pr-1">
                      <AddLeadForm 
                        onLeadCreated={handleLeadCreated}
                        onCancel={() => setIsAddLeadModalOpen(false)}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
                        ? leads.find((lead) => lead.id === field.value)?.nome || `Lead ID: ${field.value}`
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
                            {lead.nome || `Lead ID: ${lead.id}`} 
                            {(lead.email || lead.telefone) && 
                              ` (${[lead.email, lead.telefone].filter(Boolean).join(' / ')})`
                            }
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
          name="idEstoque"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Veículo de Interesse</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || undefined}
                disabled={isUserStockLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um veículo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isUserStockLoading ? (
                    <SelectItem value="loading" disabled>Carregando veículos...</SelectItem>
                  ) : userStockVehicles.length === 0 ? (
                    <SelectItem value="no-vehicles" disabled>Nenhum veículo em estoque encontrado</SelectItem>
                  ) : (
                    userStockVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.modelo} ({vehicle.fabricante})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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

        {/* Última Interação field is removed */}

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

        <Button type="submit" disabled={form.formState.isSubmitting || crmLoading || isUserStockLoading} className="w-full">
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Oportunidade'}
        </Button>
      </form>
    </Form>
  );
};

export default AddOpportunityForm;

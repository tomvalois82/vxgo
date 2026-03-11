import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface OportunidadeAnexo {
  id: number;
  id_oportunidade: number | null;
  url: string | null;
  nome_arquivo: string | null;
  publico: boolean | null;
  created_at: string;
}

export function useOportunidadeAnexos(oppId: number | null) {
  const queryClient = useQueryClient();
  const queryKey = ['oportunidade-anexos', oppId];

  const { data: anexos = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!oppId) return [];
      const { data, error } = await supabase
        .from('oportunidade_anexo')
        .select('*')
        .eq('id_oportunidade', oppId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OportunidadeAnexo[];
    },
    enabled: !!oppId,
  });

  const uploadAnexo = useMutation({
    mutationFn: async ({ file, oppId }: { file: File; oppId: number }) => {
      const ext = file.name.split('.').pop();
      const fileName = `${oppId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from('oportunidade-anexos')
        .upload(fileName, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('oportunidade-anexos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('oportunidade_anexo')
        .insert({
          id_oportunidade: oppId,
          url: urlData.publicUrl,
          nome_arquivo: file.name,
          publico: false,
        });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao enviar arquivo', description: error.message, variant: 'destructive' });
    },
  });

  const togglePublico = useMutation({
    mutationFn: async ({ id, publico }: { id: number; publico: boolean }) => {
      const { error } = await supabase
        .from('oportunidade_anexo')
        .update({ publico })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const deleteAnexo = useMutation({
    mutationFn: async ({ id, url }: { id: number; url: string }) => {
      // Extract file path from URL
      const bucketUrl = supabase.storage.from('oportunidade-anexos').getPublicUrl('').data.publicUrl;
      const filePath = url.replace(bucketUrl, '');
      
      if (filePath) {
        await supabase.storage.from('oportunidade-anexos').remove([filePath]);
      }

      const { error } = await supabase
        .from('oportunidade_anexo')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Anexo removido' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });

  return { anexos, isLoading, uploadAnexo, togglePublico, deleteAnexo };
}

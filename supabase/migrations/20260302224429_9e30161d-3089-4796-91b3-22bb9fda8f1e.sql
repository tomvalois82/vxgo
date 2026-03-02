
ALTER TABLE public.atividade
  DROP CONSTRAINT IF EXISTS atividade_id_oportunidade_fkey,
  ADD CONSTRAINT atividade_id_oportunidade_fkey
    FOREIGN KEY (id_oportunidade) REFERENCES public.opotunidade(id) ON DELETE CASCADE;

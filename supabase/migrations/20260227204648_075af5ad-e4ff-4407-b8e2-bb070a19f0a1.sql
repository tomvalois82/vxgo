
CREATE OR REPLACE FUNCTION public.get_users_by_config(p_config bigint)
RETURNS TABLE(id bigint, nome text) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT u.id, u.nome
  FROM public.usuario u
  WHERE u.config = p_config
    AND u.ativo = true
  ORDER BY u.nome;
$$;

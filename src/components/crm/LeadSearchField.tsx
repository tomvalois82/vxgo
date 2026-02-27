import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export interface LeadOption {
  id: number;
  nome: string | null;
  telefone: string | null;
}

interface LeadSearchFieldProps {
  selectedLead: LeadOption | null;
  onSelectLead: (lead: LeadOption | null) => void;
  onCreateNew: () => void;
}

const LeadSearchField: React.FC<LeadSearchFieldProps> = ({
  selectedLead,
  onSelectLead,
  onCreateNew,
}) => {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<LeadOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = async (term: string) => {
    if (!profile?.config || !term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const t = `%${term.trim()}%`;
      const { data, error } = await supabase
        .from('lead')
        .select('id, nome, telefone')
        .eq('config', profile.config)
        .or(`nome.ilike.${t},telefone.ilike.${t}`)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error) setResults((data as LeadOption[]) || []);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        doSearch(value);
        setIsOpen(true);
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (lead: LeadOption) => {
    onSelectLead(lead);
    setSearch('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectLead(null);
    setSearch('');
  };

  if (selectedLead) {
    return (
      <div className="space-y-2">
        <Label>Lead</Label>
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate">
            {selectedLead.nome || 'Sem nome'}
            {selectedLead.telefone ? ` — ${selectedLead.telefone}` : ''}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label>Lead</Label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          />
          {isOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
              {loading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Buscando...</div>
              )}
              {!loading && results.length === 0 && search.trim().length >= 2 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum lead encontrado</div>
              )}
              {results.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors cursor-pointer'
                  )}
                  onClick={() => handleSelect(lead)}
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {lead.nome || 'Sem nome'}
                    {lead.telefone ? ` — ${lead.telefone}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={onCreateNew}
          title="Criar novo lead"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default LeadSearchField;


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Bold, Italic, Code, List, ListOrdered, Quote, Link, Image, Table, Hash, Minus, Eye, Edit } from 'lucide-react';

const PromptEditorOlx = () => {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const queryClient = useQueryClient();

  // Verifica se o usuário é super admin
  if (!profile?.superadm) {
    return <Navigate to="/" replace />;
  }

  // Buscar dados da configuração - GARANTINDO que não há limitação de tamanho
  const { data: config, isLoading } = useQuery({
    queryKey: ['config-olx', configId],
    queryFn: async () => {
      if (!configId) throw new Error('Config ID não fornecido');
      
      const configIdNumber = parseInt(configId, 10);
      if (isNaN(configIdNumber)) throw new Error('Config ID inválido');
      
      console.log('Buscando configuração ID:', configIdNumber);
      
      // Busca DIRETA sem limitações - usando maybeSingle para evitar problemas
      const { data, error } = await supabase
        .from('config')
        .select('promptolx, usuario:idusuario(nome)')
        .eq('id', configIdNumber)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar config:', error);
        throw error;
      }
      
      console.log('Dados recebidos:', data);
      if (data?.promptolx) {
        console.log('Tamanho do promptolx recebido:', data.promptolx.length);
      }
      
      return data;
    },
    enabled: !!configId,
  });

  // Atualizar conteúdo quando os dados carregarem - CARREGAMENTO COMPLETO
  useEffect(() => {
    if (config?.promptolx) {
      console.log('Carregando conteúdo completo. Tamanho original:', config.promptolx.length);
      // Define o conteúdo COMPLETO, sem qualquer tipo de limitação
      setContent(config.promptolx);
      console.log('Conteúdo definido no state. Tamanho:', config.promptolx.length);
    } else if (config?.promptolx === '') {
      console.log('Campo promptolx está vazio');
      setContent('');
    }
  }, [config]);

  // Mutation para salvar - SALVA CONTEÚDO COMPLETO
  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      if (!configId) throw new Error('Config ID não fornecido');
      
      const configIdNumber = parseInt(configId, 10);
      if (isNaN(configIdNumber)) throw new Error('Config ID inválido');
      
      console.log('Iniciando salvamento. Tamanho do conteúdo:', newContent.length);
      console.log('Primeiros 100 caracteres:', newContent.substring(0, 100));
      console.log('Últimos 100 caracteres:', newContent.substring(newContent.length - 100));
      
      const { error } = await supabase
        .from('config')
        .update({ promptolx: newContent })
        .eq('id', configIdNumber);
      
      if (error) {
        console.error('Erro ao salvar:', error);
        throw error;
      }
      
      console.log('Conteúdo salvo com sucesso. Tamanho final:', newContent.length);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-olx', configId] });
      toast({
        title: "Sucesso",
        description: "Prompt OLX salvo com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error saving prompt:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar prompt OLX.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    console.log('Iniciando salvamento via handleSave. Tamanho atual:', content.length);
    saveMutation.mutate(content);
  };

  const insertMarkdown = (before: string, after: string = '') => {
    if (!textareaRef || viewMode) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newText);

    // Reposicionar cursor
    setTimeout(() => {
      if (textareaRef) {
        const newCursorPos = start + before.length + selectedText.length + after.length;
        textareaRef.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.focus();
      }
    }, 0);
  };

  // Função para renderizar markdown básico
  const renderMarkdown = (text: string) => {
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 border-b border-gray-200 pb-2">$1</h1>')
      // Bold and Italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">$1</blockquote>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return html;
  };

  const toolbarButtons = [
    { icon: Hash, label: 'Cabeçalho', action: () => insertMarkdown('# ') },
    { icon: Bold, label: 'Negrito', action: () => insertMarkdown('**', '**') },
    { icon: Italic, label: 'Itálico', action: () => insertMarkdown('*', '*') },
    { icon: Code, label: 'Código Inline', action: () => insertMarkdown('`', '`') },
    { icon: Quote, label: 'Citação', action: () => insertMarkdown('> ') },
    { icon: List, label: 'Lista', action: () => insertMarkdown('- ') },
    { icon: ListOrdered, label: 'Lista Numerada', action: () => insertMarkdown('1. ') },
    { icon: Link, label: 'Link', action: () => insertMarkdown('[', '](url)') },
    { icon: Image, label: 'Imagem', action: () => insertMarkdown('![alt](', ')') },
    { icon: Table, label: 'Tabela', action: () => insertMarkdown('| Col1 | Col2 |\n|------|------|\n| Cell | Cell |') },
    { icon: Minus, label: 'Linha Horizontal', action: () => insertMarkdown('\n---\n') },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando configuração...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Configuração não encontrada</h1>
          <Button onClick={() => navigate('/dashboard/users')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Usuários
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard/users')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold">Editor de Prompt OLX</h1>
            <p className="text-sm text-gray-600">
              Usuário: {config.usuario?.nome || 'N/A'} | Caracteres: {content.length}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saveMutation.isPending}
          className="bg-carblue hover:bg-carblue-dark flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex flex-wrap gap-1 items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {toolbarButtons.map((button, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={button.action}
                title={button.label}
                className="h-8 px-2"
                disabled={viewMode}
              >
                <button.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
          
          {/* Toggle View/Edit Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(!viewMode)}
            className="flex items-center gap-2 h-8"
          >
            {viewMode ? (
              <>
                <Edit className="w-4 h-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                View
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor/Viewer Area - Full Width */}
      <div className="flex-1 p-4">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {viewMode ? '👁️ Visualização' : '📝 Editor Markdown'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-full">
            {viewMode ? (
              // Modo Visualização
              <div 
                className="w-full h-full p-4 overflow-y-auto prose prose-sm max-w-none"
                style={{ minHeight: 'calc(100vh - 240px)' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            ) : (
              // Modo Edição - TEXTAREA SEM LIMITAÇÕES
              <textarea
                ref={setTextareaRef}
                value={content}
                onChange={(e) => {
                  console.log('Mudança no textarea. Novo tamanho:', e.target.value.length);
                  setContent(e.target.value);
                }}
                placeholder="Digite seu prompt OLX em Markdown aqui... (SEM limitação de caracteres)"
                className="w-full h-full border-0 resize-none focus:ring-0 font-mono text-sm leading-relaxed p-4 outline-none"
                style={{ 
                  minHeight: 'calc(100vh - 240px)'
                }}
                spellCheck={false}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromptEditorOlx;

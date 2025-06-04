
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Bold, Italic, Code, List, ListOrdered, Quote, Link, Image, Table, Hash, Minus } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

// Função simples para converter Markdown para HTML
const parseMarkdown = (text: string): string => {
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/__(.*)\__/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/_(.*)\_ /gim, '<em>$1</em>')
    // Code inline
    .replace(/`(.*)`/gim, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Line breaks
    .replace(/\n$/gim, '<br>')
    .replace(/\n/gim, '<br>')
    // Quote
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^[0-9]+\. (.*$)/gim, '<li>$1</li>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr>')
    .replace(/^\*\*\*$/gim, '<hr>')
    .replace(/^___$/gim, '<hr>');
};

const PromptEditor = () => {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const queryClient = useQueryClient();

  // Verifica se o usuário é super admin
  if (!profile?.superadm) {
    return <Navigate to="/" replace />;
  }

  // Buscar dados da configuração
  const { data: config, isLoading } = useQuery({
    queryKey: ['config', configId],
    queryFn: async () => {
      if (!configId) throw new Error('Config ID não fornecido');
      
      const configIdNumber = parseInt(configId, 10);
      if (isNaN(configIdNumber)) throw new Error('Config ID inválido');
      
      const { data, error } = await supabase
        .from('config')
        .select('promptwtz, usuario:idusuario(nome)')
        .eq('id', configIdNumber)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!configId,
  });

  // Atualizar conteúdo quando os dados carregarem
  useEffect(() => {
    if (config?.promptwtz) {
      setContent(config.promptwtz);
    }
  }, [config]);

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      if (!configId) throw new Error('Config ID não fornecido');
      
      const configIdNumber = parseInt(configId, 10);
      if (isNaN(configIdNumber)) throw new Error('Config ID inválido');
      
      const { error } = await supabase
        .from('config')
        .update({ promptwtz: newContent })
        .eq('id', configIdNumber);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', configId] });
      toast({
        title: "Sucesso",
        description: "Prompt salvo com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error saving prompt:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar prompt.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(content);
  };

  const insertMarkdown = (before: string, after: string = '') => {
    if (!textareaRef) return;

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
          <Button onClick={() => navigate('/users')} className="mt-4">
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
            onClick={() => navigate('/users')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold">Editor de Prompt</h1>
            <p className="text-sm text-gray-600">
              Usuário: {config.usuario?.nome || 'N/A'}
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
        <div className="flex flex-wrap gap-1">
          {toolbarButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={button.action}
              title={button.label}
              className="h-8 px-2"
            >
              <button.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Editor com 2 colunas */}
      <div className="flex-1 p-4">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Coluna Esquerda - Editor */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <Card className="h-full mr-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">📝 Editor Markdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <Textarea
                  ref={setTextareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Digite seu prompt em Markdown aqui..."
                  className="w-full h-full min-h-[600px] border-0 resize-none focus:ring-0 font-mono text-sm leading-relaxed"
                  style={{ minHeight: 'calc(100vh - 280px)' }}
                />
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Coluna Direita - Preview */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <Card className="h-full ml-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">👁️ Visualização</CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-y-auto">
                <div 
                  className="prose prose-sm max-w-none h-full"
                  style={{ minHeight: 'calc(100vh - 280px)' }}
                  dangerouslySetInnerHTML={{
                    __html: content ? parseMarkdown(content) : '<p class="text-gray-400">O preview aparecerá aqui conforme você digita...</p>'
                  }}
                />
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default PromptEditor;

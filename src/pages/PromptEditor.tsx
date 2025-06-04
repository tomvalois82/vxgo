
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Bold, Italic, Code, List, ListOrdered, Quote, Link, Image, Table, Hash, Minus, Eye, Edit } from 'lucide-react';

const PromptEditor = () => {
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

  // Atualizar conteúdo quando os dados carregarem - SEM limitação de caracteres
  useEffect(() => {
    if (config?.promptwtz) {
      // Carrega o conteúdo COMPLETO sem qualquer limitação
      setContent(config.promptwtz);
      console.log('Conteúdo carregado - tamanho:', config.promptwtz.length);
    }
  }, [config]);

  // Mutation para salvar - SEM limitação de caracteres
  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      if (!configId) throw new Error('Config ID não fornecido');
      
      const configIdNumber = parseInt(configId, 10);
      if (isNaN(configIdNumber)) throw new Error('Config ID inválido');
      
      console.log('Salvando conteúdo - tamanho:', newContent.length);
      
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
    console.log('Salvando conteúdo com tamanho:', content.length);
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
              // Modo Edição - Full Width, SEM limitação de caracteres
              <Textarea
                ref={setTextareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite seu prompt em Markdown aqui... (sem limitação de caracteres)"
                className="w-full h-full border-0 resize-none focus:ring-0 font-mono text-sm leading-relaxed"
                style={{ minHeight: 'calc(100vh - 240px)' }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromptEditor;

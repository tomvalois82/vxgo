
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
                  className="prose prose-sm max-w-none h-full prose-headings:mt-4 prose-headings:mb-2 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-h6:text-xs prose-table:border-collapse prose-table:w-full prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2"
                  style={{ minHeight: 'calc(100vh - 280px)' }}
                >
                  {content ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ children }) => (
                          <table className="border-collapse w-full my-4 border border-gray-300">
                            {children}
                          </table>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-gray-100">
                            {children}
                          </thead>
                        ),
                        th: ({ children }) => (
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-gray-300 px-4 py-2">
                            {children}
                          </td>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold mt-6 mb-4 border-b border-gray-200 pb-2">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-bold mt-5 mb-3">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-lg font-semibold mt-4 mb-2">
                            {children}
                          </h3>
                        ),
                        h4: ({ children }) => (
                          <h4 className="text-base font-semibold mt-3 mb-2">
                            {children}
                          </h4>
                        ),
                        h5: ({ children }) => (
                          <h5 className="text-sm font-semibold mt-2 mb-1">
                            {children}
                          </h5>
                        ),
                        h6: ({ children }) => (
                          <h6 className="text-xs font-semibold mt-2 mb-1 text-gray-600">
                            {children}
                          </h6>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children, ...props }) => (
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-100 p-4 rounded overflow-x-auto my-4">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-400">O preview aparecerá aqui conforme você digita...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default PromptEditor;


import React, { useState, useEffect, useRef } from 'react';
import { useLeads, Lead } from '@/hooks/crm/useLeads';
import { useMessages } from '@/hooks/crm/useMessages';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User, RefreshCw } from 'lucide-react';
import ReleaseInterventionButton from '@/components/crm/ReleaseInterventionButton';

const Atendimentos = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { data: leads, isLoading: leadsLoading, refetch: refetchLeads } = useLeads();
  
  // Get session ID for the selected lead (prioritize WhatsApp over OLX)
  const sessionId = selectedLead?.session_id_whatsaap || selectedLead?.session_id_olx || null;
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useMessages(sessionId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages load or update
  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '';
    // Remove all non-numeric characters
    return phone.replace(/\D/g, '');
  };

  const getLeadDisplayName = (lead: Lead) => {
    if (lead.nome) return lead.nome;
    return formatPhoneNumber(lead.telefone) || 'Contato sem nome';
  };

  const getLeadInitials = (lead: Lead) => {
    if (lead.nome) {
      return lead.nome.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    }
    const phone = formatPhoneNumber(lead.telefone);
    return phone ? phone.slice(-2) : '??';
  };

  const getOriginInfo = (lead: Lead) => {
    const origem = lead.Origem?.toLowerCase() || '';
    
    if (origem.includes('whatsapp')) {
      return { text: 'WhatsApp', backgroundColor: '#b4f5d3' };
    }
    if (origem.includes('olx')) {
      return { text: 'OLX', backgroundColor: '#f0e6ff' };
    }
    if (origem.includes('instagram')) {
      return { text: 'Instagram', backgroundColor: '#f8b4e1' };
    }
    
    return { text: 'Desconhecido', backgroundColor: '#f2f2f2' };
  };

  const truncateInterest = (interest: string | null, maxLength: number = 30) => {
    if (!interest) return '';
    if (interest.length <= maxLength) return interest;
    return interest.substring(0, maxLength) + '...';
  };

  const handleRefreshMessages = () => {
    if (sessionId) {
      refetchMessages();
    }
  };

  const shouldShowReleaseButton = (lead: Lead) => {
    if (!lead.intervencao) return false;
    const interventionDate = new Date(lead.intervencao);
    const now = new Date();
    return interventionDate > now;
  };

  const handleInterventionReleased = async () => {
    // Reload both leads list and current conversation
    await refetchLeads();
    if (sessionId) {
      await refetchMessages();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-gray-50">
      {/* Left Column - Leads List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle size={20} />
            Conversas
          </h2>
        </div>
        
        <ScrollArea className="flex-1">
          {leadsLoading ? (
            <div className="p-4 text-center text-gray-500">
              Carregando conversas...
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nenhuma conversa encontrada
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {leads.map((lead) => {
                const originInfo = getOriginInfo(lead);
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedLead?.id === lead.id ? 'bg-blue-50 border-r-2 border-carblue' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-carblue text-white text-sm">
                          {getLeadInitials(lead)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getLeadDisplayName(lead)}
                          </p>
                          <span 
                            className="text-xs font-medium text-gray-800 px-2 py-1 rounded"
                            style={{ backgroundColor: originInfo.backgroundColor }}
                          >
                            {originInfo.text}
                          </span>
                        </div>
                        {lead.telefone && (
                          <p className="text-xs text-gray-500 truncate">
                            {formatPhoneNumber(lead.telefone)}
                          </p>
                        )}
                        {lead.interesse && (
                          <p className="text-xs text-gray-600 truncate mt-1">
                            Interesse: {truncateInterest(lead.interesse, 30)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Column - Chat Messages */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedLead ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-carblue text-white text-sm">
                      {getLeadInitials(selectedLead)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {getLeadDisplayName(selectedLead)}
                    </h3>
                    {selectedLead.telefone && (
                      <p className="text-sm text-gray-500">
                        {formatPhoneNumber(selectedLead.telefone)}
                      </p>
                    )}
                    {selectedLead.interesse && (
                      <p className="text-sm text-gray-500 mt-1">
                        Interesse: {selectedLead.interesse}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshMessages}
                  disabled={messagesLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw size={16} className={messagesLoading ? 'animate-spin' : ''} />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Release Intervention Button */}
            {shouldShowReleaseButton(selectedLead) && (
              <div className="p-4 border-b border-gray-200">
                <ReleaseInterventionButton
                  leadId={selectedLead.id}
                  interventionTime={selectedLead.intervencao!}
                  onInterventionReleased={handleInterventionReleased}
                />
              </div>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="text-center text-gray-500 py-8">
                  Carregando mensagens...
                </div>
              ) : !messages || messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Nenhuma mensagem encontrada
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id}>
                      <div
                        className={`flex ${
                          message.type === 'human' ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'human'
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-carblue text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                      </div>
                      {/* Show intervention notice for AI messages */}
                      {message.type === 'ai' && message.interventionRequested && (
                        <div className="flex justify-end mt-1">
                          <div className="max-w-xs lg:max-w-md">
                            <p className="text-xs text-gray-500 italic">
                              Intervenção Humana Solicitada 📢
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
              <p className="text-sm">
                Escolha um lead da lista para visualizar o histórico de mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Atendimentos;

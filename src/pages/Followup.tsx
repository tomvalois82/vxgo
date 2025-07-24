
import React from 'react';
import { useFollowup } from '@/hooks/crm/useFollowup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Pause } from 'lucide-react';
import CountdownTimer from '@/components/crm/CountdownTimer';
import CopyButton from '@/components/crm/CopyButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Followup = () => {
  const { data: leads, isLoading, error } = useFollowup();

  const formatIntervencao = (intervencao: string | null) => {
    if (!intervencao) return '-';
    try {
      return format(new Date(intervencao), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const getSessionId = (lead: any) => {
    if (lead.Origem === 'Whatsapp' || lead.Origem === 'whatsapp') {
      return lead.session_id_whatsaap || '-';
    }
    return lead.session_id_olx || '-';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Followup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Followup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Erro ao carregar dados: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Followup</CardTitle>
        </CardHeader>
        <CardContent>
          {!leads || leads.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum lead encontrado para followup.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Sessão</TableHead>
                    <TableHead>Intervenção</TableHead>
                    <TableHead>IA</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Próximo Followup</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const sessionId = getSessionId(lead);
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">
                          {lead.nome || '-'}
                        </TableCell>
                        <TableCell>
                          {lead.Origem || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[120px]" title={sessionId}>
                              {sessionId}
                            </span>
                            {sessionId !== '-' && <CopyButton text={sessionId} />}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatIntervencao(lead.intervencao)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            {lead.stop ? (
                              <Play size={16} className="text-green-600" />
                            ) : (
                              <Pause size={16} className="text-orange-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.folowup || '-'}
                        </TableCell>
                        <TableCell>
                          <CountdownTimer targetDate={lead.proximofolowup} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Followup;

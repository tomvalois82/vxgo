
import React, { useState } from 'react';
import { useFollowup } from '@/hooks/crm/useFollowup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import CountdownTimer from '@/components/crm/CountdownTimer';
import CopyButton from '@/components/crm/CopyButton';
import FollowupAutomationToggle from '@/components/crm/FollowupAutomationToggle';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Followup = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const { data: result, isLoading, error } = useFollowup({
    searchTerm,
    showActiveOnly,
    page: currentPage,
    pageSize,
  });

  const leads = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchSubmit = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleActiveFilterChange = (checked: boolean) => {
    setShowActiveOnly(checked);
    setCurrentPage(1); // Reset to first page when filtering
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
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por nome, telefone ou sessão..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 pr-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Button
                onClick={handleSearchSubmit}
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1 h-8 w-8 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active-only"
                checked={showActiveOnly}
                onCheckedChange={handleActiveFilterChange}
              />
              <label
                htmlFor="active-only"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Apenas followups ativos
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!leads || leads.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm || showActiveOnly 
                ? 'Nenhum lead encontrado com os filtros aplicados.' 
                : 'Nenhum lead encontrado para followup.'
              }
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Sessão</TableHead>
                      <TableHead>Intervenção</TableHead>
                      <TableHead className="text-center">IA</TableHead>
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
                            <FollowupAutomationToggle 
                              leadId={lead.id}
                              stopValue={lead.stop}
                            />
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

              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage - 1);
                            }}
                          />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNumber > totalPages) return null;
                        
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              isActive={pageNumber === currentPage}
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(pageNumber);
                              }}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage + 1);
                            }}
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-500 text-center">
                Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} de {totalCount} registros
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Followup;

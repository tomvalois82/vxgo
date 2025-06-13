
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStockData } from '@/hooks/dashboard/useDashboardStockData';

const StockCard: React.FC = () => {
  const { data: stockData, isLoading, error } = useDashboardStockData();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Estoque</CardTitle>
        <div className="text-xs text-muted-foreground">Total de Veículos</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-2xl font-bold text-gray-400">Carregando...</div>
        ) : error ? (
          <div className="text-2xl font-bold text-red-500">Erro</div>
        ) : (
          <div className="text-3xl font-bold text-blue-600">
            {stockData?.total || 0}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          veículos cadastrados
        </p>
      </CardContent>
    </Card>
  );
};

export default StockCard;

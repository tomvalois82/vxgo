
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useDashboardLeadsData } from '@/hooks/dashboard/useDashboardLeadsData';

interface LeadsCardProps {
  startDate: Date;
  endDate: Date;
}

const LeadsCard: React.FC<LeadsCardProps> = ({ startDate, endDate }) => {
  const { data: leadsData, isLoading, error } = useDashboardLeadsData(startDate, endDate);

  const chartConfig = {
    count: {
      label: "Leads",
      color: "#22c55e",
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Leads</CardTitle>
        <div className="text-xs text-muted-foreground">Atendimentos pela IA</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-2xl font-bold text-gray-400">Carregando...</div>
        ) : error ? (
          <div className="text-2xl font-bold text-red-500">Erro</div>
        ) : (
          <>
            <div className="text-3xl font-bold text-green-600 mb-4">
              {leadsData?.total || 0}
            </div>
            <div className="h-[200px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsData?.dailyData || []}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadsCard;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useDashboardMessagesData } from '@/hooks/dashboard/useDashboardMessagesData';

interface MessagesCardProps {
  startDate: Date;
  endDate: Date;
}

const MessagesCard: React.FC<MessagesCardProps> = ({ startDate, endDate }) => {
  const { data: messagesData, isLoading, error } = useDashboardMessagesData(startDate, endDate);

  const chartConfig = {
    ai: {
      label: "IA",
      color: "#3b82f6",
    },
    human: {
      label: "Humano",
      color: "#f59e0b",
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
        <div className="text-xs text-muted-foreground">IA vs Humano</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-2xl font-bold text-gray-400">Carregando...</div>
        ) : error ? (
          <div className="text-2xl font-bold text-red-500">Erro</div>
        ) : (
          <>
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {messagesData?.totalAi || 0}
                </div>
                <p className="text-xs text-muted-foreground">IA</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {messagesData?.totalHuman || 0}
                </div>
                <p className="text-xs text-muted-foreground">Humano</p>
              </div>
            </div>
            <div className="h-[200px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={messagesData?.dailyData || []}>
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
                    <Line 
                      type="monotone" 
                      dataKey="ai" 
                      stroke="var(--color-ai)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="human" 
                      stroke="var(--color-human)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MessagesCard;


import React, { useState } from 'react';
import { subDays } from 'date-fns';
import DateRangeFilter from '@/components/dashboard/DateRangeFilter';
import StockCard from '@/components/dashboard/StockCard';
import LeadsCard from '@/components/dashboard/LeadsCard';
import MessagesCard from '@/components/dashboard/MessagesCard';

const Dashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Acompanhe o desempenho e uso da IA em tempo real
        </p>
      </div>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StockCard />
        <LeadsCard startDate={startDate} endDate={endDate} />
        <MessagesCard startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
};

export default Dashboard;

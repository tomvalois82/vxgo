
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FollowupActions from './FollowupActions';

interface CountdownTimerProps {
  targetDate: string | null;
  leadId: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, leadId }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft('-');
      setIsExpired(false);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft(`${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        setIsExpired(false);
      } else {
        try {
          const formattedDate = format(new Date(targetDate), 'dd/MM/yyyy HH:mm', { locale: ptBR });
          setTimeLeft(formattedDate);
          setIsExpired(true);
        } catch {
          setTimeLeft('Vencido');
          setIsExpired(true);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex items-center">
      <span className={isExpired ? 'text-red-500 font-medium' : 'text-gray-700'}>
        {timeLeft}
      </span>
      <FollowupActions leadId={leadId} currentDate={targetDate} />
    </div>
  );
};

export default CountdownTimer;

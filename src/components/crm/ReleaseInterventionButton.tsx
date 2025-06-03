
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Unlock } from 'lucide-react';
import { useReleaseIntervention } from '@/hooks/crm/useReleaseIntervention';

interface ReleaseInterventionButtonProps {
  leadId: number;
  interventionTime: string;
}

const ReleaseInterventionButton: React.FC<ReleaseInterventionButtonProps> = ({
  leadId,
  interventionTime,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [shouldShow, setShouldShow] = useState<boolean>(false);
  const { releaseIntervention, isLoading } = useReleaseIntervention();

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const interventionDate = new Date(interventionTime);
      
      if (interventionDate <= now) {
        setShouldShow(false);
        return;
      }

      setShouldShow(true);
      const diffMs = interventionDate.getTime() - now.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;
      
      setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [interventionTime]);

  const handleRelease = () => {
    releaseIntervention(leadId);
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <Button
        onClick={handleRelease}
        disabled={isLoading}
        size="sm"
        variant="outline"
        className="flex items-center gap-2 bg-white hover:bg-yellow-50"
      >
        <Unlock size={16} />
        {isLoading ? 'Liberando...' : 'Liberar Atendimento'}
      </Button>
      <div className="flex items-center gap-1 text-sm text-yellow-700">
        <Clock size={14} />
        <span>Falta {timeRemaining} para liberar o atendimento</span>
      </div>
    </div>
  );
};

export default ReleaseInterventionButton;

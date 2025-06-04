
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { useToggleLeadAutomation } from '@/hooks/crm/useToggleLeadAutomation';

interface LeadAutomationToggleProps {
  leadId: number;
  isAutomationStopped: boolean;
  onToggleSuccess: (newStopValue: boolean) => void;
}

const LeadAutomationToggle: React.FC<LeadAutomationToggleProps> = ({
  leadId,
  isAutomationStopped,
  onToggleSuccess,
}) => {
  const { toggleAutomation, isLoading } = useToggleLeadAutomation();

  const handleToggle = async () => {
    const success = await toggleAutomation(leadId, isAutomationStopped);
    if (success) {
      onToggleSuccess(!isAutomationStopped);
    }
  };

  const buttonText = isAutomationStopped
    ? 'Liberar cliente para atendimento automático'
    : 'Pausar atendimento automático para esse cliente';

  const Icon = isAutomationStopped ? Play : Pause;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className="flex items-center gap-2 text-xs"
    >
      <Icon size={14} />
      {buttonText}
    </Button>
  );
};

export default LeadAutomationToggle;

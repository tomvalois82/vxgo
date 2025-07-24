
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { useFollowupActions } from '@/hooks/crm/useFollowupActions';

interface FollowupAutomationToggleProps {
  leadId: number;
  stopValue: boolean | null;
}

const FollowupAutomationToggle: React.FC<FollowupAutomationToggleProps> = ({ 
  leadId, 
  stopValue 
}) => {
  const { toggleAutomation, isLoading } = useFollowupActions();

  const handleToggle = () => {
    toggleAutomation(leadId, stopValue);
  };

  return (
    <div className="flex justify-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className="h-8 w-8 p-0"
      >
        {stopValue ? (
          <Play size={16} className="text-green-600" />
        ) : (
          <Pause size={16} className="text-orange-600" />
        )}
      </Button>
    </div>
  );
};

export default FollowupAutomationToggle;

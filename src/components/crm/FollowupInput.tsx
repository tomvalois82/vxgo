
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useUpdateFollowup } from '@/hooks/crm/useUpdateFollowup';

interface FollowupInputProps {
  leadId: number;
  currentValue: number | null;
  maxValue: number;
}

const FollowupInput: React.FC<FollowupInputProps> = ({ 
  leadId, 
  currentValue, 
  maxValue 
}) => {
  const [value, setValue] = useState(currentValue?.toString() || '0');
  const { updateFollowup, isLoading } = useUpdateFollowup();

  useEffect(() => {
    setValue(currentValue?.toString() || '0');
  }, [currentValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow only numbers
    if (!/^\d*$/.test(inputValue)) {
      return;
    }

    const numValue = parseInt(inputValue) || 0;
    
    // Check max value constraint
    if (numValue > maxValue) {
      return;
    }

    setValue(inputValue);
  };

  const handleBlur = async () => {
    const numValue = parseInt(value) || 0;
    
    if (numValue !== currentValue) {
      await updateFollowup(leadId, numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      className="w-20 h-8 text-center"
      min={0}
      max={maxValue}
    />
  );
};

export default FollowupInput;

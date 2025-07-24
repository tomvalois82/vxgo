
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
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
    
    // Check max value constraint - should be maxValue (not maxValue - 1)
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const incrementValue = async () => {
    const numValue = parseInt(value) || 0;
    if (numValue < maxValue) {
      const newValue = numValue + 1;
      setValue(newValue.toString());
      await updateFollowup(leadId, newValue);
    }
  };

  const decrementValue = async () => {
    const numValue = parseInt(value) || 0;
    if (numValue > 0) {
      const newValue = numValue - 1;
      setValue(newValue.toString());
      await updateFollowup(leadId, newValue);
    }
  };

  return (
    <div className="flex items-center">
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className="w-16 h-8 text-center border-r-0 rounded-r-none"
        min={0}
        max={maxValue}
      />
      <div className="flex flex-col border border-l-0 rounded-r-md">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={incrementValue}
          disabled={isLoading || parseInt(value) >= maxValue}
          className="h-4 w-6 p-0 rounded-none border-b border-gray-200 hover:bg-gray-50"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={decrementValue}
          disabled={isLoading || parseInt(value) <= 0}
          className="h-4 w-6 p-0 rounded-none hover:bg-gray-50"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default FollowupInput;

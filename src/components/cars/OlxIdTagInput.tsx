
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OlxIdTagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export const OlxIdTagInput: React.FC<OlxIdTagInputProps> = ({
  value = [],
  onChange,
  placeholder = "Digite IDs separados por vírgula"
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTags = (input: string) => {
    if (!input.trim()) return;
    
    const newTags = input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag && !value.includes(tag));
    
    if (newTags.length > 0) {
      onChange([...value, ...newTags]);
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTags(inputValue);
    }
  };

  const handleAddClick = () => {
    addTags(inputValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          disabled={!inputValue.trim()}
        >
          <Plus size={16} />
        </Button>
      </div>
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: number;
  session_id: string;
  message: any;
}

export interface ParsedMessage {
  id: number;
  type: 'human' | 'ai';
  content: string;
  timestamp?: string;
}

const parseMessageContent = (message: any): ParsedMessage | null => {
  if (!message || typeof message !== 'object') return null;

  if (message.type === 'human') {
    return {
      id: Math.random(),
      type: 'human',
      content: message.content || '',
    };
  }

  if (message.type === 'ai') {
    let content = message.content || '';
    
    // Try to parse JSON content for AI responses
    if (content.includes('```json')) {
      try {
        const jsonMatch = content.match(/```json\n(.*?)\n```/s);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[1]);
          content = jsonData.response || content;
        }
      } catch (e) {
        // If parsing fails, use original content
        console.warn('Failed to parse AI message JSON:', e);
      }
    }

    return {
      id: Math.random(),
      type: 'ai',
      content,
    };
  }

  return null;
};

export const useMessages = (sessionId: string | null) => {
  const { profile, isLoading: authLoading } = useAuth();

  const fetchMessages = async () => {
    if (!profile || !profile.tbHistorico || !sessionId) {
      return [];
    }

    // Using any to bypass TypeScript strict typing for dynamic table names
    const { data, error } = await (supabase as any)
      .from(profile.tbHistorico)
      .select('id, session_id, message')
      .eq('session_id', sessionId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw new Error(error.message);
    }

    const parsedMessages: ParsedMessage[] = [];
    
    if (data) {
      data.forEach((item: ChatMessage) => {
        const parsed = parseMessageContent(item.message);
        if (parsed) {
          parsed.id = item.id;
          parsedMessages.push(parsed);
        }
      });
    }

    return parsedMessages;
  };

  return useQuery<ParsedMessage[], Error>({
    queryKey: ['messages', profile?.tbHistorico, sessionId],
    queryFn: fetchMessages,
    enabled: !authLoading && !!profile && !!profile.tbHistorico && !!sessionId,
  });
};

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface Message {
  id: string;
  sender_type: 'customer' | 'admin';
  message: string;
  created_at: string;
}

interface Conversation {
  id: string;
  status: string;
}

export function CustomerSupportChat() {
  const { user } = useAuth();
  const { playNotification } = useNotificationSound();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminTyping, setAdminTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchOrCreateConversation();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      
      // Set up realtime subscription for messages
      const channel = supabase
        .channel(`support-messages-${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `conversation_id=eq.${conversation.id}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            
            if (newMessage.sender_type === 'admin') {
              setAdminTyping(false);
              playNotification();
              if (!isOpen || isMinimized) {
                setUnreadCount((c) => c + 1);
              }
              toast.success('New message from support!');
            }
          }
        )
        .subscribe();

      // Set up typing indicator channel
      const typingChannel = supabase
        .channel(`typing-${conversation.id}`)
        .on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload.sender_type === 'admin') {
            setAdminTyping(true);
            // Clear typing after 3 seconds
            setTimeout(() => setAdminTyping(false), 3000);
          }
        })
        .subscribe();

      typingChannelRef.current = typingChannel;

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(typingChannel);
      };
    }
  }, [conversation, isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchOrCreateConversation = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Check for existing open conversation
      const { data: existing, error: fetchError } = await supabase
        .from('support_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        setConversation(existing);
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('support_conversations')
          .insert({
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          })
          .select()
          .single();

        if (createError) throw createError;
        setConversation(newConv);
      }
    } catch (error) {
      console.error('Error with conversation:', error);
      toast.error('Failed to start support chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!conversation) return;

    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages((data || []).map(msg => ({
      ...msg,
      sender_type: msg.sender_type as 'customer' | 'admin'
    })));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    if (conversation && typingChannelRef.current) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_type: 'customer', conversation_id: conversation.id }
      });
      
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 1000);
    }
  };

  const getAIReply = async (messageText: string) => {
    if (!conversation || !user) return;
    
    try {
      setAdminTyping(true);
      
      const { data, error } = await supabase.functions.invoke('support-ai-reply', {
        body: {
          message: messageText,
          conversationId: conversation.id,
          userId: user.id
        }
      });

      if (error) {
        console.error('AI reply error:', error);
      }
      
      // Reply is stored by the edge function, realtime will pick it up
    } catch (error) {
      console.error('Error getting AI reply:', error);
    } finally {
      setAdminTyping(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !conversation) return;

    setSending(true);
    const messageText = message.trim();
    setMessage('');

    try {
      const { error } = await supabase.from('support_messages').insert({
        conversation_id: conversation.id,
        sender_type: 'customer',
        sender_id: user.id,
        message: messageText,
      });

      if (error) throw error;
      
      // Trigger AI auto-reply after sending message
      getAIReply(messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Chat Button - positioned at bottom right, above mobile nav */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg z-40"
          size="icon"
        >
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-20 right-4 md:bottom-6 md:right-6 w-[calc(100%-2rem)] sm:w-96 bg-background border rounded-lg shadow-2xl z-40 flex flex-col transition-all",
            isMinimized ? "h-14" : "h-[70vh] max-h-[500px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">Customer Support</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Start a conversation</p>
                    <p className="text-sm">We're here to help!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "max-w-[80%] p-3 rounded-lg text-sm",
                          msg.sender_type === 'customer'
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p>{msg.message}</p>
                        <p className={cn(
                          "text-xs mt-1 opacity-70",
                          msg.sender_type === 'customer' ? "text-right" : ""
                        )}>
                          {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))}
                    {adminTyping && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>Support is typing...</span>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    disabled={sending || loading}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={sending || !message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

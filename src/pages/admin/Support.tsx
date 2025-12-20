import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, Clock, CheckCircle, XCircle, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const quickReplies = [
  {
    category: 'Greeting',
    replies: [
      { label: 'Welcome', text: 'Hello! Welcome to LUXE support. How can I help you today?' },
      { label: 'Thanks for waiting', text: 'Thank you for your patience. I am here to assist you now.' },
    ]
  },
  {
    category: 'Order Status',
    replies: [
      { label: 'Order confirmed', text: 'Your order has been confirmed and is being processed. You will receive a notification once it ships.' },
      { label: 'Order shipped', text: 'Great news! Your order has been shipped. You can track it using the tracking link in your order details.' },
      { label: 'Delivery timeline', text: 'Typically, orders are delivered within 3-5 business days. You can check the exact status in your order tracking page.' },
    ]
  },
  {
    category: 'Returns & Refunds',
    replies: [
      { label: 'Return policy', text: 'We offer 30-day returns for all unused items in original packaging. Would you like me to initiate a return for you?' },
      { label: 'Refund processing', text: 'Your refund has been initiated and will be credited to your original payment method within 5-7 business days.' },
      { label: 'Exchange request', text: 'I can help you with an exchange. Please let me know the item you would like to exchange and your preferred replacement.' },
    ]
  },
  {
    category: 'Payment',
    replies: [
      { label: 'Payment failed', text: 'It seems your payment did not go through. Please try again or use a different payment method. Let me know if you need assistance.' },
      { label: 'Payment confirmation', text: 'Your payment has been successfully received. Thank you for your purchase!' },
    ]
  },
  {
    category: 'Closing',
    replies: [
      { label: 'Anything else?', text: 'Is there anything else I can help you with today?' },
      { label: 'Thank you', text: 'Thank you for contacting LUXE support. Have a wonderful day!' },
      { label: 'Follow up', text: 'Feel free to reach out if you have any more questions. We are always here to help!' },
    ]
  },
];

interface Message {
  id: string;
  sender_type: 'customer' | 'admin';
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

export default function AdminSupport() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    fetchConversations();

    // Subscribe to new conversations
    const conversationsChannel = supabase
      .channel('admin-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      markMessagesAsRead();

      // Subscribe to messages for selected conversation
      const messagesChannel = supabase
        .channel(`admin-messages-${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            
            if (newMessage.sender_type === 'customer') {
              setCustomerTyping(false);
              toast.success('New message from customer!');
              markMessagesAsRead();
            }
          }
        )
        .subscribe();

      // Set up typing indicator channel
      const typingChannel = supabase
        .channel(`typing-${selectedConversation.id}`)
        .on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload.sender_type === 'customer') {
            setCustomerTyping(true);
            // Clear typing after 3 seconds
            setTimeout(() => setCustomerTyping(false), 3000);
          }
        })
        .subscribe();

      typingChannelRef.current = typingChannel;

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(typingChannel);
        setCustomerTyping(false);
      };
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get unread counts for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_type', 'customer')
            .eq('is_read', false);

          return { ...conv, unread_count: count || 0 };
        })
      );

      setConversations(conversationsWithUnread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', selectedConversation.id)
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

  const markMessagesAsRead = async () => {
    if (!selectedConversation) return;

    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('conversation_id', selectedConversation.id)
      .eq('sender_type', 'customer')
      .eq('is_read', false);

    fetchConversations();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !selectedConversation) return;

    setSending(true);
    const messageText = message.trim();
    setMessage('');

    try {
      const { error } = await supabase.from('support_messages').insert({
        conversation_id: selectedConversation.id,
        sender_type: 'admin',
        sender_id: user.id,
        message: messageText,
      });

      if (error) throw error;

      // Update conversation's updated_at
      await supabase
        .from('support_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    if (selectedConversation && typingChannelRef.current) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_type: 'admin', conversation_id: selectedConversation.id }
      });
      
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 1000);
    }
  };

  const closeConversation = async () => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from('support_conversations')
        .update({ status: 'closed' })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      toast.success('Conversation closed');
      setSelectedConversation(null);
      fetchConversations();
    } catch (error) {
      console.error('Error closing conversation:', error);
      toast.error('Failed to close conversation');
    }
  };

  const reopenConversation = async () => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from('support_conversations')
        .update({ status: 'open' })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      toast.success('Conversation reopened');
      fetchConversations();
      setSelectedConversation({ ...selectedConversation, status: 'open' });
    } catch (error) {
      console.error('Error reopening conversation:', error);
      toast.error('Failed to reopen conversation');
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Customer Support</h1>
            <p className="text-muted-foreground">
              {totalUnread > 0 ? `${totalUnread} unread messages` : 'Manage customer conversations'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-5rem)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversations
              </h2>
            </div>
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                        selectedConversation?.id === conv.id && "bg-muted"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {conv.user_name || 'Customer'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {conv.user_email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant={conv.status === 'open' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {conv.status}
                          </Badge>
                          {(conv.unread_count || 0) > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conv.unread_count} new
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(conv.updated_at), 'dd MMM, hh:mm a')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedConversation.user_name || 'Customer'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.user_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConversation.status === 'open' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={closeConversation}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={reopenConversation}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "max-w-[70%] p-3 rounded-lg",
                          msg.sender_type === 'admin'
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={cn(
                          "text-xs mt-1 opacity-70",
                          msg.sender_type === 'admin' ? "text-right" : ""
                        )}>
                          {format(new Date(msg.created_at), 'dd MMM, hh:mm a')}
                        </p>
                      </div>
                    ))}
                    {customerTyping && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>Customer is typing...</span>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                {selectedConversation.status === 'open' && (
                  <div className="p-4 border-t space-y-3">
                    {/* Quick Replies */}
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Zap className="h-4 w-4" />
                            Quick Replies
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <ScrollArea className="h-80">
                            <div className="p-2">
                              {quickReplies.map((category) => (
                                <div key={category.category} className="mb-3">
                                  <p className="text-xs font-semibold text-muted-foreground px-2 py-1">
                                    {category.category}
                                  </p>
                                  <div className="space-y-1">
                                    {category.replies.map((reply) => (
                                      <button
                                        key={reply.label}
                                        onClick={() => setMessage(reply.text)}
                                        className="w-full text-left px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                                      >
                                        <p className="font-medium">{reply.label}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {reply.text}
                                        </p>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                      <span className="text-xs text-muted-foreground">
                        Click to insert a quick reply
                      </span>
                    </div>
                    
                    {/* Message Input */}
                    <form onSubmit={sendMessage}>
                      <div className="flex gap-2">
                        <Input
                          value={message}
                          onChange={handleInputChange}
                          placeholder="Type your reply..."
                          disabled={sending}
                          className="flex-1"
                        />
                        <Button type="submit" disabled={sending || !message.trim()}>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose a customer to view their messages</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

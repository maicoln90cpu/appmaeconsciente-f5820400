import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, User, Plus, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

export function IANutricional() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages();
    }
  }, [currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('nutrition_chat_conversations')
        .select('id, user_id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      
      if (data && data.length > 0 && !currentConversationId) {
        setCurrentConversationId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const loadMessages = async () => {
    if (!currentConversationId) return;

    try {
      const { data, error } = await supabase
        .from('nutrition_chat_messages')
        .select('id, conversation_id, role, content, created_at')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('nutrition_chat_conversations')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setConversations([data, ...conversations]);
      setCurrentConversationId(data.id);
      setMessages([]);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      toast.error('Erro ao criar nova conversa');
    }
  };

  const confirmDeleteConversation = (convId: string) => {
    setConversationToDelete(convId);
    setDeleteDialogOpen(true);
  };

  const deleteConversation = async () => {
    if (!conversationToDelete) return;

    const { error } = await supabase
      .from('nutrition_chat_conversations')
      .delete()
      .eq('id', conversationToDelete);

    if (error) {
      toast.error("Erro ao deletar conversa");
      return;
    }

    setConversations(conversations.filter(c => c.id !== conversationToDelete));
    
    if (currentConversationId === conversationToDelete) {
      setCurrentConversationId(null);
      setMessages([]);
    }

    toast.success("Conversa deletada");
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentConversationId) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nutrition-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            conversationId: currentConversationId
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        
        // Tratamento específico para rate limiting
        if (response.status === 429) {
          toast.error("Limite de mensagens atingido", {
            description: data.message || "Você atingiu o limite de mensagens por hora. Tente novamente mais tarde.",
          });
          return;
        }
        
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      await loadMessages();
      await loadConversations();
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      
      if (error.message?.includes('Não autenticado')) {
        toast.error('Sessão expirada', {
          description: 'Faça login novamente para continuar.',
        });
      } else {
        toast.error('Erro ao enviar mensagem', {
          description: error.message || 'Tente novamente em alguns instantes.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="grid md:grid-cols-4 gap-6 h-[calc(100vh-16rem)]">
      {/* Sidebar de conversas */}
      <Card className="md:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversas</CardTitle>
            <Button size="sm" onClick={createNewConversation}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-2 p-4">
              {conversations.map((conv) => (
                <div key={conv.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentConversationId(conv.id)}
                    className={`flex-1 text-left p-3 rounded-lg transition-colors ${
                      currentConversationId === conv.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.title || "Nova conversa"}
                        </p>
                        <p className="text-xs opacity-70">
                          {new Date(conv.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteConversation(conv.id);
                    }}
                    className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                    aria-label="Deletar conversa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma conversa ainda
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Área de chat */}
      <Card className="md:col-span-3 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            IA Nutricional - Sua Nutricionista Virtual
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tire suas dúvidas sobre alimentação durante a gestação
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 && !currentConversationId && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Bot className="h-16 w-16 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  Bem-vinda à IA Nutricional!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Comece uma nova conversa para tirar suas dúvidas sobre nutrição na gestação
                </p>
                <Button onClick={createNewConversation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Iniciar Conversa
                </Button>
              </div>
            )}

            {messages.length === 0 && currentConversationId && (
              <div className="text-center p-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Olá! Sou sua nutricionista virtual. Como posso te ajudar hoje?</p>
                <p className="text-sm mt-2">
                  Você pode me perguntar sobre alimentos, receitas, suplementos ou qualquer dúvida sobre nutrição na gestação.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-4 break-words ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {currentConversationId && (
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta sobre nutrição..."
                  disabled={loading}
                />
                <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conversa e todas as mensagens serão permanentemente removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConversationToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

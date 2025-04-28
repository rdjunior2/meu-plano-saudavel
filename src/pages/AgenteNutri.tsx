import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { BadgeCheck, Bot, CornerDownLeft, MicIcon, Send, User, Brain, Apple, Dumbbell, Database, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

// Interface para mensagens do chat
interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  isLoading?: boolean;
}

// Interface para sugestões de perguntas
interface QuickSuggestion {
  id: string;
  text: string;
  icon: React.ReactNode;
}

// URL da API para o agente nutricional (simulação)
const AGENT_API_URL = '/api/agente-nutri';

// Componente principal
const AgenteNutri = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Simulação de sugestões de perguntas rápidas
  const quickSuggestions: QuickSuggestion[] = [
    {
      id: '1',
      text: 'Como melhorar meu déficit calórico?',
      icon: <Apple className="h-4 w-4 text-emerald-500" />
    },
    {
      id: '2',
      text: 'Que alimentos ajudam a ganhar massa muscular?',
      icon: <Dumbbell className="h-4 w-4 text-emerald-500" />
    },
    {
      id: '3',
      text: 'Preciso de suplementos alimentares?',
      icon: <Database className="h-4 w-4 text-emerald-500" />
    },
    {
      id: '4',
      text: 'Montar um cardápio semanal para perda de peso',
      icon: <Sparkles className="h-4 w-4 text-emerald-500" />
    }
  ];

  // Carregar histórico de mensagens
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user?.id) return;
      
      try {
        // Buscar mensagens do usuário no banco de dados
        const { data, error } = await supabase
          .from('agente_nutri_chat')
          .select('*')
          .eq('usuario_id', user.id)
          .order('timestamp', { ascending: true })
          .limit(50);
          
        if (error) throw error;
        
        // Formatar as mensagens
        if (data && data.length > 0) {
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            sender: msg.sender,
            message: msg.message,
            timestamp: new Date(msg.timestamp)
          }));
          
          setMessages(formattedMessages);
          setIsFirstLoad(false);
        } else {
          // Se não há mensagens, mostrar mensagem de boas-vindas
          await sendInitialGreeting();
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        toast({
          title: 'Erro ao carregar conversas',
          description: 'Não foi possível carregar seu histórico de conversas. Tente novamente mais tarde.',
          variant: 'destructive',
        });
      }
    };
    
    fetchMessages();
  }, [user?.id]);
  
  // Mensagem inicial do agente
  const sendInitialGreeting = async () => {
    if (!user?.id) return;
    
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'assistant',
      message: `Olá, ${user.nome || 'usuário'}! Sou o seu Agente Nutri, especialista em nutrição e bem-estar. Estou aqui para responder suas dúvidas sobre alimentação, dar dicas para seus objetivos de saúde e ajudar com seu plano alimentar. Como posso ajudar você hoje?`,
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    setIsFirstLoad(false);
    
    // Salvar no banco de dados
    try {
      await supabase.from('agente_nutri_chat').insert({
        usuario_id: user.id,
        sender: 'assistant',
        message: initialMessage.message,
        timestamp: initialMessage.timestamp
      });
    } catch (error) {
      console.error('Erro ao salvar mensagem inicial:', error);
    }
  };
  
  // Rolar para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Enviar mensagem
  const sendMessage = async (text: string = inputMessage) => {
    if (!text.trim() || !user?.id) return;
    
    // ID único para a mensagem
    const messageId = Date.now().toString();
    
    // Adicionar mensagem do usuário ao chat
    const userMessage: ChatMessage = {
      id: messageId,
      sender: 'user',
      message: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Salvar mensagem do usuário no banco de dados
    try {
      await supabase.from('agente_nutri_chat').insert({
        usuario_id: user.id,
        sender: 'user',
        message: text,
        timestamp: userMessage.timestamp
      });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
    
    // Mostrar indicador de digitação
    setIsTyping(true);
    
    // Adicionar mensagem temporária de carregamento
    const loadingMessageId = `loading-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: loadingMessageId,
      sender: 'assistant',
      message: '',
      timestamp: new Date(),
      isLoading: true
    }]);
    
    try {
      // Simular chamada à API - em produção, chamar API real
      // const response = await fetch(AGENT_API_URL, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     message: text,
      //     userId: user.id
      //   }),
      // });
      
      // if (!response.ok) throw new Error('Falha na comunicação com o agente');
      // const data = await response.json();
      
      // Resposta simulada - remover em produção
      await new Promise(resolve => setTimeout(resolve, 1500));
      const simulateResponse = getSimulatedResponse(text);
      
      // Remover mensagem de carregamento
      setMessages(prev => prev.filter(m => m.id !== loadingMessageId));
      
      // Adicionar resposta do assistente
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        // message: data.response,
        message: simulateResponse, // Remover em produção
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Salvar resposta do assistente no banco de dados
      await supabase.from('agente_nutri_chat').insert({
        usuario_id: user.id,
        sender: 'assistant',
        message: assistantMessage.message,
        timestamp: assistantMessage.timestamp
      });
      
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Remover mensagem de carregamento
      setMessages(prev => prev.filter(m => m.id !== loadingMessageId));
      
      // Mostrar mensagem de erro
      toast({
        title: 'Erro na comunicação',
        description: 'Não foi possível conectar com o agente nutricional. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  };
  
  // Função para simular resposta do agente (remover em produção)
  const getSimulatedResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('déficit calórico') || lowerMessage.includes('deficit calorico')) {
      return 'Para melhorar seu déficit calórico de forma saudável, considere estas estratégias: 1) Aumentar o consumo de alimentos ricos em fibras e proteínas, que promovem maior saciedade; 2) Reduzir carboidratos refinados e açúcares; 3) Aumentar a ingestão de água; 4) Incorporar mais vegetais no prato principal; 5) Realizar refeições menores e mais frequentes; 6) Combinar sua dieta com exercícios físicos regulares, especialmente os que aumentam a massa muscular. Lembre-se que um déficit sustentável é de 300-500 calorias por dia para resultados duradouros.';
    }
    
    if (lowerMessage.includes('massa muscular') || lowerMessage.includes('hipertrofia')) {
      return 'Os melhores alimentos para ganho de massa muscular são aqueles ricos em proteínas de alto valor biológico: 1) Carnes magras (frango, peixe, carne vermelha sem gordura); 2) Ovos inteiros; 3) Laticínios (iogurte grego, queijo cottage); 4) Leguminosas (feijão, lentilha, grão-de-bico); 5) Quinoa e outros grãos completos; 6) Nozes e sementes. Para otimizar os resultados, consuma proteínas distribuídas ao longo do dia, especialmente após o treino, quando os músculos estão mais receptivos aos nutrientes.';
    }
    
    if (lowerMessage.includes('suplemento') || lowerMessage.includes('whey')) {
      return 'A necessidade de suplementos varia conforme seus objetivos e dieta atual. Se você consome uma dieta balanceada com proteínas suficientes (1.6-2.2g/kg para praticantes de musculação), pode não precisar de suplementos. Entretanto, suplementos como whey protein, creatina e alguns aminoácidos podem ser úteis para: 1) Conveniência pós-treino; 2) Completar necessidades proteicas não atendidas pela dieta; 3) Recuperação muscular mais eficiente. Recomendo primeiro otimizar sua alimentação e depois considerar suplementos específicos para suas metas.';
    }
    
    if (lowerMessage.includes('cardápio') || lowerMessage.includes('cardapio') || lowerMessage.includes('perda de peso')) {
      return 'Um cardápio semanal equilibrado para perda de peso poderia seguir esta estrutura: CAFÉ DA MANHÃ: Proteína (ovos, iogurte grego), fibras (aveia, chia) e uma fruta. LANCHE: Fruta com oleaginosas (castanhas, amêndoas). ALMOÇO: 1/2 prato de vegetais, 1/4 de proteína magra, 1/4 de carboidratos complexos. LANCHE: Proteína (iogurte, tofu) com uma fruta ou vegetal. JANTAR: Similar ao almoço, mas com menos carboidratos. Varie os alimentos dentro destas categorias durante a semana e mantenha-se hidratado com pelo menos 2L de água diariamente. Ajuste as porções conforme sua necessidade calórica específica.';
    }
    
    // Resposta genérica
    return 'Obrigado pela sua pergunta! Como nutricionista, posso ajudar você a entender melhor sobre esse assunto. Para oferecer uma orientação mais personalizada, gostaria de saber mais sobre seus objetivos de saúde e hábitos alimentares atuais. Que tal me contar um pouco mais sobre sua rotina alimentar e quais são seus principais objetivos? Assim poderei fornecer recomendações mais adequadas para o seu caso específico.';
  };
  
  // Componente de mensagem
  const ChatMessageItem = ({ message }: { message: ChatMessage }) => {
    const isUser = message.sender === 'user';
    
    if (message.isLoading) {
      return (
        <div className="flex items-start gap-3 mb-6">
          <Avatar className="h-9 w-9 border-2 border-emerald-200 bg-emerald-50">
            <AvatarImage src="/assets/agent-avatar.png" alt="Agente Nutri" />
            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-500 text-white">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`flex items-start gap-3 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
        <Avatar className={`h-9 w-9 border-2 ${
          isUser 
            ? 'border-blue-200 bg-blue-50' 
            : 'border-emerald-200 bg-emerald-50'
        }`}>
          {isUser ? (
            <>
              <AvatarImage src={user?.avatar_url || ''} alt={user?.nome || 'Usuário'} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </>
          ) : (
            <>
              <AvatarImage src="/assets/agent-avatar.png" alt="Agente Nutri" />
              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-500 text-white">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </>
          )}
        </Avatar>
        
        <div className={`max-w-[85%] ${isUser ? 'text-right' : ''}`}>
          <div className={`px-4 py-3 rounded-lg ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
          }`}>
            <p className="whitespace-pre-wrap">{message.message}</p>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {format(message.timestamp, 'HH:mm')}
            {!isUser && (
              <span className="ml-2 inline-flex items-center text-emerald-600">
                <BadgeCheck className="h-3 w-3 mr-0.5" />
                <span>Nutri AI</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <DashboardLayout title="Agente Nutri" subtitle="Seu assistente de nutrição pessoal">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Painel lateral com informações */}
        <Card className="lg:col-span-1 overflow-hidden border border-emerald-100">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-white/30 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Agente Nutri</h3>
                <p className="text-emerald-100 text-sm">Consultor nutricional IA</p>
              </div>
            </div>
            <p className="text-sm text-emerald-50 mb-1">
              Assistente inteligente para:
            </p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center">
                <BadgeCheck className="h-4 w-4 mr-2 text-emerald-200" />
                Dúvidas nutricionais
              </li>
              <li className="flex items-center">
                <BadgeCheck className="h-4 w-4 mr-2 text-emerald-200" />
                Sugestões de cardápios
              </li>
              <li className="flex items-center">
                <BadgeCheck className="h-4 w-4 mr-2 text-emerald-200" />
                Dicas sobre alimentos
              </li>
              <li className="flex items-center">
                <BadgeCheck className="h-4 w-4 mr-2 text-emerald-200" />
                Orientações personalizadas
              </li>
            </ul>
          </div>
          
          <CardContent className="p-5">
            <h4 className="font-medium text-emerald-700 mb-3">Perguntas sugeridas</h4>
            <div className="space-y-2">
              {quickSuggestions.map(suggestion => (
                <Button
                  key={suggestion.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2.5 px-3 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                  onClick={() => sendMessage(suggestion.text)}
                >
                  {suggestion.icon}
                  <span className="ml-2 line-clamp-2 text-sm font-normal">
                    {suggestion.text}
                  </span>
                </Button>
              ))}
            </div>
            
            <div className="mt-5 pt-5 border-t border-emerald-100">
              <p className="text-xs text-emerald-600">
                As respostas do Agente Nutri são baseadas em conhecimentos nutricionais estabelecidos, mas não substituem o aconselhamento de um profissional de saúde qualificado.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Chat principal */}
        <Card className="lg:col-span-3 border border-emerald-100 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 text-white">
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9 border-2 border-white/40 bg-white/20">
                <AvatarImage src="/assets/agent-avatar.png" alt="Agente Nutri" />
                <AvatarFallback className="bg-emerald-400 text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">Agente Nutri</h3>
                <div className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-200 mr-1.5"></span>
                  <span className="text-xs text-emerald-100">Online agora</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Área de mensagens */}
          <div className="p-5 flex-grow overflow-y-auto bg-gradient-to-b from-emerald-50/50 to-white">
            {isFirstLoad ? (
              // Esqueleto de carregamento
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-full bg-emerald-100/70" />
                  <div className="space-y-2">
                    <Skeleton className="h-24 w-[300px] rounded-lg bg-emerald-50" />
                    <Skeleton className="h-3 w-20 bg-emerald-50" />
                  </div>
                </div>
                
                <div className="flex items-start gap-3 flex-row-reverse">
                  <Skeleton className="h-9 w-9 rounded-full bg-blue-100/70" />
                  <div className="space-y-2 text-right flex flex-col items-end">
                    <Skeleton className="h-12 w-[200px] rounded-lg bg-blue-50" />
                    <Skeleton className="h-3 w-20 bg-blue-50" />
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-full bg-emerald-100/70" />
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-[280px] rounded-lg bg-emerald-50" />
                    <Skeleton className="h-3 w-20 bg-emerald-50" />
                  </div>
                </div>
              </div>
            ) : (
              // Mensagens do chat
              <div className="space-y-1">
                {messages.map((message) => (
                  <ChatMessageItem key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Área de input */}
          <div className="p-3 border-t border-emerald-100 bg-white">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }} 
              className="relative"
            >
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="pr-24 border-emerald-200 focus-visible:ring-emerald-500"
                disabled={isTyping}
              />
              
              <div className="absolute right-1 top-1 flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                  disabled={isTyping}
                  onClick={() => {
                    // Funcionalidade de voz - a ser implementada
                    toast({
                      title: 'Entrada por voz',
                      description: 'Funcionalidade a ser implementada em breve!',
                      variant: 'default',
                    });
                  }}
                >
                  <MicIcon className="h-4 w-4" />
                </Button>
                
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                  disabled={isTyping || !inputMessage.trim()}
                >
                  {isTyping ? (
                    <Skeleton className="h-4 w-4 rounded-full bg-emerald-100" />
                  ) : (
                    inputMessage.trim() ? <Send className="h-4 w-4" /> : <CornerDownLeft className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
            
            <div className="mt-2 text-xs text-center text-emerald-600">
              <p>Alimentação saudável combinada com exercícios regulares é o caminho para o bem-estar</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Estilos para o indicador de digitação */}
      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          background-color: #f0fdf4;
          border: 1px solid #d1fae5;
          padding: 12px 16px;
          border-radius: 10px;
        }
        
        .typing-indicator span {
          height: 8px;
          width: 8px;
          background-color: #10b981;
          border-radius: 50%;
          display: inline-block;
          margin-right: 5px;
          animation: typing 1.3s infinite ease-in-out;
          opacity: 0.7;
        }
        
        .typing-indicator span:nth-child(1) {
          animation-delay: 0s;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
          margin-right: 0;
        }
        
        @keyframes typing {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default AgenteNutri; 
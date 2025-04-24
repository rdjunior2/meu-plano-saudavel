import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dumbbell, ChevronRight, Bike, Salad, ArrowRight, Shield, Clock, Heart, Users, Star, CheckCircle, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAuthContext } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

const Index = () => {
  const { isAuthenticated: isAuthStore } = useAuthStore();
  const { isAuthenticated: isAuthContext } = useAuthContext();
  const navigate = useNavigate();
  
  // Verificação dupla de autenticação para maior segurança
  const isAuthenticated = isAuthStore || isAuthContext;
  
  // Verificar se o usuário já está autenticado ao carregar a página
  useEffect(() => {
    console.log('[Index] Estado de autenticação:', { 
      isAuthStore, 
      isAuthContext, 
      isAuthenticated
    });
  }, [isAuthStore, isAuthContext, isAuthenticated]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Hero Section com gradiente atualizado e animações */}
      <section className="w-full min-h-[90vh] flex items-center py-12 bg-gradient-to-br from-gray-900 via-green-950 to-emerald-950 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        <div className="container px-4 md:px-6 mx-auto z-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-block rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-1.5 text-sm text-white font-medium shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse">
                Transforme seu corpo, renove sua vida
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">
                Seu plano personalizado para resultados reais
              </h1>
              <p className="text-xl text-emerald-200 max-w-[600px]">
                Nutrição adaptada, treinos estratégicos e um assistente IA exclusivo para transformar seus objetivos em resultados concretos.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)] transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:scale-105 group">
                      Acessar Meu Plano
                      <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/register">
                    <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)] transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:scale-105 group">
                      Começar Minha Transformação
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
                <Link to={isAuthenticated ? "/anamnese" : "/login"}>
                  <Button size="lg" variant="outline" className="border-green-500 text-green-800 hover:bg-green-950/50 shadow-[0_0_5px_rgba(34,197,94,0.2)] transition-all duration-300 hover:shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:scale-105">
                    Acessar Agora
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative animate-fade-in [animation-delay:200ms]">
              <div className="rounded-2xl bg-gray-900/90 p-8 shadow-[0_0_20px_rgba(34,197,94,0.4)] border border-green-500/30 backdrop-blur-sm relative z-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-green-950 to-gray-900 border border-green-500/30 hover:shadow-[0_0_10px_rgba(34,197,94,0.4)] transition-all duration-500 hover:-translate-y-1">
                    <div className="rounded-full bg-gradient-to-r from-green-600 to-emerald-600 p-3 shadow-[0_0_5px_rgba(34,197,94,0.4)]">
                      <Salad className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-emerald-300">Plano Alimentar</h3>
                      <p className="text-gray-300">Nutrição adaptada especificamente para atingir suas metas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-emerald-950 to-gray-900 border border-emerald-500/30 hover:shadow-[0_0_10px_rgba(34,197,94,0.4)] transition-all duration-500 hover:-translate-y-1">
                    <div className="rounded-full bg-gradient-to-r from-emerald-600 to-green-600 p-3 shadow-[0_0_5px_rgba(34,197,94,0.4)]">
                      <Dumbbell className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-emerald-300">Plano de Treino</h3>
                      <p className="text-gray-300">Programas de exercícios para seu biotipo e objetivos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-teal-950 to-gray-900 border border-teal-500/30 hover:shadow-[0_0_10px_rgba(34,197,94,0.4)] transition-all duration-500 hover:-translate-y-1">
                    <div className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 p-3 shadow-[0_0_5px_rgba(34,197,94,0.4)]">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-teal-300">Agente Nutri AI</h3>
                      <p className="text-gray-300">Assistente inteligente disponível 24/7 para suas dúvidas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona - Section com animações e melhor visualização */}
      <section className="w-full py-16 md:py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.1),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-block rounded-full bg-green-900/50 px-4 py-1.5 text-sm font-medium text-emerald-300 mb-4 shadow-[0_0_5px_rgba(34,197,94,0.3)]">
              Simples e eficiente
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">
              Três passos para sua transformação
            </h2>
            <p className="text-xl text-emerald-200 max-w-3xl mx-auto">
              Um processo descomplicado para transformar seu corpo e sua saúde
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mt-16 relative">
            <div className="bg-gray-900/90 rounded-xl p-8 shadow-[0_0_10px_rgba(34,197,94,0.4)] border border-green-500/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:-translate-y-2 animate-fade-in">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xl mb-6 shadow-[0_0_10px_rgba(34,197,94,0.4)]">1</div>
              <h3 className="text-2xl font-bold mb-3 text-emerald-300">Cadastre-se</h3>
              <p className="text-gray-300">Crie sua conta em menos de 2 minutos para iniciar sua jornada</p>
            </div>
            
            <div className="bg-gray-900/90 rounded-xl p-8 shadow-[0_0_10px_rgba(34,197,94,0.4)] border border-green-500/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:-translate-y-2 animate-fade-in [animation-delay:200ms]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xl mb-6 shadow-[0_0_10px_rgba(34,197,94,0.4)]">2</div>
              <h3 className="text-2xl font-bold mb-3 text-emerald-300">Personalize seu plano</h3>
              <p className="text-gray-300">Informe seus objetivos, preferências alimentares e metas de treino</p>
            </div>
            
            <div className="bg-gray-900/90 rounded-xl p-8 shadow-[0_0_10px_rgba(34,197,94,0.4)] border border-green-500/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:-translate-y-2 animate-fade-in [animation-delay:400ms]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xl mb-6 shadow-[0_0_10px_rgba(34,197,94,0.4)]">3</div>
              <h3 className="text-2xl font-bold mb-3 text-teal-300">Acesse seus planos</h3>
              <p className="text-gray-300">Comece imediatamente seu programa personalizado com ajuda do Agente Nutri AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-r from-green-900 to-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(52,211,153,0.2),transparent_50%)]"></div>
        
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]">
              Pronto para transformar seu corpo?
            </h2>
            <p className="text-xl md:text-2xl text-emerald-200 mb-8">
              Junte-se a mais de 1.500 pessoas que já estão conquistando o corpo que sempre sonharam
            </p>
            
            <div className="inline-block relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg blur-md opacity-50 group-hover:opacity-70 transition duration-1000 group-hover:duration-300 animate-tilt"></div>
              {isAuthenticated ? (
                <Link to="/dashboard" className="relative">
                  <Button size="lg" className="relative bg-gray-900 text-white hover:bg-gray-800 shadow-[0_0_10px_rgba(34,197,94,0.4)] px-8 py-6 text-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] group">
                    Acessar Meu Plano
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link to="/register" className="relative">
                  <Button size="lg" className="relative bg-gray-900 text-white hover:bg-gray-800 shadow-[0_0_10px_rgba(34,197,94,0.4)] px-8 py-6 text-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] group">
                    Começar Minha Transformação
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
            
            <p className="mt-4 text-emerald-200 text-sm flex items-center justify-center gap-1">
              <Shield className="h-4 w-4 text-emerald-300" /> 100% seguro • Acesso imediato • Satisfação garantida
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

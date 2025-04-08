
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dumbbell, Apple, ChevronRight, Bike, Salad } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const Index = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="hero-gradient flex flex-1 flex-col">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 space-y-10 xl:space-y-16">
            <div className="grid gap-4 px-4 sm:px-6 md:px-10 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-4 animate-slide-in">
                <div className="inline-block rounded-lg bg-lavender px-3 py-1 text-sm">
                  Seu bem-estar personalizado
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Seu plano personalizado de nutrição e fitness
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Conquiste seus objetivos com um plano alimentar e de treino criado especialmente para você. Simples, eficiente e 100% personalizado.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  {isAuthenticated ? (
                    <Link to="/dashboard">
                      <Button size="lg" className="bg-lavender hover:bg-lavender-dark">
                        Acessar Dashboard
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/login">
                      <Button size="lg" className="bg-lavender hover:bg-lavender-dark">
                        Começar Agora
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              <div className="mt-8 flex items-center justify-center lg:mt-0 lg:justify-end">
                <div className="space-y-4 rounded-xl bg-gradient-to-b from-white to-mint-light/30 p-8 shadow-lg animate-fade-in">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-lavender p-1.5">
                        <Apple className="h-4 w-4 text-white" />
                      </div>
                      <div className="font-semibold">Plano Alimentar</div>
                    </div>
                    <div className="pl-9">Refeições balanceadas e adaptadas ao seu estilo de vida</div>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-mint p-1.5">
                        <Dumbbell className="h-4 w-4 text-white" />
                      </div>
                      <div className="font-semibold">Plano de Treino</div>
                    </div>
                    <div className="pl-9">Exercícios personalizados para os seus objetivos</div>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-lavender-dark p-1.5">
                        <Bike className="h-4 w-4 text-white" />
                      </div>
                      <div className="font-semibold">Acompanhamento</div>
                    </div>
                    <div className="pl-9">Suporte contínuo para manter você motivado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-mint px-3 py-1 text-sm">
                  Funcionalidades
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Como funciona
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Um processo simples para obter resultados extraordinários
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1 animate-slide-in">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="text-xl font-bold">Cadastro Simples</h3>
                </div>
                <p className="text-gray-500">
                  Acesse com o seu número de WhatsApp e crie uma senha para começar.
                </p>
              </div>
              <div className="grid gap-1 animate-slide-in [animation-delay:200ms]">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h3 className="text-xl font-bold">Formulário de Anamnese</h3>
                </div>
                <p className="text-gray-500">
                  Preencha suas informações para que possamos personalizar seu plano.
                </p>
              </div>
              <div className="grid gap-1 animate-slide-in [animation-delay:400ms]">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender-dark">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h3 className="text-xl font-bold">Receba seu Plano</h3>
                </div>
                <p className="text-gray-500">
                  Acesse seu dashboard para visualizar seu plano personalizado quando estiver pronto.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-lavender-light to-mint-light">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Pronto para transformar sua saúde?
                </h2>
                <p className="max-w-[900px] text-gray-700 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Dê o primeiro passo para uma vida mais saudável agora mesmo.
                </p>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-2">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button className="w-full bg-lavender hover:bg-lavender-dark" size="lg">
                      Acesse seu Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login">
                    <Button className="w-full bg-lavender hover:bg-lavender-dark" size="lg">
                      Crie sua conta agora
                    </Button>
                  </Link>
                )}
                <p className="text-xs text-gray-500">
                  Comece a jornada para um estilo de vida mais saudável hoje mesmo.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;

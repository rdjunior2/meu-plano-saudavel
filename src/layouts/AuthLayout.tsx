import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { Link } from 'react-router-dom';
import RootLayout from './RootLayout';
import Logo from '../components/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  linkText?: string;
  linkTo?: string;
}

/**
 * Layout específico para páginas de autenticação (login, registro, etc.)
 * Fornece uma estrutura visualmente consistente com o resto da aplicação
 */
export default function AuthLayout({ 
  children, 
  title = "Acesse sua conta", 
  subtitle = "Entre para acessar seu plano personalizado",
  linkText,
  linkTo
}: AuthLayoutProps) {
  return (
    <RootLayout showNavbar={false} showFooter={false}>
      <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row">
          {/* Lado esquerdo - Simplificado e com cores mais neutras */}
          <div className="hidden md:flex md:w-1/2 bg-slate-100 p-8 items-center justify-center">
            <div className="max-w-md text-center">
              <Logo size={60} className="mx-auto mb-6 text-sky-600" /> 
              <h1 className="text-3xl font-bold mb-3 text-slate-800">Meu Plano</h1>
              <p className="text-slate-600 mb-8">
                Transforme seu corpo e sua vida com planos personalizados.
              </p>
            </div>
          </div>
          
          {/* Lado direito - Formulário com cores ajustadas */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-12">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
                <p className="text-slate-500 mt-2">{subtitle}</p>
              </div>
              
              {children}
              
              {linkText && linkTo && (
                <div className="text-center mt-8">
                  <Link 
                    to={linkTo} 
                    className="text-sky-600 hover:text-sky-700 text-sm font-medium"
                  >
                    {linkText}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </RootLayout>
  );
} 
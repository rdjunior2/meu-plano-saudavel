import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { loginWithEmail, registerUser, checkSession, logout } from '../services/auth';
import { supabase } from '@/lib/supabaseClient';

// Mock do supabase
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock do Cookies
vi.mock('js-cookie', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn()
  }
}));

describe('Serviços de Autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loginWithEmail', () => {
    it('deve fazer login com sucesso e retornar os dados do usuário', async () => {
      // Mock de resposta do supabase
      const mockAuthResponse = {
        data: {
          user: { id: 'user123', email: 'teste@example.com' },
          session: { access_token: 'token123', refresh_token: 'refresh123' }
        },
        error: null
      };

      const mockProfileResponse = {
        data: {
          id: 'user123',
          nome: 'Usuário Teste',
          telefone: '5511999999999',
          email: 'teste@example.com',
          status_geral: 'ativo',
          is_admin: false
        },
        error: null
      };

      // Configurar mocks
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockAuthResponse as any);
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(mockProfileResponse)
          })
        })
      } as any);

      // Executar função
      const result = await loginWithEmail('teste@example.com', 'senha123');

      // Verificar resultado
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.nome).toBe('Usuário Teste');
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'teste@example.com',
        password: 'senha123'
      });
    });

    it('deve retornar erro quando a autenticação falhar', async () => {
      // Mock de resposta do supabase com erro
      const mockAuthResponse = {
        data: { user: null, session: null },
        error: { message: 'Email ou senha incorretos' }
      };

      // Configurar mock
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockAuthResponse as any);

      // Executar função
      const result = await loginWithEmail('teste@example.com', 'senha_errada');

      // Verificar resultado
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.user).toBeUndefined();
    });
  });

  describe('registerUser', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      // Mock de resposta do supabase
      const mockAuthResponse = {
        data: {
          user: { id: 'newuser123', email: 'novo@example.com' },
          session: { access_token: 'token123', refresh_token: 'refresh123' }
        },
        error: null
      };

      const mockProfileResponse = {
        error: null
      };

      // Configurar mocks
      vi.mocked(supabase.auth.signUp).mockResolvedValue(mockAuthResponse as any);
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue(mockProfileResponse)
      } as any);

      // Dados do usuário
      const userData = {
        nome: 'Novo Usuário',
        telefone: '5511988888888'
      };

      // Executar função
      const result = await registerUser('novo@example.com', 'senha123', userData);

      // Verificar resultado
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'novo@example.com',
        password: 'senha123',
        options: {
          data: {
            nome: 'Novo Usuário',
            telefone: '5511988888888'
          }
        }
      });
    });

    it('deve retornar erro quando o registro falhar', async () => {
      // Mock de resposta do supabase com erro
      const mockAuthResponse = {
        data: { user: null, session: null },
        error: { message: 'Email já está em uso' }
      };

      // Configurar mock
      vi.mocked(supabase.auth.signUp).mockResolvedValue(mockAuthResponse as any);

      // Dados do usuário
      const userData = {
        nome: 'Novo Usuário',
        telefone: '5511988888888'
      };

      // Executar função
      const result = await registerUser('existente@example.com', 'senha123', userData);

      // Verificar resultado
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email já está em uso');
    });
  });

  describe('checkSession', () => {
    it('deve retornar a sessão quando ela existir', async () => {
      // Mock de resposta do supabase
      const mockSession = {
        data: {
          session: {
            access_token: 'token123',
            refresh_token: 'refresh123',
            user: { id: 'user123' }
          }
        },
        error: null
      };

      // Configurar mock
      vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSession as any);

      // Executar função
      const result = await checkSession();

      // Verificar resultado
      expect(result).toBeDefined();
      expect(result?.access_token).toBe('token123');
    });

    it('deve retornar null quando não houver sessão', async () => {
      // Mock de resposta do supabase sem sessão
      const mockSession = {
        data: { session: null },
        error: null
      };

      // Configurar mock
      vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSession as any);

      // Executar função
      const result = await checkSession();

      // Verificar resultado
      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('deve fazer logout com sucesso', async () => {
      // Mock de resposta do supabase
      const mockResponse = { error: null };

      // Configurar mock
      vi.mocked(supabase.auth.signOut).mockResolvedValue(mockResponse as any);

      // Executar função
      const result = await logout();

      // Verificar resultado
      expect(result.success).toBe(true);
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
}); 
import axios from 'axios';

// URL base da API, usando variável de ambiente quando disponível
const baseURL = import.meta.env.VITE_API_URL || 'https://api.meuplanonutri.com.br';

// Criando instância do axios com configurações padrão
export const api = axios.create({
  baseURL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Erro na configuração da requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento de erros comuns
    if (error.response) {
      // Erro retornado pelo servidor (4xx, 5xx)
      console.error('[API] Erro na resposta:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
      
      // Se o erro for de autenticação (401), podemos disparar ações como logout
      if (error.response.status === 401) {
        // Verificar se não estamos em uma rota de autenticação para evitar loops
        if (
          !error.config.url.includes('/auth/login') && 
          !error.config.url.includes('/auth/register')
        ) {
          console.warn('[API] Erro de autenticação, redirecionando para login');
          // Aqui poderia haver um redirecionamento para login ou limpeza do estado
          localStorage.removeItem('token');
        }
      }
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta (problemas de rede)
      console.error('[API] Sem resposta do servidor:', error.request);
    } else {
      // Algo aconteceu na configuração da requisição
      console.error('[API] Erro na configuração:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api; 
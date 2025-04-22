import { supabase } from '@/lib/supabaseClient'

/**
 * Níveis de severidade para logs
 */
export enum LogSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * Registra um evento no sistema de logs
 * @param eventName Nome do evento
 * @param message Mensagem descritiva
 * @param severity Nível de severidade
 * @param metadata Dados adicionais
 */
export const logEvent = (
  eventName: string,
  message: string,
  severity: LogSeverity = LogSeverity.INFO,
  metadata: Record<string, any> = {}
) => {
  // Criar objeto de log
  const logData = {
    event: eventName,
    message,
    severity,
    timestamp: new Date().toISOString(),
    ...metadata
  };

  // No ambiente de desenvolvimento, exibe no console
  if (import.meta.env.DEV) {
    const consoleMethod = {
      [LogSeverity.DEBUG]: console.debug,
      [LogSeverity.INFO]: console.info,
      [LogSeverity.WARNING]: console.warn,
      [LogSeverity.ERROR]: console.error,
      [LogSeverity.FATAL]: console.error
    }[severity] || console.log;

    consoleMethod(`[${severity.toUpperCase()}] ${eventName}: ${message}`, metadata);
  }

  // Em produção, poderia enviar para um serviço de monitoramento
  if (import.meta.env.PROD) {
    try {
      // Salvar log em arquivo (em produção, isto seria enviado para um serviço externo)
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(logData);
      
      // Manter apenas os últimos 100 logs
      if (logs.length > 100) {
        logs.shift();
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Erro ao salvar log:', error);
    }
  }
  
  return logData;
};

/**
 * Recupera os logs armazenados
 */
export const getLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('app_logs') || '[]');
  } catch (error) {
    console.error('Erro ao recuperar logs:', error);
    return [];
  }
};

/**
 * Limpa todos os logs armazenados
 */
export const clearLogs = () => {
  localStorage.removeItem('app_logs');
};

/**
 * Registra um erro crítico e envia notificação
 * Este método deve ser usado para erros que precisam de intervenção imediata
 */
export const logCriticalError = async (
  event: string,
  description: string,
  metadata: any = {}
) => {
  try {
    // Registra o log no banco
    const logged = await logEvent(
      event,
      description,
      LogSeverity.FATAL,
      metadata
    )
    
    // Tenta enviar notificação via webhook (chamada fake para simular)
    try {
      const notificationEndpoint = import.meta.env.VITE_NOTIFICATION_WEBHOOK_URL
      
      if (notificationEndpoint) {
        const response = await fetch(notificationEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event,
            description,
            severity: LogSeverity.FATAL,
            timestamp: new Date().toISOString(),
            metadata
          })
        })
        
        if (!response.ok) {
          console.error('Erro ao enviar notificação:', await response.text())
        }
      }
    } catch (notificationError) {
      console.error('Erro ao enviar notificação:', notificationError)
    }
    
    return logged
  } catch (error) {
    console.error('Erro ao registrar erro crítico:', error)
    return false
  }
}

/**
 * Busca logs recentes com base nos filtros
 */
export const getRecentLogs = async (
  severity?: LogSeverity,
  limit: number = 100,
  offset: number = 0
) => {
  try {
    let query = supabase
      .from('log_agente_automacao')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (severity) {
      query = query.eq('severidade', severity)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Erro ao buscar logs:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, logs: data }
  } catch (error) {
    console.error('Erro ao buscar logs:', error)
    return { success: false, error: 'Ocorreu um erro inesperado.' }
  }
} 
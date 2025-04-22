import { supabase } from '@/lib/supabaseClient'

/**
 * Níveis de severidade para logs
 */
export enum LogSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Loga eventos do sistema na tabela de logs
 */
export const logEvent = async (
  event: string,
  description: string,
  severity: LogSeverity = LogSeverity.INFO,
  metadata: any = {}
) => {
  try {
    const { error } = await supabase
      .from('log_agente_automacao')
      .insert({
        evento: event,
        descricao: description,
        severidade: severity,
        metadata: metadata,
        timestamp: new Date().toISOString()
      })
    
    if (error) {
      console.error('Erro ao registrar log:', error)
      // Se falhar ao registrar no banco, ao menos registra no console
      console.error('Log original:', { event, description, severity, metadata })
      return false
    }
    
    return true
  } catch (error) {
    console.error('Erro ao registrar log:', error)
    // Se falhar ao registrar no banco, ao menos registra no console
    console.error('Log original:', { event, description, severity, metadata })
    return false
  }
}

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
      LogSeverity.CRITICAL,
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
            severity: LogSeverity.CRITICAL,
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
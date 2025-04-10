import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function validateEnvironmentVariables() {
  const errors: string[] = []

  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL não está definida')
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL deve começar com https://')
  }

  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY não está definida')
  } else if (supabaseAnonKey === 'sua_chave_anonima_do_supabase') {
    errors.push('VITE_SUPABASE_ANON_KEY ainda está usando o valor padrão')
  }

  if (errors.length > 0) {
    throw new Error(
      'Erro na configuração do Supabase:\n' +
      errors.map(err => `- ${err}`).join('\n') +
      '\n\nVerifique o arquivo .env.example para instruções de configuração.'
    )
  }
}

validateEnvironmentVariables()

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 
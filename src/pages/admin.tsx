import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import AdminPanel from '@/components/AdminPanel'
import { Toaster } from 'sonner'
import { AlertCircle, Users, ClipboardList, Bell, LayoutDashboard, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import DashboardLayout from '@/components/DashboardLayout'

/**
 * Página de redirecionamento para a área administrativa
 * Verifica permissões e redireciona para o dashboard administrativo
 */
export default function AdminPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar se o usuário tem permissões de admin
    if (!user) {
      navigate('/login')
      return
    }
    
    if (!user.is_admin) {
      navigate('/dashboard')
      return
    }
    
    // Redirecionar para o dashboard administrativo
    navigate('/admin/index')
  }, [user, navigate])

  return (
    <DashboardLayout 
      title="Área Administrativa"
      subtitle="Carregando área administrativa..."
      icon={<Settings className="h-5 w-5 text-slate-600" />}
      gradient="subtle"
      isAdmin={true}
    >
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    </DashboardLayout>
  )
} 
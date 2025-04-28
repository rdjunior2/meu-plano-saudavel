import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import AdminPanel from '@/components/AdminPanel'
import { Toaster } from 'sonner'
import { AlertCircle, Users, ClipboardList, Bell, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import DashboardLayout from '@/components/DashboardLayout'

/**
 * Página de gerenciamento de planos pendentes
 */
export default function AdminPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar se o usuário tem permissões de admin
    if (user && !user.is_admin) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  return (
    <DashboardLayout 
      title="Gerenciamento de Planos"
      subtitle="Ative e gerencie planos de usuários"
      icon={<ClipboardList className="h-5 w-5 text-emerald-600" />}
      gradient="subtle"
      isAdmin={true}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <AdminPanel />
      </div>
    </DashboardLayout>
  )
} 
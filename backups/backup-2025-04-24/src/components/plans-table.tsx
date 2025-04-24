"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DatePicker } from './ui/date-picker'
import { Button } from './ui/button'
import { useToast } from './ui/use-toast'
import { supabase } from '@/lib/supabase'

interface Plan {
  id: string
  user_id: string
  data_inicio: string
  data_fim: string
  status: string
  tipo: 'meal' | 'workout'
}

interface PlansTableProps {
  plans: Plan[]
  onUpdate: () => void
}

export function PlansTable({ plans, onUpdate }: PlansTableProps) {
  const [loading, setLoading] = useState<{[key: string]: boolean}>({})
  const { toast } = useToast()

  const updatePlanDates = async (planId: string, startDate: Date | undefined, endDate: Date | undefined) => {
    if (!startDate || !endDate) return

    setLoading(prev => ({ ...prev, [planId]: true }))

    try {
      const table = plans[0]?.tipo === 'meal' ? 'meal_plans' : 'workout_plans'
      
      const { error } = await supabase
        .from(table)
        .update({ 
          data_inicio: startDate.toISOString(),
          data_fim: endDate.toISOString()
        })
        .eq('id', planId)

      if (error) throw error

      toast({
        title: "Plano atualizado com sucesso",
        description: "As datas do plano foram atualizadas.",
      })

      onUpdate()
    } catch (error) {
      toast({
        title: "Erro ao atualizar plano",
        description: "Ocorreu um erro ao atualizar as datas do plano.",
        variant: "destructive"
      })
    } finally {
      setLoading(prev => ({ ...prev, [planId]: false }))
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID do Usuário</TableHead>
          <TableHead>Data Início</TableHead>
          <TableHead>Data Fim</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell>{plan.user_id}</TableCell>
            <TableCell>
              <DatePicker
                date={new Date(plan.data_inicio)}
                onChange={(date) => date && updatePlanDates(plan.id, date, new Date(plan.data_fim))}
                disabled={loading[plan.id]}
              />
            </TableCell>
            <TableCell>
              <DatePicker
                date={new Date(plan.data_fim)}
                onChange={(date) => date && updatePlanDates(plan.id, new Date(plan.data_inicio), date)}
                disabled={loading[plan.id]}
              />
            </TableCell>
            <TableCell>{plan.status}</TableCell>
            <TableCell>
              <Button 
                variant="outline" 
                size="sm"
                disabled={loading[plan.id]}
                onClick={() => {
                  const today = new Date()
                  updatePlanDates(plan.id, today, new Date(today.setMonth(today.getMonth() + 1)))
                }}
              >
                Renovar (1 mês)
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 
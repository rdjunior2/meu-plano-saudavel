import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export interface PlanFilters {
  type: 'all' | 'meal' | 'workout';
  sortBy: 'created_at' | 'title';
  sortOrder: 'asc' | 'desc';
  search: string;
}

interface PlanFiltersProps {
  filters: PlanFilters;
  setFilters: React.Dispatch<React.SetStateAction<PlanFilters>>;
}

export const PlanFilters: React.FC<PlanFiltersProps> = ({ filters, setFilters }) => {
  return (
    <Card className="border border-gray-200 bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 mb-3 md:mb-0 md:hidden">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filtros</span>
          </div>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por título ou nome do usuário..."
              className="pl-9 border-gray-200 focus:border-sky-500 focus:ring-sky-500"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as PlanFilters['type'] }))}
            >
              <SelectTrigger className="w-[120px] border-gray-200 focus:ring-sky-500">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="meal">Alimentar</SelectItem>
                <SelectItem value="workout">Treino</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as PlanFilters['sortBy'] }))}
            >
              <SelectTrigger className="w-[150px] border-gray-200 focus:ring-sky-500">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Data de criação</SelectItem>
                <SelectItem value="title">Título</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.sortOrder}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value as PlanFilters['sortOrder'] }))}
            >
              <SelectTrigger className="w-[120px] border-gray-200 focus:ring-sky-500">
                <SelectValue placeholder="Ordem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Mais recente</SelectItem>
                <SelectItem value="asc">Mais antigo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanFilters; 
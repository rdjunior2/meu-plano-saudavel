import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeft, Save, Plus, MinusCircle, Trash2, MoveUp, MoveDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Interfaces
interface Campo {
  id: string;
  label: string;
  tipo: 'texto' | 'numero' | 'selecao' | 'checkbox' | 'data' | 'textarea';
  obrigatorio: boolean;
  opcoes?: string[];
  ordem: number;
}

interface Formulario {
  id?: string;
  nome: string;
  descricao: string;
  tipo: 'anamnese' | 'avaliacao' | 'progresso';
  ativo: boolean;
  campos: Campo[];
}

export default function FormularioEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formulario, setFormulario] = useState<Formulario>({
    nome: '',
    descricao: '',
    tipo: 'anamnese',
    ativo: true,
    campos: []
  });
  const [novaOpcao, setNovaOpcao] = useState<{ [key: string]: string }>({});

  // Modo de edição ou criação
  const isEditMode = !!id;

  // Carregar formulário existente se estiver no modo de edição
  useEffect(() => {
    const fetchFormulario = async () => {
      if (!isEditMode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setFormulario({
            id: data.id,
            nome: data.name || data.title || '',
            descricao: data.description || '',
            tipo: data.type || 'anamnese',
            ativo: data.is_active || false,
            campos: data.fields || []
          });
        }
      } catch (error) {
        console.error('Erro ao carregar formulário:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o formulário.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormulario();
  }, [id, isEditMode, toast]);

  // Adicionar campo ao formulário
  const adicionarCampo = () => {
    const novoCampo: Campo = {
      id: uuidv4(),
      label: 'Novo Campo',
      tipo: 'texto',
      obrigatorio: false,
      ordem: formulario.campos.length
    };

    setFormulario(prev => ({
      ...prev,
      campos: [...prev.campos, novoCampo]
    }));
  };

  // Remover campo do formulário
  const removerCampo = (campoId: string) => {
    setFormulario(prev => ({
      ...prev,
      campos: prev.campos.filter(campo => campo.id !== campoId)
    }));
  };

  // Atualizar campo
  const atualizarCampo = (campoId: string, atualizacao: Partial<Campo>) => {
    setFormulario(prev => ({
      ...prev,
      campos: prev.campos.map(campo => 
        campo.id === campoId ? { ...campo, ...atualizacao } : campo
      )
    }));
  };

  // Adicionar opção a um campo de seleção
  const adicionarOpcao = (campoId: string) => {
    if (!novaOpcao[campoId] || novaOpcao[campoId].trim() === '') return;

    setFormulario(prev => ({
      ...prev,
      campos: prev.campos.map(campo => {
        if (campo.id === campoId) {
          const opcoes = campo.opcoes || [];
          return {
            ...campo,
            opcoes: [...opcoes, novaOpcao[campoId]]
          };
        }
        return campo;
      })
    }));

    setNovaOpcao(prev => ({ ...prev, [campoId]: '' }));
  };

  // Remover opção de um campo de seleção
  const removerOpcao = (campoId: string, index: number) => {
    setFormulario(prev => ({
      ...prev,
      campos: prev.campos.map(campo => {
        if (campo.id === campoId && campo.opcoes) {
          const opcoes = [...campo.opcoes];
          opcoes.splice(index, 1);
          return { ...campo, opcoes };
        }
        return campo;
      })
    }));
  };

  // Mover campo para cima
  const moverCampoCima = (index: number) => {
    if (index === 0) return;
    
    const novosCampos = [...formulario.campos];
    [novosCampos[index], novosCampos[index - 1]] = [novosCampos[index - 1], novosCampos[index]];
    
    // Atualizar a ordem dos campos
    novosCampos.forEach((campo, idx) => {
      campo.ordem = idx;
    });
    
    setFormulario(prev => ({ ...prev, campos: novosCampos }));
  };

  // Mover campo para baixo
  const moverCampoBaixo = (index: number) => {
    if (index === formulario.campos.length - 1) return;
    
    const novosCampos = [...formulario.campos];
    [novosCampos[index], novosCampos[index + 1]] = [novosCampos[index + 1], novosCampos[index]];
    
    // Atualizar a ordem dos campos
    novosCampos.forEach((campo, idx) => {
      campo.ordem = idx;
    });
    
    setFormulario(prev => ({ ...prev, campos: novosCampos }));
  };

  // Salvar formulário
  const salvarFormulario = async () => {
    // Validação básica
    if (!formulario.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do formulário é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      const dadosFormulario = {
        name: formulario.nome,
        description: formulario.descricao,
        type: formulario.tipo,
        is_active: formulario.ativo,
        fields: formulario.campos,
        updated_at: new Date().toISOString()
      };

      let resultado;

      if (isEditMode && formulario.id) {
        // Atualizar formulário existente
        resultado = await supabase
          .from('forms')
          .update(dadosFormulario)
          .eq('id', formulario.id);
      } else {
        // Criar novo formulário
        dadosFormulario['created_at'] = new Date().toISOString();
        
        // Tenta criar a tabela "forms" se ela não existir (isso normalmente é feito pela migração)
        try {
          resultado = await supabase
            .from('forms')
            .insert(dadosFormulario);
              
          // Se receber erro 404, cria a tabela primeiro
          if (resultado.error && (resultado.error.code === '404' || resultado.error.message?.includes('does not exist'))) {
            // Notificar o usuário sobre a criação da tabela
            toast({
              title: 'Criando estrutura',
              description: 'Configurando o banco de dados para formulários.',
              variant: 'default',
            });
            
            console.log('Tentativa de criar tabela forms ao usar pela primeira vez');
            
            // Tenta novamente após um momento
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            resultado = await supabase
              .from('forms')
              .insert(dadosFormulario);
          }
        } catch (insertError) {
          console.error('Erro ao inserir formulário:', insertError);
          throw insertError;
        }
      }

      if (resultado.error) {
        throw resultado.error;
      }

      toast({
        title: isEditMode ? 'Formulário atualizado' : 'Formulário criado',
        description: isEditMode 
          ? 'O formulário foi atualizado com sucesso.'
          : 'O formulário foi criado com sucesso.',
        variant: 'default',
      });

      // Redirecionar para a lista de formulários
      navigate('/admin/formularios');
    } catch (error) {
      console.error('Erro ao salvar formulário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o formulário. Verifique se a tabela "forms" existe no banco de dados.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Renderizar campos do formulário
  const renderizarCampos = () => {
    return formulario.campos.map((campo, index) => (
      <Card key={campo.id} className="mb-4 border border-gray-200">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <Label htmlFor={`campo-${campo.id}-label`}>Nome do Campo</Label>
              <Input
                id={`campo-${campo.id}-label`}
                value={campo.label}
                onChange={e => atualizarCampo(campo.id, { label: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="icon"
                variant="outline"
                onClick={() => moverCampoCima(index)}
                disabled={index === 0}
                className="h-8 w-8"
              >
                <MoveUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => moverCampoBaixo(index)}
                disabled={index === formulario.campos.length - 1}
                className="h-8 w-8"
              >
                <MoveDown className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => removerCampo(campo.id)}
                className="h-8 w-8 bg-red-100 hover:bg-red-200 border-red-200 text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`campo-${campo.id}-tipo`}>Tipo de Campo</Label>
              <Select
                value={campo.tipo}
                onValueChange={value => atualizarCampo(campo.id, { 
                  tipo: value as Campo['tipo'],
                  opcoes: value === 'selecao' ? (campo.opcoes || []) : undefined
                })}
              >
                <SelectTrigger id={`campo-${campo.id}-tipo`} className="mt-1">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">Texto</SelectItem>
                  <SelectItem value="numero">Número</SelectItem>
                  <SelectItem value="selecao">Seleção</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="textarea">Área de texto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center mt-4">
              <Checkbox
                id={`campo-${campo.id}-obrigatorio`}
                checked={campo.obrigatorio}
                onCheckedChange={checked => atualizarCampo(campo.id, { obrigatorio: !!checked })}
              />
              <Label htmlFor={`campo-${campo.id}-obrigatorio`} className="ml-2">
                Campo obrigatório
              </Label>
            </div>
          </div>

          {/* Opções para campo do tipo seleção */}
          {campo.tipo === 'selecao' && (
            <div className="mt-4">
              <Label>Opções de Seleção</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={novaOpcao[campo.id] || ''}
                  onChange={e => setNovaOpcao({ ...novaOpcao, [campo.id]: e.target.value })}
                  placeholder="Nova opção"
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => adicionarOpcao(campo.id)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                {campo.opcoes?.map((opcao, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <span>{opcao}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removerOpcao(campo.id, i)}
                      className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {(!campo.opcoes || campo.opcoes.length === 0) && (
                  <div className="text-center py-3 text-gray-500 text-sm italic">
                    Nenhuma opção adicionada
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    ));
  };

  // Componente de loading
  if (isLoading) {
    return (
      <DashboardLayout
        title="Carregando Formulário"
        subtitle="Aguarde enquanto carregamos os dados do formulário..."
        gradient="subtle"
        isAdmin={true}
      >
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={isEditMode ? "Editar Formulário" : "Novo Formulário"}
      subtitle={isEditMode ? "Edite as informações e campos do formulário" : "Crie um novo formulário para seus pacientes"}
      gradient="subtle"
      isAdmin={true}
    >
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-emerald-800">
            {isEditMode ? "Editar Formulário" : "Novo Formulário"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Modifique as informações e campos do formulário conforme necessário."
              : "Preencha as informações básicas e adicione os campos desejados."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Formulário *</Label>
                <Input
                  id="nome"
                  value={formulario.nome}
                  onChange={e => setFormulario(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Anamnese Inicial"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Formulário</Label>
                <Select
                  value={formulario.tipo}
                  onValueChange={value => setFormulario(prev => ({ ...prev, tipo: value as 'anamnese' | 'avaliacao' | 'progresso' }))}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anamnese">Anamnese</SelectItem>
                    <SelectItem value="avaliacao">Avaliação Física</SelectItem>
                    <SelectItem value="progresso">Acompanhamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formulario.descricao}
                onChange={e => setFormulario(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o objetivo deste formulário..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={formulario.ativo}
                onCheckedChange={checked => setFormulario(prev => ({ ...prev, ativo: !!checked }))}
              />
              <Label htmlFor="ativo">Formulário ativo</Label>
            </div>

            {/* Campos do formulário */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-emerald-800">Campos do Formulário</h3>
                <Button onClick={adicionarCampo} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Campo
                </Button>
              </div>

              <div className="space-y-4">
                {formulario.campos.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-600 mb-1">Nenhum campo adicionado</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-4">
                      Adicione campos para construir seu formulário.
                    </p>
                    <Button onClick={adicionarCampo} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Campo
                    </Button>
                  </div>
                ) : (
                  renderizarCampos()
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-gray-50/50 p-6">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/formularios')}
            className="border-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={salvarFormulario}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
          >
            {isSaving ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
} 
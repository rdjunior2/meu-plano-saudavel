
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import FormStepper from '@/components/FormStepper';
import { useAuthStore } from '@/stores/authStore';
import { useFormStore } from '@/stores/formStore';
import { usePlanStore } from '@/stores/planStore';

const formSteps = [
  "Dados Pessoais",
  "Objetivos",
  "Rotina",
  "Saúde",
  "Alimentação",
  "Treino",
  "Revisão"
];

const Anamnese = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setFormCompleted } = useAuthStore();
  const { formData, activeStep, updateFormField, setActiveStep, isSubmitting, setIsSubmitting, setIsCompleted } = useFormStore();
  const { setPlanStatus } = usePlanStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleNextStep = () => {
    if (activeStep < formSteps.length - 1) {
      setActiveStep(activeStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      // Simulação de envio de dados para uma API externa
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Atualizar status
      setFormCompleted(true);
      setIsCompleted(true);
      setPlanStatus('processing');
      
      toast.success("Formulário enviado com sucesso!");
      
      // Simulação de recebimento do plano após alguns segundos
      setTimeout(() => {
        const mockMealPlan = {
          title: "Plano Alimentar Personalizado",
          description: "Plano alimentar focado em perda de peso com refeições balanceadas.",
          meals: [
            {
              name: "Café da Manhã",
              time: "07:00",
              foods: [
                { name: "Ovos mexidos", portion: "2 unidades" },
                { name: "Torrada integral", portion: "2 fatias" },
                { name: "Mamão", portion: "1/2 unidade" }
              ]
            },
            {
              name: "Lanche da Manhã",
              time: "10:00",
              foods: [
                { name: "Iogurte natural", portion: "1 pote" },
                { name: "Banana", portion: "1 unidade" }
              ]
            },
            {
              name: "Almoço",
              time: "13:00",
              foods: [
                { name: "Frango grelhado", portion: "150g" },
                { name: "Arroz integral", portion: "4 colheres" },
                { name: "Feijão", portion: "2 colheres" },
                { name: "Salada verde", portion: "À vontade" }
              ]
            },
            {
              name: "Lanche da Tarde",
              time: "16:00",
              foods: [
                { name: "Maçã", portion: "1 unidade" },
                { name: "Castanhas", portion: "10 unidades" }
              ]
            },
            {
              name: "Jantar",
              time: "19:30",
              foods: [
                { name: "Peixe assado", portion: "150g" },
                { name: "Batata doce", portion: "1 unidade média" },
                { name: "Legumes cozidos", portion: "1 xícara" }
              ]
            }
          ]
        };
        
        const mockWorkoutPlan = {
          title: "Plano de Treino Personalizado",
          description: "Treino focado em fortalecimento muscular e condicionamento físico.",
          days: [
            {
              day: "Segunda-feira - Peito e Tríceps",
              exercises: [
                { name: "Supino reto", sets: 4, reps: "12, 10, 8, 8", rest: "60s" },
                { name: "Crucifixo", sets: 3, reps: "12-15", rest: "45s" },
                { name: "Tríceps corda", sets: 3, reps: "12-15", rest: "45s" },
                { name: "Tríceps francês", sets: 3, reps: "10-12", rest: "60s" }
              ]
            },
            {
              day: "Quarta-feira - Costas e Bíceps",
              exercises: [
                { name: "Puxada frontal", sets: 4, reps: "12, 10, 8, 8", rest: "60s" },
                { name: "Remada curvada", sets: 3, reps: "10-12", rest: "60s" },
                { name: "Rosca direta", sets: 3, reps: "10-12", rest: "45s" },
                { name: "Rosca martelo", sets: 3, reps: "10-12", rest: "45s" }
              ]
            },
            {
              day: "Sexta-feira - Pernas e Ombros",
              exercises: [
                { name: "Agachamento", sets: 4, reps: "12, 10, 10, 8", rest: "90s" },
                { name: "Leg press", sets: 3, reps: "12-15", rest: "60s" },
                { name: "Desenvolvimento", sets: 3, reps: "10-12", rest: "60s" },
                { name: "Elevação lateral", sets: 3, reps: "12-15", rest: "45s" }
              ]
            }
          ]
        };
        
        // Atualizar o status e os planos
        usePlanStore.getState().setMealPlan(mockMealPlan);
        usePlanStore.getState().setWorkoutPlan(mockWorkoutPlan);
        usePlanStore.getState().setPlanStatus('ready');
        usePlanStore.getState().setPdfUrl('https://example.com/fake-plan.pdf');
        
        // Navegar para o dashboard
        navigate('/dashboard');
      }, 5000);
      
    } catch (error) {
      toast.error("Erro ao enviar o formulário. Tente novamente.");
      console.error("Erro ao enviar formulário:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormValueChange = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    updateFormField(field, value);
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0: // Dados Pessoais
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleFormValueChange('nome', e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idade">Idade</Label>
                <Input
                  id="idade"
                  type="number"
                  value={formData.idade || ''}
                  onChange={(e) => handleFormValueChange('idade', parseInt(e.target.value) || 0)}
                  placeholder="Sua idade"
                />
              </div>
              <div>
                <Label htmlFor="genero">Gênero</Label>
                <Select 
                  value={formData.genero} 
                  onValueChange={(value) => handleFormValueChange('genero', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={formData.peso || ''}
                  onChange={(e) => handleFormValueChange('peso', parseFloat(e.target.value) || 0)}
                  placeholder="Seu peso em kg"
                />
              </div>
              <div>
                <Label htmlFor="altura">Altura (cm)</Label>
                <Input
                  id="altura"
                  type="number"
                  value={formData.altura || ''}
                  onChange={(e) => handleFormValueChange('altura', parseInt(e.target.value) || 0)}
                  placeholder="Sua altura em cm"
                />
              </div>
            </div>
          </div>
        );
        
      case 1: // Objetivos
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="objetivo">Qual é o seu principal objetivo?</Label>
              <Select 
                value={formData.objetivo} 
                onValueChange={(value) => handleFormValueChange('objetivo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                  <SelectItem value="hipertrofia">Hipertrofia (ganho de massa muscular)</SelectItem>
                  <SelectItem value="definicao">Definição muscular</SelectItem>
                  <SelectItem value="saude">Melhora da saúde geral</SelectItem>
                  <SelectItem value="condicionamento">Condicionamento físico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="mb-2 block">Você tem alguma restrição alimentar?</Label>
              <div className="space-y-2">
                {['Vegetariano', 'Vegano', 'Sem glúten', 'Sem lactose', 'Sem frutos do mar'].map((restricao) => (
                  <div key={restricao} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`restricao-${restricao}`}
                      checked={formData.restricoes.includes(restricao.toLowerCase())}
                      onCheckedChange={(checked) => {
                        const newRestrictions = checked 
                          ? [...formData.restricoes, restricao.toLowerCase()] 
                          : formData.restricoes.filter(r => r !== restricao.toLowerCase());
                        handleFormValueChange('restricoes', newRestrictions);
                      }}
                    />
                    <label 
                      htmlFor={`restricao-${restricao}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {restricao}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="alergias">Você possui alergias alimentares? Quais?</Label>
              <Textarea
                id="alergias"
                placeholder="Liste suas alergias alimentares (se houver)"
                value={formData.alergias.join(', ')}
                onChange={(e) => {
                  const value = e.target.value;
                  const alergias = value ? value.split(',').map(item => item.trim()) : [];
                  handleFormValueChange('alergias', alergias);
                }}
              />
            </div>
          </div>
        );
        
      case 2: // Rotina
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="rotina">Descreva sua rotina diária</Label>
              <Textarea
                id="rotina"
                placeholder="Conte-nos sobre seu dia a dia"
                value={formData.rotina}
                onChange={(e) => handleFormValueChange('rotina', e.target.value)}
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="atividadeFisica">Você pratica alguma atividade física atualmente? Qual?</Label>
              <Textarea
                id="atividadeFisica"
                placeholder="Descreva suas atividades físicas atuais"
                value={formData.atividadeFisica}
                onChange={(e) => handleFormValueChange('atividadeFisica', e.target.value)}
                rows={3}
              />
            </div>
            
            <div>
              <Label className="mb-2 block">Qual é o seu nível de atividade física?</Label>
              <RadioGroup 
                value={formData.nivelAtividade}
                onValueChange={(value) => handleFormValueChange('nivelAtividade', value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sedentario" id="sedentario" />
                  <Label htmlFor="sedentario">Sedentário (pouco ou nenhum exercício)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="leve" id="leve" />
                  <Label htmlFor="leve">Levemente ativo (exercício leve 1-3 dias/semana)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderado" id="moderado" />
                  <Label htmlFor="moderado">Moderadamente ativo (exercício moderado 3-5 dias/semana)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intenso" id="intenso" />
                  <Label htmlFor="intenso">Muito ativo (exercício intenso 6-7 dias/semana)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="muito intenso" id="muito_intenso" />
                  <Label htmlFor="muito_intenso">Extremamente ativo (exercício muito intenso, trabalho físico)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
        
      case 3: // Saúde
        return (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Você possui alguma condição médica?</Label>
              <div className="space-y-2">
                {[
                  'Diabetes', 
                  'Hipertensão', 
                  'Colesterol alto', 
                  'Doença cardiovascular', 
                  'Problemas na tireoide',
                  'Problemas digestivos'
                ].map((doenca) => (
                  <div key={doenca} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`doenca-${doenca}`}
                      checked={formData.doencas.includes(doenca.toLowerCase())}
                      onCheckedChange={(checked) => {
                        const newDoencas = checked 
                          ? [...formData.doencas, doenca.toLowerCase()] 
                          : formData.doencas.filter(d => d !== doenca.toLowerCase());
                        handleFormValueChange('doencas', newDoencas);
                      }}
                    />
                    <label 
                      htmlFor={`doenca-${doenca}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {doenca}
                    </label>
                  </div>
                ))}
              </div>
              <Textarea
                className="mt-2"
                placeholder="Outras condições médicas não listadas acima"
                value={formData.doencas.filter(d => !['diabetes', 'hipertensão', 'colesterol alto', 'doença cardiovascular', 'problemas na tireoide', 'problemas digestivos'].includes(d)).join(', ')}
                onChange={(e) => {
                  const value = e.target.value;
                  const outrasDoencas = value ? value.split(',').map(item => item.trim()) : [];
                  const doencasBase = formData.doencas.filter(d => 
                    ['diabetes', 'hipertensão', 'colesterol alto', 'doença cardiovascular', 'problemas na tireoide', 'problemas digestivos'].includes(d)
                  );
                  handleFormValueChange('doencas', [...doencasBase, ...outrasDoencas]);
                }}
              />
            </div>
            
            <div>
              <Label htmlFor="medicamentos">Você utiliza algum medicamento regularmente? Quais?</Label>
              <Textarea
                id="medicamentos"
                placeholder="Liste os medicamentos que você utiliza regularmente"
                value={formData.medicamentos.join(', ')}
                onChange={(e) => {
                  const value = e.target.value;
                  const medicamentos = value ? value.split(',').map(item => item.trim()) : [];
                  handleFormValueChange('medicamentos', medicamentos);
                }}
                rows={3}
              />
            </div>
          </div>
        );
        
      case 4: // Alimentação
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="refeicoesDia">Quantas refeições você faz por dia?</Label>
              <Select 
                value={formData.refeicoesDia.toString()} 
                onValueChange={(value) => handleFormValueChange('refeicoesDia', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num} refeições</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="horarioAcordar">Horário que acorda</Label>
                <Input
                  id="horarioAcordar"
                  type="time"
                  value={formData.horarioAcordar}
                  onChange={(e) => handleFormValueChange('horarioAcordar', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="horarioDormir">Horário que dorme</Label>
                <Input
                  id="horarioDormir"
                  type="time"
                  value={formData.horarioDormir}
                  onChange={(e) => handleFormValueChange('horarioDormir', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="preferenciasAlimentares">Alimentos que você mais gosta</Label>
              <Textarea
                id="preferenciasAlimentares"
                placeholder="Liste os alimentos que você mais gosta"
                value={formData.preferenciasAlimentares.join(', ')}
                onChange={(e) => {
                  const value = e.target.value;
                  const preferencias = value ? value.split(',').map(item => item.trim()) : [];
                  handleFormValueChange('preferenciasAlimentares', preferencias);
                }}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="alimentosIndesejados">Alimentos que você não consome ou não gosta</Label>
              <Textarea
                id="alimentosIndesejados"
                placeholder="Liste os alimentos que você não gosta ou não consome"
                value={formData.alimentosIndesejados.join(', ')}
                onChange={(e) => {
                  const value = e.target.value;
                  const indesejados = value ? value.split(',').map(item => item.trim()) : [];
                  handleFormValueChange('alimentosIndesejados', indesejados);
                }}
                rows={3}
              />
            </div>
          </div>
        );
        
      case 5: // Treino
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="diasTreino">Quantos dias por semana você pode treinar?</Label>
              <Select 
                value={formData.diasTreino.toString()} 
                onValueChange={(value) => handleFormValueChange('diasTreino', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'dia' : 'dias'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tempoDisponivel">Quanto tempo você tem disponível por treino (em minutos)?</Label>
              <Select 
                value={formData.tempoDisponivel.toString()} 
                onValueChange={(value) => handleFormValueChange('tempoDisponivel', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                  <SelectItem value="90">90 minutos</SelectItem>
                  <SelectItem value="120">120 minutos ou mais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="mb-2 block">Onde você prefere treinar?</Label>
              <RadioGroup 
                value={formData.localTreino}
                onValueChange={(value) => handleFormValueChange('localTreino', value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="casa" id="casa" />
                  <Label htmlFor="casa">Em casa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="academia" id="academia" />
                  <Label htmlFor="academia">Na academia</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ar livre" id="ar_livre" />
                  <Label htmlFor="ar_livre">Ao ar livre</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outro" id="outro_local" />
                  <Label htmlFor="outro_local">Outro</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
        
      case 6: // Revisão
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="observacoes">Observações adicionais</Label>
              <Textarea
                id="observacoes"
                placeholder="Alguma informação adicional que gostaria de compartilhar?"
                value={formData.observacoes}
                onChange={(e) => handleFormValueChange('observacoes', e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="border rounded-md p-4 space-y-3">
              <h3 className="font-medium">Resumo das informações</h3>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Nome:</div>
                  <div className="text-sm font-medium">{formData.nome || 'Não informado'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Idade:</div>
                  <div className="text-sm font-medium">{formData.idade || 'Não informado'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Gênero:</div>
                  <div className="text-sm font-medium">{formData.genero || 'Não informado'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Peso:</div>
                  <div className="text-sm font-medium">{formData.peso ? `${formData.peso} kg` : 'Não informado'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Altura:</div>
                  <div className="text-sm font-medium">{formData.altura ? `${formData.altura} cm` : 'Não informado'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Objetivo:</div>
                  <div className="text-sm font-medium">{formData.objetivo || 'Não informado'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Nível de atividade:</div>
                  <div className="text-sm font-medium">{formData.nivelAtividade || 'Não informado'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Dias de treino:</div>
                  <div className="text-sm font-medium">{formData.diasTreino || 'Não informado'}</div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Ao enviar o formulário, você concorda que as informações fornecidas serão utilizadas para a criação do seu plano personalizado.
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="container py-8 max-w-3xl animate-fade-in">
      <div className="space-y-2 mb-8 text-center">
        <h1 className="text-3xl font-bold">Formulário de Anamnese</h1>
        <p className="text-muted-foreground">
          Preencha o formulário para criarmos seu plano personalizado
        </p>
      </div>
      
      <Card className="border-lavender-light/50">
        <CardHeader>
          <CardTitle>Etapa {activeStep + 1} de {formSteps.length}</CardTitle>
          <FormStepper steps={formSteps} currentStep={activeStep} />
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={activeStep === 0 || isSubmitting}
          >
            Anterior
          </Button>
          
          {activeStep === formSteps.length - 1 ? (
            <Button 
              onClick={handleSubmit} 
              className="bg-lavender hover:bg-lavender-dark"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar"}
            </Button>
          ) : (
            <Button 
              onClick={handleNextStep}
              className="bg-mint hover:bg-mint-dark"
            >
              Próximo
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Anamnese;

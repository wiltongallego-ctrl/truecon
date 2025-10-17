import { useState, useEffect, useCallback, useRef } from 'react';
import { launchConfetti } from '@/lib/confetti';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface CheckinDay {
  day: number;
  date: Date;
  isCompleted: boolean;
  isAvailable: boolean;
  isToday: boolean;
  isMissed: boolean; // Novo campo para indicar dias perdidos
}

export interface Phase1CheckinData {
  id?: string;
  user_id: string;
  checkin_date: string;
  day_number: number;
  cycle_start_date: string;
  created_at?: string;
}

// Estrutura agregada conforme a migração da tabela `user_phase1_checkins`
interface Phase1AggregatedRow {
  id: string;
  user_id: string;
  start_date: string; // ISO string
  checkin_days: any[]; // array de datas (strings) ou objetos
  current_cycle: number;
  has_completed_first_time: boolean;
  is_first: boolean;
  last_checkin_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UsePhase1CheckinReturn {
  // Estado principal
  checkinDays: CheckinDay[];
  currentDay: number;
  completedDays: number;
  isLoading: boolean;
  error: string | null;
  
  // Estados de controle
  canCheckinToday: boolean;
  hasCompletedFirstCycle: boolean;
  hasUserRecord: boolean;
  hasAnyCheckin: boolean;
  isFirstCompletion: boolean;
  showCompletionModal: boolean;
  
  // Informações de tempo
  nextCheckinTime: Date | null;
  timeUntilNextCheckin: string;
  currentCycleStartDate: Date | null;
  
  // Datas da fase
  phaseStartDate: Date | null;
  phaseEndDate: Date | null;
  
  // Ações
  performCheckin: () => Promise<boolean>;
  setShowCompletionModal: (show: boolean) => void;
  resetCycle: () => Promise<void>;
  markTooltipAsSeen: () => Promise<void>;
}

const CHECKIN_RESET_HOUR = 8; // 8h da manhã
const CYCLE_DAYS = 7;

export const usePhase1Checkin = (): UsePhase1CheckinReturn => {
  const [user, setUser] = useState<User | null>(null);
  const hasInitializedRef = useRef(false);
  
  // Verificar usuário autenticado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  // Estados principais
  const [checkinDays, setCheckinDays] = useState<CheckinDay[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [completedDays, setCompletedDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de controle
  const [canCheckinToday, setCanCheckinToday] = useState(false);
  const [hasCompletedFirstCycle, setHasCompletedFirstCycle] = useState(false);
  const [hasUserRecord, setHasUserRecord] = useState(false);
  const [hasAnyCheckin, setHasAnyCheckin] = useState(false);
  const [isFirstCompletion, setIsFirstCompletion] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // Estados de tempo
  const [nextCheckinTime, setNextCheckinTime] = useState<Date | null>(null);
  const [timeUntilNextCheckin, setTimeUntilNextCheckin] = useState('');
  const [currentCycleStartDate, setCurrentCycleStartDate] = useState<Date | null>(null);
  
  // XP configurado para a Fase 1 (fallback para 10)
  const [phaseXP, setPhaseXP] = useState<number>(10);

  // Estados para configuração da fase
  const [phaseStartDate, setPhaseStartDate] = useState<Date | null>(null);
  const [phaseEndDate, setPhaseEndDate] = useState<Date | null>(null);

  // Função para calcular próximo horário de check-in (8h da manhã)
  const calculateNextCheckinTime = (): Date => {
    const now = new Date();
    const nextCheckin = new Date();
    
    nextCheckin.setHours(CHECKIN_RESET_HOUR, 0, 0, 0);
    
    // Se já passou das 8h hoje, próximo check-in é amanhã às 8h
    if (now.getHours() >= CHECKIN_RESET_HOUR) {
      nextCheckin.setDate(nextCheckin.getDate() + 1);
    }
    
    return nextCheckin;
  };

  // Função para formatar tempo restante
  const formatTimeUntilNext = (targetTime: Date): string => {
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();
    
    if (diff <= 0) return '00:00:00';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Função para verificar se pode fazer check-in hoje
  const checkCanCheckinToday = (checkins: Phase1CheckinData[]): boolean => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Verifica se já fez check-in hoje
    const todayCheckin = checkins.find(c => c.checkin_date === todayStr);
    if (todayCheckin) return false;
    
    // Verifica se já passou das 8h
    return today.getHours() >= CHECKIN_RESET_HOUR;
  };

  // Função para verificar se é o dia atual considerando as datas da fase
  const isToday = (dayIndex: number) => {
    if (!phaseStartDate || !phaseEndDate) return false;
    
    const today = new Date();
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Verificar se a data atual está dentro do período da fase
    const phaseStart = new Date(phaseStartDate.getFullYear(), phaseStartDate.getMonth(), phaseStartDate.getDate());
    const phaseEnd = new Date(phaseEndDate.getFullYear(), phaseEndDate.getMonth(), phaseEndDate.getDate());
    
    if (currentDate < phaseStart || currentDate > phaseEnd) {
      // Se estamos fora do período da fase, nenhum dia é "hoje"
      return false;
    }
    
    // Calcular qual dia da fase corresponde à data atual
    const daysDiff = Math.floor((currentDate.getTime() - phaseStart.getTime()) / (1000 * 60 * 60 * 24));
    const currentPhaseDay = daysDiff + 1; // Dias da fase começam em 1
    
    console.log('🔍 Debug isToday - Data atual:', currentDate);
    console.log('🔍 Debug isToday - Início da fase:', phaseStart);
    console.log('🔍 Debug isToday - Fim da fase:', phaseEnd);
    console.log('🔍 Debug isToday - Dia atual da fase:', currentPhaseDay);
    console.log('🔍 Debug isToday - Verificando dia:', dayIndex);
    
    return currentPhaseDay === dayIndex;
  };

  // Função para gerar todos os dias da fase desde o início até o final
  const generateCheckinDays = (checkins: Phase1CheckinData[], cycleStart: Date | null, phaseEnd?: Date | null, phaseStartOverride?: Date | null): CheckinDay[] => {
    console.log('🔍 Debug generateCheckinDays - checkins recebidos:', checkins);
    console.log('🔍 Debug generateCheckinDays - cycleStart:', cycleStart);
    console.log('🔍 Debug generateCheckinDays - phaseStartDate:', phaseStartDate);
    console.log('🔍 Debug generateCheckinDays - phaseStartOverride:', phaseStartOverride);
    console.log('🔍 Debug generateCheckinDays - phaseEndDate:', phaseEndDate);
    console.log('🔍 Debug generateCheckinDays - phaseEnd param:', phaseEnd);
    
    // Verificar se temos as datas necessárias
    const effectivePhaseStart = phaseStartOverride || phaseStartDate;
    if (!cycleStart || !effectivePhaseStart) {
      console.warn('🔍 Debug generateCheckinDays - Datas não disponíveis, retornando array vazio');
      return [];
    }
    
    const days: CheckinDay[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Usar sempre as datas configuradas da fase se disponíveis, senão usar o ciclo do usuário
    const effectiveStartDate = effectivePhaseStart;
    const effectiveEndDate = phaseEnd || phaseEndDate || new Date(cycleStart.getTime() + (CYCLE_DAYS - 1) * 24 * 60 * 60 * 1000);
    
    console.log('🔍 Debug generateCheckinDays - effectiveStartDate:', effectiveStartDate);
    console.log('🔍 Debug generateCheckinDays - effectiveEndDate:', effectiveEndDate);
    
    // Calcular todos os dias da fase (do início ao fim, independente de hoje)
    const totalPhaseDays = Math.floor((effectiveEndDate.getTime() - effectiveStartDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const totalDays = Math.min(totalPhaseDays, CYCLE_DAYS);
    
    console.log('🔍 Debug generateCheckinDays - totalPhaseDays:', totalPhaseDays);
    console.log('🔍 Debug generateCheckinDays - totalDays calculados:', totalDays);
    
    for (let i = 1; i <= totalDays; i++) {
      const dayDate = new Date(effectiveStartDate);
      dayDate.setDate(effectiveStartDate.getDate() + (i - 1));
      
      const dayStr = dayDate.toISOString().split('T')[0];
      
      // Verificar se há check-in para esta data específica (não por day_number, mas por data)
      const isCompleted = checkins.some(c => {
        const checkinDate = new Date(c.checkin_date).toISOString().split('T')[0];
        return checkinDate === dayStr;
      });
      
      // Usar a função isToday atualizada
      const isTodayValue = isToday(i);
      
      console.log(`🔍 Debug Dia ${i}:`, {
        dayStr,
        isCompleted,
        isToday: isTodayValue,
        todayStr,
        dayDate: dayDate.toISOString().split('T')[0],
        checkinsForThisDay: checkins.filter(c => {
          const checkinDate = new Date(c.checkin_date).toISOString().split('T')[0];
          return checkinDate === dayStr;
        })
      });
      
      // Disponível se: é hoje E já passou das 8h E não foi completado
      const isAvailable = isTodayValue && today.getHours() >= CHECKIN_RESET_HOUR && !isCompleted;
      
      // Dia perdido se: a data já passou E não foi completado E não é hoje E está dentro do período da fase
      const dayDateOnly = new Date(dayStr + 'T00:00:00');
      const todayDateOnly = new Date(todayStr + 'T00:00:00');
      const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const phaseStart = new Date(effectiveStartDate.getFullYear(), effectiveStartDate.getMonth(), effectiveStartDate.getDate());
      const phaseEnd = new Date(effectiveEndDate.getFullYear(), effectiveEndDate.getMonth(), effectiveEndDate.getDate());
      
      // Verificar se estamos dentro do período da fase para determinar se é perdido
      const isWithinPhase = currentDate >= phaseStart && currentDate <= phaseEnd;
      const isMissed = dayDateOnly < todayDateOnly && !isCompleted && !isTodayValue && isWithinPhase;
      
      // Se estamos após o período da fase, marcar dias não completados como perdidos
      if (currentDate > phaseEnd && !isCompleted) {
        days.push({
          day: i,
          date: dayDate,
          isCompleted,
          isAvailable: false,
          isToday: false,
          isMissed: true
        });
      } else {
        days.push({
          day: i,
          date: dayDate,
          isCompleted,
          isAvailable,
          isToday: isTodayValue,
          isMissed
        });
      }
    }
    
    console.log('🔍 Debug generateCheckinDays - dias gerados:', days);
    return days;
  };

  // Normaliza os registros agregados da tabela para a estrutura usada internamente
  const normalizeAggregatedCheckins = (row: Phase1AggregatedRow | null, userId: string, cycleStart: Date | null): Phase1CheckinData[] => {
    if (!row || !cycleStart) return [];
    const rawDays = Array.isArray(row.checkin_days) ? row.checkin_days : [];
    const startMs = cycleStart.getTime();

    console.log('🔍 Debug normalizeAggregatedCheckins - rawDays:', rawDays);
    console.log('🔍 Debug normalizeAggregatedCheckins - cycleStart:', cycleStart);

    const normalized = rawDays.map((entry: any) => {
      const dateStr: string | undefined =
        typeof entry === 'string'
          ? entry
          : (entry?.checkin_date || entry?.date || entry?.day_date);
      if (!dateStr) return null;
      const date = new Date(dateStr);
      const dayNumber = Math.max(1, Math.min(CYCLE_DAYS, Math.floor((date.getTime() - startMs) / (1000 * 60 * 60 * 24)) + 1));
      
      console.log('🔍 Debug normalizeAggregatedCheckins - entry:', entry, 'dateStr:', dateStr, 'dayNumber:', dayNumber);
      
      return {
        user_id: userId,
        checkin_date: dateStr,
        day_number: dayNumber,
        cycle_start_date: cycleStart.toISOString().split('T')[0]
      } as Phase1CheckinData;
    }).filter(Boolean) as Phase1CheckinData[];

    console.log('🔍 Debug normalizeAggregatedCheckins - normalized:', normalized);
    return normalized;
  };

  // Função para calcular datas da fase baseada na data atual
  const calculatePhaseDates = (existingCheckins?: Phase1CheckinData[]) => {
    // Se já existem check-ins, usar a data do ciclo do primeiro check-in
    if (existingCheckins && existingCheckins.length > 0) {
      const firstCheckin = existingCheckins[0];
      if (firstCheckin.cycle_start_date) {
        const phaseStart = new Date(firstCheckin.cycle_start_date + 'T00:00:00');
        const phaseEnd = new Date(phaseStart);
        phaseEnd.setDate(phaseStart.getDate() + 6); // 7 dias de duração
        phaseEnd.setHours(23, 59, 59, 999);
        
        console.log('🔍 Debug calculatePhaseDates - Usando datas do primeiro check-in');
        console.log('🔍 Debug calculatePhaseDates - Phase start (persistido):', phaseStart);
        console.log('🔍 Debug calculatePhaseDates - Phase end (persistido):', phaseEnd);
        
        return { phaseStart, phaseEnd };
      }
    }
    
    // Caso contrário, calcular dinamicamente baseado na data atual
    const today = new Date();
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Configuração dinâmica: Fase 1 sempre começa na segunda-feira da semana atual
    // e dura 7 dias (uma semana completa)
    const dayOfWeek = currentDate.getDay(); // 0 = domingo, 1 = segunda, etc.
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajustar para segunda-feira
    
    const phaseStart = new Date(currentDate);
    phaseStart.setDate(currentDate.getDate() + daysToMonday);
    phaseStart.setHours(0, 0, 0, 0);
    
    const phaseEnd = new Date(phaseStart);
    phaseEnd.setDate(phaseStart.getDate() + 6); // 7 dias de duração
    phaseEnd.setHours(23, 59, 59, 999);
    
    console.log('🔍 Debug calculatePhaseDates - Calculando datas dinamicamente');
    console.log('🔍 Debug calculatePhaseDates - Phase start (dinâmico):', phaseStart);
    console.log('🔍 Debug calculatePhaseDates - Phase end (dinâmico):', phaseEnd);
    
    return { phaseStart, phaseEnd };
  };

  // Função para carregar dados do check-in
  const loadCheckinData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Buscar ou inicializar o registro agregado do usuário primeiro
      console.log('🔍 Debug Hook - Buscando dados do usuário:', user.id);
      const { data: existingRow, error: rowError } = await supabase
        .from('user_phase1_checkins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (rowError && rowError.code !== 'PGRST116') {
        console.error('🔍 Debug Hook - Erro ao buscar dados:', rowError);
        throw rowError;
      }

      // Primeiro tentar buscar configuração do banco (prioridade)
      let finalPhaseStart: Date;
      let finalPhaseEnd: Date;
      let finalPhaseXP = 10;
      
      try {
        const { data: phase1Data } = await supabase
          .from('phases')
          .select('xp_reward, start_date, end_date, is_active')
          .eq('phase_number', 1)
          .maybeSingle();
        
        if (phase1Data && phase1Data.is_active && phase1Data.start_date && phase1Data.end_date) {
          // Se existe configuração ativa no banco com datas, usar essas datas (PRIORIDADE)
          finalPhaseStart = new Date(phase1Data.start_date + 'T00:00:00');
          finalPhaseEnd = new Date(phase1Data.end_date + 'T23:59:59');
          finalPhaseXP = phase1Data.xp_reward || 10;
          console.log('🔍 Debug Hook - Usando configuração do banco (PRIORIDADE)');
          console.log('🔍 Debug Hook - Phase start date do banco:', finalPhaseStart);
          console.log('🔍 Debug Hook - Phase end date do banco:', finalPhaseEnd);
        } else {
          // Fallback para cálculo dinâmico apenas se não houver configuração no banco
          const { phaseStart, phaseEnd } = calculatePhaseDates([]);
          finalPhaseStart = phaseStart;
          finalPhaseEnd = phaseEnd;
          console.log('🔍 Debug Hook - Usando configuração calculada (fallback)');
          console.log('🔍 Debug Hook - Phase start date calculado:', finalPhaseStart);
          console.log('🔍 Debug Hook - Phase end date calculado:', finalPhaseEnd);
        }
      } catch (dbError) {
        console.error('🔍 Debug Hook - Erro ao buscar configuração da Fase 1 no banco:', dbError);
        // Fallback para cálculo dinâmico em caso de erro
        const { phaseStart, phaseEnd } = calculatePhaseDates([]);
        finalPhaseStart = phaseStart;
        finalPhaseEnd = phaseEnd;
        console.log('🔍 Debug Hook - Usando configuração calculada (erro no banco)');
      }
      
      // Definir os estados com as datas finais
      setPhaseStartDate(finalPhaseStart);
      setPhaseEndDate(finalPhaseEnd);
      setPhaseXP(finalPhaseXP);
      
      console.log('🔍 Debug Hook - Configuração FINAL da Fase 1');
      console.log('🔍 Debug Hook - Data atual:', new Date());
      console.log('🔍 Debug Hook - Phase start date FINAL:', finalPhaseStart);
      console.log('🔍 Debug Hook - Phase end date FINAL:', finalPhaseEnd);

      // Normalizar check-ins existentes com as datas FINAIS corretas da fase
      const normalizedCheckins = existingRow ? normalizeAggregatedCheckins(existingRow, user.id, finalPhaseStart) : [];

      let cycleStart: Date;
      let row: Phase1AggregatedRow | null = existingRow ?? null;

      if (!row) {
        // Primeiro ciclo - usar a data de início da fase FINAL
        const start = new Date(finalPhaseStart);
        start.setHours(CHECKIN_RESET_HOUR, 0, 0, 0);

        // Tentar criar registro inicial de forma idempotente
        const { error: insertError } = await supabase
          .from('user_phase1_checkins')
          .insert({
            user_id: user.id,
            start_date: start.toISOString(),
            checkin_days: [],
            current_cycle: 1,
            has_completed_first_time: false,
            is_first: true,
            last_checkin_at: null
          });

        if (insertError) {
          const message = insertError?.message || '';
          const isDuplicate = insertError?.code === '23505' || /duplicate key/i.test(message);
          if (!isDuplicate) {
            throw insertError;
          }
          // Outro processo criou o registro em paralelo — seguir em frente
        }

        // Buscar novamente para garantir que temos o registro atual
        const { data: createdRow } = await supabase
          .from('user_phase1_checkins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle<Phase1AggregatedRow>();

        row = createdRow ?? {
          id: '',
          user_id: user.id,
          start_date: start.toISOString(),
          checkin_days: [],
          current_cycle: 1,
          has_completed_first_time: false,
          last_checkin_at: null
        } as Phase1AggregatedRow;

        cycleStart = new Date(row.start_date);
      } else {
        // Usar início do ciclo existente
        cycleStart = new Date(row.start_date);

        // Verificar se precisa iniciar novo ciclo
        const now = new Date();
        const cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleStart.getDate() + CYCLE_DAYS);

        if (now >= cycleEnd) {
          const newStart = new Date();
          newStart.setHours(CHECKIN_RESET_HOUR, 0, 0, 0);

          const { error: updateError } = await supabase
            .from('user_phase1_checkins')
            .update({
              start_date: newStart.toISOString(),
              checkin_days: [],
              current_cycle: (row.current_cycle ?? 1) + 1
            })
            .eq('user_id', user.id);
          if (updateError) throw updateError;

          cycleStart = newStart;
          row = { ...row, start_date: newStart.toISOString(), checkin_days: [], current_cycle: (row.current_cycle ?? 1) + 1 };
        }
      }

      setCurrentCycleStartDate(cycleStart);

      // Usar os check-ins normalizados já calculados
      const checkinData = normalizedCheckins;
      console.log('🔍 Debug Hook - Check-ins normalizados:', checkinData);

      // Gerar dias do check-in usando as datas FINAIS da fase
      const days = generateCheckinDays(checkinData, cycleStart, finalPhaseEnd, finalPhaseStart);
      setCheckinDays(days);

      console.log('🔍 Debug Hook - Dias gerados:', days);

      // Calcular estatísticas
      const completed = checkinData.length;
      setCompletedDays(completed);
      setCurrentDay(Math.min(completed + 1, CYCLE_DAYS));

      // Verificar se pode fazer check-in hoje
      const canCheckin = checkCanCheckinToday(checkinData);
      setCanCheckinToday(canCheckin);

      // Verificar se já completou algum ciclo
      const hasCompleted = !!row?.has_completed_first_time;
      setHasCompletedFirstCycle(hasCompleted);

      // Verificar se existe registro do usuário
      setHasUserRecord(!!row);

      // Verificar se já fez pelo menos um check-in
      const hasAnyCheckinValue = !!row && row.checkin_days && row.checkin_days.length > 0;
      setHasAnyCheckin(hasAnyCheckinValue);

      // Verificar se é primeira conclusão
      const localStorageKey = `phase1_is_first_${user?.id}`;
      const localStorageValue = localStorage.getItem(localStorageKey);
      
      if (localStorageValue === 'false') {
        setIsFirstCompletion(false);
      } else {
        const isFirstValue = !!row?.is_first;
        setIsFirstCompletion(isFirstValue);
        localStorage.setItem(localStorageKey, isFirstValue.toString());
      }

      // Calcular próximo check-in
      const nextTime = calculateNextCheckinTime();
      setNextCheckinTime(nextTime);
    } catch (err) {
      console.error('🔍 Debug Hook - Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para realizar check-in
  const performCheckin = async (): Promise<boolean> => {
    if (!user || !canCheckinToday) return false;

    try {
      setIsLoading(true);
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Usar a data de início da fase como cycle_start_date para o primeiro check-in
      const cycleStartForCheckin = phaseStartDate.toISOString().split('T')[0];

      const newCheckin: Phase1CheckinData = {
        user_id: user.id,
        checkin_date: todayStr,
        day_number: currentDay,
        cycle_start_date: cycleStartForCheckin
      };

      console.log('🔍 Debug performCheckin - Novo check-in:', newCheckin);

      // Buscar registro atual para atualizar array de check-ins
      const { data: row, error: fetchError } = await supabase
        .from('user_phase1_checkins')
        .select('checkin_days, has_completed_first_time, start_date, current_cycle')
        .eq('user_id', user.id)
        .maybeSingle<Phase1AggregatedRow>();
      if (fetchError || !row) throw fetchError || new Error('Registro de check-in não encontrado');

      const rawDays = Array.isArray(row.checkin_days) ? row.checkin_days : [];
      const normalizedDays: string[] = rawDays
        .map((entry: any) => typeof entry === 'string' ? entry : (entry?.checkin_date || entry?.date || entry?.day_date))
        .filter((d: string | undefined) => !!d) as string[];

      if (normalizedDays.includes(todayStr)) {
        // Já fez check-in hoje
        return false;
      }

      const updatedDays = [...normalizedDays, todayStr];
      const completedNow = updatedDays.length >= CYCLE_DAYS;
      
      const updates: Partial<Phase1AggregatedRow> = {
        checkin_days: updatedDays,
        last_checkin_at: now.toISOString()
      } as any;

      // Definir has_completed_first_time como true quando completar o ciclo completo (7 dias)
      if (updatedDays.length >= CYCLE_DAYS && !row.has_completed_first_time) {
        (updates as any).has_completed_first_time = true;
        // Não alterar is_first automaticamente - deve ser controlado apenas pelo tooltip
      }

      const { error: updateError } = await supabase
        .from('user_phase1_checkins')
        .update(updates)
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      // Atualizar o perfil com o último check-in
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ last_checkin_at: now.toISOString() })
        .eq('user_id', user.id);
      if (profileError) {
        // Não bloqueia o fluxo de check-in; apenas registra
        console.warn('Falha ao atualizar last_checkin_at no perfil:', profileError);
      }

      // Conceder XP do check-in diário (RPC atômica com fallback)
      try {
        const amount = phaseXP ?? 10;
        const { error: rpcError } = await supabase.rpc('award_xp', { target_user: user.id, amount });
        if (rpcError) {
          console.warn('award_xp falhou, aplicando fallback:', rpcError);
          const { data: profileData, error: fetchErr } = await supabase
            .from('profiles')
            .select('total_xp')
            .eq('user_id', user.id)
            .single();
          if (!fetchErr && profileData) {
            const currentXP = profileData.total_xp || 0;
            const newXP = currentXP + amount;
            const { error: updateErr } = await supabase
              .from('profiles')
              .update({ total_xp: newXP })
              .eq('user_id', user.id);
            if (updateErr) {
              console.warn('Fallback: falha ao atualizar total_xp:', updateErr);
            }
          } else {
            console.warn('Fallback: falha ao buscar perfil para XP:', fetchErr);
          }
        }
      } catch (xpAwardErr) {
        console.warn('Erro ao conceder XP (RPC):', xpAwardErr);
      }

      // Recarregar dados
      await loadCheckinData();

      // Explosão de confete ao concluir o check-in
      try { launchConfetti(); } catch {}

      // Verificar se completou o ciclo
      if (completedNow && !hasCompletedFirstCycle) {
        setShowCompletionModal(true);
      }

      return true;

    } catch (err) {
      console.error('Erro ao realizar check-in:', err);
      setError('Erro ao realizar check-in');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para resetar ciclo (para testes)
  const resetCycle = async () => {
    if (!user) return;

    try {
      const newStart = new Date();
      newStart.setHours(CHECKIN_RESET_HOUR, 0, 0, 0);

      // Atualizar registro para reiniciar ciclo
      const { error: updateError } = await supabase
        .from('user_phase1_checkins')
        .update({
          start_date: newStart.toISOString(),
          checkin_days: [],
          current_cycle: 1
        })
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      await loadCheckinData();
    } catch (err) {
      console.error('Erro ao resetar ciclo:', err);
    }
  };

  // Função para marcar tooltip como visto (is_first = false)
  const markTooltipAsSeen = async () => {
    if (!user) return;

    try {
      console.log('🔄 markTooltipAsSeen - Iniciando atualização para user:', user.id);
      
      // Atualizar localStorage imediatamente para resposta rápida
      const localStorageKey = `phase1_is_first_${user.id}`;
      localStorage.setItem(localStorageKey, 'false');
      console.log('✅ markTooltipAsSeen - localStorage atualizado imediatamente');
      
      // Atualizar estado local imediatamente
      setIsFirstCompletion(false);
      console.log('✅ markTooltipAsSeen - Estado local atualizado: isFirstCompletion = false');
      
      const { error: updateError } = await supabase
        .from('user_phase1_checkins')
        .update({ is_first: false })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Erro ao marcar tooltip como visto:', updateError);
        // Em caso de erro, reverter localStorage
        localStorage.setItem(localStorageKey, 'true');
        setIsFirstCompletion(true);
        return;
      }

      console.log('✅ markTooltipAsSeen - Banco atualizado com sucesso');
      
      // Recarregar dados para garantir sincronização (opcional, pois já temos localStorage)
      // await loadCheckinData();
      // console.log('✅ markTooltipAsSeen - Dados recarregados');
      
    } catch (err) {
      console.error('Erro ao marcar tooltip como visto:', err);
      // Em caso de erro, reverter localStorage
      if (user) {
        const localStorageKey = `phase1_is_first_${user.id}`;
        localStorage.setItem(localStorageKey, 'true');
        setIsFirstCompletion(true);
      }
    }
  };

  // ...existing code...

  // Função para verificar se a fase terminou
  const isPhaseEnded = (): boolean => {
    // Se completou 7 check-ins, a fase terminou
    if (completedDays >= 7) return true;
    
    // Se não há data de fim da fase, não pode verificar prazo
    if (!phaseEndDate) return false;
    
    // Verificar se o prazo venceu
    const now = new Date();
    const phaseEnd = new Date(phaseEndDate.getFullYear(), phaseEndDate.getMonth(), phaseEndDate.getDate(), 23, 59, 59);
    const isPastDeadline = now.getTime() > phaseEnd.getTime();
    
    // Se passou do prazo, a fase terminou
    if (isPastDeadline) return true;
    
    // Verificar se é o último dia da fase E já fez o check-in do dia 7
    const isLastDay = now.toDateString() === phaseEnd.toDateString();
    const hasCompletedDay7 = checkinDays.some(day => day.day === 7 && day.isCompleted);
    
    // Se é o último dia E completou o 7º check-in, a fase terminou
    if (isLastDay && hasCompletedDay7) return true;
    
    return false;
  };

  // Atualizar countdown a cada segundo
  useEffect(() => {
    if (!nextCheckinTime) return;
    
    // Se a fase terminou, não atualizar o countdown
    if (isPhaseEnded()) return;
    
    const interval = setInterval(() => {
      // Verificar novamente se a fase terminou antes de atualizar
      if (isPhaseEnded()) {
        clearInterval(interval);
        return;
      }
      setTimeUntilNextCheckin(formatTimeUntilNext(nextCheckinTime));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [nextCheckinTime, completedDays, checkinDays, phaseEndDate]);

  // Carregar dados iniciais
  useEffect(() => {
    console.log('🔍 Debug Hook - useEffect inicial - user:', user?.id, 'hasInitialized:', hasInitializedRef.current);
    if (user && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      console.log('🔍 Debug Hook - Chamando loadCheckinData...');
      loadCheckinData();
    }
  }, [user]);

  // Recarregar dados a cada minuto para verificar mudanças de horário
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        loadCheckinData();
      }
    }, 60000); // 1 minuto
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    // Estado principal
    checkinDays,
    currentDay,
    completedDays,
    isLoading,
    error,
    
    // Estados de controle
    canCheckinToday,
    hasCompletedFirstCycle,
    hasUserRecord,
    hasAnyCheckin,
    isFirstCompletion,
    showCompletionModal,
    
    // Informações de tempo
    nextCheckinTime,
    timeUntilNextCheckin,
    currentCycleStartDate,
    
    // Datas da fase
    phaseStartDate,
    phaseEndDate,
    
    // Ações
    performCheckin,
    setShowCompletionModal,
    resetCycle,
    markTooltipAsSeen
  };
};
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

  // Função para gerar os 7 dias do ciclo
  const generateCheckinDays = (checkins: Phase1CheckinData[], cycleStart: Date): CheckinDay[] => {
    const days: CheckinDay[] = [];
    const today = new Date();
    
    for (let i = 1; i <= CYCLE_DAYS; i++) {
      const dayDate = new Date(cycleStart);
      dayDate.setDate(cycleStart.getDate() + (i - 1));
      
      const dayStr = dayDate.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      const isCompleted = checkins.some(c => c.day_number === i);
      const isToday = dayStr === todayStr;
      
      // Disponível se: é hoje E já passou das 8h E não foi completado
      const isAvailable = isToday && today.getHours() >= CHECKIN_RESET_HOUR && !isCompleted;
      
      days.push({
        day: i,
        date: dayDate,
        isCompleted,
        isAvailable,
        isToday
      });
    }
    
    return days;
  };

  // Normaliza os registros agregados da tabela para a estrutura usada internamente
  const normalizeAggregatedCheckins = (row: Phase1AggregatedRow | null, userId: string, cycleStart: Date): Phase1CheckinData[] => {
    if (!row) return [];
    const rawDays = Array.isArray(row.checkin_days) ? row.checkin_days : [];
    const startMs = cycleStart.getTime();

    const normalized = rawDays.map((entry: any) => {
      const dateStr: string | undefined =
        typeof entry === 'string'
          ? entry
          : (entry?.checkin_date || entry?.date || entry?.day_date);
      if (!dateStr) return null;
      const date = new Date(dateStr);
      const dayNumber = Math.max(1, Math.min(CYCLE_DAYS, Math.floor((date.getTime() - startMs) / (1000 * 60 * 60 * 24)) + 1));
      return {
        user_id: userId,
        checkin_date: dateStr,
        day_number: dayNumber,
        cycle_start_date: cycleStart.toISOString().split('T')[0]
      } as Phase1CheckinData;
    }).filter(Boolean) as Phase1CheckinData[];

    return normalized;
  };

  // Função para carregar dados do check-in
  const loadCheckinData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Buscar XP configurado para a Fase 1 (usa 10 como fallback quando xp_reward for 0)
      try {
        const { data: phase1Data } = await supabase
          .from('phases')
          .select('xp_reward')
          .eq('phase_number', 1)
          .maybeSingle();
        if (phase1Data) {
          setPhaseXP(phase1Data.xp_reward || 10);
        }
      } catch (xpErr) {
        console.warn('Falha ao carregar xp da Fase 1, usando fallback 10:', xpErr);
        setPhaseXP(10);
      }

      // Buscar ou inicializar o registro agregado do usuário
      console.log('🔍 Debug Hook - Buscando dados do usuário:', user.id);
      const { data: existingRow, error: rowError } = await supabase
        .from('user_phase1_checkins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle<Phase1AggregatedRow>();

      if (rowError) throw rowError;
      console.log('🔍 Debug Hook - Dados encontrados:', existingRow);

      let cycleStart: Date;
      let row: Phase1AggregatedRow | null = existingRow ?? null;

      if (!row) {
        // Primeiro ciclo - inicia hoje às 8h
        const start = new Date();
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

      // Normalizar check-ins do ciclo atual
      const currentCycleCheckins = normalizeAggregatedCheckins(row, user.id, cycleStart);

      // Gerar dias do ciclo
      const days = generateCheckinDays(currentCycleCheckins, cycleStart);
      setCheckinDays(days);

      // Calcular estatísticas
      const completed = currentCycleCheckins.length;
      setCompletedDays(completed);
      setCurrentDay(Math.min(completed + 1, CYCLE_DAYS));

      // Verificar se pode fazer check-in hoje
      const canCheckin = checkCanCheckinToday(currentCycleCheckins);
      setCanCheckinToday(canCheckin);

      // Verificar se já completou algum ciclo
      // Se tem 7 check-ins no ciclo atual OU já marcou has_completed_first_time, considera como completado
      const hasCompleted = !!row?.has_completed_first_time || completed >= CYCLE_DAYS;
      setHasCompletedFirstCycle(hasCompleted);

      // Verificar se existe registro do usuário (para controlar exibição do botão)
      setHasUserRecord(!!row);

      // Verificar se já fez pelo menos um check-in
      const hasAnyCheckinValue = !!row && row.checkin_days && row.checkin_days.length > 0;
      setHasAnyCheckin(hasAnyCheckinValue);

      // Verificar se é primeira conclusão (baseado no campo is_first + localStorage)
      console.log('🔍 Debug Hook - row?.is_first:', row?.is_first);
      console.log('🔍 Debug Hook - !!row?.is_first:', !!row?.is_first);
      
      // Chave do localStorage específica para o usuário
      const localStorageKey = `phase1_is_first_${user?.id}`;
      const localStorageValue = localStorage.getItem(localStorageKey);
      
      console.log('🔍 Debug Hook - localStorage value:', localStorageValue);
      
      // Se localStorage diz que não é mais first, respeitar isso
      if (localStorageValue === 'false') {
        console.log('🔍 Debug Hook - localStorage indica que não é mais first, definindo como false');
        setIsFirstCompletion(false);
      } else {
        // Caso contrário, usar valor do banco
        const isFirstValue = !!row?.is_first;
        console.log('🔍 Debug Hook - Definindo isFirstCompletion como:', isFirstValue);
        setIsFirstCompletion(isFirstValue);
        
        // Sincronizar localStorage com banco
        localStorage.setItem(localStorageKey, isFirstValue.toString());
      }

      // Calcular próximo check-in
      const nextTime = calculateNextCheckinTime();
      setNextCheckinTime(nextTime);

    } catch (err) {
      console.error('Erro ao carregar dados de check-in:', err);
      setError('Erro ao carregar dados de check-in');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para realizar check-in
  const performCheckin = async (): Promise<boolean> => {
    if (!user || !canCheckinToday || !currentCycleStartDate) return false;

    try {
      setIsLoading(true);

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

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
        last_checkin_at: today.toISOString()
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
        .update({ last_checkin_at: today.toISOString() })
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

  // Atualizar countdown a cada segundo
  useEffect(() => {
    if (!nextCheckinTime) return;
    
    const interval = setInterval(() => {
      setTimeUntilNextCheckin(formatTimeUntilNext(nextCheckinTime));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [nextCheckinTime]);

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
    
    // Ações
    performCheckin,
    setShowCompletionModal,
    resetCycle,
    markTooltipAsSeen
  };
};
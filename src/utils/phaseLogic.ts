/**
 * Utilitários para lógica de fases
 * Controla quando uma fase pode ser concluída e se deve conceder pontos
 */

export interface PhaseCompletionResult {
  canComplete: boolean;
  shouldAwardPoints: boolean;
  reason?: string;
}

/**
 * Verifica se uma fase pode ser concluída e se deve conceder pontos
 * @param phase - Dados da fase
 * @param currentDate - Data atual (opcional, usa Date.now() se não fornecida)
 * @returns Resultado da verificação
 */
export function checkPhaseCompletion(
  phase: {
    start_date: string;
    end_date: string | null;
    allow_completion_after_deadline: boolean | null;
    is_active: boolean;
  },
  currentDate?: Date
): PhaseCompletionResult {
  const now = currentDate || new Date();
  const startDate = new Date(phase.start_date);
  const endDate = phase.end_date ? new Date(phase.end_date) : null;

  // Verificar se a fase está ativa
  if (!phase.is_active) {
    return {
      canComplete: false,
      shouldAwardPoints: false,
      reason: "Fase não está ativa"
    };
  }

  // Verificar se a fase já começou
  if (now < startDate) {
    return {
      canComplete: false,
      shouldAwardPoints: false,
      reason: "Fase ainda não começou"
    };
  }

  // Se não há data de término, pode completar normalmente
  if (!endDate) {
    return {
      canComplete: true,
      shouldAwardPoints: true,
      reason: "Fase sem data de término"
    };
  }

  // Se ainda está dentro do prazo
  if (now <= endDate) {
    return {
      canComplete: true,
      shouldAwardPoints: true,
      reason: "Dentro do prazo"
    };
  }

  // Se passou do prazo
  if (phase.allow_completion_after_deadline) {
    return {
      canComplete: true,
      shouldAwardPoints: false,
      reason: "Após vencimento - sem pontos"
    };
  }

  // Passou do prazo e não permite conclusão
  return {
    canComplete: false,
    shouldAwardPoints: false,
    reason: "Prazo vencido"
  };
}

/**
 * Calcula os pontos que devem ser concedidos para uma fase
 * @param baseXP - XP base configurado para a fase
 * @param shouldAwardPoints - Se deve conceder pontos (baseado na verificação de data)
 * @returns Pontos a serem concedidos
 */
export function calculatePhasePoints(baseXP: number, shouldAwardPoints: boolean): number {
  return shouldAwardPoints ? baseXP : 0;
}

/**
 * Formata a mensagem de conclusão da fase baseada no resultado
 * @param phaseNumber - Número da fase
 * @param pointsAwarded - Pontos concedidos
 * @param completionResult - Resultado da verificação de conclusão
 * @returns Mensagem formatada
 */
export function formatCompletionMessage(
  phaseNumber: number,
  pointsAwarded: number,
  completionResult: PhaseCompletionResult
): string {
  const baseMessage = `Fase ${phaseNumber} completa!`;
  
  if (pointsAwarded > 0) {
    return `${baseMessage} Você ganhou ${pointsAwarded} XP!`;
  }
  
  if (completionResult.reason === "Após vencimento - sem pontos") {
    return `${baseMessage} Concluída após o prazo - sem pontos XP.`;
  }
  
  return baseMessage;
}

/**
 * Verifica se uma fase está disponível para ser acessada
 * @param phase - Dados da fase
 * @param currentDate - Data atual (opcional)
 * @returns Se a fase está disponível
 */
export function isPhaseAvailable(
  phase: {
    start_date: string;
    is_active: boolean;
  },
  currentDate?: Date
): boolean {
  const now = currentDate || new Date();
  const startDate = new Date(phase.start_date);
  
  return phase.is_active && now >= startDate;
}
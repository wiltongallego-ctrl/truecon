// Utilitário para gerenciar transições de página
export type TransitionDirection = 'up' | 'none';

// Mapeamento das rotas para determinar a ordem/posição
const routeOrder: Record<string, number> = {
  '/ranking': 0,
  '/phase/1': 1,
  '/home': 2,
  '/phase/2': 3,
  '/admin': 4,
  '/admin/groups': 5,
};

// Função para determinar a direção da transição baseada nas rotas
export const getTransitionDirection = (fromRoute: string, toRoute: string): TransitionDirection => {
  const fromOrder = routeOrder[fromRoute] ?? 2; // Default para home
  const toOrder = routeOrder[toRoute] ?? 2; // Default para home
  
  if (fromOrder === toOrder) return 'none';
  
  // Sempre usa animação de surgimento de baixo para cima
  return 'up';
};

// Função para aplicar a classe de transição
export const applyPageTransition = (
  element: HTMLElement | null, 
  direction: TransitionDirection,
  isEntering: boolean = true
) => {
  if (!element || direction === 'none') return;
  
  const baseClass = 'slide-up';
  const stateClass = isEntering ? 'enter' : 'exit';
  
  // Remove classes anteriores
  element.classList.remove(
    'slide-left-enter', 'slide-left-enter-active', 'slide-left-exit', 'slide-left-exit-active',
    'slide-right-enter', 'slide-right-enter-active', 'slide-right-exit', 'slide-right-exit-active',
    'slide-up-enter', 'slide-up-enter-active', 'slide-up-exit', 'slide-up-exit-active'
  );
  
  // Adiciona a classe inicial
  element.classList.add(`${baseClass}-${stateClass}`);
  
  // Força o reflow para garantir que a classe inicial seja aplicada
  element.offsetHeight;
  
  // Adiciona a classe ativa após um pequeno delay
  requestAnimationFrame(() => {
    element.classList.add(`${baseClass}-${stateClass}-active`);
  });
};

// Função simplificada para aplicar transição no body ou elemento principal
export const applyBodyTransition = (direction: TransitionDirection) => {
  const body = document.body;
  if (body && direction !== 'none') {
    body.classList.add('page-transitioning');
    
    // Remove a classe após a transição
    setTimeout(() => {
      body.classList.remove('page-transitioning');
    }, 400);
  }
};

// Hook personalizado para gerenciar transições
export const usePageTransition = () => {
  const startTransition = (
    fromElement: HTMLElement | null,
    toElement: HTMLElement | null,
    direction: TransitionDirection
  ) => {
    if (!fromElement || !toElement || direction === 'none') return;
    
    // Aplica transição de saída no elemento atual
    applyPageTransition(fromElement, direction, false);
    
    // Aplica transição de entrada no novo elemento
    applyPageTransition(toElement, direction, true);
    
    // Remove as classes após a transição
    setTimeout(() => {
      fromElement.classList.remove(
        'slide-left-exit', 'slide-left-exit-active',
        'slide-right-exit', 'slide-right-exit-active',
        'slide-up-exit', 'slide-up-exit-active'
      );
      toElement.classList.remove(
        'slide-left-enter', 'slide-left-enter-active',
        'slide-right-enter', 'slide-right-enter-active',
        'slide-up-enter', 'slide-up-enter-active'
      );
    }, 400); // Duração da transição atualizada
  };
  
  return { startTransition };
};

// Função para detectar se um botão está à esquerda ou direita do botão home
export const getNavigationDirection = (targetRoute: string, currentRoute: string = '/home'): TransitionDirection => {
  return getTransitionDirection(currentRoute, targetRoute);
};

// Função para adicionar listener de transição
export const addTransitionListener = (element: HTMLElement, callback: () => void) => {
  const handleTransitionEnd = (e: TransitionEvent) => {
    if (e.target === element && e.propertyName === 'transform') {
      callback();
      element.removeEventListener('transitionend', handleTransitionEnd);
    }
  };
  
  element.addEventListener('transitionend', handleTransitionEnd);
};
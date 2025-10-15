import Swal from 'sweetalert2';

// Ícones estáticos SVG
const staticIcons = {
  success: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 9,17 4,12"></polyline></svg>',
  error: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
  warning: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  question: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
};

// Configuração padrão do SweetAlert2
const defaultConfig = {
  position: 'top' as const,
  timer: 3000,
  timerProgressBar: true,
  showConfirmButton: false,
  toast: true,
  customClass: {
    popup: 'swal-toast-top',
    title: 'swal-toast-title',
    htmlContainer: 'swal-toast-content',
    icon: 'swal-static-icon'
  },
  didOpen: (toast: HTMLElement) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
};

// Função para alertas de sucesso
export const showSuccess = (message: string, options?: any) => {
  return Swal.fire({
    ...defaultConfig,
    icon: undefined,
    iconHtml: staticIcons.success,
    title: message,
    background: '#10b981',
    color: '#ffffff',
    ...options
  });
};

// Função para alertas de erro
export const showError = (message: string, description?: string, options?: any) => {
  return Swal.fire({
    ...defaultConfig,
    icon: undefined,
    iconHtml: staticIcons.error,
    title: message,
    text: description,
    background: '#ef4444',
    color: '#ffffff',
    timer: 4000, // Erros ficam um pouco mais tempo
    ...options
  });
};

// Função para alertas de informação
export const showInfo = (message: string, options?: any) => {
  return Swal.fire({
    ...defaultConfig,
    icon: undefined,
    iconHtml: staticIcons.info,
    title: message,
    background: '#3b82f6',
    color: '#ffffff',
    ...options
  });
};

// Função para alertas de aviso
export const showWarning = (message: string, options?: any) => {
  return Swal.fire({
    ...defaultConfig,
    icon: undefined,
    iconHtml: staticIcons.warning,
    title: message,
    background: '#f59e0b',
    color: '#ffffff',
    ...options
  });
};

// Função para confirmação
export const showConfirmation = (
  title: string,
  text?: string,
  confirmButtonText: string = 'Sim',
  cancelButtonText: string = 'Cancelar'
) => {
  return Swal.fire({
    title,
    text,
    icon: undefined,
    iconHtml: staticIcons.question,
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#ef4444',
    confirmButtonText,
    cancelButtonText,
    position: 'center',
    toast: false,
    timer: undefined,
    showConfirmButton: true,
    customClass: {
      popup: 'swal-confirmation',
      title: 'swal-confirmation-title',
      htmlContainer: 'swal-confirmation-content',
      icon: 'swal-static-icon'
    }
  });
};

// Função para sucesso com ícone customizado
export const showSuccessWithCustomIcon = (message: string, iconHtml: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: undefined,
    iconHtml: iconHtml,
    html: message,
    customClass: {
      ...defaultConfig.customClass,
      icon: 'swal-static-icon'
    }
  });
};

// Exportar como toast para compatibilidade
export const toast = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning
};
// Notification Service for PWA Push Notifications
export class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Inicializar o serviço de notificações
  public async initialize(): Promise<boolean> {
    try {
      // Verificar se o navegador suporta notificações
      if (!('Notification' in window)) {
        console.warn('Este navegador não suporta notificações');
        return false;
      }

      // Verificar se o navegador suporta Service Workers
      if (!('serviceWorker' in navigator)) {
        console.warn('Este navegador não suporta Service Workers');
        return false;
      }

      // Registrar o Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[NotificationService] Service Worker registrado:', this.registration);

      return true;
    } catch (error) {
      console.error('[NotificationService] Erro ao inicializar:', error);
      return false;
    }
  }

  // Solicitar permissão para notificações
  public async requestPermission(): Promise<NotificationPermission> {
    try {
      console.log('[NotificationService] Iniciando solicitação de permissão...');
      console.log('[NotificationService] iOS:', this.isIOS());
      console.log('[NotificationService] Safari:', this.isSafari());
      console.log('[NotificationService] PWA:', this.isPWA());
      console.log('[NotificationService] Standalone:', window.navigator.standalone);
      
      // No iOS/Safari, verificar se está em modo PWA antes de solicitar
      if (this.isIOS() && !this.isPWA()) {
        console.warn('[NotificationService] Notificações não são suportadas no Safari fora do modo PWA');
        return 'denied';
      }

      const permission = await Notification.requestPermission();
      console.log('[NotificationService] Permissão obtida:', permission);

      // Para iOS, aguardar um pouco após a permissão ser concedida
      if (this.isIOS() && permission === 'granted') {
        console.log('[NotificationService] Aguardando processamento da permissão no iOS...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return permission;
    } catch (error) {
      console.error('[NotificationService] Erro ao solicitar permissão:', error);
      return 'denied';
    }
  }

  // Verificar se as notificações estão habilitadas
  public isNotificationEnabled(): boolean {
    return Notification.permission === 'granted';
  }

  // Enviar notificação local (para teste)
  public async sendLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isNotificationEnabled()) {
      console.warn('[NotificationService] Notificações não estão habilitadas');
      return;
    }

    if (!this.registration) {
      console.warn('[NotificationService] Service Worker não está registrado');
      return;
    }

    // Verificações específicas para iOS
    if (this.isIOS()) {
      if (!this.isPWA()) {
        console.warn('[NotificationService] Notificações no iOS só funcionam em modo PWA');
        return;
      }
      
      // Verificar se o app está em primeiro plano
      if (document.visibilityState === 'visible') {
        console.log('[NotificationService] App em primeiro plano no iOS, não enviando notificação');
        return;
      }
    }

    const defaultOptions: NotificationOptions = {
      body: 'Nova fase liberada!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: { timestamp: Date.now() },
      actions: [
        {
          action: 'open',
          title: 'Abrir App'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ]
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      await this.registration.showNotification(title, finalOptions);
      console.log('[NotificationService] Notificação local enviada:', title);
    } catch (error) {
      console.error('[NotificationService] Erro ao enviar notificação local:', error);
    }
  }

  // Notificar sobre liberação de fase
  public async notifyPhaseReleased(phaseNumber: number, phaseName: string): Promise<void> {
    console.log('[NotificationService] === INICIANDO NOTIFICAÇÃO DE FASE ===');
    console.log('[NotificationService] Fase:', phaseNumber, '-', phaseName);
    console.log('[NotificationService] Permissão atual:', Notification.permission);
    console.log('[NotificationService] iOS:', this.isIOS());
    console.log('[NotificationService] PWA:', this.isPWA());
    console.log('[NotificationService] Visibilidade:', document.visibilityState);
    console.log('[NotificationService] Service Worker Controller:', !!navigator.serviceWorker.controller);
    console.log('[NotificationService] Registration:', !!this.registration);
    
    const title = `🎉 Nova Fase Liberada!`;
    const options: NotificationOptions = {
      body: `A Fase ${phaseNumber} - ${phaseName} está agora disponível!`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: { 
        type: 'phase-released',
        phaseNumber,
        phaseName,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'open-phase',
          title: 'Ver Fase'
        },
        {
          action: 'close',
          title: 'Depois'
        }
      ]
    };

    // Para iOS, usar método alternativo se o app estiver em primeiro plano
    if (this.isIOS() && document.visibilityState === 'visible') {
      console.log('[NotificationService] iOS em primeiro plano - usando métodos alternativos');
      
      // Agendar notificação para quando o app sair de primeiro plano
      setTimeout(() => {
        console.log('[NotificationService] Verificando visibilidade após timeout:', document.visibilityState);
        if (document.visibilityState !== 'visible') {
          console.log('[NotificationService] App em background - enviando notificação');
          this.sendLocalNotification(title, options);
        }
      }, 2000);
      
      // Também tentar via Service Worker message
      if (navigator.serviceWorker.controller) {
        console.log('[NotificationService] Enviando mensagem para Service Worker');
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body: options.body,
          icon: options.icon,
          badge: options.badge,
          data: options.data
        });
      } else {
        console.warn('[NotificationService] Service Worker Controller não disponível');
      }
    } else {
      console.log('[NotificationService] Enviando notificação diretamente');
      await this.sendLocalNotification(title, options);
    }
    
    console.log('[NotificationService] === FIM DA NOTIFICAÇÃO DE FASE ===');
  }

  // Configurar listener para mudanças de visibilidade da página
  public setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Limpar notificações quando o usuário volta para o app
        this.clearNotifications();
      }
    });
  }

  // Limpar todas as notificações
  public async clearNotifications(): Promise<void> {
    if (!this.registration) return;

    try {
      const notifications = await this.registration.getNotifications();
      notifications.forEach(notification => notification.close());
      console.log('[NotificationService] Notificações limpas');
    } catch (error) {
      console.error('[NotificationService] Erro ao limpar notificações:', error);
    }
  }

  // Verificar se o app está em modo PWA
  public isPWA(): boolean {
    // Verificação específica para iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    
    // No iOS, também verificar se está em modo standalone
    if (isIOS) {
      return isStandalone || (window.navigator as any).standalone === true;
    }
    
    return isStandalone;
  }

  // Verificar se é iOS
  public isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Verificar se é Safari
  public isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  // Configurar prompt de instalação PWA
  public setupPWAInstallPrompt(): void {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Mostrar botão de instalação personalizado se necessário
      console.log('[NotificationService] PWA pode ser instalado');
    });

    window.addEventListener('appinstalled', () => {
      console.log('[NotificationService] PWA foi instalado');
      deferredPrompt = null;
    });
  }
}

// Exportar instância singleton
export const notificationService = NotificationService.getInstance();
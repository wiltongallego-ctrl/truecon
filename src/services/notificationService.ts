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
      const permission = await Notification.requestPermission();
      console.log('[NotificationService] Permissão de notificação:', permission);
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

    await this.sendLocalNotification(title, options);
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
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
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
// Debug utility for iPhone notifications
export class NotificationDebugger {
  
  // Verificar status completo do sistema de notificações
  public static checkNotificationStatus(): void {
    console.log('=== DEBUG NOTIFICAÇÕES ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Notification support:', 'Notification' in window);
    console.log('Service Worker support:', 'serviceWorker' in navigator);
    console.log('Permission:', Notification.permission);
    console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches);
    console.log('Navigator standalone:', (window.navigator as any).standalone);
    console.log('Visibility state:', document.visibilityState);
    console.log('Is iOS:', /iPad|iPhone|iPod/.test(navigator.userAgent));
    console.log('Is Safari:', /^((?!chrome|android).)*safari/i.test(navigator.userAgent));
    console.log('Service Worker ready:', navigator.serviceWorker.ready);
    console.log('Service Worker controller:', !!navigator.serviceWorker.controller);
    console.log('=========================');
  }

  // Testar notificação simples
  public static async testSimpleNotification(): Promise<void> {
    console.log('=== TESTE NOTIFICAÇÃO SIMPLES ===');
    
    if (Notification.permission !== 'granted') {
      console.log('Solicitando permissão...');
      const permission = await Notification.requestPermission();
      console.log('Permissão obtida:', permission);
      
      if (permission !== 'granted') {
        console.log('Permissão negada - não é possível testar');
        return;
      }
    }

    try {
      // Teste com Notification API direta
      console.log('Testando Notification API direta...');
      const notification = new Notification('Teste Direto', {
        body: 'Esta é uma notificação de teste direta',
        icon: '/favicon.ico'
      });
      
      notification.onclick = () => {
        console.log('Notificação clicada!');
        notification.close();
      };
      
      setTimeout(() => {
        notification.close();
      }, 5000);
      
    } catch (error) {
      console.error('Erro no teste direto:', error);
    }
  }

  // Testar via Service Worker
  public static async testServiceWorkerNotification(): Promise<void> {
    console.log('=== TESTE VIA SERVICE WORKER ===');
    
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker pronto:', registration);
      
      await registration.showNotification('Teste Service Worker', {
        body: 'Esta é uma notificação via Service Worker',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: { test: true }
      });
      
      console.log('Notificação via Service Worker enviada');
      
    } catch (error) {
      console.error('Erro no teste via Service Worker:', error);
    }
  }

  // Monitorar mudanças de visibilidade
  public static setupVisibilityMonitor(): void {
    console.log('=== MONITOR DE VISIBILIDADE ===');
    
    document.addEventListener('visibilitychange', () => {
      console.log('Visibilidade mudou:', document.visibilityState);
      console.log('Timestamp:', new Date().toISOString());
    });
    
    // Monitorar foco da janela
    window.addEventListener('focus', () => {
      console.log('Janela ganhou foco:', new Date().toISOString());
    });
    
    window.addEventListener('blur', () => {
      console.log('Janela perdeu foco:', new Date().toISOString());
    });
  }

  // Verificar Service Worker
  public static async checkServiceWorker(): Promise<void> {
    console.log('=== VERIFICAÇÃO SERVICE WORKER ===');
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('Registrations encontradas:', registrations.length);
      
      registrations.forEach((reg, index) => {
        console.log(`Registration ${index}:`, {
          scope: reg.scope,
          active: !!reg.active,
          installing: !!reg.installing,
          waiting: !!reg.waiting
        });
      });
      
      if (navigator.serviceWorker.controller) {
        console.log('Controller ativo:', navigator.serviceWorker.controller.scriptURL);
      } else {
        console.log('Nenhum controller ativo');
      }
      
    } catch (error) {
      console.error('Erro ao verificar Service Worker:', error);
    }
  }

  // Executar todos os testes
  public static async runAllTests(): Promise<void> {
    console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE NOTIFICAÇÕES');
    
    this.checkNotificationStatus();
    await this.checkServiceWorker();
    this.setupVisibilityMonitor();
    
    // Aguardar um pouco antes dos testes
    setTimeout(async () => {
      await this.testSimpleNotification();
      
      setTimeout(async () => {
        await this.testServiceWorkerNotification();
      }, 2000);
      
    }, 1000);
  }
}

// Adicionar ao window para acesso via console
(window as any).NotificationDebugger = NotificationDebugger;

export default NotificationDebugger;
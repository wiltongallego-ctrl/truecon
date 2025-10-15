// Utilitários específicos para notificações no iOS
export class IOSNotificationHelper {
  
  /**
   * Verifica se o dispositivo é iOS
   */
  static isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Verifica se está rodando no Safari
   */
  static isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  /**
   * Verifica se está em modo standalone (PWA instalado)
   */
  static isStandalone(): boolean {
    return (window.navigator as any).standalone === true ||
           window.matchMedia('(display-mode: standalone)').matches;
  }

  /**
   * Verifica se as notificações são suportadas no contexto atual
   */
  static areNotificationsSupported(): boolean {
    if (!this.isIOS()) {
      return 'Notification' in window;
    }

    // No iOS, notificações só funcionam em PWA
    return 'Notification' in window && this.isStandalone();
  }

  /**
   * Mostra instruções para habilitar notificações no iOS
   */
  static showIOSInstructions(): string {
    if (!this.isIOS()) {
      return '';
    }

    if (!this.isStandalone()) {
      return `
Para receber notificações no iPhone:
1. Adicione o app à tela inicial (botão compartilhar → "Adicionar à Tela de Início")
2. Abra o app pela tela inicial (não pelo Safari)
3. Permita notificações quando solicitado
      `.trim();
    }

    return `
Para receber notificações:
1. Vá em Configurações → Notificações
2. Encontre "TrueCon" na lista
3. Ative "Permitir Notificações"
4. Configure o estilo de alerta desejado
    `.trim();
  }

  /**
   * Verifica se o app está em primeiro plano
   */
  static isAppInForeground(): boolean {
    return document.visibilityState === 'visible';
  }

  /**
   * Agenda uma notificação para quando o app sair de primeiro plano
   */
  static scheduleBackgroundNotification(
    title: string, 
    body: string, 
    delayMs: number = 5000
  ): void {
    if (!this.isIOS() || !this.areNotificationsSupported()) {
      return;
    }

    const scheduleNotification = () => {
      if (!this.isAppInForeground()) {
        // App está em background, pode enviar notificação
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            body
          });
        }
      }
    };

    setTimeout(scheduleNotification, delayMs);
  }

  /**
   * Configura listeners para mudanças de visibilidade específicos do iOS
   */
  static setupIOSVisibilityListeners(
    onBackground: () => void,
    onForeground: () => void
  ): void {
    if (!this.isIOS()) {
      return;
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        onBackground();
      } else if (document.visibilityState === 'visible') {
        onForeground();
      }
    });

    // Listeners específicos para iOS
    window.addEventListener('pagehide', onBackground);
    window.addEventListener('pageshow', onForeground);
  }
}
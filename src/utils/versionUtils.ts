/**
 * Utilitários para gerenciamento de versão do PWA
 */

// Importar a versão do package.json
import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;

/**
 * Chave para armazenar a versão no localStorage
 */
const VERSION_STORAGE_KEY = 'app_version';

/**
 * Verifica se há uma nova versão disponível
 * @returns true se há uma nova versão
 */
export function checkForNewVersion(): boolean {
  const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
  return storedVersion !== null && storedVersion !== APP_VERSION;
}

/**
 * Atualiza a versão armazenada no localStorage
 */
export function updateStoredVersion(): void {
  localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
}

/**
 * Obtém a versão armazenada no localStorage
 */
export function getStoredVersion(): string | null {
  return localStorage.getItem(VERSION_STORAGE_KEY);
}

/**
 * Força a atualização do PWA limpando o cache
 */
export async function forceAppUpdate(): Promise<void> {
  try {
    // Limpar o cache do service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // Limpar cache do navegador
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }

    // Atualizar a versão armazenada
    updateStoredVersion();

    // Recarregar a página
    window.location.reload();
  } catch (error) {
    console.error('Erro ao forçar atualização do app:', error);
    // Fallback: apenas recarregar a página
    updateStoredVersion();
    window.location.reload();
  }
}

/**
 * Verifica se é a primeira vez que o usuário acessa esta versão
 */
export function isFirstTimeThisVersion(): boolean {
  const storedVersion = getStoredVersion();
  return storedVersion === null || storedVersion !== APP_VERSION;
}
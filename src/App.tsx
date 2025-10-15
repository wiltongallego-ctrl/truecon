import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import DesktopLanding from "@/components/DesktopLanding";
import { useIsMobile } from "@/hooks/use-mobile";
import { notificationService } from "@/services/notificationService";
import UpdateNotification from "@/components/UpdateNotification";
import { updateStoredVersion } from "@/utils/versionUtils";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Ranking from "./pages/Ranking";
import Admin from "./pages/Admin";
import GroupsAdmin from "./pages/GroupsAdmin";
import PhaseDetail from "./pages/PhaseDetail";
import NotFound from "./pages/NotFound";

//

const App = () => {
  const isMobile = useIsMobile();

  useEffect(() => {
    // Atualizar versão armazenada na inicialização
    updateStoredVersion();
    
    // Inicializar serviço de notificações
    const initializeNotifications = async () => {
      try {
        const initialized = await notificationService.initialize();
        if (initialized) {
          console.log('[App] Serviço de notificações inicializado');
          
          // Configurar listeners
          notificationService.setupVisibilityListener();
          notificationService.setupPWAInstallPrompt();
          
          // Solicitar permissão se ainda não foi concedida
          if (notificationService.isPWA() && !notificationService.isNotificationEnabled()) {
            // Aguardar um pouco antes de solicitar permissão para melhor UX
            setTimeout(async () => {
              const permission = await notificationService.requestPermission();
              console.log('[App] Permissão de notificação:', permission);
            }, 3000);
          }
        }
      } catch (error) {
        console.error('[App] Erro ao inicializar notificações:', error);
      }
    };

    initializeNotifications();
  }, []);

  // Se não for mobile, mostrar a tela de desktop
  if (!isMobile) {
    return (
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DesktopLanding />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <UpdateNotification />
      <PWAInstallPrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/groups" element={<GroupsAdmin />} />
          <Route path="/phase/:phaseNumber" element={<PhaseDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;

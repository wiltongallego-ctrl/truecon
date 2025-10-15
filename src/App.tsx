import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import DesktopLanding from "@/components/DesktopLanding";
import { useIsMobile } from "@/hooks/use-mobile";
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
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker registrado'))
        .catch((error) => console.error('Erro ao registrar Service Worker:', error));
    }
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

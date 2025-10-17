import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Smartphone, Share, Plus, Bell } from 'lucide-react';

interface PWAInstallGuideProps {
  onClose?: () => void;
}

const PWAInstallGuide: React.FC<PWAInstallGuideProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone;

  const iosSteps = [
    {
      title: "Abra no Safari",
      description: "Certifique-se de estar usando o Safari (não Chrome ou outros navegadores)",
      icon: <Smartphone className="w-6 h-6" />,
      detail: "No iOS, PWAs só funcionam corretamente no Safari. Outros navegadores não suportam todas as funcionalidades."
    },
    {
      title: "Toque no botão Compartilhar",
      description: "Toque no ícone de compartilhar na parte inferior da tela",
      icon: <Share className="w-6 h-6" />,
      detail: "O ícone de compartilhar fica na barra inferior do Safari e parece uma caixa com uma seta para cima."
    },
    {
      title: "Adicionar à Tela de Início",
      description: "Role para baixo e toque em 'Adicionar à Tela de Início'",
      icon: <Plus className="w-6 h-6" />,
      detail: "Esta opção pode estar na segunda linha de opções. Procure pelo ícone de um quadrado com um sinal de mais."
    },
    {
      title: "Confirmar Instalação",
      description: "Toque em 'Adicionar' para confirmar a instalação",
      icon: <CheckCircle className="w-6 h-6" />,
      detail: "O app será adicionado à sua tela inicial e funcionará como um app nativo."
    },
    {
      title: "Abrir pelo Ícone",
      description: "IMPORTANTE: Sempre abra o app pelo ícone da tela inicial",
      icon: <Bell className="w-6 h-6" />,
      detail: "Para que as notificações funcionem, você DEVE abrir o app pelo ícone da tela inicial, não pelo Safari."
    }
  ];

  const androidSteps = [
    {
      title: "Prompt de Instalação",
      description: "Toque em 'Instalar' quando o prompt aparecer",
      icon: <Plus className="w-6 h-6" />,
      detail: "O navegador mostrará automaticamente um prompt para instalar o app."
    },
    {
      title: "Ou use o Menu",
      description: "Vá no menu do navegador > 'Instalar app' ou 'Adicionar à tela inicial'",
      icon: <Smartphone className="w-6 h-6" />,
      detail: "Se o prompt não aparecer, você pode instalar manualmente pelo menu do navegador."
    }
  ];

  const steps = isIOS ? iosSteps : androidSteps;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isPWA) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-green-600">PWA Instalado!</CardTitle>
          <CardDescription>
            Seu app está instalado corretamente como PWA. As notificações devem funcionar normalmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">✅ Tudo Pronto!</h4>
              <p className="text-sm text-green-700">
                Você pode receber notificações quando novas fases forem liberadas.
              </p>
            </div>
            {onClose && (
              <Button onClick={onClose} className="w-full">
                Fechar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            {isIOS ? 'iOS' : 'Android'} - Passo {currentStep + 1} de {steps.length}
          </Badge>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
        <CardTitle className="flex items-center gap-2">
          {steps[currentStep].icon}
          {steps[currentStep].title}
        </CardTitle>
        <CardDescription>
          {steps[currentStep].description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              {steps[currentStep].detail}
            </p>
          </div>

          {isIOS && currentStep === steps.length - 1 && (
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Importante para Notificações</h4>
              <p className="text-sm text-yellow-700">
                Para receber notificações no iPhone, você DEVE:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Sempre abrir pelo ícone da tela inicial</li>
                <li>• Permitir notificações quando solicitado</li>
                <li>• Verificar se as notificações estão ativas em Configurações</li>
              </ul>
            </div>
          )}

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 0}
            >
              Anterior
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep}>
                Próximo
              </Button>
            ) : (
              <Button onClick={onClose} variant="default">
                Concluir
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallGuide;
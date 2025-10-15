import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { checkForNewVersion, forceAppUpdate, APP_VERSION } from '@/utils/versionUtils';

interface UpdateNotificationProps {
  onClose?: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onClose }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Verificar se há nova versão disponível
    const hasNewVersion = checkForNewVersion();
    if (hasNewVersion) {
      setShowNotification(true);
    }

    // Verificar periodicamente por atualizações (a cada 30 segundos)
    const interval = setInterval(() => {
      if (checkForNewVersion()) {
        setShowNotification(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await forceAppUpdate();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setShowNotification(false);
    onClose?.();
  };

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="p-4 bg-primary text-primary-foreground shadow-lg border-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">
              Nova versão disponível!
            </h4>
            <p className="text-xs opacity-90 mb-3">
              Versão {APP_VERSION} está pronta. Atualize para ter acesso às últimas funcionalidades.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUpdate}
                disabled={isUpdating}
                className="text-xs h-7"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Atualizar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClose}
                className="text-xs h-7 text-primary-foreground hover:bg-primary-foreground/20"
              >
                Depois
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClose}
            className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UpdateNotification;
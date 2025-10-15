import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Phase1Onboarding from "@/components/phases/Phase1Onboarding";
import Phase2Groups from "@/components/phases/Phase2Groups";
import Phase3Personalization from "@/components/phases/Phase3Personalization";
import Phase4Challenges from "@/components/phases/Phase4Challenges";
import Phase5Awards from "@/components/phases/Phase5Awards";
import Phase6Live from "@/components/phases/Phase6Live";
import Phase7Feedback from "@/components/phases/Phase7Feedback";
import NotFound from "./NotFound";

const PhaseDetail = () => {
  const { phaseNumber } = useParams<{ phaseNumber: string }>();
  const [isPhaseActive, setIsPhaseActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPhaseStatus = async () => {
      if (!phaseNumber) {
        setLoading(false);
        return;
      }

      const { data: phaseData } = await supabase
        .from("phases")
        .select("is_active")
        .eq("phase_number", parseInt(phaseNumber))
        .maybeSingle();

      setIsPhaseActive(phaseData?.is_active || false);
      setLoading(false);
    };

    checkPhaseStatus();
  }, [phaseNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isPhaseActive) {
    return <NotFound />;
  }

  const phaseComponents: Record<string, JSX.Element> = {
    "1": <Phase1Onboarding />,
    "2": <Phase2Groups />,
    "3": <Phase3Personalization />,
    "4": <Phase4Challenges />,
    "5": <Phase5Awards />,
    "6": <Phase6Live />,
    "7": <Phase7Feedback />,
  };

  const component = phaseNumber ? phaseComponents[phaseNumber] : null;

  if (!component) {
    return <NotFound />;
  }

  return component;
};

export default PhaseDetail;

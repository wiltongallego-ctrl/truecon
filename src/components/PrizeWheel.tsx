import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "@/lib/sweetAlert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface PrizeWheelProps {
  onPrizeWon: (points: number) => void;
  disabled?: boolean;
}

const prizes = [
  { label: "0 XP", value: 0, color: "hsl(var(--muted))" },
  { label: "10 XP", value: 10, color: "hsl(var(--primary))" },
  { label: "25 XP", value: 25, color: "hsl(var(--secondary))" },
  { label: "50 XP", value: 50, color: "hsl(var(--warning))" },
  { label: "75 XP", value: 75, color: "hsl(var(--accent))" },
  { label: "100 XP", value: 100, color: "hsl(var(--destructive))" },
  { label: "5 XP", value: 5, color: "hsl(var(--primary))" },
  { label: "20 XP", value: 20, color: "hsl(var(--secondary))" },
];

const PrizeWheel = ({ onPrizeWon, disabled = false }: PrizeWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState<number | null>(null);

  const spinWheel = () => {
    if (isSpinning || disabled) return;

    setIsSpinning(true);
    setSelectedPrize(null);

    // Random prize index
    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes[prizeIndex];

    // Calculate rotation: at least 5 full spins + position to land on prize
    const segmentAngle = 360 / prizes.length;
    const targetRotation = 360 * 5 + (360 - prizeIndex * segmentAngle - segmentAngle / 2);
    
    setRotation(targetRotation);

    // After animation completes
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedPrize(prize.value);
      onPrizeWon(prize.value);
    }, 4000);
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-warning" />
          <h3 className="text-xl font-bold">Roleta de Prêmios</h3>
        </div>

        {/* Wheel Container */}
        <div className="relative w-80 h-80">
          {/* Arrow Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-foreground" />
          </div>

          {/* Wheel */}
          <div className="relative w-full h-full">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? "transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)" : "none",
              }}
            >
              {prizes.map((prize, index) => {
                const segmentAngle = 360 / prizes.length;
                const startAngle = index * segmentAngle - 90;
                const endAngle = startAngle + segmentAngle;

                // Convert to radians
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;

                // Calculate path
                const x1 = 100 + 95 * Math.cos(startRad);
                const y1 = 100 + 95 * Math.sin(startRad);
                const x2 = 100 + 95 * Math.cos(endRad);
                const y2 = 100 + 95 * Math.sin(endRad);

                const largeArc = segmentAngle > 180 ? 1 : 0;

                const pathData = `M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`;

                // Text position
                const textAngle = startAngle + segmentAngle / 2;
                const textRad = (textAngle * Math.PI) / 180;
                const textX = 100 + 65 * Math.cos(textRad);
                const textY = 100 + 65 * Math.sin(textRad);

                return (
                  <g key={index}>
                    <path d={pathData} fill={prize.color} stroke="white" strokeWidth="2" />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                    >
                      {prize.label}
                    </text>
                  </g>
                );
              })}
              {/* Center circle */}
              <circle cx="100" cy="100" r="20" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Result Display */}
        {selectedPrize !== null && (
          <div className="text-center animate-fade-in">
            <p className="text-sm text-muted-foreground mb-2">Você ganhou:</p>
            <p className="text-3xl font-bold text-primary">{selectedPrize} XP</p>
          </div>
        )}

        {/* Spin Button */}
        <Button
          onClick={spinWheel}
          disabled={isSpinning || disabled}
          size="lg"
          className="w-full max-w-xs"
        >
          {isSpinning ? "Girando..." : disabled ? "Já utilizado" : "Girar Roleta"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Gire a roleta e ganhe de 0 a 100 XP!
        </p>
      </div>
    </Card>
  );
};

export default PrizeWheel;
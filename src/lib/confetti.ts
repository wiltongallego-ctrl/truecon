import confetti from "canvas-confetti";

export const launchConfetti = () => {
  const colors = ["#22c55e", "#0ea5e9", "#f59e0b", "#ef4444", "#6366f1"]; // brand-friendly

  const end = Date.now() + 800;

  (function frame() {
    confetti({
      particleCount: 7,
      angle: 60,
      spread: 60,
      startVelocity: 45,
      origin: { x: 0, y: 0.7 },
      colors,
      scalar: 0.9,
      gravity: 0.9,
    });
    confetti({
      particleCount: 7,
      angle: 120,
      spread: 60,
      startVelocity: 45,
      origin: { x: 1, y: 0.7 },
      colors,
      scalar: 0.9,
      gravity: 0.9,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    } else {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.4 },
        colors,
        startVelocity: 55,
        scalar: 1,
        gravity: 1,
      });
    }
  })();
};
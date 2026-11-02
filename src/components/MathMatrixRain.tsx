import React, { useEffect, useRef } from 'react';

const MATH_SYMBOLS = [
  '∫', '∑', '√', 'π', '∞', '∂', 'θ', 'λ', 'α', 'β', 'Δ', '∇',
  '≈', '≠', '≤', '≥', 'lim', 'dx', 'dt', 'x²', 'e^x', 'f(x)',
  '∈', 'ℝ', 'ℤ', 'ℕ', 'sin', 'cos', 'tan', 'log', 'ln', 'Ω', '±',
  '∀', '∃', 'f\'(x)', 'C_n^k', 'x→0'
];

interface MathMatrixRainProps {
  opacity?: number;
  speedMultiplier?: number;
}

export const MathMatrixRain: React.FC<MathMatrixRainProps> = ({ 
  opacity = 0.45,
  speedMultiplier = 1.0 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1920;
    canvas.height = 1080;

    const fontSize = 18;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Initial staggered drops
    const drops: number[] = Array.from({ length: columns }, () => Math.random() * -100);
    // Substantially slower speeds for gentle, hypnotic, smooth flow
    const speeds: number[] = Array.from({ length: columns }, () => (Math.random() * 0.18 + 0.10) * speedMultiplier);
    const charSwaps: number[] = Array.from({ length: columns }, () => 0);

    let animationId: number;

    const draw = () => {
      // Semi-transparent fade trail
      ctx.fillStyle = 'rgba(4, 10, 8, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        charSwaps[i]++;
        const char = MATH_SYMBOLS[(i + charSwaps[i]) % MATH_SYMBOLS.length];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Head of falling streak (intense neon green glow)
        ctx.fillStyle = '#4ade80'; // Vivid neon Matrix green
        ctx.fillText(char, x, y);

        // Body of falling streak (classic rich emerald green)
        ctx.fillStyle = '#22c55e'; // Green-500
        ctx.fillText(char, x, y - fontSize);

        // Tail of falling streak (deep green)
        ctx.fillStyle = 'rgba(21, 128, 61, 0.55)'; // Deep forest matrix green
        ctx.fillText(char, x, y - fontSize * 2);

        // Reset drop to top with slight randomization
        if (y > canvas.height && Math.random() > 0.985) {
          drops[i] = 0;
        }

        drops[i] += speeds[i];
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [speedMultiplier]);

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity }}
    />
  );
};

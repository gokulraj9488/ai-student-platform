import React, { useEffect, useRef } from 'react';

const FORMULAS = [
  'E = mc²', 'F = ma', 'e^(iπ)+1=0', 'iℏ∂ψ/∂t=Ĥψ',
  'PV=nRT', 'a²+b²=c²', 'ΔxΔp≥ℏ/2', 'S=k ln Ω',
  'E=hf', 'λ=h/mv', '∇²φ=ρ/ε₀', 'F=Gm₁m₂/r²',
  'V=IR', 'x=(-b±√(b²-4ac))/2a', '∇·E=ρ/ε₀',
  'd/dx[xⁿ]=nxⁿ⁻¹', '∮E·dA=Q/ε₀', 'p=mv',
  'eⁱˣ=cosx+isinx', '∇×B=μ₀J', 'F=qvB',
];

export default function MathBackground() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    let lastTime = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createParticle(forceZ) {
      return {
        formula: FORMULAS[Math.floor(Math.random() * FORMULAS.length)],
        x: (Math.random() - 0.5) * 1.8,
        y: (Math.random() - 0.5) * 1.8,
        z: forceZ !== undefined ? forceZ : Math.random() * 4 + 1,
        speed: 0.025 + Math.random() * 0.015,
        color: Math.random() > 0.5
          ? '100, 160, 255'
          : Math.random() > 0.5
          ? '180, 140, 255'
          : '200, 220, 255',
      };
    }

    function initParticles() {
      particles = Array.from({ length: 28 }, () => createParticle());
    }

    function project(x, y, z) {
      const fov = 1.2;
      const s = fov / Math.max(z, 0.01);
      return {
        px: (x * s + 1) * canvas.width / 2,
        py: (y * s + 1) * canvas.height / 2,
        scale: s,
      };
    }

    function draw(timestamp) {
      const delta = timestamp - lastTime;
      if (delta < 33) {
        animId = requestAnimationFrame(draw);
        return;
      }
      lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.z -= p.speed;

        if (p.z <= 0.08) {
          particles[i] = createParticle(4 + Math.random());
          return;
        }

        const { px, py, scale } = project(p.x, p.y, p.z);

        if (px < -300 || px > canvas.width + 300 || py < -300 || py > canvas.height + 300) {
          particles[i] = createParticle(4 + Math.random());
          return;
        }

        const alpha = Math.min(0.55, (4 - p.z) / 5);
        const fontSize = Math.max(8, Math.min(22, scale * 14));

        ctx.save();
        ctx.font = `${fontSize}px 'Courier New', monospace`;
        ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
        ctx.textAlign = 'center';
        ctx.fillText(p.formula, px, py);
        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    }

    resize();
    initParticles();
    animId = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
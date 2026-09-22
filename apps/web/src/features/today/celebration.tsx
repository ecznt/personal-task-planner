'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#5e6ad2', '#8b93e0', '#22c55e', '#f59e0b', '#f43f5e'];
const PARTICLE_COUNT = 32;

type CelebrationProps = {
  readonly triggerKey: number;
};

export function Celebration({ triggerKey }: CelebrationProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerKey === 0) return;

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) return;

    const layer = layerRef.current;
    if (!layer) return;

    const element = document.createElement('span');
    if (typeof element.animate !== 'function') return;

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.22;
    const particles: HTMLElement[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const particle = document.createElement('span');
      const isRect = i % 3 !== 0;
      const color = COLORS[i % COLORS.length];
      const w = isRect ? 5 + Math.random() * 4 : 7 + Math.random() * 5;
      const h = isRect ? 9 + Math.random() * 6 : w;

      particle.style.position = 'absolute';
      particle.style.left = '0px';
      particle.style.top = '0px';
      particle.style.width = `${w}px`;
      particle.style.height = `${h}px`;
      particle.style.borderRadius = isRect ? '1px' : '50%';
      particle.style.backgroundColor = color ?? '#5e6ad2';
      particle.style.pointerEvents = 'none';
      particle.style.opacity = '1';
      layer.appendChild(particle);
      particles.push(particle);

      const angle = (Math.PI / 180) * (10 + Math.random() * 160);
      const distance = 90 + Math.random() * 170;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const drift = (Math.random() - 0.5) * 60;
      const rotation = (Math.random() - 0.5) * 720;
      const duration = 900 + Math.random() * 500;

      const animation = particle.animate(
        [
          {
            transform: `translate3d(${originX}px, ${originY}px, 0) rotate(0deg)`,
            opacity: 1,
          },
          {
            transform: `translate3d(${originX + dx}px, ${originY + dy}px, 0) rotate(${rotation}deg)`,
            opacity: 1,
          },
          {
            transform: `translate3d(${originX + dx + drift}px, ${
              originY + dy + 90 + Math.random() * 60
            }px, 0) rotate(${rotation * 1.5}deg)`,
            opacity: 0,
          },
        ],
        {
          duration,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'forwards',
        },
      );

      animation.onfinish = () => particle.remove();
    }

    return () => {
      for (const particle of particles) particle.remove();
    };
  }, [triggerKey]);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    />
  );
}
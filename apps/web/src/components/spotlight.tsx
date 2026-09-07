import * as React from 'react';

import { cn } from '@/lib/utils';

export function Spotlight({ className, children, ...props }: React.ComponentProps<'div'>) {
  const glowRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) {
      const glow = glowRef.current;
      if (glow) glow.style.opacity = '0';
    }
  }, []);

  const handlePointerMove = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const glow = glowRef.current;
    if (!glow) return;
    const rect = glow.getBoundingClientRect();
    glow.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    glow.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  }, []);

  return (
    <div
      data-slot="spotlight"
      onPointerMove={handlePointerMove}
      className={cn('spotlight', className)}
      {...props}
    >
      <span className="spotlight-glow" ref={glowRef} aria-hidden="true" />
      {children}
    </div>
  );
}

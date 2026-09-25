'use client';

import type { PlantTier } from './focus-types';
import { stageForProgress } from './focus-types';

export type FocusPlantProps = {
  readonly tier: PlantTier;
  readonly progress: number;
  readonly className?: string;
  readonly animated?: boolean;
};

const SOIL_STEM = '#9c6b3f';
const SOIL_TOP = '#b98a5a';

function FlowerBloom({ progress }: { readonly progress: number }) {
  const stage = stageForProgress(progress);
  const visible = stage >= 2;
  return (
    <g
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {[0, 60, 120, 180, 240, 300].map((rotation) => (
        <ellipse
          key={rotation}
          cx="60"
          cy="72"
          rx="6"
          ry="11"
          fill="#e2688f"
          transform={`rotate(${rotation} 60 84)`}
        />
      ))}
      <ellipse cx="60" cy="72" rx="5" ry="9" fill="#f085a6" transform="rotate(90 60 84)" />
      <circle cx="60" cy="84" r="6.5" fill="#f4b740" />
      <circle cx="60" cy="84" r="2.5" fill="#e09b24" />
    </g>
  );
}

function PlantCrown({ progress }: { readonly progress: number }) {
  const stage = stageForProgress(progress);
  const visible = stage >= 2;
  return (
    <g
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <path d="M60 102 Q 34 96 30 74 Q 52 80 60 98 Z" fill="#58a564" />
      <path d="M60 102 Q 86 96 90 72 Q 68 78 60 98 Z" fill="#4c9a57" />
      <path d="M60 102 Q 54 76 60 58 Q 66 76 60 102 Z" fill="#6fc07a" />
      <circle cx="38" cy="80" r="3" fill="#9adf9e" />
      <circle cx="82" cy="78" r="3" fill="#9adf9e" />
    </g>
  );
}

function TreeCanopy({ progress }: { readonly progress: number }) {
  const stage = stageForProgress(progress);
  const visible = stage >= 2;
  return (
    <g
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <circle cx="60" cy="70" r="24" fill="#3f8f4f" />
      <circle cx="42" cy="78" r="15" fill="#4c9a57" />
      <circle cx="78" cy="76" r="14" fill="#4c9a57" />
      <circle cx="60" cy="54" r="16" fill="#5ba368" />
      <circle cx="50" cy="62" r="4" fill="#d55441" />
      <circle cx="72" cy="70" r="3.5" fill="#d55441" />
      <circle cx="10" cy="47" r="3" fill="#9adf9e" />
      <circle cx="106" cy="52" r="3" fill="#9adf9e" />
    </g>
  );
}

export function FocusPlant({
  tier,
  progress,
  className,
  animated = true,
}: FocusPlantProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const stage = stageForProgress(clamped);
  const scale = 0.42 + 0.58 * clamped;

  return (
    <svg
      viewBox="0 0 120 160"
      className={className}
      aria-hidden="true"
      role="img"
      data-tier={tier}
      data-stage={stage}
    >
      <g
        style={{
          transform: `scale(${scale})`,
          transformOrigin: '60px 152px',
          transformBox: 'view-box',
          transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <g className={animated ? 'focus-plant-sway' : undefined}>
          {tier === 'flower' && (
            <>
              <path
                d="M60 148 C 58 128, 62 108, 60 90"
                stroke="#4c9a57"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              {stage >= 1 && (
                <>
                  <path d="M58 116 Q 40 110 36 94 Q 52 100 58 114 Z" fill="#6aa963" />
                  <path d="M62 106 Q 80 98 86 84 Q 70 94 63 104 Z" fill="#58a564" />
                </>
              )}
              <FlowerBloom progress={clamped} />
            </>
          )}

          {tier === 'plant' && (
            <>
              <path
                d="M60 148 C 58 132, 63 116, 60 104"
                stroke="#3f8f4f"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
              {stage >= 1 && (
                <>
                  <path d="M58 130 Q 40 126 36 112 Q 52 118 58 128 Z" fill="#6aa963" />
                  <path d="M62 118 Q 80 112 88 98 Q 70 108 63 116 Z" fill="#4c9a57" />
                </>
              )}
              <PlantCrown progress={clamped} />
            </>
          )}

          {tier === 'tree' && (
            <>
              <path
                d="M57 148 L57 100 C57 96 63 96 63 100 L63 148 Z"
                fill="#7a5538"
              />
              {stage === 1 && <circle cx="60" cy="96" r="7" fill="#4c9a57" />}
              <TreeCanopy progress={clamped} />
            </>
          )}
        </g>
      </g>

      <ellipse cx="60" cy="152" rx="38" ry="9" fill={SOIL_STEM} />
      <ellipse cx="60" cy="150" rx="29" ry="5" fill={SOIL_TOP} />
    </svg>
  );
}
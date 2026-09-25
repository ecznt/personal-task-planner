import { describe, expect, it } from 'vitest';

import {
  formatDurationLabel,
  formatRemaining,
  plantTierForMinutes,
  stageForProgress,
} from './focus-types';

describe('focus-types helpers', () => {
  describe('plantTierForMinutes', () => {
    it('maps under 25 minutes to flower', () => {
      expect(plantTierForMinutes(5)).toBe('flower');
      expect(plantTierForMinutes(15)).toBe('flower');
      expect(plantTierForMinutes(24)).toBe('flower');
    });

    it('maps 25-59 minutes to plant', () => {
      expect(plantTierForMinutes(25)).toBe('plant');
      expect(plantTierForMinutes(45)).toBe('plant');
      expect(plantTierForMinutes(59)).toBe('plant');
    });

    it('maps 60+ minutes to tree', () => {
      expect(plantTierForMinutes(60)).toBe('tree');
      expect(plantTierForMinutes(120)).toBe('tree');
    });
  });

  describe('stageForProgress', () => {
    it('returns stages in order as progress grows', () => {
      expect(stageForProgress(0)).toBe(0);
      expect(stageForProgress(0.39)).toBe(0);
      expect(stageForProgress(0.4)).toBe(1);
      expect(stageForProgress(0.74)).toBe(1);
      expect(stageForProgress(0.75)).toBe(2);
      expect(stageForProgress(0.99)).toBe(2);
      expect(stageForProgress(1)).toBe(3);
    });
  });

  describe('formatRemaining', () => {
    it('formats milliseconds as mm:ss', () => {
      expect(formatRemaining(61_000)).toBe('01:01');
      expect(formatRemaining(600_000)).toBe('10:00');
      expect(formatRemaining(15 * 60 * 1_000 - 1)).toBe('15:00');
    });

    it('clamps negative values', () => {
      expect(formatRemaining(-5_000)).toBe('00:00');
    });
  });

  describe('formatDurationLabel', () => {
    it('formats minutes under an hour', () => {
      expect(formatDurationLabel(25)).toBe('25 dk');
      expect(formatDurationLabel(59)).toBe('59 dk');
    });

    it('formats hours and minutes', () => {
      expect(formatDurationLabel(60)).toBe('1 sa');
      expect(formatDurationLabel(90)).toBe('1 sa 30 dk');
      expect(formatDurationLabel(120)).toBe('2 sa');
    });
  });
});
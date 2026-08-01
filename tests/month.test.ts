import { describe, expect, it } from 'vitest';
import { monthWindow, resolveMonth, shiftMonth, withMonth } from '$lib/month';
import { TODAY } from './fixtures';

describe('resolveMonth', () => {
  it('defaults to the current month when the parameter is absent', () => {
    const m = resolveMonth(null, TODAY);
    expect(m.key).toBe('2026-07');
    expect(m.isCurrent).toBe(true);
  });

  it('accepts a past month and reports it as not current', () => {
    const m = resolveMonth('2026-04', TODAY);
    expect(m.key).toBe('2026-04');
    expect(m.label).toBe('April 2026');
    expect(m.isCurrent).toBe(false);
  });

  it('has no next month at the current month, so the forward arrow is disabled', () => {
    expect(resolveMonth(null, TODAY).next).toBeNull();
    expect(resolveMonth('2026-06', TODAY).next).toBe('2026-07');
  });

  it('always offers a previous month', () => {
    expect(resolveMonth(null, TODAY).prev).toBe('2026-06');
    expect(resolveMonth('2026-01', TODAY).prev).toBe('2025-12');
  });

  // Every one of these is a link someone could paste. None may break a screen.
  it.each([
    ['malformed', 'juni'],
    ['wrong shape', '2026-6'],
    ['a full date', '2026-06-01'],
    ['month zero', '2026-00'],
    ['month thirteen', '2026-13'],
    ['empty', ''],
    ['injection-shaped', "2026-06'; drop table transactions--"]
  ])('falls back to the current month for %s input', (_name, param) => {
    expect(resolveMonth(param, TODAY).key).toBe('2026-07');
  });

  it('clamps a future month back to the current one', () => {
    expect(resolveMonth('2027-03', TODAY).key).toBe('2026-07');
  });

  it('bounds the month with a correct last day, including February in a leap year', () => {
    expect(resolveMonth('2026-07', TODAY).end).toBe('2026-07-31');
    expect(resolveMonth('2026-06', TODAY).end).toBe('2026-06-30');
    expect(resolveMonth('2024-02', '2026-07-15').end).toBe('2024-02-29');
    expect(resolveMonth('2026-02', TODAY).end).toBe('2026-02-28');
  });
});

describe('shiftMonth', () => {
  it('rolls over the year in both directions', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-07', -12)).toBe('2025-07');
  });
});

describe('monthWindow', () => {
  it('ends at the selected month, oldest first', () => {
    expect(monthWindow('2026-07', 4)).toEqual(['2026-04', '2026-05', '2026-06', '2026-07']);
  });

  it('re-anchors on a past month rather than always ending at today', () => {
    expect(monthWindow('2026-05', 4)).toEqual(['2026-02', '2026-03', '2026-04', '2026-05']);
  });
});

describe('withMonth', () => {
  it('leaves the current month out of the URL', () => {
    expect(withMonth('/transaksi', resolveMonth(null, TODAY))).toBe('/transaksi');
  });

  it('carries a past month so it survives navigation', () => {
    expect(withMonth('/transaksi', resolveMonth('2026-05', TODAY))).toBe('/transaksi?m=2026-05');
  });
});

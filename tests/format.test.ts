import { describe, expect, it } from 'vitest';
import { grouped, parseAmount } from '$lib/format';

/**
 * These two are the whole of `MoneyInput`. The visible field shows `grouped`
 * text and carries no name; a hidden sibling carries `parseAmount` of it and
 * carries the name the form action reads. Every amount in the app — a
 * Transaction, a Debt principal, a Saldo Awal, an Anggaran limit — makes that
 * round trip, so a defect in either function is a defect in all four screens.
 *
 * Component tests would need a DOM harness this project does not have. These
 * are the highest seam available, and they cover the part that can be wrong.
 */
describe('grouped', () => {
  it('separates thousands the Indonesian way, with dots', () => {
    expect(grouped(1_500_000)).toBe('1.500.000');
    expect(grouped(50_000)).toBe('50.000');
    expect(grouped(999)).toBe('999');
  });

  it('shows nothing for zero, so the "0" placeholder stands in', () => {
    expect(grouped(0)).toBe('');
  });
});

describe('parseAmount', () => {
  it('keeps only digits, so grouped text parses back', () => {
    expect(parseAmount('1.500.000')).toBe(1_500_000);
  });

  it('survives a paste of an amount copied from elsewhere in the app', () => {
    // `rp()` renders with a non-breaking space, which is not a digit either.
    expect(parseAmount('Rp 1.500.000')).toBe(1_500_000);
    expect(parseAmount('Rp 1500000')).toBe(1_500_000);
    expect(parseAmount('− Rp 75.000')).toBe(75_000);
  });

  it('reads an empty or junk field as zero rather than NaN', () => {
    // NaN would reach the form action as the string "NaN" and land in a BIGINT
    // column, so this is the one case that must never return something falsy
    // by accident.
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('abc')).toBe(0);
    expect(parseAmount('-')).toBe(0);
  });

  it('has no sign and no decimals to lose (ADR-0007: BIGINT whole rupiah)', () => {
    expect(parseAmount('-5000')).toBe(5000);
    expect(parseAmount('1500,50')).toBe(150_050);
  });
});

describe('the round trip a money field makes on every keystroke', () => {
  it('returns the same number it was given', () => {
    for (const n of [0, 1, 999, 1000, 50_000, 1_500_000, 999_999_999]) {
      expect(parseAmount(grouped(n))).toBe(n);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { generatePatientCode, validatePatientCode } from '../patientId';

describe('Patient ID Generation', () => {
  it('should generate patient code with correct format', () => {
    const code = generatePatientCode(0);
    expect(code).toMatch(/^AYU-\d{4}-0001$/);
  });

  it('should increment patient number', () => {
    const code = generatePatientCode(5);
    expect(code).toMatch(/^AYU-\d{4}-0006$/);
  });

  it('should pad numbers with leading zeros', () => {
    const code = generatePatientCode(99);
    expect(code).toMatch(/^AYU-\d{4}-0100$/);
  });

  it('should use current year', () => {
    const year = new Date().getFullYear();
    const code = generatePatientCode(0);
    expect(code).toContain(String(year));
  });
});

describe('Patient Code Validation', () => {
  it('should validate correct format', () => {
    expect(validatePatientCode('AYU-2026-0001')).toBe(true);
  });

  it('should reject incorrect format', () => {
    expect(validatePatientCode('AYU-2026-001')).toBe(false);
    expect(validatePatientCode('AYU-26-0001')).toBe(false);
    expect(validatePatientCode('AYU20260001')).toBe(false);
    expect(validatePatientCode('')).toBe(false);
  });
});

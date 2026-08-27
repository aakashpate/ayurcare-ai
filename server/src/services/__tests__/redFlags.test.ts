import { describe, it, expect } from 'vitest';
import { generateRedFlags } from '../redFlags';

describe('Red Flag Engine', () => {
  it('should flag high severity as URGENT', () => {
    const flags = generateRedFlags({ severity: 9 });
    expect(flags).toHaveLength(1);
    expect(flags[0].level).toBe('URGENT');
    expect(flags[0].code).toBe('HIGH_SEVERITY');
  });

  it('should flag moderate severity as ATTENTION', () => {
    const flags = generateRedFlags({ severity: 7 });
    expect(flags).toHaveLength(1);
    expect(flags[0].level).toBe('ATTENTION');
    expect(flags[0].code).toBe('MODERATE_SEVERITY');
  });

  it('should flag normal severity as NORMAL', () => {
    const flags = generateRedFlags({ severity: 4 });
    expect(flags).toHaveLength(1);
    expect(flags[0].level).toBe('NORMAL');
    expect(flags[0].code).toBe('NO_FLAGS');
  });

  it('should flag high blood pressure', () => {
    const flags = generateRedFlags({
      vitals: { systolicBP: 185 }
    });
    expect(flags.some(f => f.code === 'HYPERTENSIVE_CRISIS')).toBe(true);
  });

  it('should flag low SpO2', () => {
    const flags = generateRedFlags({
      vitals: { spo2: 88 }
    });
    expect(flags.some(f => f.code === 'LOW_SPO2')).toBe(true);
  });

  it('should flag urgent symptoms in chief complaint', () => {
    const flags = generateRedFlags({
      chiefComplaint: 'Severe chest pain and difficulty breathing'
    });
    expect(flags.some(f => f.code === 'URGENT_SYMPTOM')).toBe(true);
  });

  it('should flag severe allergies', () => {
    const flags = generateRedFlags({
      biomedicalAssessment: {
        allergies: 'Severe penicillin allergy with anaphylaxis'
      }
    });
    expect(flags.some(f => f.code === 'SEVERE_ALLERGY')).toBe(true);
  });

  it('should return NORMAL when no flags are present', () => {
    const flags = generateRedFlags({
      severity: 3,
      chiefComplaint: 'Mild headache'
    });
    expect(flags).toHaveLength(1);
    expect(flags[0].level).toBe('NORMAL');
  });
});

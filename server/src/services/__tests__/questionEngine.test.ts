import { describe, it, expect } from 'vitest';
import { getNextQuestion } from '../questionEngine';

describe('Question Engine', () => {
  it('should return first question when no responses exist', () => {
    const question = getNextQuestion('headache', []);
    expect(question).not.toBeNull();
    expect(question?.key).toBe('symptom_location');
  });

  it('should return next unanswered question', () => {
    const question = getNextQuestion('headache', [
      { key: 'symptom_location', value: 'Head region' }
    ]);
    expect(question).not.toBeNull();
    expect(question?.key).toBe('symptom_duration');
  });

  it('should skip required questions already answered', () => {
    const question = getNextQuestion('headache', [
      { key: 'symptom_location', value: 'Head region' },
      { key: 'symptom_duration', value: '1-3 days' },
      { key: 'symptom_severity', value: '7' }
    ]);
    expect(question).not.toBeNull();
    expect(question?.key).not.toBe('symptom_location');
  });

  it('should return null when all questions are answered', () => {
    const question = getNextQuestion('general', [
      { key: 'symptom_location', value: 'General area' },
      { key: 'symptom_duration', value: '1-3 days' },
      { key: 'symptom_severity', value: '5' },
      { key: 'nausea_vomiting', value: 'No' },
      { key: 'fever', value: 'No' },
      { key: 'appetite_changes', value: 'Normal' },
      { key: 'sleep_quality', value: 'Normal' },
      { key: 'bowel_movements', value: 'Normal' },
      { key: 'stress_level', value: 'Low' },
      { key: 'energy_level', value: 'Normal' }
    ]);
    expect(question).toBeNull();
  });

  it('should include digestive questions for stomach complaints', () => {
    const questions = [];
    let q = getNextQuestion('stomach pain and bloating', []);
    while (q) {
      questions.push(q);
      const answers = questions.map(qq => ({ key: qq.key, value: 'stomach region' }));
      q = getNextQuestion('stomach pain and bloating', answers);
    }
    const hasDigestiveQuestions = questions.some(q => q.key.includes('digestive') || q.key.includes('bowel') || q.key.includes('agni'));
    expect(hasDigestiveQuestions).toBe(true);
  });
});

import { en } from './en';
import { hi } from './hi';

export type TranslationKeys = typeof en;

const translations: Record<string, TranslationKeys> = {
  en,
  hi
};

let currentLanguage = 'en';

export function setLanguage(lang: string) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('ayurcare-language', lang);
  }
}

export function getLanguage(): string {
  return currentLanguage;
}

export function initLanguage() {
  const saved = localStorage.getItem('ayurcare-language');
  if (saved && translations[saved]) {
    currentLanguage = saved;
  }
}

export function t(path: string): string {
  const keys = path.split('.');
  let result: any = translations[currentLanguage];
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      result = path;
      break;
    }
  }
  
  return typeof result === 'string' ? result : path;
}

export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' }
  ];
}

initLanguage();

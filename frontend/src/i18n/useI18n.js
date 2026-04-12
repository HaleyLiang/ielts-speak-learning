/**
 * useI18n - Simple i18n hook backed by Zustand store
 * Returns a `t` function for accessing nested translation keys
 */

import useStore from '../stores/useStore';
import { locales, DEFAULT_LANGUAGE } from './locales';

/**
 * Get a nested value from an object by dot-separated key path.
 * e.g. get(obj, 'nav.practice') => obj.nav.practice
 */
function get(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/**
 * Hook that returns the translation function `t` and the current locale.
 *
 * Usage:
 *   const { t, locale } = useI18n();
 *   t('nav.practice')  // => '练习'
 *   t('practice.aiDrawn', 'Hometown', 'Travel')  // calls function with args
 */
export default function useI18n() {
  const language = useStore((s) => s.language);
  const currentLocale = locales[language] || locales[DEFAULT_LANGUAGE];
  const fallbackLocale = locales[DEFAULT_LANGUAGE];

  function t(key, ...args) {
    let value = get(currentLocale, key);
    // Fallback to default locale
    if (value === undefined) {
      value = get(fallbackLocale, key);
    }
    // If value is a function, call it with args
    if (typeof value === 'function') {
      return value(...args);
    }
    return value ?? key;
  }

  return { t, locale: language };
}

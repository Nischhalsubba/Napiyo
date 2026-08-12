import { useEffect, useState } from 'react';
import type { AppLanguage } from './language';

const currentLanguage = (): AppLanguage => document.documentElement.lang === 'ne' ? 'ne' : 'en';

export const useAppLanguage = () => {
  const [language, setLanguage] = useState<AppLanguage>(currentLanguage);

  useEffect(() => {
    const observer = new MutationObserver(() => setLanguage(currentLanguage()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => observer.disconnect();
  }, []);

  return language;
};

export const chooseCopy = <T,>(language: AppLanguage, english: T, nepali: T): T => language === 'ne' ? nepali : english;

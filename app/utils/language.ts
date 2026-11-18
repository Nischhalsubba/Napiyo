export type AppLanguage = 'en' | 'ne';

export const LANGUAGE_STORAGE_KEY = 'napiyo:language';

export const readLanguage = (): AppLanguage => {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'ne' ? 'ne' : 'en';
  } catch {
    return 'en';
  }
};

export const speechLocale = (language: AppLanguage) => language === 'ne' ? 'ne-NP' : 'en-US';

export const languageName = (language: AppLanguage) => language === 'ne' ? 'नेपाली' : 'English';

export const appCopy = {
  en: {
    convert: 'Convert', image: 'Image', gps: 'Field GPS', plan: 'Plan', projects: 'Projects', learn: 'Learn',
    online: 'Online', offline: 'Offline', tagline: 'Land measurements, made readable',
    planning: 'Planning aid, not a survey record.', storage: 'Projects are stored locally and are not encrypted by Napiyo.',
    theme: 'Theme', text: 'Text', contrast: 'Contrast', motion: 'Motion', language: 'Language',
  },
  ne: {
    convert: 'रूपान्तरण', image: 'तस्बिर', gps: 'फिल्ड GPS', plan: 'योजना', projects: 'परियोजना', learn: 'सिक्नुहोस्',
    online: 'अनलाइन', offline: 'अफलाइन', tagline: 'जग्गा नाप, सजिलो हिसाब',
    planning: 'यो योजना सहयोगी हो, आधिकारिक नापी अभिलेख होइन।', storage: 'परियोजनाहरू यस ब्राउजरमा मात्र सुरक्षित हुन्छन् र Napiyo ले इन्क्रिप्ट गर्दैन।',
    theme: 'थिम', text: 'अक्षर', contrast: 'कन्ट्रास्ट', motion: 'गति', language: 'भाषा',
  },
} as const;

import { describe, expect, it } from 'vitest';
import { appCopy, languageName, speechLocale } from '../utils/language';
import { buildSpokenConversion, chooseSpeechVoice, recognitionErrorMessage } from '../utils/speech';

describe('language switch', () => {
  it('maps interface language to the correct speech locale', () => {
    expect(speechLocale('en')).toBe('en-US');
    expect(speechLocale('ne')).toBe('ne-NP');
    expect(languageName('en')).toBe('English');
    expect(languageName('ne')).toBe('नेपाली');
  });

  it('provides translated primary navigation labels', () => {
    expect(appCopy.en.convert).toBe('Convert');
    expect(appCopy.ne.convert).toBe('रूपान्तरण');
    expect(appCopy.ne.projects).toBe('परियोजना');
  });
});

describe('speech helpers', () => {
  const voices = [
    { lang: 'en-US', default: true },
    { lang: 'hi-IN', default: false },
    { lang: 'en-GB', default: false },
  ];

  it('selects a Nepali-compatible fallback voice when a Nepali voice is absent', () => {
    expect(chooseSpeechVoice(voices, 'ne-NP')?.lang).toBe('hi-IN');
  });

  it('selects a preferred English voice', () => {
    expect(chooseSpeechVoice(voices, 'en-US')?.lang).toBe('en-GB');
  });

  it('builds bilingual spoken conversion text', () => {
    const values = {
      sqFt: '5,476', sqM: '508.737',
      hills: { ropani: '1', aana: '0', paisa: '0', daam: '0' },
      terai: { bigha: '0', kattha: '1', dhur: '10.047' },
    };
    expect(buildSpokenConversion({ language: 'en-US', ...values })).toContain('The land area is');
    expect(buildSpokenConversion({ language: 'ne-NP', ...values })).toContain('जग्गाको क्षेत्रफल');
  });

  it('returns localized microphone errors', () => {
    expect(recognitionErrorMessage('not-allowed', 'en-US')).toContain('Microphone permission');
    expect(recognitionErrorMessage('not-allowed', 'ne-NP')).toContain('माइक्रोफोन अनुमति');
  });
});

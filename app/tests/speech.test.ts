import { describe, expect, it } from 'vitest';
import { buildSpokenConversion, chooseSpeechVoice, recognitionErrorMessage, recognitionLanguage } from '../utils/speech';

const voices = [
  { lang: 'en-US', default: true },
  { lang: 'hi-IN', default: false },
  { lang: 'ne-NP', default: false },
];

describe('bilingual speech helpers', () => {
  it('uses supported recognition locales', () => {
    expect(recognitionLanguage('en-US')).toBe('en-US');
    expect(recognitionLanguage('ne-NP')).toBe('ne-NP');
  });

  it('prefers a native Nepali voice and falls back to Hindi', () => {
    expect(chooseSpeechVoice(voices, 'ne-NP')?.lang).toBe('ne-NP');
    expect(chooseSpeechVoice(voices.filter((voice) => voice.lang !== 'ne-NP'), 'ne-NP')?.lang).toBe('hi-IN');
  });

  it('prefers an English voice for English output', () => {
    expect(chooseSpeechVoice(voices, 'en-US')?.lang).toBe('en-US');
  });

  it('provides clear microphone permission messages in both languages', () => {
    expect(recognitionErrorMessage('not-allowed', 'en-US')).toContain('Microphone permission');
    expect(recognitionErrorMessage('not-allowed', 'ne-NP')).toContain('माइक्रोफोन');
  });

  it('builds complete English and Nepali spoken summaries', () => {
    const values = {
      sqFt: '5,476',
      sqM: '508.737',
      hills: { ropani: '1', aana: '0', paisa: '0', daam: '0' },
      terai: { bigha: '0', kattha: '1', dhur: '10.047' },
    };
    expect(buildSpokenConversion({ language: 'en-US', ...values })).toContain('square feet');
    expect(buildSpokenConversion({ language: 'ne-NP', ...values })).toContain('वर्ग फिट');
    expect(buildSpokenConversion({ language: 'ne-NP', ...values })).toContain('रोपनी');
  });
});

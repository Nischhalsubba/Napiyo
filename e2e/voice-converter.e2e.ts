import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    __spokenText?: string;
    __spokenLang?: string;
  }
}

test.describe('Converter bilingual speech', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }),
        },
      });

      class MockRecognition {
        lang = 'en-US';
        interimResults = false;
        continuous = false;
        onstart: (() => void) | null = null;
        onresult: ((event: Event & { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null = null;
        onend: (() => void) | null = null;
        onerror: ((event: Event & { error: string }) => void) | null = null;
        start() {
          window.setTimeout(() => {
            this.onstart?.();
            const transcript = this.lang === 'ne-NP' ? '२ रोपनी ४ आना' : '2 ropani 4 aana';
            this.onresult?.({ results: [{ 0: { transcript } }] } as unknown as Event & { results: ArrayLike<{ 0: { transcript: string } }> });
            this.onend?.();
          }, 20);
        }
        stop() { this.onend?.(); }
        abort() { this.onend?.(); }
      }

      class MockUtterance {
        text: string;
        lang = '';
        rate = 1;
        pitch = 1;
        voice: SpeechSynthesisVoice | null = null;
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) { this.text = text; }
      }

      Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: MockRecognition });
      Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: MockRecognition });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: MockUtterance });
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
          cancel() {},
          getVoices: () => [
            { lang: 'en-US', default: true, name: 'English', voiceURI: 'english', localService: true },
            { lang: 'ne-NP', default: false, name: 'Nepali', voiceURI: 'nepali', localService: true },
          ],
          speak(utterance: MockUtterance) {
            window.__spokenText = utterance.text;
            window.__spokenLang = utterance.lang;
            utterance.onstart?.();
            window.setTimeout(() => utterance.onend?.(), 20);
          },
        },
      });
    });
    await page.goto('/#convert');
  });

  test('captures English and Nepali speech input', async ({ page }) => {
    const area = page.getByLabel('Area · क्षेत्रफल');
    await page.getByLabel('Voice language').selectOption('en-US');
    await page.getByRole('button', { name: 'Start microphone' }).click();
    await expect(area).toHaveValue('2 ropani 4 aana');
    await expect(page.getByText('Transcript added', { exact: true })).toBeVisible();

    await page.getByLabel('Voice language').selectOption('ne-NP');
    await page.getByRole('button', { name: 'Start microphone' }).click();
    await expect(area).toHaveValue('२ रोपनी ४ आना');
    await expect(page.getByText('आवाज लेखियो', { exact: true })).toBeVisible();
  });

  test('reads results aloud in the selected language', async ({ page }) => {
    await page.getByLabel('Voice language').selectOption('en-US');
    await page.getByRole('button', { name: 'Listen in English' }).click();
    await expect.poll(() => page.evaluate(() => window.__spokenLang)).toBe('en-US');
    await expect.poll(() => page.evaluate(() => window.__spokenText)).toContain('square feet');

    await page.getByLabel('Voice language').selectOption('ne-NP');
    await page.getByRole('button', { name: 'Listen in Nepali' }).click();
    await expect.poll(() => page.evaluate(() => window.__spokenLang)).toBe('ne-NP');
    await expect.poll(() => page.evaluate(() => window.__spokenText)).toContain('वर्ग फिट');
  });
});

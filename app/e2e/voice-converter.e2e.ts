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
      localStorage.setItem('napiyo:language', 'en');
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
        volume = 1;
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
          paused: false,
          cancel() {},
          resume() {},
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

  test('captures English and Nepali speech input through the app language switch', async ({ page }) => {
    const englishArea = page.getByLabel('Area', { exact: true });
    await page.getByRole('button', { name: 'Start microphone' }).click();
    await expect(englishArea).toHaveValue('2 ropani 4 aana');
    await expect(page.getByText('Transcript added', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'नेपाली', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ne');
    await expect(page.getByRole('heading', { name: 'जग्गा नाप, सजिलो हिसाब।' })).toBeVisible();

    const nepaliArea = page.getByLabel('क्षेत्रफल', { exact: true });
    await page.getByRole('button', { name: 'माइक्रोफोन सुरु गर्नुहोस्' }).click();
    await expect(nepaliArea).toHaveValue('२ रोपनी ४ आना');
    await expect(page.getByText('आवाज लेखियो', { exact: true })).toBeVisible();
  });

  test('reads results aloud in the selected app language', async ({ page }) => {
    await page.getByRole('button', { name: 'Listen in English' }).click();
    await expect.poll(() => page.evaluate(() => window.__spokenLang)).toBe('en-US');
    await expect.poll(() => page.evaluate(() => window.__spokenText)).toContain('square feet');

    await page.getByRole('button', { name: 'नेपाली', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ne');
    await page.getByRole('button', { name: 'नेपालीमा सुन्नुहोस्' }).click();
    await expect.poll(() => page.evaluate(() => window.__spokenLang)).toBe('ne-NP');
    await expect.poll(() => page.evaluate(() => window.__spokenText)).toContain('वर्ग फिट');
  });
});

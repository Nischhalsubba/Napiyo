export type SpeechLanguage = 'en-US' | 'ne-NP';

export type VoiceLike = Pick<SpeechSynthesisVoice, 'lang' | 'default'>;

export const recognitionLanguage = (language: SpeechLanguage) => language === 'ne-NP' ? 'ne-NP' : 'en-US';

export const recognitionErrorMessage = (error: string, language: SpeechLanguage) => {
  const nepali = language === 'ne-NP';
  if (error === 'not-allowed' || error === 'service-not-allowed') return nepali
    ? 'माइक्रोफोन अनुमति रोकिएको छ। ब्राउजरको साइट सेटिङमा Microphone अनुमति दिनुहोस्।'
    : 'Microphone permission is blocked. Allow Microphone in this site’s browser settings.';
  if (error === 'audio-capture') return nepali
    ? 'माइक्रोफोन भेटिएन। उपकरणको माइक्रोफोन जाँच गर्नुहोस्।'
    : 'No microphone was found. Check your device microphone.';
  if (error === 'network') return nepali
    ? 'आवाज पहिचान सेवामा नेटवर्क समस्या भयो। इन्टरनेट जाँच गरी फेरि प्रयास गर्नुहोस्।'
    : 'The speech service had a network problem. Check your connection and try again.';
  if (error === 'no-speech') return nepali
    ? 'आवाज सुनिएन। माइक्रोफोन नजिक स्पष्ट रूपमा फेरि बोल्नुहोस्।'
    : 'No speech was detected. Speak clearly near the microphone and try again.';
  if (error === 'aborted') return nepali ? 'आवाज इनपुट रोकियो।' : 'Voice input stopped.';
  if (error === 'language-not-supported') return nepali
    ? 'यो ब्राउजरमा नेपाली आवाज पहिचान उपलब्ध छैन। Chrome वा Android प्रयोग गर्नुहोस्।'
    : 'This browser does not support the selected speech language.';
  return nepali
    ? 'आवाज बुझ्न सकिएन। शान्त ठाउँमा फेरि प्रयास गर्नुहोस्।'
    : 'Voice input could not be understood. Try again in a quieter place.';
};

export const chooseSpeechVoice = <T extends VoiceLike>(voices: T[], language: SpeechLanguage): T | undefined => {
  const normalized = voices.map((voice) => ({ voice, lang: voice.lang.toLowerCase() }));
  const preferences = language === 'ne-NP'
    ? ['ne-np', 'ne', 'hi-in', 'hi']
    : ['en-np', 'en-in', 'en-gb', 'en-us', 'en'];
  for (const preference of preferences) {
    const exact = normalized.find(({ lang }) => lang === preference);
    if (exact) return exact.voice;
    const prefix = normalized.find(({ lang }) => lang.startsWith(`${preference}-`));
    if (prefix) return prefix.voice;
  }
  return normalized.find(({ voice }) => voice.default)?.voice ?? voices[0];
};

export const waitForSpeechVoices = async (synthesis: SpeechSynthesis, timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> => {
  const immediate = synthesis.getVoices();
  if (immediate.length > 0) return immediate;

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synthesis.removeEventListener?.('voiceschanged', finish);
      resolve(synthesis.getVoices());
    };
    synthesis.addEventListener?.('voiceschanged', finish, { once: true });
    window.setTimeout(finish, timeoutMs);
  });
};

export const speakText = async ({
  text,
  language,
  onStart,
  onEnd,
  onError,
}: {
  text: string;
  language: SpeechLanguage;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}) => {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return false;
  const synthesis = window.speechSynthesis;
  synthesis.cancel();
  synthesis.resume();

  const voices = await waitForSpeechVoices(synthesis);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = language === 'ne-NP' ? 0.78 : 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  const voice = chooseSpeechVoice(voices, language);
  if (voice) utterance.voice = voice;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onError?.();

  await new Promise<void>((resolve) => window.setTimeout(resolve, 60));
  synthesis.speak(utterance);
  window.setTimeout(() => {
    if (synthesis.paused) synthesis.resume();
  }, 180);
  return true;
};

export const buildSpokenConversion = ({
  language,
  sqFt,
  sqM,
  hills,
  terai,
}: {
  language: SpeechLanguage;
  sqFt: string;
  sqM: string;
  hills: { ropani: string; aana: string; paisa: string; daam: string };
  terai: { bigha: string; kattha: string; dhur: string };
}) => language === 'ne-NP'
  ? `जग्गाको क्षेत्रफल ${sqFt} वर्ग फिट, अर्थात् ${sqM} वर्ग मिटर हो। पहाडी प्रणालीमा ${hills.ropani} रोपनी, ${hills.aana} आना, ${hills.paisa} पैसा र ${hills.daam} दाम। तराई प्रणालीमा ${terai.bigha} बिघा, ${terai.kattha} कठ्ठा र ${terai.dhur} धुर।`
  : `The land area is ${sqFt} square feet, or ${sqM} square metres. Hill system: ${hills.ropani} ropani, ${hills.aana} aana, ${hills.paisa} paisa and ${hills.daam} daam. Terai system: ${terai.bigha} bigha, ${terai.kattha} kattha and ${terai.dhur} dhur.`;

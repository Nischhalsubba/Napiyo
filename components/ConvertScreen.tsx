import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { BookmarkPlus, Calculator, Check, Copy, ExternalLink, Info, Languages, Mic, MicOff, RotateCcw, Share2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { QUICK_VALUES, UNITS } from '../constants';
import { SavedItem, UnitSystem } from '../types';
import {
  formatDecimal, formatHills, formatHillsWords, formatNepaliNumber, formatTerai, formatTeraiWords,
  fromSqFt, getHillsBreakdown, getTeraiBreakdown, hillsToSqFt, parseAreaInput, parseSmartArea,
  teraiToSqFt, toSqFt, toSqM,
} from '../utils/conversions';
import { buildSpokenConversion, chooseSpeechVoice, recognitionErrorMessage, recognitionLanguage, type SpeechLanguage } from '../utils/speech';

interface ConvertScreenProps { onSave: (item: SavedItem) => boolean; onVisualize: (sqFt: number) => void; notify: (message: string) => void; }
type InputMode = 'SMART' | 'HILLS' | 'TERAI' | 'SQUARE';
type SquareUnit = 'SQFT' | 'SQM' | 'SQYD' | 'ACRE' | 'HECTARE';
type Fields = Record<string, string>;
type ConversionItem = { id: string; label: string; shortLabel: string; value: number; decimals?: number; };
type SpeechResult = { 0: { transcript: string } };
type RecognitionEvent = Event & { results: ArrayLike<SpeechResult> };
type RecognitionErrorEvent = Event & { error: string; message?: string };
type RecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
};
type RecognitionConstructor = new () => RecognitionInstance;

const valueText = (value: number, decimals = 3) => Number.isInteger(value) ? String(value) : String(Number(value.toFixed(decimals)));
const priceUnits = ['ROPANI','AANA','BIGHA','KATTHA','DHUR','SQFT','SQM'] as const;

const ConvertScreen = ({ onSave, onVisualize, notify }: ConvertScreenProps) => {
  const [mode, setMode] = useState<InputMode>('SMART');
  const [smartInput, setSmartInput] = useState('1 ropani');
  const [hills, setHills] = useState<Fields>({ ropani: '1', aana: '0', paisa: '0', daam: '0' });
  const [terai, setTerai] = useState<Fields>({ bigha: '0', kattha: '0', dhur: '0' });
  const [squareValue, setSquareValue] = useState('5476');
  const [squareUnit, setSquareUnit] = useState<SquareUnit>('SQFT');
  const [price, setPrice] = useState('0');
  const [priceUnit, setPriceUnit] = useState<(typeof priceUnits)[number]>('AANA');
  const [copied, setCopied] = useState(false);
  const [nepaliDigits, setNepaliDigits] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<SpeechLanguage>('en-US');
  const [voiceStatus, setVoiceStatus] = useState('Ready · तयार');
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const recognitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (recognitionTimeoutRef.current !== null) window.clearTimeout(recognitionTimeoutRef.current);
    recognitionRef.current?.abort?.();
    window.speechSynthesis?.cancel();
  }, []);

  const parsedSmart = useMemo(() => parseSmartArea(smartInput), [smartInput]);
  const sqFt = useMemo(() => {
    if (mode === 'SMART') return parsedSmart.sqFt;
    if (mode === 'HILLS') return hillsToSqFt({ ropani: parseAreaInput(hills.ropani), aana: parseAreaInput(hills.aana), paisa: parseAreaInput(hills.paisa), daam: parseAreaInput(hills.daam) });
    if (mode === 'TERAI') return teraiToSqFt({ bigha: parseAreaInput(terai.bigha), kattha: parseAreaInput(terai.kattha), dhur: parseAreaInput(terai.dhur) });
    return toSqFt(parseAreaInput(squareValue), squareUnit);
  }, [hills, mode, parsedSmart.sqFt, squareUnit, squareValue, terai]);
  const sqM = toSqM(sqFt);
  const hasValue = sqFt > 0;
  const displayNumber = (value: number, decimals = 2) => nepaliDigits ? formatNepaliNumber(value, decimals) : formatDecimal(value, decimals);
  const totalPrice = parseAreaInput(price) * fromSqFt(sqFt, priceUnit);

  const groups = useMemo(() => ({
    hill: [
      { id:'ROPANI', label:'Ropani · रोपनी', shortLabel:'ropani', value:fromSqFt(sqFt,'ROPANI'), decimals:6 },
      { id:'AANA', label:'Aana · आना', shortLabel:'aana', value:fromSqFt(sqFt,'AANA'), decimals:5 },
      { id:'PAISA', label:'Paisa · पैसा', shortLabel:'paisa', value:fromSqFt(sqFt,'PAISA'), decimals:4 },
      { id:'DAAM', label:'Daam · दाम', shortLabel:'daam', value:fromSqFt(sqFt,'DAAM'), decimals:3 },
    ] as ConversionItem[],
    terai: [
      { id:'BIGHA', label:'Bigha · बिघा', shortLabel:'bigha', value:fromSqFt(sqFt,'BIGHA'), decimals:6 },
      { id:'KATTHA', label:'Kattha · कठ्ठा', shortLabel:'kattha', value:fromSqFt(sqFt,'KATTHA'), decimals:5 },
      { id:'DHUR', label:'Dhur · धुर', shortLabel:'dhur', value:fromSqFt(sqFt,'DHUR'), decimals:3 },
    ] as ConversionItem[],
    standard: [
      { id:'SQFT', label:'Square feet', shortLabel:'ft²', value:sqFt, decimals:2 },
      { id:'SQM', label:'Square metres', shortLabel:'m²', value:sqM, decimals:3 },
      { id:'SQYD', label:'Square yards', shortLabel:'yd²', value:fromSqFt(sqFt,'SQYD'), decimals:3 },
      { id:'ACRE', label:'Acres', shortLabel:'acres', value:fromSqFt(sqFt,'ACRE'), decimals:7 },
      { id:'HECTARE', label:'Hectares', shortLabel:'ha', value:fromSqFt(sqFt,'HECTARE'), decimals:7 },
    ] as ConversionItem[],
  }), [sqFt, sqM]);

  const switchMode = (nextMode: InputMode, area = sqFt) => {
    if (nextMode === 'SMART') setSmartInput(formatHillsWords(area));
    if (nextMode === 'HILLS') { const value=getHillsBreakdown(area); setHills({ropani:valueText(value.ropani,0),aana:valueText(value.aana,0),paisa:valueText(value.paisa,0),daam:valueText(value.daam)}); }
    if (nextMode === 'TERAI') { const value=getTeraiBreakdown(area); setTerai({bigha:valueText(value.bigha,0),kattha:valueText(value.kattha,0),dhur:valueText(value.dhur)}); }
    if (nextMode === 'SQUARE') setSquareValue(valueText(fromSqFt(area, squareUnit),4));
    setMode(nextMode);
  };

  const applyQuickValue = (item: (typeof QUICK_VALUES)[number]) => {
    const area = toSqFt(parseAreaInput(item.value), item.unit);
    setSmartInput(`${item.value} ${UNITS[item.unit].name}`); setMode('SMART');
    if (UNITS[item.unit].system === UnitSystem.HILLS) { const value=getHillsBreakdown(area); setHills({ropani:String(value.ropani),aana:String(value.aana),paisa:String(value.paisa),daam:valueText(value.daam)}); }
  };

  const stopRecognition = () => {
    if (recognitionTimeoutRef.current !== null) window.clearTimeout(recognitionTimeoutRef.current);
    recognitionTimeoutRef.current = null;
    recognitionRef.current?.stop();
  };

  const toggleVoice = async () => {
    if (listening) { stopRecognition(); return; }
    const speechWindow = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStatus('Unsupported · उपलब्ध छैन');
      return notify('Voice input is not supported here. Use current Chrome or Edge, or type the area manually.');
    }

    setVoiceStatus(speechLanguage === 'ne-NP' ? 'माइक्रोफोन अनुमति जाँच्दै…' : 'Checking microphone permission…');
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      const message = recognitionErrorMessage(name === 'NotAllowedError' || name === 'SecurityError' ? 'not-allowed' : 'audio-capture', speechLanguage);
      setVoiceStatus(speechLanguage === 'ne-NP' ? 'माइक्रोफोन रोकिएको छ' : 'Microphone blocked');
      notify(message);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = recognitionLanguage(speechLanguage);
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => {
      setListening(true);
      setVoiceStatus(speechLanguage === 'ne-NP' ? 'बोल्नुहोस्…' : 'Listening…');
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results, (result) => result[0]?.transcript ?? '').join(' ').trim();
      if (transcript) {
        setSmartInput(transcript);
        setMode('SMART');
        setVoiceStatus(speechLanguage === 'ne-NP' ? 'आवाज लेखियो' : 'Transcript added');
        notify(speechLanguage === 'ne-NP' ? 'आवाजबाट मापन थपियो। व्याख्या जाँच गर्नुहोस्।' : 'Voice measurement added. Check the interpretation before using it.');
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      setVoiceStatus(speechLanguage === 'ne-NP' ? 'फेरि प्रयास गर्नुहोस्' : 'Try again');
      notify(recognitionErrorMessage(event.error, speechLanguage));
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (recognitionTimeoutRef.current !== null) window.clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      recognitionTimeoutRef.current = window.setTimeout(() => {
        recognition.stop();
        setVoiceStatus(speechLanguage === 'ne-NP' ? 'समय सकियो · फेरि बोल्नुहोस्' : 'Timed out · try again');
      }, 15000);
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setVoiceStatus('Unavailable · उपलब्ध छैन');
      notify('The browser could not start voice input. Reload the page and allow microphone access.');
    }
  };

  const clear = () => {
    stopRecognition();
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setSmartInput('');
    setHills({ropani:'0',aana:'0',paisa:'0',daam:'0'});
    setTerai({bigha:'0',kattha:'0',dhur:'0'});
    setSquareValue('0');
    setPrice('0');
  };

  const summary = `Napiyo land conversion\nHill: ${formatHillsWords(sqFt)}\nTerai: ${formatTeraiWords(sqFt)}\nStandard: ${formatDecimal(sqFt)} ft² · ${formatDecimal(sqM,3)} m²${totalPrice > 0 ? `\nEstimated price: NPR ${formatDecimal(totalPrice)}` : ''}`;
  const copySummary = async () => { try { await navigator.clipboard.writeText(summary); setCopied(true); notify('All conversions copied.'); setTimeout(()=>setCopied(false),1800); } catch { notify('Your browser blocked clipboard access.'); } };
  const share = async () => { if (navigator.share) { try { await navigator.share({title:'Napiyo land conversion',text:summary}); return; } catch { return; } } await copySummary(); };

  const speak = () => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return notify('Spoken results are not supported in this browser.');
    const synthesis = window.speechSynthesis;
    if (speaking) {
      synthesis.cancel();
      setSpeaking(false);
      setVoiceStatus(speechLanguage === 'ne-NP' ? 'आवाज रोकियो' : 'Audio stopped');
      return;
    }
    const hill = getHillsBreakdown(sqFt);
    const plainTerai = getTeraiBreakdown(sqFt);
    const number = (value: number, decimals = 2) => speechLanguage === 'ne-NP' ? formatNepaliNumber(value, decimals) : formatDecimal(value, decimals);
    const text = buildSpokenConversion({
      language: speechLanguage,
      sqFt: number(sqFt),
      sqM: number(sqM, 3),
      hills: { ropani:number(hill.ropani,0), aana:number(hill.aana,0), paisa:number(hill.paisa,0), daam:number(hill.daam,2) },
      terai: { bigha:number(plainTerai.bigha,0), kattha:number(plainTerai.kattha,0), dhur:number(plainTerai.dhur,3) },
    });
    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLanguage;
    utterance.rate = speechLanguage === 'ne-NP' ? 0.82 : 0.9;
    utterance.pitch = 1;
    const voice = chooseSpeechVoice(synthesis.getVoices(), speechLanguage);
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { setSpeaking(true); setVoiceStatus(speechLanguage === 'ne-NP' ? 'नतिजा पढ्दै…' : 'Reading result…'); };
    utterance.onend = () => { setSpeaking(false); setVoiceStatus(speechLanguage === 'ne-NP' ? 'पढिसकियो' : 'Finished reading'); };
    utterance.onerror = () => { setSpeaking(false); setVoiceStatus(speechLanguage === 'ne-NP' ? 'आवाज उपलब्ध भएन' : 'Voice unavailable'); notify(speechLanguage === 'ne-NP' ? 'नेपाली आवाज यो उपकरणमा उपलब्ध नहुन सक्छ।' : 'The selected spoken voice is unavailable on this device.'); };
    synthesis.speak(utterance);
  };

  const saveCalculation = () => { if (!hasValue) return; const saved=onSave({id:crypto.randomUUID(),title:mode==='SMART'?parsedSmart.interpretation:formatHillsWords(sqFt),sqFt,sqM,date:Date.now(),type:'CONVERTED',tags:[mode.toLowerCase()],source:{inputValue:mode==='SMART'?smartInput:squareValue,inputUnit:mode}}); notify(saved?'Area saved on this device.':'This browser could not save the area.'); };

  return <div className="page-shell animate-enter !max-w-[96rem] converter-page">
    <header className="nepali-hero">
      <div className="nepali-hero-copy">
        <p className="eyebrow">नेपाल जग्गा एकाइ · Nepal land units</p>
        <h1 className="page-title">जग्गा नाप, सजिलो हिसाब।</h1>
        <p className="nepali-hero-english">Type, speak, and understand land area naturally.</p>
        <p className="page-copy">Use English, नेपाली अंक, आवाज, compact notation, or manual fields. Every result remains transparent and easy to verify.</p>
      </div>
      <div className="nepali-hero-emblem" aria-hidden="true"><span>रोपनी</span><span>कठ्ठा</span><span>m²</span></div>
    </header>

    <div className="nepali-system-band" aria-label="Supported Nepal land systems"><span>पहाड · Hill</span><i/><span>तराई · Terai</span><i/><span>मानक · Metric</span></div>

    <section className="grid gap-6 xl:grid-cols-[26rem_minmax(0,1fr)] xl:items-start">
      <aside className="panel nepali-panel xl:sticky xl:top-4">
        <div className="panel-header"><p className="section-title">१ · क्षेत्रफल लेख्नुहोस्</p><p className="section-copy">Enter a known area using Hill, Terai, standard units, or natural language.</p></div>
        <div className="panel-body">
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-paper-100 p-1" role="tablist" aria-label="Choose input method">{(['SMART','HILLS','TERAI','SQUARE'] as InputMode[]).map((item)=><ModeButton key={item} active={mode===item} label={item==='SMART'?'Smart':item==='HILLS'?'पहाड':item==='TERAI'?'तराई':'Metric'} onClick={()=>switchMode(item)}/>)}</div>
          <div className="mt-5 flex items-center justify-between"><p className="text-sm font-semibold text-ink-950">{mode==='SMART'?'Natural language · बोल्नुहोस्':mode==='HILLS'?'रोपनी–आना–पैसा–दाम':mode==='TERAI'?'बिघा–कठ्ठा–धुर':'Standard measurement'}</p><button type="button" onClick={clear} className="button-quiet focus-ring !min-h-9 !px-2.5 !py-1.5"><RotateCcw size={15}/>Clear</button></div>

          {mode==='SMART'&&<div className="mt-4">
            <label className="field-label" htmlFor="smart-area">Area · क्षेत्रफल</label>
            <textarea id="smart-area" value={smartInput} onChange={(event)=>setSmartInput(event.target.value)} rows={3} className="field min-h-24 resize-none text-lg font-semibold" placeholder="Example: 1 ropani 2 aana or २ कठ्ठा ५ धुर"/>
            <div className="voice-console mt-3">
              <div className="flex items-center gap-2"><Languages size={17} className="text-leaf-700"/><p className="font-semibold text-ink-950">Voice · आवाज</p><span className="ml-auto text-[11px] font-semibold text-ink-500" aria-live="polite">{voiceStatus}</span></div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <select value={speechLanguage} onChange={(event)=>setSpeechLanguage(event.target.value as SpeechLanguage)} className="select-field" aria-label="Voice language"><option value="en-US">English</option><option value="ne-NP">नेपाली</option></select>
                <button type="button" onClick={toggleVoice} aria-pressed={listening} aria-label={listening?'Stop microphone':'Start microphone'} className={`button-secondary focus-ring ${listening?'!border-crimson-400 !bg-crimson-50 !text-crimson-700':''}`}>{listening?<MicOff size={17}/>:<Mic size={17}/>} {listening?(speechLanguage==='ne-NP'?'रोक्नुहोस्':'Stop'):(speechLanguage==='ne-NP'?'बोल्नुहोस्':'Speak')}</button>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-ink-500">Audio is not stored. Microphone permission and browser speech services are required.</p>
            </div>
            <div className={`mt-3 rounded-xl border p-3 text-sm leading-6 ${parsedSmart.recognized?'border-leaf-200 bg-leaf-50 text-leaf-900':'border-saffron-200 bg-saffron-50 text-ink-700'}`}><span className="font-semibold">Interpreted · बुझिएको:</span> {parsedSmart.interpretation}</div>
          </div>}
          {mode==='HILLS'&&<div className="mt-4 grid grid-cols-2 gap-3">{(['ropani','aana','paisa','daam'] as const).map((field)=><AreaField key={field} label={field} value={hills[field]} onChange={(value)=>setHills((current)=>({...current,[field]:value}))}/>)}</div>}
          {mode==='TERAI'&&<div className="mt-4 grid grid-cols-3 gap-3">{(['bigha','kattha','dhur'] as const).map((field)=><AreaField key={field} label={field} value={terai[field]} onChange={(value)=>setTerai((current)=>({...current,[field]:value}))}/>)}</div>}
          {mode==='SQUARE'&&<div className="mt-4"><label className="field-label">Source unit</label><select className="select-field" value={squareUnit} onChange={(event)=>{const sourceUnit=event.target.value as SquareUnit;setSquareValue(valueText(fromSqFt(sqFt,sourceUnit),4));setSquareUnit(sourceUnit);}}>{(['SQFT','SQM','SQYD','ACRE','HECTARE'] as SquareUnit[]).map((sourceUnit)=><option key={sourceUnit} value={sourceUnit}>{UNITS[sourceUnit].name}</option>)}</select><label className="field-label mt-4" htmlFor="square-value">Area</label><input id="square-value" inputMode="decimal" value={squareValue} onChange={(event:ChangeEvent<HTMLInputElement>)=>setSquareValue(event.target.value)} className="field numeral text-2xl font-semibold"/></div>}

          <div className="mt-5 flex gap-3 rounded-xl border border-leaf-100 bg-leaf-50 p-3.5 text-sm leading-6 text-leaf-900"><Info className="mt-0.5 shrink-0 text-leaf-700" size={17}/><p>Try “1-2-0-0”, “2 kattha 5 dhur”, “500 m²”, or “१ रोपनी ४ आना”.</p></div>
          <div className="mt-5"><p className="field-label">Quick examples · छिटो उदाहरण</p><div className="flex flex-wrap gap-2">{QUICK_VALUES.map((item)=><button key={item.label} type="button" onClick={()=>applyQuickValue(item)} className="focus-ring rounded-lg border border-paper-300 bg-white px-3 py-2 text-xs font-semibold text-ink-600">{item.label}</button>)}</div></div>

          <div className="mt-6 border-t border-paper-200 pt-5"><div className="flex items-center gap-2"><Calculator size={17} className="text-crimson-600"/><p className="font-semibold text-ink-950">मूल्य अनुमान · Price estimate</p></div><div className="mt-3 grid grid-cols-[1fr_8rem] gap-2"><input value={price} onChange={(event)=>setPrice(event.target.value)} inputMode="decimal" className="field numeral" aria-label="Price per unit" placeholder="Price in NPR"/><select value={priceUnit} onChange={(event)=>setPriceUnit(event.target.value as typeof priceUnit)} className="select-field" aria-label="Price unit">{priceUnits.map((sourceUnit)=><option key={sourceUnit} value={sourceUnit}>per {UNITS[sourceUnit].name}</option>)}</select></div><div className="nepali-price-card mt-3"><p className="text-xs text-ink-300">Estimated total · अनुमानित मूल्य</p><p className="numeral mt-1 text-2xl font-semibold">NPR {displayNumber(totalPrice)}</p><p className="mt-1 text-xs text-ink-300">Registration, tax, and brokerage are not included.</p></div></div>
        </div>
      </aside>

      <main className="space-y-5">
        <section className="nepal-result-card overflow-hidden rounded-2xl text-white shadow-card">
          <div className="grid gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-leaf-300">Exact area · ठ्याक्कै रूपान्तरण</p><div className="mt-3 flex flex-wrap items-end gap-x-3"><span className="numeral text-4xl font-semibold sm:text-5xl">{displayNumber(sqFt)}</span><span className="pb-1 text-ink-300">square feet</span></div><p className="mt-2 text-sm text-ink-300">{displayNumber(sqM,3)} square metres</p></div>
            <div className="flex flex-wrap gap-2"><ActionButton onClick={saveCalculation} disabled={!hasValue} primary icon={<BookmarkPlus size={17}/>} label="Save"/><ActionButton onClick={()=>onVisualize(sqFt)} disabled={!hasValue} icon={<ExternalLink size={17}/>} label="Planner"/><ActionButton onClick={speak} disabled={!hasValue} icon={speaking?<VolumeX size={17}/>:<Volume2 size={17}/>} label={speaking?(speechLanguage==='ne-NP'?'रोक्नुहोस्':'Stop audio'):(speechLanguage==='ne-NP'?'सुन्नुहोस्':'Listen')} ariaLabel={speaking?'Stop spoken result':`Listen in ${speechLanguage==='ne-NP'?'Nepali':'English'}`}/><ActionButton onClick={share} disabled={!hasValue} icon={<Share2 size={17}/>} label="Share"/><ActionButton onClick={copySummary} disabled={!hasValue} icon={copied?<Check size={17}/>:<Copy size={17}/>} label={copied?'Copied':'Copy'}/></div>
          </div>
          <div className="grid gap-px bg-white/10 md:grid-cols-2"><BreakdownCard title="पहाडी प्रणाली · Hill" compact={formatHills(sqFt)} words={formatHillsWords(sqFt)}/><BreakdownCard title="तराई प्रणाली · Terai" compact={formatTerai(sqFt)} words={formatTeraiWords(sqFt)}/></div>
        </section>

        <section className="panel nepali-panel overflow-hidden"><div className="panel-header flex items-center justify-between gap-3"><div><p className="section-title">२ · सबै एकाइ · All units</p><p className="section-copy">Every equivalent updates immediately.</p></div><button type="button" onClick={()=>setNepaliDigits((value)=>!value)} className="button-secondary focus-ring !min-h-9 !px-3">{nepaliDigits?'123':'१२३'}</button></div><div className="grid gap-px bg-paper-200 lg:grid-cols-3"><ConversionGroup title="पहाड · Hill" items={groups.hill} display={displayNumber}/><ConversionGroup title="तराई · Terai" items={groups.terai} display={displayNumber}/><ConversionGroup title="मानक · Standard" items={groups.standard} display={displayNumber}/></div></section>
        <div className="rounded-xl border border-saffron-200 bg-saffron-50 px-4 py-3 text-xs leading-5 text-ink-600"><Sparkles size={15} className="mr-2 inline"/>Conversions are exact mathematical relationships. Legal boundaries require official cadastral records.</div>
      </main>
    </section>
  </div>;
};

const AreaField=({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void})=><label className="block"><span className="field-label capitalize">{label}</span><input inputMode="decimal" value={value} onChange={(event)=>onChange(event.target.value)} className="field numeral text-center text-xl font-semibold"/></label>;
const ModeButton=({active,label,onClick}:{active:boolean;label:string;onClick:()=>void})=><button type="button" role="tab" aria-selected={active} onClick={onClick} className={`focus-ring rounded-lg px-2 py-2.5 text-xs font-semibold transition ${active?'bg-white text-ink-950 shadow-sm ring-1 ring-leaf-200':'text-ink-500 hover:bg-white'}`}>{label}</button>;
const BreakdownCard=({title,compact,words}:{title:string;compact:string;words:string})=><div className="bg-ink-900/90 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-leaf-300">{title}</p><p className="numeral mt-2 text-2xl font-semibold text-white">{compact}</p><p className="mt-2 text-xs leading-5 text-ink-300">{words}</p></div>;
const ConversionGroup=({title,items,display}:{title:string;items:ConversionItem[];display:(value:number,decimals?:number)=>string})=><section className="bg-white p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-leaf-700">{title}</p><dl className="mt-4 divide-y divide-paper-200">{items.map((item)=><div key={item.id} className="flex items-baseline justify-between gap-4 py-3"><dt className="text-sm text-ink-600">{item.label}</dt><dd className="numeral text-right font-semibold text-ink-950">{display(item.value,item.decimals)} <span className="text-xs text-ink-400">{item.shortLabel}</span></dd></div>)}</dl></section>;
const ActionButton=({onClick,disabled,icon,label,primary=false,ariaLabel}:{onClick:()=>void;disabled:boolean;icon:ReactNode;label:string;primary?:boolean;ariaLabel?:string})=><button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={`focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold disabled:opacity-35 ${primary?'bg-white text-ink-950':'border border-white/15 bg-white/5 text-white hover:bg-white/10'}`}>{icon}{label}</button>;
export default ConvertScreen;

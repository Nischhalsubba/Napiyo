import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { BookmarkPlus, Calculator, Check, Copy, ExternalLink, Info, Mic, MicOff, RotateCcw, Share2, Sparkles, Volume2 } from 'lucide-react';
import { QUICK_VALUES, UNITS } from '../constants';
import { SavedItem, UnitSystem } from '../types';
import {
  formatDecimal, formatHills, formatHillsWords, formatNepaliNumber, formatTerai, formatTeraiWords,
  fromSqFt, getHillsBreakdown, getTeraiBreakdown, hillsToSqFt, parseAreaInput, parseSmartArea,
  teraiToSqFt, toSqFt, toSqM,
} from '../utils/conversions';

interface ConvertScreenProps { onSave: (item: SavedItem) => boolean; onVisualize: (sqFt: number) => void; notify: (message: string) => void; }
type InputMode = 'SMART' | 'HILLS' | 'TERAI' | 'SQUARE';
type SquareUnit = 'SQFT' | 'SQM' | 'SQYD' | 'ACRE' | 'HECTARE';
type Fields = Record<string, string>;
type ConversionItem = { id: string; label: string; shortLabel: string; value: number; decimals?: number; };
type SpeechResult = { 0: { transcript: string } };
type RecognitionEvent = Event & { results: ArrayLike<SpeechResult> };
type RecognitionInstance = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((event: RecognitionEvent) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; };
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
  const [voiceLanguage, setVoiceLanguage] = useState<'en-NP' | 'ne-NP'>('en-NP');
  const recognitionRef = useRef<RecognitionInstance | null>(null);

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
      { id:'ROPANI', label:'Ropani', shortLabel:'ropani', value:fromSqFt(sqFt,'ROPANI'), decimals:6 },
      { id:'AANA', label:'Aana', shortLabel:'aana', value:fromSqFt(sqFt,'AANA'), decimals:5 },
      { id:'PAISA', label:'Paisa', shortLabel:'paisa', value:fromSqFt(sqFt,'PAISA'), decimals:4 },
      { id:'DAAM', label:'Daam', shortLabel:'daam', value:fromSqFt(sqFt,'DAAM'), decimals:3 },
    ] as ConversionItem[],
    terai: [
      { id:'BIGHA', label:'Bigha', shortLabel:'bigha', value:fromSqFt(sqFt,'BIGHA'), decimals:6 },
      { id:'KATTHA', label:'Kattha', shortLabel:'kattha', value:fromSqFt(sqFt,'KATTHA'), decimals:5 },
      { id:'DHUR', label:'Dhur', shortLabel:'dhur', value:fromSqFt(sqFt,'DHUR'), decimals:3 },
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
  const toggleVoice = () => {
    if (listening) { recognitionRef.current?.stop(); return; }
    const speechWindow = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) return notify('Voice input is not supported in this browser. Chrome on Android or desktop usually supports it.');
    const recognition = new Recognition(); recognition.lang=voiceLanguage; recognition.interimResults=false; recognition.continuous=false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results, (result) => result[0].transcript).join(' ').trim();
      if (transcript) { setSmartInput(transcript); setMode('SMART'); notify('Voice measurement added. Check the interpretation before using it.'); }
    };
    recognition.onerror=()=>{setListening(false);notify('Voice input could not understand that. Try again in a quieter place.');}; recognition.onend=()=>setListening(false);
    recognitionRef.current=recognition; setListening(true); recognition.start();
  };
  const clear = () => { recognitionRef.current?.stop(); setSmartInput(''); setHills({ropani:'0',aana:'0',paisa:'0',daam:'0'}); setTerai({bigha:'0',kattha:'0',dhur:'0'}); setSquareValue('0'); setPrice('0'); };
  const summary = `Napiyo land conversion\nHill: ${formatHillsWords(sqFt)}\nTerai: ${formatTeraiWords(sqFt)}\nStandard: ${formatDecimal(sqFt)} ft² · ${formatDecimal(sqM,3)} m²${totalPrice > 0 ? `\nEstimated price: NPR ${formatDecimal(totalPrice)}` : ''}`;
  const copySummary = async () => { try { await navigator.clipboard.writeText(summary); setCopied(true); notify('All conversions copied.'); setTimeout(()=>setCopied(false),1800); } catch { notify('Your browser blocked clipboard access.'); } };
  const share = async () => { if (navigator.share) { try { await navigator.share({title:'Napiyo land conversion',text:summary}); return; } catch { return; } } await copySummary(); };
  const speak = () => { if (!('speechSynthesis' in window)) return notify('Speech is not supported in this browser.'); speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(`${formatHillsWords(sqFt)}. ${formatTeraiWords(sqFt)}. ${formatDecimal(sqFt)} square feet.`)); };
  const saveCalculation = () => { if (!hasValue) return; const saved=onSave({id:crypto.randomUUID(),title:mode==='SMART'?parsedSmart.interpretation:formatHillsWords(sqFt),sqFt,sqM,date:Date.now(),type:'CONVERTED',tags:[mode.toLowerCase()],source:{inputValue:mode==='SMART'?smartInput:squareValue,inputUnit:mode}}); notify(saved?'Area saved on this device.':'This browser could not save the area.'); };

  return <div className="page-shell animate-enter !max-w-[96rem]"><header className="page-header max-w-4xl"><p className="eyebrow">Nepal land unit converter</p><h1 className="page-title">Type or speak land area naturally.</h1><p className="page-copy">Use English, नेपाली digits, voice, compact notation, or manual fields. Check the interpretation before using the result.</p></header><section className="grid gap-6 xl:grid-cols-[25rem_minmax(0,1fr)] xl:items-start"><aside className="panel xl:sticky xl:top-4"><div className="panel-header"><p className="section-title">1. Enter your known area</p><p className="section-copy">Smart input supports Hill, Terai, and standard units.</p></div><div className="panel-body">
    <div className="grid grid-cols-4 gap-1 rounded-xl bg-paper-100 p-1" role="tablist" aria-label="Choose input method">{(['SMART','HILLS','TERAI','SQUARE'] as InputMode[]).map((item)=><ModeButton key={item} active={mode===item} label={item==='SMART'?'Smart':item==='HILLS'?'Hill':item==='TERAI'?'Terai':'Standard'} onClick={()=>switchMode(item)}/>)}</div>
    <div className="mt-5 flex items-center justify-between"><p className="text-sm font-semibold text-ink-950">{mode==='SMART'?'Natural language':mode==='HILLS'?'Ropani–Aana–Paisa–Daam':mode==='TERAI'?'Bigha–Kattha–Dhur':'Any standard unit'}</p><button type="button" onClick={clear} className="button-quiet focus-ring !min-h-9 !px-2.5 !py-1.5"><RotateCcw size={15}/>Clear</button></div>
    {mode==='SMART'&&<div className="mt-4"><label className="field-label" htmlFor="smart-area">Area</label><textarea id="smart-area" value={smartInput} onChange={(event)=>setSmartInput(event.target.value)} rows={3} className="field min-h-24 resize-none text-lg font-semibold" placeholder="Example: 1 ropani 2 aana or २ कट्ठा ५ धुर"/><div className="mt-2 grid grid-cols-[1fr_auto] gap-2"><select value={voiceLanguage} onChange={(event)=>setVoiceLanguage(event.target.value as typeof voiceLanguage)} className="select-field" aria-label="Voice language"><option value="en-NP">English voice</option><option value="ne-NP">नेपाली आवाज</option></select><button type="button" onClick={toggleVoice} aria-pressed={listening} className={`button-secondary focus-ring ${listening?'!border-red-400 !bg-red-50 !text-red-700':''}`}>{listening?<MicOff size={17}/>:<Mic size={17}/>} {listening?'Stop':'Speak'}</button></div><p className="mt-2 text-[11px] leading-5 text-ink-400">Napiyo does not save audio. Your browser may use its speech service to create the transcript.</p><div className={`mt-3 rounded-xl border p-3 text-sm leading-6 ${parsedSmart.recognized?'border-leaf-200 bg-leaf-50 text-leaf-900':'border-saffron-200 bg-saffron-50 text-ink-700'}`}><span className="font-semibold">Interpreted as:</span> {parsedSmart.interpretation}</div></div>}
    {mode==='HILLS'&&<div className="mt-4 grid grid-cols-2 gap-3">{(['ropani','aana','paisa','daam'] as const).map((field)=><AreaField key={field} label={field} value={hills[field]} onChange={(value)=>setHills((current)=>({...current,[field]:value}))}/>)}</div>}
    {mode==='TERAI'&&<div className="mt-4 grid grid-cols-3 gap-3">{(['bigha','kattha','dhur'] as const).map((field)=><AreaField key={field} label={field} value={terai[field]} onChange={(value)=>setTerai((current)=>({...current,[field]:value}))}/>)}</div>}
    {mode==='SQUARE'&&<div className="mt-4"><label className="field-label">Source unit</label><select className="select-field" value={squareUnit} onChange={(event)=>{const sourceUnit=event.target.value as SquareUnit;setSquareValue(valueText(fromSqFt(sqFt,sourceUnit),4));setSquareUnit(sourceUnit);}}>{(['SQFT','SQM','SQYD','ACRE','HECTARE'] as SquareUnit[]).map((sourceUnit)=><option key={sourceUnit} value={sourceUnit}>{UNITS[sourceUnit].name}</option>)}</select><label className="field-label mt-4" htmlFor="square-value">Area</label><input id="square-value" inputMode="decimal" value={squareValue} onChange={(event:ChangeEvent<HTMLInputElement>)=>setSquareValue(event.target.value)} className="field numeral text-2xl font-semibold"/></div>}
    <div className="mt-5 flex gap-3 rounded-xl border border-leaf-100 bg-leaf-50 p-3.5 text-sm leading-6 text-leaf-900"><Info className="mt-0.5 shrink-0 text-leaf-700" size={17}/><p>Examples: “1-2-0-0”, “2 kattha 5 dhur”, “500 m²”, “१ रोपनी ४ आना”.</p></div><div className="mt-5"><p className="field-label">Quick examples</p><div className="flex flex-wrap gap-2">{QUICK_VALUES.map((item)=><button key={item.label} type="button" onClick={()=>applyQuickValue(item)} className="focus-ring rounded-lg border border-paper-300 bg-white px-3 py-2 text-xs font-semibold text-ink-600">{item.label}</button>)}</div></div>
    <div className="mt-6 border-t border-paper-200 pt-5"><div className="flex items-center gap-2"><Calculator size={17} className="text-leaf-700"/><p className="font-semibold text-ink-950">Land price calculator</p></div><div className="mt-3 grid grid-cols-[1fr_8rem] gap-2"><input value={price} onChange={(event)=>setPrice(event.target.value)} inputMode="decimal" className="field numeral" aria-label="Price per unit" placeholder="Price in NPR"/><select value={priceUnit} onChange={(event)=>setPriceUnit(event.target.value as typeof priceUnit)} className="select-field" aria-label="Price unit">{priceUnits.map((sourceUnit)=><option key={sourceUnit} value={sourceUnit}>per {UNITS[sourceUnit].name}</option>)}</select></div><div className="mt-3 rounded-xl bg-ink-950 p-4 text-white"><p className="text-xs text-ink-300">Estimated total price</p><p className="numeral mt-1 text-2xl font-semibold">NPR {displayNumber(totalPrice)}</p><p className="mt-1 text-xs text-ink-300">Planning estimate only. Registration, tax, and brokerage are not included.</p></div></div>
  </div></aside><main className="space-y-5"><section className="overflow-hidden rounded-2xl border border-ink-900 bg-ink-950 text-white shadow-card"><div className="grid gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-leaf-300">Exact converted area</p><div className="mt-3 flex flex-wrap items-end gap-x-3"><span className="numeral text-4xl font-semibold sm:text-5xl">{displayNumber(sqFt)}</span><span className="pb-1 text-ink-300">square feet</span></div><p className="mt-2 text-sm text-ink-300">{displayNumber(sqM,3)} square metres</p></div><div className="flex flex-wrap gap-2"><ActionButton onClick={saveCalculation} disabled={!hasValue} primary icon={<BookmarkPlus size={17}/>} label="Save"/><ActionButton onClick={()=>onVisualize(sqFt)} disabled={!hasValue} icon={<ExternalLink size={17}/>} label="Planner"/><ActionButton onClick={speak} disabled={!hasValue} icon={<Volume2 size={17}/>} label="Listen"/><ActionButton onClick={share} disabled={!hasValue} icon={<Share2 size={17}/>} label="Share"/><ActionButton onClick={copySummary} disabled={!hasValue} icon={copied?<Check size={17}/>:<Copy size={17}/>} label={copied?'Copied':'Copy'}/></div></div><div className="grid gap-px bg-white/10 md:grid-cols-2"><BreakdownCard title="Hill breakdown" compact={formatHills(sqFt)} words={formatHillsWords(sqFt)}/><BreakdownCard title="Terai breakdown" compact={formatTerai(sqFt)} words={formatTeraiWords(sqFt)}/></div></section><section className="panel overflow-hidden"><div className="panel-header flex items-center justify-between gap-3"><div><p className="section-title">2. All converted units</p><p className="section-copy">Every individual equivalent updates live.</p></div><button type="button" onClick={()=>setNepaliDigits((value)=>!value)} className="button-secondary focus-ring !min-h-9 !px-3">{nepaliDigits?'123':'१२३'}</button></div><div className="grid gap-px bg-paper-200 lg:grid-cols-3"><ConversionGroup title="Hill system" items={groups.hill} display={displayNumber}/><ConversionGroup title="Terai system" items={groups.terai} display={displayNumber}/><ConversionGroup title="Standard units" items={groups.standard} display={displayNumber}/></div></section><div className="rounded-xl border border-saffron-200 bg-saffron-50 px-4 py-3 text-xs leading-5 text-ink-600"><Sparkles size={15} className="mr-2 inline"/>Conversions are exact mathematical relationships. Legal area and boundaries must come from official records.</div></main></section></div>;
};

const AreaField=({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void})=><label className="block"><span className="field-label capitalize">{label}</span><input inputMode="decimal" value={value} onChange={(event)=>onChange(event.target.value)} className="field numeral text-center text-xl font-semibold"/></label>;
const ModeButton=({active,label,onClick}:{active:boolean;label:string;onClick:()=>void})=><button type="button" role="tab" aria-selected={active} onClick={onClick} className={`focus-ring rounded-lg px-2 py-2.5 text-xs font-semibold transition ${active?'bg-white text-ink-950 shadow-sm':'text-ink-500 hover:bg-white'}`}>{label}</button>;
const BreakdownCard=({title,compact,words}:{title:string;compact:string;words:string})=><div className="bg-ink-900 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-300">{title}</p><p className="numeral mt-2 text-2xl font-semibold text-white">{compact}</p><p className="mt-2 text-xs leading-5 text-ink-300">{words}</p></div>;
const ConversionGroup=({title,items,display}:{title:string;items:ConversionItem[];display:(value:number,decimals?:number)=>string})=><section className="bg-white p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-leaf-700">{title}</p><dl className="mt-4 divide-y divide-paper-200">{items.map((item)=><div key={item.id} className="flex items-baseline justify-between gap-4 py-3"><dt className="text-sm text-ink-600">{item.label}</dt><dd className="numeral text-right font-semibold text-ink-950">{display(item.value,item.decimals)} <span className="text-xs text-ink-400">{item.shortLabel}</span></dd></div>)}</dl></section>;
const ActionButton=({onClick,disabled,icon,label,primary=false}:{onClick:()=>void;disabled:boolean;icon:ReactNode;label:string;primary?:boolean})=><button type="button" onClick={onClick} disabled={disabled} className={`focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold disabled:opacity-35 ${primary?'bg-white text-ink-950':'border border-white/15 bg-white/5 text-white hover:bg-white/10'}`}>{icon}{label}</button>;
export default ConvertScreen;

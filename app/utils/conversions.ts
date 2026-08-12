import { SQ_FT_PER_SQ_M, UNITS } from '../constants';
import { Point } from '../types';

export interface HillsInput { ropani:number;aana:number;paisa:number;daam:number; }
export interface TeraiInput { bigha:number;kattha:number;dhur:number; }
export interface ParsedArea { sqFt:number;recognized:boolean;interpretation:string;matchedUnits:string[]; }
const EPSILON=1e-9;
const NEPALI_DIGITS:Record<string,string>={'०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9'};
const nepaliUi=()=>typeof document!=='undefined'&&document.documentElement.lang==='ne';
const UNIT_LABELS:Record<string,{en:string;ne:string}>={ROPANI:{en:'Ropani',ne:'रोपनी'},AANA:{en:'Aana',ne:'आना'},PAISA:{en:'Paisa',ne:'पैसा'},DAAM:{en:'Daam',ne:'दाम'},BIGHA:{en:'Bigha',ne:'बिघा'},KATTHA:{en:'Kattha',ne:'कठ्ठा'},DHUR:{en:'Dhur',ne:'धुर'},SQFT:{en:'Square feet',ne:'वर्ग फिट'},SQM:{en:'Square metres',ne:'वर्ग मिटर'},SQYD:{en:'Square yards',ne:'वर्ग गज'},ACRE:{en:'Acres',ne:'एकर'},HECTARE:{en:'Hectares',ne:'हेक्टर'}};
const unitLabel=(id:string)=>UNIT_LABELS[id]?.[nepaliUi()?'ne':'en']??UNITS[id]?.name??id;

export const normalizeDigits=(value:string):string=>value.replace(/[०-९]/g,digit=>NEPALI_DIGITS[digit]??digit);
export const toSqFt=(value:number,unitId:string):number=>!Number.isFinite(value)||value<0?0:value*(UNITS[unitId]?.sqFtFactor??1);
export const fromSqFt=(sqFt:number,unitId:string):number=>!Number.isFinite(sqFt)||sqFt<0?0:sqFt/(UNITS[unitId]?.sqFtFactor??1);
export const hillsToSqFt=({ropani,aana,paisa,daam}:HillsInput):number=>toSqFt(ropani,'ROPANI')+toSqFt(aana,'AANA')+toSqFt(paisa,'PAISA')+toSqFt(daam,'DAAM');
export const teraiToSqFt=({bigha,kattha,dhur}:TeraiInput):number=>toSqFt(bigha,'BIGHA')+toSqFt(kattha,'KATTHA')+toSqFt(dhur,'DHUR');
export const toSqM=(sqFt:number):number=>sqFt/SQ_FT_PER_SQ_M;
export const parseAreaInput=(value:string):number=>{const normalized=normalizeDigits(value).replace(/,/g,'').trim();if(!normalized)return 0;const parsed=Number(normalized);return Number.isFinite(parsed)&&parsed>=0?parsed:0;};

const UNIT_ALIASES:Array<{id:string;label:string;aliases:string[]}>= [
  {id:'ROPANI',label:'Ropani',aliases:['ropani','rop','रोपनी']},{id:'AANA',label:'Aana',aliases:['aana','ana','आना']},{id:'PAISA',label:'Paisa',aliases:['paisa','पैसा']},{id:'DAAM',label:'Daam',aliases:['daam','dam','दाम']},{id:'BIGHA',label:'Bigha',aliases:['bigha','biga','बिघा']},{id:'KATTHA',label:'Kattha',aliases:['kattha','katha','कट्ठा','कठ्ठा']},{id:'DHUR',label:'Dhur',aliases:['dhur','धुर']},{id:'SQFT',label:'Square feet',aliases:['sq ft','sqft','square feet','square foot','ft2','ft²','वर्ग फिट']},{id:'SQM',label:'Square metres',aliases:['sq m','sqm','square metre','square meter','square metres','square meters','m2','m²','वर्ग मिटर']},{id:'SQYD',label:'Square yards',aliases:['sq yd','sqyd','square yard','square yards','yd2','yd²','वर्ग गज']},{id:'ACRE',label:'Acres',aliases:['acre','acres','एकर']},{id:'HECTARE',label:'Hectares',aliases:['hectare','hectares','ha','हेक्टर']},
];
const escapeRegExp=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export const parseSmartArea=(raw:string):ParsedArea=>{
  const ne=nepaliUi();const text=normalizeDigits(raw).toLowerCase().replace(/,/g,'').replace(/–|—/g,'-').trim();
  if(!text)return{sqFt:0,recognized:false,interpretation:ne?'सुरु गर्न क्षेत्रफल लेख्नुहोस्।':'Enter an area to begin.',matchedUnits:[]};
  const compact=text.match(/^\s*(\d+(?:\.\d+)?)\s*[-/]\s*(\d+(?:\.\d+)?)\s*[-/]\s*(\d+(?:\.\d+)?)(?:\s*[-/]\s*(\d+(?:\.\d+)?))?\s*$/);
  if(compact){const values=compact.slice(1).filter(Boolean).map(Number);if(values.length===4){const sqFt=hillsToSqFt({ropani:values[0],aana:values[1],paisa:values[2],daam:values[3]});return{sqFt,recognized:true,interpretation:`${values[0]} ${unitLabel('ROPANI')} · ${values[1]} ${unitLabel('AANA')} · ${values[2]} ${unitLabel('PAISA')} · ${values[3]} ${unitLabel('DAAM')}`,matchedUnits:['ROPANI','AANA','PAISA','DAAM']};}const sqFt=teraiToSqFt({bigha:values[0],kattha:values[1],dhur:values[2]});return{sqFt,recognized:true,interpretation:`${values[0]} ${unitLabel('BIGHA')} · ${values[1]} ${unitLabel('KATTHA')} · ${values[2]} ${unitLabel('DHUR')}`,matchedUnits:['BIGHA','KATTHA','DHUR']};}
  let sqFt=0;const parts:string[]=[];const matchedUnits:string[]=[];
  for(const unit of UNIT_ALIASES){const aliases=[...unit.aliases].sort((a,b)=>b.length-a.length).map(escapeRegExp).join('|');const expression=new RegExp(`(-?\\d+(?:\\.\\d+)?)\\s*(?:${aliases})(?![a-z])`,'gi');let match:RegExpExecArray|null;while((match=expression.exec(text))){const amount=Number(match[1]);if(Number.isFinite(amount)&&amount>=0){sqFt+=toSqFt(amount,unit.id);parts.push(`${amount} ${unitLabel(unit.id)}`);matchedUnits.push(unit.id);}}}
  if(parts.length)return{sqFt,recognized:true,interpretation:parts.join(' + '),matchedUnits};
  const numberOnly=Number(text);if(Number.isFinite(numberOnly)&&numberOnly>=0)return{sqFt:numberOnly,recognized:true,interpretation:ne?`${numberOnly} वर्ग फिट (पूर्वनिर्धारित)`:`${numberOnly} square feet (default)`,matchedUnits:['SQFT']};
  return{sqFt:0,recognized:false,interpretation:ne?'एकाइ पहिचान गर्न सकिएन। “१ रोपनी २ आना”, “२ कठ्ठा ५ धुर”, “५०० m²” वा “१-२-०-०” प्रयास गर्नुहोस्।':'Could not identify the units. Try “1 ropani 2 aana”, “2 kattha 5 dhur”, “500 m²”, or “1-2-0-0”.',matchedUnits:[]};
};

export const formatDecimal=(value:number,decimals=2):string=>new Intl.NumberFormat(nepaliUi()?'ne-NP':'en-US',{maximumFractionDigits:decimals,minimumFractionDigits:0}).format(Number.isFinite(value)?value:0);
export const formatNepaliNumber=(value:number,decimals=2):string=>new Intl.NumberFormat('ne-NP',{maximumFractionDigits:decimals,minimumFractionDigits:0}).format(Number.isFinite(value)?value:0);
const cleanRemainder=(value:number):number=>Math.max(0,Math.abs(value-Math.round(value))<EPSILON?Math.round(value):value);
export const getHillsBreakdown=(sqFt:number)=>{let remainingDaam=Math.max(0,sqFt)/UNITS.DAAM.sqFtFactor;const ropani=Math.floor((remainingDaam+EPSILON)/256);remainingDaam-=ropani*256;const aana=Math.floor((remainingDaam+EPSILON)/16);remainingDaam-=aana*16;const paisa=Math.floor((remainingDaam+EPSILON)/4);const daam=cleanRemainder(remainingDaam-paisa*4);return{ropani,aana,paisa,daam};};
export const getTeraiBreakdown=(sqFt:number)=>{let remainingDhur=Math.max(0,sqFt)/UNITS.DHUR.sqFtFactor;const bigha=Math.floor((remainingDhur+EPSILON)/400);remainingDhur-=bigha*400;const kattha=Math.floor((remainingDhur+EPSILON)/20);const dhur=cleanRemainder(remainingDhur-kattha*20);return{bigha,kattha,dhur};};
export const formatHills=(sqFt:number):string=>{const v=getHillsBreakdown(sqFt);return`${formatDecimal(v.ropani,0)}-${formatDecimal(v.aana,0)}-${formatDecimal(v.paisa,0)}-${formatDecimal(v.daam,3)}`;};
export const formatTerai=(sqFt:number):string=>{const v=getTeraiBreakdown(sqFt);return`${formatDecimal(v.bigha,0)}-${formatDecimal(v.kattha,0)}-${formatDecimal(v.dhur,3)}`;};
export const formatHillsWords=(sqFt:number):string=>{const v=getHillsBreakdown(sqFt);return`${formatDecimal(v.ropani,0)} ${unitLabel('ROPANI')} · ${formatDecimal(v.aana,0)} ${unitLabel('AANA')} · ${formatDecimal(v.paisa,0)} ${unitLabel('PAISA')} · ${formatDecimal(v.daam,3)} ${unitLabel('DAAM')}`;};
export const formatTeraiWords=(sqFt:number):string=>{const v=getTeraiBreakdown(sqFt);return`${formatDecimal(v.bigha,0)} ${unitLabel('BIGHA')} · ${formatDecimal(v.kattha,0)} ${unitLabel('KATTHA')} · ${formatDecimal(v.dhur,3)} ${unitLabel('DHUR')}`;};
export const getAllConversions=(sqFt:number)=>Object.values(UNITS).map(unit=>({id:unit.id,label:unitLabel(unit.id),value:fromSqFt(sqFt,unit.id),suffix:unit.shortName}));

export const calculatePolygonAreaPx=(points:Point[]):number=>{if(points.length<3)return 0;let area=0;for(let index=0;index<points.length;index+=1){const nextIndex=(index+1)%points.length;area+=points[index].x*points[nextIndex].y-points[nextIndex].x*points[index].y;}return Math.abs(area/2);};
export const calculatePolygonPerimeterPx=(points:Point[]):number=>points.length<2?0:points.reduce((total,point,index)=>total+distance(point,points[(index+1)%points.length]),0);
export const distance=(first:Point,second:Point):number=>Math.hypot(second.x-first.x,second.y-first.y);
const orientation=(a:Point,b:Point,c:Point):number=>Math.sign((b.y-a.y)*(c.x-b.x)-(b.x-a.x)*(c.y-b.y));
const onSegment=(a:Point,b:Point,c:Point):boolean=>b.x<=Math.max(a.x,c.x)+EPSILON&&b.x+EPSILON>=Math.min(a.x,c.x)&&b.y<=Math.max(a.y,c.y)+EPSILON&&b.y+EPSILON>=Math.min(a.y,c.y);
const segmentsIntersect=(a:Point,b:Point,c:Point,d:Point):boolean=>{const o1=orientation(a,b,c),o2=orientation(a,b,d),o3=orientation(c,d,a),o4=orientation(c,d,b);if(o1!==o2&&o3!==o4)return true;return(o1===0&&onSegment(a,c,b))||(o2===0&&onSegment(a,d,b))||(o3===0&&onSegment(c,a,d))||(o4===0&&onSegment(c,b,d));};
export const polygonSelfIntersects=(points:Point[]):boolean=>{if(points.length<4)return false;for(let first=0;first<points.length;first+=1){const firstNext=(first+1)%points.length;for(let second=first+1;second<points.length;second+=1){const secondNext=(second+1)%points.length;if(first===second||firstNext===second||secondNext===first)continue;if(first===0&&secondNext===0)continue;if(segmentsIntersect(points[first],points[firstNext],points[second],points[secondNext]))return true;}}return false;};

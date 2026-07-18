import { BookOpen, Calculator, MapPinned, ShieldCheck } from 'lucide-react';
import { CONVERSION_REFERENCE } from '../constants';

const LearnScreen = () => <div className="page-shell animate-enter !max-w-[86rem]">
  <header className="page-header max-w-4xl">
    <p className="eyebrow">Learn · सिक्नुहोस्</p>
    <h1 className="page-title">Understand Nepal land units before using the numbers.</h1>
    <p className="page-copy">Simple English and नेपाली explanations for families, students, buyers, sellers, and anyone who reasonably refuses to memorize three measurement systems.</p>
  </header>

  <section className="grid gap-4 md:grid-cols-3">
    <Card icon={Calculator} title="Hill system · पहाडी प्रणाली" text="Ropani, Aana, Paisa, and Daam are commonly used in Nepal's hill regions. A larger unit can be written as smaller parts, such as 1 Ropani = 16 Aana." />
    <Card icon={MapPinned} title="Terai system · तराई प्रणाली" text="Bigha, Kattha, and Dhur are commonly used in the Terai. The same plot can also be expressed in square feet or square metres." />
    <Card icon={ShieldCheck} title="Estimate versus survey · अनुमान र नापी" text="Conversions are mathematical. Image and GPS measurements are estimates. Official boundaries and ownership must come from cadastral records and qualified professionals." />
  </section>

  <section className="panel mt-6 overflow-hidden">
    <div className="panel-header"><div className="flex items-center gap-3"><BookOpen className="text-leaf-700" size={20}/><div><p className="section-title">Core relationships</p><p className="section-copy">These square-foot relationships are the calculation base used throughout Napiyo.</p></div></div></div>
    <div className="divide-y divide-paper-200">{CONVERSION_REFERENCE.rates.map((rate) => <div key={rate.unit} className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:items-center sm:px-6"><strong className="text-sm text-ink-950">{rate.unit}</strong><span className="text-sm leading-6 text-ink-600">{rate.relation}</span></div>)}</div>
  </section>

  <section className="mt-6 grid gap-4 lg:grid-cols-2">
    <Guide title="How to convert · कसरी रूपान्तरण गर्ने" steps={['Open Convert and type what you know, for example “1 ropani 4 aana” or “२ कट्ठा ५ धुर”.','Check the “Interpreted as” message before trusting the result.','Copy, speak, save, or open the result in the planner.']} />
    <Guide title="How to measure · कसरी नाप्ने" steps={['Use Image Measure when you have a clear top-down screenshot and one known distance.','Use Field GPS outdoors and record each corner only when the accuracy reading is acceptable.','Treat both methods as planning estimates and confirm important decisions professionally.']} />
  </section>
</div>;

const Card = ({ icon: Icon, title, text }: { icon: typeof Calculator; title: string; text: string }) => <article className="panel p-5 sm:p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700"><Icon size={20}/></span><h2 className="mt-4 text-lg font-semibold text-ink-950">{title}</h2><p className="mt-2 text-sm leading-6 text-ink-600">{text}</p></article>;
const Guide = ({ title, steps }: { title: string; steps: string[] }) => <section className="panel p-5 sm:p-6"><h2 className="section-title">{title}</h2><ol className="mt-4 space-y-3">{steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-ink-600"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-950 text-xs font-bold text-white">{index + 1}</span><span>{step}</span></li>)}</ol></section>;

export default LearnScreen;

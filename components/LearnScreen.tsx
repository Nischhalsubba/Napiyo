import { BookOpen, Calculator, MapPinned, ShieldCheck } from 'lucide-react';
import { CONVERSION_REFERENCE } from '../constants';
import { useAppLanguage } from '../utils/useAppLanguage';

const nepaliRates = [
  { unit: '१ रोपनी', relation: '१६ आना · ५,४७६ वर्ग फिट · करिब ५०८.७४ वर्ग मिटर' },
  { unit: '१ आना', relation: '४ पैसा · ३४२.२५ वर्ग फिट · करिब ३१.८० वर्ग मिटर' },
  { unit: '१ पैसा', relation: '४ दाम · ८५.५६२५ वर्ग फिट · करिब ७.९५ वर्ग मिटर' },
  { unit: '१ दाम', relation: '२१.३९०६२५ वर्ग फिट · करिब १.९९ वर्ग मिटर' },
  { unit: '१ बिघा', relation: '२० कठ्ठा · ४०० धुर · ७२,९०० वर्ग फिट · करिब ६,७७२.६३ वर्ग मिटर' },
  { unit: '१ कठ्ठा', relation: '२० धुर · ३,६४५ वर्ग फिट · करिब ३३८.६३ वर्ग मिटर' },
  { unit: '१ धुर', relation: '१८२.२५ वर्ग फिट · करिब १६.९३ वर्ग मिटर' },
];

const LearnScreen = () => {
  const language = useAppLanguage();
  const ne = language === 'ne';
  const cards = ne ? [
    { icon: Calculator, title: 'पहाडी प्रणाली', text: 'रोपनी, आना, पैसा र दाम नेपालको पहाडी क्षेत्रमा प्रचलित छन्। उदाहरणका लागि १ रोपनी बराबर १६ आना हुन्छ।' },
    { icon: MapPinned, title: 'तराई प्रणाली', text: 'बिघा, कठ्ठा र धुर तराई क्षेत्रमा प्रचलित छन्। एउटै जग्गालाई वर्ग फिट वा वर्ग मिटरमा पनि देखाउन सकिन्छ।' },
    { icon: ShieldCheck, title: 'अनुमान र आधिकारिक नापी', text: 'एकाइ रूपान्तरण गणितीय हुन्छ। तस्बिर र GPS बाट गरिएको नाप अनुमान मात्र हो। आधिकारिक सिमाना र स्वामित्व नापी अभिलेखबाट पुष्टि गर्नुहोस्।' },
  ] : [
    { icon: Calculator, title: 'Hill system', text: 'Ropani, Aana, Paisa, and Daam are commonly used in Nepal’s hill regions. For example, 1 Ropani equals 16 Aana.' },
    { icon: MapPinned, title: 'Terai system', text: 'Bigha, Kattha, and Dhur are commonly used in the Terai. The same plot can also be expressed in square feet or square metres.' },
    { icon: ShieldCheck, title: 'Estimate versus survey', text: 'Unit conversions are mathematical. Image and GPS measurements are estimates. Confirm official boundaries and ownership through cadastral records.' },
  ];
  const guides = ne ? [
    { title: 'रूपान्तरण कसरी गर्ने', steps: ['रूपान्तरण खोल्नुहोस् र आफूलाई थाहा भएको क्षेत्रफल लेख्नुहोस्।', 'नतिजा प्रयोग गर्नुअघि “बुझिएको” सन्देश जाँच गर्नुहोस्।', 'नतिजा प्रतिलिपि, आवाजमा सुन्न, सुरक्षित गर्न वा योजनामा खोल्न सकिन्छ।'] },
    { title: 'जग्गा कसरी नाप्ने', steps: ['स्पष्ट माथिबाट खिचिएको तस्बिर र एउटा ज्ञात दूरी भए तस्बिर नाप प्रयोग गर्नुहोस्।', 'बाहिर GPS प्रयोग गर्दा सटीकता स्वीकार्य भएपछि मात्र प्रत्येक कुना सुरक्षित गर्नुहोस्।', 'दुवै विधिलाई योजना अनुमानका रूपमा मात्र प्रयोग गरी महत्त्वपूर्ण निर्णय आधिकारिक रूपमा पुष्टि गर्नुहोस्।'] },
  ] : [
    { title: 'How to convert', steps: ['Open Convert and enter the area you know.', 'Check the “Interpreted as” message before using the result.', 'Copy, listen to, save, or open the result in the planner.'] },
    { title: 'How to measure', steps: ['Use Image when you have a clear top-down screenshot and one known distance.', 'Use Field GPS outdoors and record each corner only when the accuracy is acceptable.', 'Treat both methods as planning estimates and confirm important decisions professionally.'] },
  ];
  const rates = ne ? nepaliRates : CONVERSION_REFERENCE.rates;

  return <div className="page-shell animate-enter !max-w-[86rem]">
    <header className="page-header max-w-4xl">
      <p className="eyebrow">{ne ? 'सिकाइ केन्द्र' : 'Learning centre'}</p>
      <h1 className="page-title">{ne ? 'नतिजा प्रयोग गर्नुअघि नेपालका जग्गा एकाइ बुझ्नुहोस्।' : 'Understand Nepal land units before using the numbers.'}</h1>
      <p className="page-copy">{ne ? 'परिवार, विद्यार्थी, खरिदकर्ता, विक्रेता र जग्गा एकाइ सजिलै बुझ्न चाहने सबैका लागि सरल नेपाली व्याख्या।' : 'Clear English explanations for families, students, buyers, sellers, and anyone who wants to understand Nepal’s land systems.'}</p>
    </header>
    <section className="grid gap-4 md:grid-cols-3">{cards.map(card => <Card key={card.title} {...card}/>)}</section>
    <section className="panel mt-6 overflow-hidden">
      <div className="panel-header"><div className="flex items-center gap-3"><BookOpen className="text-leaf-700" size={20}/><div><p className="section-title">{ne ? 'मुख्य सम्बन्धहरू' : 'Core relationships'}</p><p className="section-copy">{ne ? 'यी वर्ग फिट सम्बन्धहरू Napiyo का सबै गणनाको आधार हुन्।' : 'These square-foot relationships are the calculation base used throughout Napiyo.'}</p></div></div></div>
      <div className="divide-y divide-paper-200">{rates.map(rate => <div key={rate.unit} className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:items-center sm:px-6"><strong className="text-sm text-ink-950">{rate.unit}</strong><span className="text-sm leading-6 text-ink-600">{rate.relation}</span></div>)}</div>
    </section>
    <section className="mt-6 grid gap-4 lg:grid-cols-2">{guides.map(guide => <Guide key={guide.title} {...guide}/>)}</section>
  </div>;
};
const Card = ({ icon: Icon, title, text }: { icon: typeof Calculator; title: string; text: string }) => <article className="panel p-5 sm:p-6"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-leaf-50 text-leaf-700"><Icon size={20}/></span><h2 className="mt-4 text-lg font-semibold text-ink-950">{title}</h2><p className="mt-2 text-sm leading-6 text-ink-600">{text}</p></article>;
const Guide = ({ title, steps }: { title: string; steps: string[] }) => <section className="panel p-5 sm:p-6"><h2 className="section-title">{title}</h2><ol className="mt-4 space-y-3">{steps.map((step,index) => <li key={step} className="flex gap-3 text-sm leading-6 text-ink-600"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-950 text-xs font-bold text-white">{index+1}</span><span>{step}</span></li>)}</ol></section>;
export default LearnScreen;

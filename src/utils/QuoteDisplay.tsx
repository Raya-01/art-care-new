import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface QuoteDisplayProps {
  type?: 'welcome' | 'task_completion' | 'journal' | 'gallery' | 'login' | 'upload';
  className?: string;
}

interface QuoteType {
  text: string;
  author: string;
  category: string;
}

const C = {
  salmon: '#E88067', peach: '#FBBD96', cream: '#F9DDB8',
  sage: '#A3B995', mist: '#A8BBB9', forest: '#2C3E35', stone: '#5C6E6A',
  bgWarm: '#FAF5EF', border: '#F9DDB8',
};

const TinyFlower = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="2" fill="#FBBD96"/>
    <ellipse cx="7" cy="3.5" rx="1.5" ry="2" fill="#E88067" opacity="0.7"/>
    <ellipse cx="7" cy="10.5" rx="1.5" ry="2" fill="#E88067" opacity="0.7"/>
    <ellipse cx="3.5" cy="7" rx="2" ry="1.5" fill="#FCCAAB" opacity="0.7"/>
    <ellipse cx="10.5" cy="7" rx="2" ry="1.5" fill="#FCCAAB" opacity="0.7"/>
  </svg>
);

const quotes: Record<string, QuoteType[]> = {
  welcome: [
    { text: 'Изкуството е начинът да тичаш без да напускаш къщата.', author: 'Тери Пратчет', category: 'Творчество' },
    { text: 'Всяко дете е художник. Проблемът е как да остане художник, когато порасне.', author: 'Пабло Пикасо', category: 'Детство' },
    { text: 'Творчеството е лекарство за душата.', author: 'Аристотел', category: 'Целителство' },
    { text: 'Цветовете са усмивките на природата.', author: 'Лий Хънт', category: 'Природа' },
    { text: 'Рисувай всеки ден, дори само с молив в ума си.', author: 'Анонимен', category: 'Практика' },
    { text: 'Изкуството не се прави — то се открива.', author: 'Пол Сезан', category: 'Откритие' },
    { text: 'Вдъхновението съществува, но то трябва да те намери в работа.', author: 'Пикасо', category: 'Труд' },
    { text: 'Красотата е навсякъде — трябва само да спреш да гледаш и да започнеш да виждаш.', author: 'Матис', category: 'Красота' },
    { text: 'Изкуството е не това, което виждаш, а онова, което карате другите да видят.', author: 'Едгар Дега', category: 'Визия' },
    { text: 'Най-доброто лекарство за умората е нова страница с чист лист.', author: 'Анонимен', category: 'Начало' },
    { text: 'Само в тишината можем да чуем собствения си творчески глас.', author: 'Анонимен', category: 'Тишина' },
    { text: 'Линиите, цветовете и формите са езикът на душата.', author: 'Анонимен', category: 'Изразяване' },
    { text: 'Изкуството е мостът между онова, което е вътре, и онова, което е навън.', author: 'Аниш Капур', category: 'Мост' },
    { text: 'Не чакай перфектния момент. Вземи момента и го направи перфектен.', author: 'Анонимен', category: 'Действие' },
    { text: 'Рисуването е поезия, която се вижда.', author: 'Леонардо да Винчи', category: 'Поезия' },
    { text: 'Да рисуваш означава да обичаш отново.', author: 'Хенри Милър', category: 'Любов' },
    { text: 'Творчеството е разум, който се забавлява.', author: 'Алберт Айнщайн', category: 'Радост' },
    { text: 'Изкуството измива от душата праха на ежедневието.', author: 'Пикасо', category: 'Пречистване' },
    { text: 'Не е нужно да си художник, за да рисуваш. Достатъчно е да бъдеш.', author: 'ARTCARE', category: 'Присъствие' },
    { text: 'Всяка четка, всяка линия, всяка точка — те всички са ти.', author: 'ARTCARE', category: 'Идентичност' },
  ],
  task_completion: [
    { text: 'Малките стъпки всеки ден водят до големи промени.', author: 'Анонимен', category: 'Прогрес' },
    { text: 'Успехът е сумата от малките усилия, повтаряни всеки ден.', author: 'Робърт Колиър', category: 'Настойчивост' },
    { text: 'Всяко начало е трудно, но всяко завършено дело носи удовлетворение.', author: 'Анонимен', category: 'Завършеност' },
    { text: 'Творчеството се поражда от постоянство, не от вълшебство.', author: 'Туила Тарп', category: 'Творчество' },
    { text: 'Направихте го! Всяка завършена задача е тухла в сградата на себе си.', author: 'ARTCARE', category: 'Изграждане' },
    { text: 'Вие не просто завършихте задача — вие избрахте себе си.', author: 'ARTCARE', category: 'Избор' },
    { text: 'Последователността е тайното оръжие на всички велики художници.', author: 'Анонимен', category: 'Последователност' },
    { text: 'Браво! Уменията растат с всяка нова линия, която рисувате.', author: 'ARTCARE', category: 'Растеж' },
    { text: 'Дни като днес изграждат художника, когото ставате.', author: 'ARTCARE', category: 'Идентичност' },
    { text: 'Не спирайте. Следващото парче е най-доброто, което сте правили.', author: 'Анонимен', category: 'Мотивация' },
    { text: 'Рисувах лошо дълги години, преди да рисувам добре — и това е единственият начин.', author: 'Анонимен', category: 'Пътят' },
    { text: 'Всяко завършено произведение е доказателство, че сте по-силни от страха.', author: 'ARTCARE', category: 'Смелост' },
    { text: 'Перфектното е враг на готовото. Готовото е победа.', author: 'Волтер', category: 'Завършеност' },
    { text: 'Красива работа! Вашата поредица расте с всеки изминал ден.', author: 'ARTCARE', category: 'Поредица' },
    { text: 'Изкуството изисква смелост — и вие го доказахте днес.', author: 'Матис', category: 'Смелост' },
    { text: 'Не е важно колко бавно вървите, стига да не спирате.', author: 'Конфуций', category: 'Постоянство' },
    { text: 'Денят, в който рисувате, никога не е изгубен.', author: 'ARTCARE', category: 'Стойност' },
    { text: 'Браво! Дори лошата рисунка е по-добра от никаква рисунка.', author: 'Анонимен', category: 'Начало' },
  ],
  journal: [
    { text: 'Написването на мислите е разговор със собствената си душа.', author: 'Анонимен', category: 'Рефлексия' },
    { text: 'Дневникът е огледало на сърцето.', author: 'Мери Фолей', category: 'Самопознание' },
    { text: 'Думата е мост между миналото и бъдещето.', author: 'Анонимен', category: 'Време' },
    { text: 'Пиши без страх, без съдия, без спиране.', author: 'ARTCARE', category: 'Свобода' },
    { text: 'Дневникът не ви съди. Той само слуша.', author: 'ARTCARE', category: 'Безопасност' },
    { text: 'Онова, което не можем да кажем, можем да напишем.', author: 'Анонимен', category: 'Изразяване' },
    { text: 'Пиши. Дори лошо. Дори хаотично. Пиши.', author: 'ARTCARE', category: 'Практика' },
    { text: 'В страниците на дневника живеят най-честните версии на себе си.', author: 'Анонимен', category: 'Честност' },
    { text: 'Всеки запис е мигновена снимка на един неповторим миг.', author: 'ARTCARE', category: 'Момент' },
    { text: 'Думите, написани за себе си, имат особена магия — те лекуват бавно и тихо.', author: 'ARTCARE', category: 'Лечение' },
    { text: 'Да пишеш е да подредиш хаоса.', author: 'Анонимен', category: 'Ред' },
    { text: 'Познай себе си чрез перото си.', author: 'Анонимен', category: 'Самопознание' },
    { text: 'Един запис на ден държи тъгата далеч.', author: 'ARTCARE', category: 'Грижа' },
    { text: 'Не пишеш за другите. Пишеш, за да се намериш.', author: 'ARTCARE', category: 'Себе си' },
    { text: 'Хартията търпи всичко — дай й всичко.', author: 'Анонимен', category: 'Откровеност' },
  ],
  gallery: [
    { text: 'Всяко произведение на изкуството е отпечатък от сърцето на художника.', author: 'Анонимен', category: 'Емоция' },
    { text: 'Изкуството не се копира, се чувства.', author: 'Винсент ван Гог', category: 'Израз' },
    { text: 'Галерията е място, където спомените стават вечни.', author: 'Анонимен', category: 'Спомен' },
    { text: 'Всяка творба разказва история, дори когато авторът мълчи.', author: 'ARTCARE', category: 'Разказване' },
    { text: 'Колекцията ти расте — расте и ти.', author: 'ARTCARE', category: 'Растеж' },
    { text: 'Красотата на изкуството е, че то остава.', author: 'Анонимен', category: 'Вечност' },
    { text: 'Всяка картина е документ за един ден от живота ти.', author: 'ARTCARE', category: 'Памет' },
    { text: 'Не е нужно да е съвършено, за да е прекрасно.', author: 'ARTCARE', category: 'Приемане' },
    { text: 'Качи творбата. Тя заслужава да бъде видяна.', author: 'ARTCARE', category: 'Споделяне' },
  ],
  upload: [
    { text: 'Новата творба е на правилното място. Добре дошла в галерията.', author: 'ARTCARE', category: 'Добре дошла' },
    { text: 'Всяка добавена творба е доказателство за вашето присъствие днес.', author: 'ARTCARE', category: 'Присъствие' },
    { text: 'Вашата колекция расте. Расте и вашият художнически глас.', author: 'ARTCARE', category: 'Растеж' },
    { text: 'Прекрасно! Тази творба вече е записана завинаги.', author: 'ARTCARE', category: 'Завинаги' },
    { text: 'Не всяка творба е шедьовър, но всяка е стъпка напред.', author: 'Анонимен', category: 'Прогрес' },
  ],
  login: [
    { text: 'Добре дошли обратно! Вашето творческо пътуване ви очаква.', author: 'ARTCARE', category: 'Посрещане' },
    { text: 'Радваме се да ви видим отново. Какво ще създадете днес?', author: 'ARTCARE', category: 'Творчество' },
    { text: 'Всяко посещение е нов шанс за откритие.', author: 'ARTCARE', category: 'Възможност' },
    { text: 'Тук е вашето пространство. Влезте и се почувствайте у дома.', author: 'ARTCARE', category: 'Дом' },
    { text: 'Добре дошли обратно. Четката чака.', author: 'ARTCARE', category: 'Готовност' },
  ],
};

const getRandom = (type: string): QuoteType => {
  const pool = quotes[type] || quotes.welcome;
  return pool[Math.floor(Math.random() * pool.length)];
};

/* ─────────────────────────────────────────────────────────────────
   This component renders differently based on context:
   - type="welcome"  → full elegant card for Home page
   - everything else → small inline italic bubble
───────────────────────────────────────────────────────────────── */
const QuoteDisplay: React.FC<QuoteDisplayProps> = ({ type = 'welcome', className = '' }) => {
  const [q, setQ]     = useState<QuoteType>(() => getRandom(type));
  const [vis, setVis] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVis(false);
      setTimeout(() => { setQ(getRandom(type)); setVis(true); }, 350);
    }, 9000);
    return () => clearInterval(id);
  }, [type]);

  const refresh = () => {
    setVis(false);
    setTimeout(() => { setQ(getRandom(type)); setVis(true); }, 300);
  };

  const isHome = type === 'welcome';

  /* ── HOME PAGE: full botanical quote card ── */
  if (isHome) {
    return (
      <div className={className}>
        <style>{`
          @keyframes quoteFlow { 0%,100%{background-position:0%} 50%{background-position:100%} }
          @keyframes quoteFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
          @keyframes qSway { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
          .q-home-rainbow {
            height:2px; border-radius:999px;
            background:linear-gradient(90deg,transparent,#E88067,#FBBD96,#F9DDB8,#A3B995,transparent);
            background-size:200% 100%;
            animation:quoteFlow 6s ease infinite;
          }
          .q-visible { animation:quoteFadeIn .45s ease both; }
          .q-hidden  { opacity:0; transform:translateY(6px); transition:all .3s; }
          .q-sway-l  { animation:qSway 5s ease-in-out infinite;    display:inline-block; transform-origin:bottom center; }
          .q-sway-r  { animation:qSway 5s ease-in-out infinite .7s;display:inline-block; transform-origin:bottom center; }
          .q-refresh { transition:transform .2s,background .18s,color .18s; }
          .q-refresh:hover { transform:rotate(30deg) scale(1.1); background:#FFF0EB !important; color:#E88067 !important; }
        `}</style>

        <div style={{ background:'white', borderRadius:24, border:`1px solid ${C.border}`, boxShadow:'0 3px 14px rgba(44,62,53,0.07)', overflow:'hidden', position:'relative' }}>
          {/* thin rainbow stripe */}
          <div className="q-home-rainbow"/>

          <div style={{ padding:'22px 26px' }}>
            {/* header row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span className="q-sway-l"><TinyFlower/></span>
                <span style={{ fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.16em', color:C.mist }}>
                  {q.category}
                </span>
                <span className="q-sway-r"><TinyFlower/></span>
              </div>
              <button onClick={refresh}
                className="q-refresh"
                style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.border}`, background:C.bgWarm, color:C.mist, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <RefreshCw size={12}/>
              </button>
            </div>

            {/* quote text */}
            <div className={vis ? 'q-visible' : 'q-hidden'}>
              <blockquote style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'clamp(1rem,2.2vw,1.25rem)', fontWeight:700, color:C.forest, lineHeight:1.65, margin:'0 0 12px', padding:0, borderLeft:`3px solid ${C.peach}`, paddingLeft:14 }}>
                "{q.text}"
              </blockquote>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.peach},transparent)` }}/>
                <cite style={{ fontSize:'0.76rem', fontWeight:700, color:C.stone, fontStyle:'normal' }}>— {q.author}</cite>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── ALL OTHER CONTEXTS: tiny inline italic bubble ── */
  return (
    <div className={`${className} ${vis ? '' : 'opacity-0'}`}
      style={{ transition:'opacity .3s', fontSize:'0.78rem', fontStyle:'italic', color:C.stone, lineHeight:1.6 }}>
      <span style={{ fontFamily:"'Cormorant Garamond',serif" }}>"{q.text}"</span>
      <span style={{ display:'block', marginTop:4, fontSize:'0.68rem', fontWeight:700, color:C.mist, fontStyle:'normal' }}>
        — {q.author}
      </span>
    </div>
  );
};

export default QuoteDisplay;
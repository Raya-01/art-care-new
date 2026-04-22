export interface Task {
  id: string;
  text: string;
  completed: boolean;
  isCustom?: boolean;
  category: string;
  duration?: string;
}

const taskPool: Omit<Task, 'id' | 'completed'>[] = [
  /* ── Drawing ── */
  { text: 'Нарисувайте нещо, което ви прави щастлив/а', category: 'Рисуване', duration: '15 мин' },
  { text: 'Нарисувайте с недоминантната си ръка', category: 'Рисуване', duration: '10 мин' },
  { text: 'Нарисувайте автопортрет само с линии, без изтриване', category: 'Рисуване', duration: '20 мин' },
  { text: 'Направете скица на пейзаж от спомен', category: 'Рисуване', duration: '15 мин' },
  { text: 'Нарисувайте емоция без да използвате лица или фигури', category: 'Рисуване', duration: '15 мин' },
  { text: 'Нарисувайте вашите ръце от натура', category: 'Рисуване', duration: '20 мин' },
  { text: 'Нарисувайте животно само с геометрични форми', category: 'Рисуване', duration: '15 мин' },
  { text: 'Направете скица на обект от кухнята с 30 линии максимум', category: 'Рисуване', duration: '10 мин' },
  { text: 'Нарисувайте дърво в четирите сезона на един лист', category: 'Рисуване', duration: '25 мин' },
  { text: 'Нарисувайте вашия прозорец и видът от него', category: 'Рисуване', duration: '20 мин' },
  { text: 'Нарисувайте портрет на любим човек по памет', category: 'Рисуване', duration: '20 мин' },
  { text: 'Нарисувайте нещо много малко — увеличено 10 пъти', category: 'Рисуване', duration: '15 мин' },
  { text: 'Нарисувайте вятъра — само с линии', category: 'Рисуване', duration: '10 мин' },
  { text: 'Нарисувайте сянката на предмет без самия предмет', category: 'Рисуване', duration: '15 мин' },
  { text: 'Нарисувайте нещо с очи, затворени само с чувство', category: 'Рисуване', duration: '10 мин' },

  /* ── Colour & Painting ── */
  { text: 'Създайте рисунка само с три цвята', category: 'Цвят', duration: '20 мин' },
  { text: 'Нарисувайте с кафе или чай като боя', category: 'Цвят', duration: '20 мин' },
  { text: 'Нарисувайте с пръсти — без четки', category: 'Цвят', duration: '15 мин' },
  { text: 'Създайте цветова палитра на вашето настроение днес', category: 'Цвят', duration: '10 мин' },
  { text: 'Нарисувайте залез с акварел или акварелни моливи', category: 'Цвят', duration: '25 мин' },
  { text: 'Направете монохромна рисунка само в нюанси на един цвят', category: 'Цвят', duration: '20 мин' },
  { text: 'Нарисувайте дъга в 10 различни стила на един лист', category: 'Цвят', duration: '20 мин' },
  { text: 'Създайте текстура с четка и различни натиски', category: 'Цвят', duration: '15 мин' },
  { text: 'Оцветете стара скица с неочаквани цветове', category: 'Цвят', duration: '15 мин' },

  /* ── Abstract & Experimental ── */
  { text: 'Създайте абстрактна рисунка под музика', category: 'Абстрактно', duration: '15 мин' },
  { text: 'Нарисувайте само с точки — пойнтилизъм', category: 'Абстрактно', duration: '20 мин' },
  { text: 'Създайте рисунка само с прави линии', category: 'Абстрактно', duration: '15 мин' },
  { text: 'Направете рисунка с хаотични движения на ръката', category: 'Абстрактно', duration: '10 мин' },
  { text: 'Нарисувайте звук — как изглежда музика на хартия?', category: 'Абстрактно', duration: '15 мин' },
  { text: 'Направете рисунка само с кръгове и спирали', category: 'Абстрактно', duration: '15 мин' },
  { text: 'Нарисувайте нещо, което не съществува в реалността', category: 'Абстрактно', duration: '20 мин' },
  { text: 'Създайте текстурна рисунка с различни материали под хартия', category: 'Абстрактно', duration: '15 мин' },

  /* ── Meditative ── */
  { text: 'Създайте мандала — следвайте симетрията', category: 'Медитация', duration: '30 мин' },
  { text: 'Нарисувайте зен-дудъл — изпълнете форма с шарки', category: 'Медитация', duration: '25 мин' },
  { text: 'Направете повтарящ се шаблон от природни форми', category: 'Медитация', duration: '20 мин' },
  { text: 'Нарисувайте 100 малки цветчета на един лист', category: 'Медитация', duration: '25 мин' },
  { text: 'Нарисувайте лабиринт и го оцветете слой по слой', category: 'Медитация', duration: '20 мин' },

  /* ── Illustration & Narrative ── */
  { text: 'Илюстрирайте любима си приказка в 3 кадъра', category: 'Илюстрация', duration: '25 мин' },
  { text: 'Илюстрирайте мечта от тази нощ', category: 'Илюстрация', duration: '20 мин' },
  { text: 'Илюстрирайте любима песен', category: 'Илюстрация', duration: '20 мин' },
  { text: 'Нарисувайте животно като човек в определена роля', category: 'Илюстрация', duration: '20 мин' },
  { text: 'Илюстрирайте детски спомен', category: 'Илюстрация', duration: '20 мин' },
  { text: 'Нарисувайте измислен архитектурен обект', category: 'Илюстрация', duration: '20 мин' },
  { text: 'Илюстрирайте любима цитата — текст + образ', category: 'Илюстрация', duration: '25 мин' },
  { text: 'Нарисувайте митологично същество в съвременна обстановка', category: 'Илюстрация', duration: '25 мин' },

  /* ── Collage & Mixed Media ── */
  { text: 'Създайте колаж от стари списания или хартии', category: 'Колаж', duration: '25 мин' },
  { text: 'Нарисувайте върху стара страница от книга', category: 'Колаж', duration: '15 мин' },
  { text: 'Направете колаж само от естествени материали — листа, цветя', category: 'Колаж', duration: '20 мин' },
  { text: 'Нарисувайте върху картонена кутия или опаковка', category: 'Колаж', duration: '15 мин' },
  { text: 'Направете книга-художник от 3 листа — сгънати и зашити', category: 'Колаж', duration: '30 мин' },

  /* ── Nature Studies ── */
  { text: 'Нарисувайте три различни листа от природата', category: 'Природа', duration: '20 мин' },
  { text: 'Нарисувайте цвете от натура — внимавайте за детайлите', category: 'Природа', duration: '25 мин' },
  { text: 'Нарисувайте облаците от прозореца в момента', category: 'Природа', duration: '10 мин' },
  { text: 'Направете ботанически скетч на домашно растение', category: 'Природа', duration: '20 мин' },
  { text: 'Нарисувайте промяната на светлината в стаята за 10 минути', category: 'Природа', duration: '10 мин' },

  /* ── Lettering & Pattern ── */
  { text: 'Напишете любима дума в декоративен стил — леттеринг', category: 'Леттеринг', duration: '15 мин' },
  { text: 'Създайте декоративна рамка от ботанически елементи', category: 'Леттеринг', duration: '20 мин' },
  { text: 'Напишете датата на днес в максимално декоративен вид', category: 'Леттеринг', duration: '10 мин' },
  { text: 'Нарисувайте азбуката — всяка буква като различно цвете', category: 'Леттеринг', duration: '30 мин' },

  /* ── Challenge / Creative Push ── */
  { text: 'Нарисувайте нещо за 5 минути без да вдигате молива', category: 'Предизвикателство', duration: '5 мин' },
  { text: 'Нарисувайте портрет само с едно непрекъснато движение', category: 'Предизвикателство', duration: '10 мин' },
  { text: 'Нарисувайте символ на вашата сила', category: 'Предизвикателство', duration: '15 мин' },
  { text: 'Направете съвременна интерпретация на известна класическа картина', category: 'Предизвикателство', duration: '25 мин' },
  { text: 'Нарисувайте себе си като герой от история', category: 'Предизвикателство', duration: '20 мин' },
  { text: 'Нарисувайте вашето идеално ателие или творческо пространство', category: 'Предизвикателство', duration: '20 мин' },
  { text: 'Нарисувайте нещо, от което се страхувате — направете го красиво', category: 'Предизвикателство', duration: '20 мин' },
  { text: 'Нарисувайте 9 миниатюри в мрежа 3×3 — свободна тема', category: 'Предизвикателство', duration: '25 мин' },
];

const getRandomTasks = (pool: Omit<Task, 'id' | 'completed'>[], count: number): Omit<Task, 'id' | 'completed'>[] => {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const generateDailyTasks = (): Task[] => {
  const today        = new Date().toDateString();
  const storedDate   = localStorage.getItem('artcare_last_task_date');
  const storedTasks  = localStorage.getItem('artcare_daily_tasks');

  if (storedDate === today && storedTasks) {
    return JSON.parse(storedTasks);
  }

  const randomTasks = getRandomTasks(taskPool, 10);
  const tasks: Task[] = randomTasks.map((task, index) => ({
    ...task,
    id: `daily-${Date.now()}-${index}`,
    completed: false,
  }));

  localStorage.setItem('artcare_daily_tasks', JSON.stringify(tasks));
  localStorage.setItem('artcare_last_task_date', today);

  return tasks;
};

export const resetDailyTasks = (): Task[] => {
  localStorage.removeItem('artcare_last_task_date');
  localStorage.removeItem('artcare_daily_tasks');
  return generateDailyTasks();
};

export const getTaskCategories = (): string[] => {
  const categories = new Set(taskPool.map(task => task.category));
  return Array.from(categories);
};

export const getTasksByCategory = (category: string): Omit<Task, 'id' | 'completed'>[] => {
  return taskPool.filter(task => task.category === category);
};
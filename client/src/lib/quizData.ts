// Quiz data for Urbanwood Hung Hom 2nd Anniversary POV Sensory Quiz
// Updated: 13 questions, 4 chapters, 3 traveller types
// Design: Retro Aviation × Boarding Pass Aesthetic

export type AnswerType = 'A' | 'B' | 'C';

export interface Question {
  id: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
  sensoryType: '視覺' | '聽覺' | '嗅覺' | '觸覺';
  questionType?: 'multiple-choice' | 'open-end';
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  scene: string;
  bgImage: string;
  questions: Question[];
}

export interface ResultType {
  id: 'A' | 'B' | 'C';
  name: string;
  nameEn: string;
  tagline: string;
  frequency: string;
  sensoryProfile: string;
  urbanwoodMatch: string;
  color: string;
  icon: string;
  boardingPassDestination: string;
  resultImage?: string; // optional custom result image URL
}

export const chapters: Chapter[] = [
  {
    id: 1,
    title: '第一章',
    subtitle: '晨喚與出發',
    scene: '城木酒店內',
    bgImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/chapter1-hotel-W29tWhgqFkjXHEeUGhXaPx.webp',
    questions: [
      {
        id: 1,
        text: '陽光穿透城木的窗簾，你第一時間會：',
        sensoryType: '視覺',
        options: {
          A: '靜靜欣賞光影在木紋地板上的變化',
          B: '拿起手機，搜尋附近有什麼好吃的早餐',
          C: '走到窗邊，拍一張俯瞰紅磡街景的照片',
        },
      },
      {
        id: 2,
        text: '在城木的大堂準備出發，吸引你目光的是：',
        sensoryType: '視覺',
        options: {
          A: '簡約木系設計帶來的寧靜氛圍',
          B: '前台職員熱情的早安問候',
          C: '牆上充滿設計感的藝術裝飾',
        },
      },
      {
        id: 3,
        text: '踏出酒店大門那一刻，撲面而來的空氣讓你覺得：',
        sensoryType: '嗅覺',
        options: {
          A: '帶點清晨的微涼與清新',
          B: '混雜著遠處茶餐廳飄來的麵包香',
          C: '充滿了準備探索新地方的期待感',
        },
      },
    ],
  },
  {
    id: 2,
    title: '第二章',
    subtitle: '舊街與煙火氣',
    scene: '紅磡舊區',
    bgImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/chapter2-street-6xHx8sb6kevxdCPb3sZazz.webp',
    questions: [
      {
        id: 4,
        text: '經過一間老字號冰室，最吸引你的氣味是：',
        sensoryType: '嗅覺',
        options: {
          A: '濃郁微澀的港式奶茶香',
          B: '剛出爐、熱騰騰的蛋撻牛油香',
          C: '鐵板上滋滋作響的黑椒汁香味',
        },
      },
      {
        id: 5,
        text: '抬頭看到一棟唐樓的外牆，你最留意的是：',
        sensoryType: '視覺',
        options: {
          A: '斑駁油漆留下的歲月痕跡',
          B: '窗邊晾曬著的色彩繽紛的衣服',
          C: '充滿幾何美感的復古花窗玻璃',
        },
      },
      {
        id: 6,
        text: '觀音廟飄出的檀香味，給你的感覺是：',
        sensoryType: '嗅覺',
        options: {
          A: '沉澱心靈，讓思緒平靜下來',
          B: '帶點神秘，充滿傳統文化的味道',
          C: '適合配上一段慢動作的 Reels 畫面',
        },
      },
      {
        id: 7,
        text: '在小巷中發現一間沒有招牌的隱世小店，你會：',
        sensoryType: '視覺',
        options: {
          A: '站在門外觀察一下它的裝潢風格',
          B: '毫不猶豫地推門進去看看有什麼好吃的',
          C: '先在 IG 搜尋一下這間店有沒有人打卡',
        },
      },
    ],
  },
  {
    id: 3,
    title: '第三章',
    subtitle: '海風與黃昏',
    scene: '紅磡新海濱',
    bgImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/chapter3-waterfront-iPfdaUQUxczMzsT66zKagV.webp',
    questions: [
      {
        id: 8,
        text: '來到紅磡海濱，迎面吹來的海風讓你覺得：',
        sensoryType: '觸覺',
        options: {
          A: '吹散了一天的疲憊，無比舒暢',
          B: '帶點海水的鹹味，是屬於城市的氣息',
          C: '剛好把頭髮吹起，很適合拍一段 Vlog',
        },
      },
      {
        id: 9,
        text: '聽著海浪拍打岸邊的聲音，你會聯想到：',
        sensoryType: '聽覺',
        options: {
          A: '一首節奏緩慢的輕音樂',
          B: '晚上去吃一頓豐盛海鮮大餐的衝動',
          C: '電影裡主角在海邊散步的浪漫場景',
        },
      },
      {
        id: 10,
        text: '夕陽把海面染成金黃色，這時你最想：',
        sensoryType: '視覺',
        options: {
          A: '找張長椅坐下，什麼都不做，只看日落',
          B: '買一罐冰凍的啤酒或汽水，邊喝邊看',
          C: '瘋狂連拍，捕捉光線最完美的一刻',
        },
      },
    ],
  },
  {
    id: 4,
    title: '第四章',
    subtitle: '夜歸與回味',
    scene: '回到城木酒店',
    bgImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/chapter4-night-JNRpkyYue4XpnfcaXbRsqz.webp',
    questions: [
      {
        id: 11,
        text: '結束一天的紅磡探索，晚上回到酒店房內，你最想做什麼？',
        sensoryType: '觸覺',
        options: {
          A: '泡一個熱水浴，然後在床上靜靜地看一本好書',
          B: '打開外賣 App，點一份宵夜，繼續今天的「吃」的任務',
          C: '整理今天拍的照片和影片，把最好看的一張照片和影片發到 IG',
        },
      },
      {
        id: 12,
        text: '睡前閉上眼睛，今天最讓你難忘的「紅磡氣味」是：',
        sensoryType: '嗅覺',
        options: {
          A: '觀音廟的檀香與海濱的微風',
          B: '冰室的奶茶香與街邊的雞蛋仔',
          C: '充滿新鮮感與未知的城市氣息',
        },
      },
      {
        id: 13,
        text: '如果要為今天的紅磡之旅選一首背景音樂，你會選：',
        sensoryType: '聽覺',
        options: {
          A: '一首沒有歌詞的治癒系純音樂',
          B: '一首節奏輕快、充滿活力的流行曲',
          C: '一首帶點復古感、適合做 Reels BGM 的歌',
        },
      },
    ],
  },
];

export const results: Record<AnswerType, ResultType> = {
  A: {
    id: 'A',
    name: '慢活旅人',
    nameEn: 'Slow Life Wanderer',
    tagline: '走得慢，感受得最深。',
    frequency: '慢調 · 治癒 · 深度',
    sensoryProfile: '你對聲音與氣味極度敏感。你不喜歡走馬看花，反而享受在觀音廟聞著檀香沉思，或在海濱聽著海浪聲發呆。每一個細節，都是你與城市對話的方式。',
    urbanwoodMatch: '城木酒店的木系簡約設計，正是你洗滌心靈的最佳避風港。在這裡，你能找到城市中最珍貴的寧靜。',
    color: '#7A9E8E',
    icon: '🕯️',
    boardingPassDestination: 'HUNG HOM · INNER PEACE',
  },
  B: {
    id: 'B',
    name: '街坊美食家',
    nameEn: 'Neighbourhood Gourmet',
    tagline: '最好的餐廳，從來沒有招牌。',
    frequency: '熱鬧 · 隨性 · 滿足',
    sensoryProfile: '你的旅行是由味蕾主導的！從冰室的奶茶香到街邊的雞蛋仔，紅磡的「煙火氣」是你最愛的城市味道。哪裡有美食，哪裡就有你的身影。',
    urbanwoodMatch: '住在城木，你就像擁有了紅磡美食的「任意門」。帶著滿足的胃回到舒適的房間，是你最完美的旅行節奏。',
    color: '#D4A843',
    icon: '🍳',
    boardingPassDestination: 'HUNG HOM · FLAVOUR DISTRICT',
  },
  C: {
    id: 'C',
    name: '鏡頭探索家',
    nameEn: 'Lens Explorer',
    tagline: '用鏡頭捕捉光影，用影像記錄相遇。',
    frequency: '敏銳 · 視覺 · 記錄',
    sensoryProfile: '你擁有一雙發現美的眼睛。斑駁的唐樓、黃昏的海濱、充滿設計感的酒店角落，都是你鏡頭下的主角。你喜歡用影像說故事，讓每個瞬間永恆。',
    urbanwoodMatch: '城木酒店每個充滿美學細節的角落，都是你的專屬攝影棚。在這裡，你能捕捉到最具質感的旅行瞬間。',
    color: '#E8654A',
    icon: '📷',
    boardingPassDestination: 'HUNG HOM · VISUAL JOURNEY',
  },
};

export function calculateResult(answers: AnswerType[]): AnswerType {
  const counts = { A: 0, B: 0, C: 0 };
  answers.forEach((a) => counts[a]++);
  if (counts.A >= counts.B && counts.A >= counts.C) return 'A';
  if (counts.B >= counts.A && counts.B >= counts.C) return 'B';
  return 'C';
}

export const allQuestions = chapters.flatMap((c) => c.questions);
export const totalQuestions = allQuestions.length;

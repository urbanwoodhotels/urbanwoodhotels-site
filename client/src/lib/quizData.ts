export type AnswerType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type SensoryType = '視覺' | '聽覺' | '嗅覺' | '觸覺';
export type QuestionType = 'multiple-choice' | 'open-end';

export interface Question {
  id: number;
  text: string;
  sensoryType: SensoryType;
  options: Record<AnswerType, string>;
  questionType?: QuestionType;
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  scene: string;
  bgImage: string;
  questions: Question[];
}

export const results: Record<
  AnswerType,
  {
    id: AnswerType;
    icon: string;
    color: string;
    name: string;
    nameEn: string;
    tagline: string;
    frequency: string;
    sensoryProfile: string;
    urbanwoodMatch: string;
    boardingPassDestination: string;
    resultImage?: string;
    resultImageEn?: string;
  }
> = {
  A: {
    id: 'A',
    icon: '🌿',
    color: '#7A9E8E',
    name: '慢活療癒者',
    nameEn: 'Slow Living Healer',
    tagline: '慢下來，讓城市為你療癒。',
    frequency: 'Slow · Gentle · Restore',
    sensoryProfile:
      '你總能在繁忙之中找到屬於自己的節奏。無論是一杯咖啡的香氣、一段微風的流動，還是一個靜謐的角落，你都能從中感受到放鬆與重整。你不追求行程的密度，而更在意每一刻的質感與內在感受。有時候，什麼都不做，只是靜靜待著，也是一種剛剛好的狀態。',
    urbanwoodMatch:
      '城木酒店以木系簡約設計與溫潤氛圍，回應你對慢活的嚮往。在這裡，你可以放下節奏，讓自己完全放鬆，享受屬於自己的寧靜時光。',
    boardingPassDestination: 'SLOW STAY',
    resultImage: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778558792/urbanwood-quiz/qfywt9iquegioygkaxvp.jpg?v=1778558792944',
    resultImageEn: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778558904/urbanwood-quiz/n9zgbissq4v2854w3yup.jpg?v=1778558905241',
  },
  B: {
    id: 'B',
    icon: '🍳',
    color: '#D4A843',
    name: '街坊美食家',
    nameEn: 'Neighbourhood Gourmet',
    tagline: '以味道，探索一座城市的靈魂。',
    frequency: 'Taste · Local · Joy',
    sensoryProfile:
      '你總是以味蕾作為旅行的起點。從冰室到街邊小食，每一種香氣與口感，都是你理解城市的方式。你偏愛那些貼近生活的小店，讓每一餐都成為與地方連結的體驗。對你而言，旅行是一場由味道串連起來的探索。',
    urbanwoodMatch:
      '城木酒店連結著地道生活圈，讓你隨時走進街區尋找美食，再帶著滿足回到舒適空間。',
    boardingPassDestination: 'LOCAL BITES',
    resultImage: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778558813/urbanwood-quiz/re4t0rpamvz1fhwdfvjm.jpg?v=1778558814432',
    resultImageEn: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778558917/urbanwood-quiz/bnjdyc2anjrioldyjmrc.jpg?v=1778558918337',
  },
  C: {
    id: 'C',
    icon: '📷',
    color: '#E8654A',
    name: '影像捕捉者',
    nameEn: 'Visual Storyteller',
    tagline: '用光影記錄，讓瞬間成為故事。',
    frequency: 'Visual · Story · Capture',
    sensoryProfile:
      '你擁有一雙善於發現美的眼睛。城市中的光線、紋理與細節，總能在你眼中轉化為值得記錄的畫面。你習慣用影像說故事，讓每一個片刻都變得獨特而深刻。對你而言，旅行是一場創作。',
    urbanwoodMatch:
      '城木酒店的設計細節與空間層次，讓你隨時都能捕捉到富有質感的畫面。',
    boardingPassDestination: 'FRAME & LIGHT',
    resultImage: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778558831/urbanwood-quiz/wjhdcyzgrnl8ko5xay9u.jpg?v=1778558832668',
    resultImageEn: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778558935/urbanwood-quiz/jccxod2fnenemisdvzbj.jpg?v=1778558935899',
  },
  D: {
    id: 'D',
    icon: '🚶',
    color: '#5C8DFF',
    name: '城市探索者',
    nameEn: 'Urban Explorer',
    tagline: '走進城市深處，發現未被標記的故事。',
    frequency: 'Walk · Discover · Route',
    sensoryProfile:
      '你對未知充滿好奇，總被城市中未被發現的角落吸引。你喜歡行走、轉彎、迷路，讓旅程自然展開。對你而言，旅行不是安排，而是發現。',
    urbanwoodMatch:
      '城木酒店位於城市與社區交界，讓你輕鬆深入不同生活層次，開展屬於你的探索路線。',
    boardingPassDestination: 'CITY DEPTH',
    resultImage: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778558848/urbanwood-quiz/qdh0cwaxc0fms7rvy5sf.jpg?v=1778558849148',
    resultImageEn: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778558962/urbanwood-quiz/djwgnbkkmipkk3xgmvbs.jpg?v=1778558963420',
  },
  E: {
    id: 'E',
    icon: '🌙',
    color: '#8B7CFF',
    name: '夜行感知者',
    nameEn: 'Night Vibe Seeker',
    tagline: '當夜幕降臨，城市展現另一種節奏。',
    frequency: 'Night · Mood · Drift',
    sensoryProfile:
      '你對夜晚特別敏感。燈光、節奏與氛圍交織出另一個城市，讓你更容易沉浸其中。你不一定需要目的地，只要在夜色之中行走，就能感受到與城市的連結。對你而言，旅行是一場與情緒共振的體驗。',
    urbanwoodMatch:
      '城木酒店在夜晚成為延續感受的空間，讓你在靜謐中慢慢消化屬於城市的情緒。',
    boardingPassDestination: 'NIGHT VIBE',
    resultImage: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778558866/urbanwood-quiz/n9gy7v4omnvaaqidiajr.jpg?v=1778558866864',
    resultImageEn: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778559038/urbanwood-quiz/qqgkjptfwiksbt0soiqx.jpg?v=1778559040970',
  },
  F: {
    id: 'F',
    icon: '🗣️',
    color: '#3ECFCF',
    name: '城市連結者',
    nameEn: 'Social Connector',
    tagline: '與人相遇，是旅行最真實的風景。',
    frequency: 'People · Warmth · Connect',
    sensoryProfile:
      '你喜歡與人交流，從對話中認識一座城市。每一段互動，都讓旅程變得更真實、更有溫度。你相信，城市的靈魂存在於人與人之間的連結之中。對你而言，旅行是一場關於相遇的體驗。',
    urbanwoodMatch:
      '城木酒店連結社區與旅人，讓你更容易與城市產生互動，成為其中的一部分。',
    boardingPassDestination: 'HUMAN LINKS',
    resultImage: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778558880/urbanwood-quiz/tcbrs9rrzuljm2p5gndw.jpg?v=1778558881733',
    resultImageEn: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778559082/urbanwood-quiz/gzqpyjowgxezritn4jbs.jpg?v=1778559083928',
  },
};

export const chapters: Chapter[] = [
  {
    id: 1,
    title: 'Chapter 01',
    subtitle: '晨喚與出發',
    scene: '城木酒店內',
    bgImage:
      'https://res.cloudinary.com/defqvpbk4/image/upload/v1776852552/DSC05808_xg2l1l.png',
    questions: [
      {
        id: 1,
        text: '陽光穿透城木的窗簾，你第一時間會：',
        sensoryType: '視覺',
        options: {
          A: '靜靜欣賞光影在木紋地板上的變化',
          B: '拿起手機，搜尋附近有什麼好吃的早餐',
          C: '走到窗邊，拍一張俯瞰紅磡街景的照片',
          D: '直接換好衣服，出門隨便走一圈',
          E: '腦海閃過：夜晚這裡應該會更有感覺',
          F: '同身邊的人聊兩句，問下附近有咩好去處',
        },
      },
      {
        id: 2,
        text: '在城木的大堂準備出發，吸引你目光的是：',
        sensoryType: '視覺',
        options: {
          A: '簡約木系設計帶來的寧靜氛圍',
          B: '大堂空氣中隱約傳來的早餐香氣',
          C: '牆上充滿設計感的藝術裝飾',
          D: '門外街道的流動感，讓人想立刻走出去',
          E: '光線打在牆面上的陰影變化',
          F: '大堂裡人與人之間的互動',
        },
      },
      {
        id: 3,
        text: '踏出酒店大門那一刻，撲面而來的空氣讓你覺得：',
        sensoryType: '嗅覺',
        options: {
          A: '帶點清晨的微涼與清新',
          B: '混雜著遠處茶餐廳飄來的麵包香',
          C: '有種畫面感，很想記錄下來',
          D: '讓人想順著這股氣味走進街區',
          E: '帶著城市剛甦醒的氣氛',
          F: '夾雜著人來人往的生活氣息',
        },
      },
    ],
  },
  {
    id: 2,
    title: 'Chapter 02',
    subtitle: '街區漫遊',
    scene: 'Neighbourhood Walk',
    bgImage:
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/chapter2-street-6xHx8sb6kevxdCPb3sZazz.webp',
    questions: [
      {
        id: 4,
        text: '經過一間老字號冰室，最吸引你的氣味是：',
        sensoryType: '嗅覺',
        options: {
          A: '濃郁微澀的港式奶茶香',
          B: '剛出爐、熱騰騰的蛋撻牛油香',
          C: '鐵板上滋滋作響的黑椒汁香味',
          D: '整條街混在一起的生活氣味',
          E: '空氣中那種舊區特有的味道',
          F: '店內熱鬧人聲混著食物香氣',
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
          D: '想走進這棟樓看看裡面',
          E: '光影在牆面形成的層次',
          F: '陽台上人與人之間的互動',
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
          D: '讓人想了解這個地方背後的故事',
          E: '有一種時間停住的感覺',
          F: '讓人聯想到人群與信仰的連結',
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
          D: '直接走進去，看看會遇到什麼',
          E: '心想：夜晚再來應該會更有感覺',
          F: '同店主聊兩句，看看有什麼推薦',
        },
      },
    ],
  },
  {
    id: 3,
    title: 'Chapter 03',
    subtitle: '海風與黃昏',
    scene: '紅磡新海濱',
    bgImage:
      'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/chapter3-waterfront-iPfdaUQUxczMzsT66zKagV.webp',
    questions: [
      {
        id: 8,
        text: '來到紅磡海濱，迎面吹來的海風讓你覺得：',
        sensoryType: '觸覺',
        options: {
          A: '吹散了一天的疲憊，無比舒暢',
          B: '帶點海水的鹹味，是屬於城市的氣息',
          C: '剛好把頭髮吹起，很適合拍一段 Vlog',
          D: '想沿著海邊一路走下去',
          E: '讓人想留到夜晚再感受這片海風',
          F: '想同身邊的人分享這一刻',
        },
      },
      {
        id: 9,
        text: '聽著海浪拍打岸邊的聲音，你會聯想到：',
        sensoryType: '聽覺',
        options: {
          A: '一首節奏緩慢的輕音樂',
          B: '晚上去吃一頓豐盛海鮮大餐的衝動',
          C: '電影裡主角在海邊散步的畫面',
          D: '像在引導你走向下一個地方',
          E: '夜晚海邊的靜與遠方城市聲音',
          F: '想同人坐低慢慢傾偈',
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
          D: '看完日落繼續走，探索其他地方',
          E: '等天完全黑下來，看城市燈光亮起',
          F: '同身邊的人一起看，順便聊聊天',
        },
      },
    ],
  },
  {
    id: 4,
    title: 'Chapter 04',
    subtitle: '夜歸與回味',
    scene: '回到城木酒店',
    bgImage:
      'https://res.cloudinary.com/defqvpbk4/image/upload/v1777347279/urbanwood-quiz/mwa0c8st6u6cuqxxvdyy.png?v=1777347280217',
    questions: [
      {
        id: 11,
        text: '結束一天的紅磡探索，晚上回到酒店房內，你最想做什麼？',
        sensoryType: '觸覺',
        options: {
          A: '泡一個熱水浴，然後靜靜放空',
          B: '打開外賣 App，點一份宵夜',
          C: '整理今天拍的照片和影片，上傳 IG',
          D: '回想今天走過的地方',
          E: '站在窗邊，看夜晚城市的燈光',
          F: '和朋友聊今天的經歷',
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
          D: '街區與空間交織的氣味',
          E: '夜晚空氣中特有的靜謐氣息',
          F: '人群與生活流動的氣息',
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
          D: '一段帶有城市節奏感的聲音',
          E: '一首氛圍感強的電子 / ambient 音樂',
          F: '一首適合與人分享、輕鬆聊天的音樂',
        },
      },
    ],
  },
];

export function calculateResult(answers: AnswerType[]): AnswerType {
  const scores: Record<AnswerType, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
  };

  for (const answer of answers) {
    scores[answer] += 1;
  }

  const maxScore = Math.max(...Object.values(scores));
  const tied = (Object.keys(scores) as AnswerType[]).filter((key) => scores[key] === maxScore);

  if (tied.length === 1) return tied[0];

  const lastThree = answers.slice(-3);
  const recentScores: Record<AnswerType, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
  };

  for (const answer of lastThree) {
    if (tied.includes(answer)) {
      recentScores[answer] += 1;
    }
  }

  const maxRecentScore = Math.max(...tied.map((key) => recentScores[key]));
  const recentTied = tied.filter((key) => recentScores[key] === maxRecentScore);

  if (recentTied.length === 1) return recentTied[0];

  for (let i = answers.length - 1; i >= 0; i--) {
    const answer = answers[i];
    if (recentTied.includes(answer)) {
      return answer;
    }
  }

  return recentTied[0];
}
 

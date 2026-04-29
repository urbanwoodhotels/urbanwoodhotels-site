import type { AnswerType } from './quizData';

export type Lang = 'zh' | 'en';

export function pickLang(lang: Lang, zh: string, en: string) {
  return lang === 'en' ? en : zh;
}

export const sensoryLabel: Record<string, string> = {
  視覺: 'Sight',
  聽覺: 'Sound',
  嗅覺: 'Scent',
  觸覺: 'Touch',
};

export const landingCopy = {
  eyebrow: 'Urbanwood Hotel · Hung Hom',
  anniversaryZh: '周年',
  anniversaryEn: 'ANNIV',
  titleZhLine1: '你是哪種',
  titleZhHighlight: '紅磡旅人',
  titleZhSuffix: '？',
  titleEnLine1: 'What kind of',
  titleEnHighlight: 'Hung Hom traveller',
  titleEnSuffix: ' are you?',
  subtitleZh: '跟隨第一身視角，從城木酒店出發',
  subtitleEn: 'Set off from Urbanwood Hotel through a first-person sensory journey',
  descriptionZhLine1: '穿梭紅磡舊街、海濱與隱世角落',
  descriptionZhLine2: '回答 13 條感官問題，領取你的專屬登機證',
  descriptionEnLine1: 'Move through old streets, the waterfront and hidden corners',
  descriptionEnLine2: 'Answer 13 sensory questions and receive your boarding pass',
  startZh: '開始測驗',
  startEn: 'Start Quiz',
};
export const chapterCopyEn: Record<number, { subtitle: string; scene: string; button: string }> = {
  1: { subtitle: 'Morning Wake-up & Departure', scene: 'Inside Urbanwood Hotel', button: 'Enter Scene →' },
  2: { subtitle: 'Neighbourhood Walk', scene: 'Neighbourhood Walk', button: 'Enter Scene →' },
  3: { subtitle: 'Sea Breeze & Sunset', scene: 'Hung Hom Waterfront', button: 'Enter Scene →' },
  4: { subtitle: 'Night Return & Reflection', scene: 'Back at Urbanwood Hotel', button: 'Enter Scene →' },
};

export const questionTextEn: Record<number, string> = {
  1: 'Sunlight filters through the curtains at Urbanwood. What would you do first?',
  2: 'As you get ready to leave from the Urbanwood lobby, what catches your eye?',
  3: 'The moment you step out of the hotel, the air makes you feel...',
  4: 'Passing by an old-school cha chaan teng, which scent draws you in most?',
  5: 'Looking up at the façade of an old tong lau building, what do you notice most?',
  6: 'The incense drifting from Kwun Yum Temple makes you feel...',
  7: 'You discover a hidden shop in a small alley with no signboard. You would...',
  8: 'Arriving at the Hung Hom waterfront, the sea breeze makes you feel...',
  9: 'Listening to waves hitting the shore, what comes to mind?',
  10: 'As the sunset turns the sea golden, what do you want to do most?',
  11: 'After a full day exploring Hung Hom, you return to your hotel room at night. What do you want to do most?',
  12: 'Before sleep, when you close your eyes, which “Hung Hom scent” stays with you most?',
  13: 'If you had to choose a soundtrack for today’s Hung Hom journey, what would it be?',
};

export const optionsEn: Record<number, Record<AnswerType, string>> = {
  1: {
    A: 'Quietly admire the shifting light and shadows on the wooden floor',
    B: 'Pick up your phone and search for nearby breakfast spots',
    C: 'Walk to the window and take a photo overlooking the streets of Hung Hom',
    D: 'Get changed and head out for an unplanned walk',
    E: 'Think to yourself: this place must feel even better at night',
    F: 'Chat with someone nearby and ask what is good around here',
  },
  2: {
    A: 'The calm atmosphere created by the minimalist wooden design',
    B: 'The subtle breakfast aroma lingering in the lobby air',
    C: 'The artistic wall details full of design character',
    D: 'The movement of the street outside, making you want to step out immediately',
    E: 'The way light casts shadows across the wall',
    F: 'The small interactions between people in the lobby',
  },
  3: {
    A: 'A cool, fresh hint of morning air',
    B: 'The smell of bread drifting from a distant cha chaan teng',
    C: 'A scene-like feeling that makes you want to capture it',
    D: 'A scent that makes you want to follow it into the neighbourhood',
    E: 'The atmosphere of a city just waking up',
    F: 'A lived-in feeling mixed with people coming and going',
  },
  4: {
    A: 'The rich, slightly bitter aroma of Hong Kong-style milk tea',
    B: 'The buttery scent of freshly baked egg tarts',
    C: 'The sizzling black pepper sauce on the hot plate',
    D: 'The mixed everyday scent of the whole street',
    E: 'That distinctive smell of an old neighbourhood',
    F: 'The lively chatter inside mixed with food aromas',
  },
  5: {
    A: 'The traces of time left on peeling paint',
    B: 'The colourful laundry hanging by the windows',
    C: 'The geometric beauty of vintage patterned glass windows',
    D: 'The urge to step inside and see what is within',
    E: 'The layers of light and shadow across the wall',
    F: 'The interactions between people on the balconies',
  },
  6: {
    A: 'It settles your mind and brings calm to your thoughts',
    B: 'It feels mysterious and full of traditional culture',
    C: 'It would pair perfectly with a slow-motion Reels shot',
    D: 'It makes you want to learn the story behind this place',
    E: 'It feels as if time has paused',
    F: 'It reminds you of the connection between people and faith',
  },
  7: {
    A: 'Stand outside and observe its interior style first',
    B: 'Push the door open without hesitation to see what is good to eat',
    C: 'Search it on Instagram first to see if anyone has checked in',
    D: 'Walk straight in and see what you might discover',
    E: 'Think to yourself: it would probably feel even better at night',
    F: 'Chat with the shop owner and ask for recommendations',
  },
  8: {
    A: 'It washes away the tiredness of the day and feels incredibly refreshing',
    B: 'It carries a hint of sea salt — a scent that belongs to the city',
    C: 'It lifts your hair at just the right moment for a Vlog',
    D: 'It makes you want to keep walking along the waterfront',
    E: 'It makes you want to stay until night and feel the breeze again',
    F: 'It makes you want to share this moment with someone beside you',
  },
  9: {
    A: 'A slow, gentle piece of music',
    B: 'The sudden urge to have a hearty seafood dinner tonight',
    C: 'A movie scene where the main character walks by the sea',
    D: 'A sound that seems to guide you toward the next place',
    E: 'The stillness of the night sea and distant city sounds',
    F: 'Sitting down with someone for a slow conversation',
  },
  10: {
    A: 'Find a bench, do nothing, and simply watch the sunset',
    B: 'Buy a cold beer or soda and enjoy the view while drinking',
    C: 'Keep taking photos until you capture the perfect light',
    D: 'Continue walking after sunset and explore somewhere else',
    E: 'Wait until it gets completely dark and watch the city lights come on',
    F: 'Watch it with someone beside you and chat along the way',
  },
  11: {
    A: 'Take a hot bath and quietly zone out',
    B: 'Open a delivery app and order a late-night snack',
    C: 'Organise today’s photos and videos, then upload them to Instagram',
    D: 'Think back on all the places you walked through today',
    E: 'Stand by the window and look at the city lights at night',
    F: 'Chat with friends about today’s experience',
  },
  12: {
    A: 'The temple incense and the breeze from the waterfront',
    B: 'The milk tea from the cha chaan teng and the smell of street-side egg waffles',
    C: 'The fresh and unknown scent of the city',
    D: 'The blended scent of neighbourhood streets and urban spaces',
    E: 'The special stillness in the night air',
    F: 'The scent of people and everyday life in motion',
  },
  13: {
    A: 'A healing instrumental track with no lyrics',
    B: 'A lively pop song full of energy',
    C: 'A slightly retro song that would work perfectly as a Reels BGM',
    D: 'A soundscape with the rhythm of the city',
    E: 'An atmospheric electronic / ambient track',
    F: 'A relaxed song made for sharing and chatting with others',
  },
};

export const resultCopyEn: Record<AnswerType, { tagline: string; sensoryProfile: string; urbanwoodMatch: string }> = {
  A: {
    tagline: 'Slow down, and let the city restore you.',
    sensoryProfile:
      'You always find your own rhythm within the rush of the city. Whether it is the aroma of coffee, a passing breeze, or a quiet corner, you sense calm and renewal in the smallest details. You do not chase a packed itinerary; you care more about the quality of each moment and how it feels inside. Sometimes, doing nothing and simply staying still is exactly enough.',
    urbanwoodMatch:
      'Urbanwood Hotel responds to your love for slow living with minimalist wooden design and a warm, gentle atmosphere. Here, you can release the pace, fully unwind, and enjoy a quiet moment of your own.',
  },
  B: {
    tagline: 'Explore the soul of a city through taste.',
    sensoryProfile:
      'Your journey always begins with flavour. From cha chaan teng milk tea to street snacks, every aroma and texture becomes your way of understanding the city. You are drawn to small, local places close to everyday life, where each meal becomes a connection with the neighbourhood. For you, travel is an exploration woven together by taste.',
    urbanwoodMatch:
      'Urbanwood Hotel connects you with a local living circle, letting you step easily into the neighbourhood for good food before returning to a comfortable stay.',
  },
  C: {
    tagline: 'Record with light and shadow, and turn moments into stories.',
    sensoryProfile:
      'You have an eye for discovering beauty. The city’s light, texture and tiny details always turn into scenes worth capturing in your eyes. You tell stories through images, making every passing moment feel unique and meaningful. For you, travel is a form of creation.',
    urbanwoodMatch:
      'The design details and spatial layers of Urbanwood Hotel allow you to capture refined, atmospheric frames at any moment.',
  },
  D: {
    tagline: 'Step into the depth of the city and uncover unmarked stories.',
    sensoryProfile:
      'You are curious about the unknown and drawn to the hidden corners of the city. You enjoy walking, turning, getting a little lost, and letting the journey unfold naturally. For you, travel is not about planning — it is about discovery.',
    urbanwoodMatch:
      'Located between the city and the community, Urbanwood Hotel lets you move easily through different layers of local life and begin your own route of exploration.',
  },
  E: {
    tagline: 'When night falls, the city reveals another rhythm.',
    sensoryProfile:
      'You are especially sensitive to the night. Lights, rhythm and atmosphere weave together into another version of the city, drawing you deeper into the moment. You do not always need a destination; simply walking through the night is enough to feel connected to the city. For you, travel is an experience that resonates with mood.',
    urbanwoodMatch:
      'At night, Urbanwood Hotel becomes a space that extends your feelings, allowing you to slowly process the emotions of the city in quietness.',
  },
  F: {
    tagline: 'Meeting people is the most authentic scenery of travel.',
    sensoryProfile:
      'You enjoy connecting with people and understanding a city through conversation. Every interaction makes the journey feel more real and more human. You believe the soul of a city lives in the connections between people. For you, travel is an experience of encounter.',
    urbanwoodMatch:
      'Urbanwood Hotel connects travellers with the neighbourhood, making it easier for you to interact with the city and become part of it.',
  },
};

export const uiCopyEn = {
  next: 'Next →',
  result: 'View Result ✶',
  textareaPlaceholder: 'Please enter your answer...',
  almostThere: 'Almost There',
  travellerType: 'Your Traveller Type',
  submitForm: 'Register for the Giveaway & View Result',
  submitting: 'Submitting...',
  platformField: '1. Which platform did you use to register for the event?',
  socialHandleField: '2. Social Media Username',
  nameField: '3. Name',
  emailField: '4. Email Address',
  instagramPlaceholder: '@yourhandle',
  facebookPlaceholder: 'Facebook account name',
  submissionSuccessTitle: '✶ Giveaway registration successful!',
  submissionSuccessMsg: 'Share your boarding pass to IG Story, tag @urbanwoodhotels + #Urbanwood2ndAnniversary to increase your chance of winning!',
  boardingPassLabel: 'Boarding Pass',
  passengerType: 'Passenger Type',
  sensoryProfileLabel: 'Sensory Profile',
  share: '📤 Share My Boarding Pass',
  copied: '✓ Copied!',
  saveImage: '📸 Save Boarding Pass Image',
  saving: 'Saving...',
  bookHotel: '🏨 Book Urbanwood Hung Hom Now',
  restart: 'Restart Quiz',
  shareHint: 'Share to IG Story, tag @urbanwoodhotels + #Urbanwood2ndAnniversary to join the giveaway!',
};

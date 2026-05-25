type ChapterImageConfig = {
  coverDesktop: string;
  coverMobile: string;
  questionDesktop: string;
  questionMobile: string;
};

export const imageConfig: {
  cover: {
    desktop: string;
    mobile: string;
  };
  chapters: Record<number, ChapterImageConfig>;
  form: {
    desktop: string;
    mobile: string;
  };
  result: {
    desktop: string;
    mobile: string;
  };
} = {
  cover: {
    desktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180154/urbanwood-quiz/enxo8cz5d44zwwnn6me3.jpg',
    mobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180154/urbanwood-quiz/enxo8cz5d44zwwnn6me3.jpg',
  },

  chapters: {
    1: {
      coverDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180171/urbanwood-quiz/gcdgkauygbgerqgpktyv.jpg',
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180171/urbanwood-quiz/gcdgkauygbgerqgpktyv.jpg',
      questionDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180171/urbanwood-quiz/gcdgkauygbgerqgpktyv.jpg',
      questionMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180171/urbanwood-quiz/gcdgkauygbgerqgpktyv.jpg',
    },
    2: {
      coverDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181295/urbanwood-quiz/cef3e1pdixgsmn57uyyc.jpg',
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181295/urbanwood-quiz/cef3e1pdixgsmn57uyyc.jpg',
      questionDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181295/urbanwood-quiz/cef3e1pdixgsmn57uyyc.jpg',
      questionMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181295/urbanwood-quiz/cef3e1pdixgsmn57uyyc.jpg',
    },
    3: {
      coverDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181301/urbanwood-quiz/iatistgbtcfek96cbbpu.jpg',
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181301/urbanwood-quiz/iatistgbtcfek96cbbpu.jpg',
      questionDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181301/urbanwood-quiz/iatistgbtcfek96cbbpu.jpg',
      questionMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181301/urbanwood-quiz/iatistgbtcfek96cbbpu.jpg',
    },
    4: {
      coverDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180187/urbanwood-quiz/bzqqbevvtbwbk7cvzxn0.jpg',
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180187/urbanwood-quiz/bzqqbevvtbwbk7cvzxn0.jpg',
      questionDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180187/urbanwood-quiz/bzqqbevvtbwbk7cvzxn0.jpg',
      questionMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180187/urbanwood-quiz/bzqqbevvtbwbk7cvzxn0.jpg',
    },
  },

  form: {
    desktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180154/urbanwood-quiz/enxo8cz5d44zwwnn6me3.jpg',
    mobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180154/urbanwood-quiz/enxo8cz5d44zwwnn6me3.jpg',
  },

  result: {
    desktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180154/urbanwood-quiz/enxo8cz5d44zwwnn6me3.jpg',
    mobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180154/urbanwood-quiz/enxo8cz5d44zwwnn6me3.jpg',
  },
};
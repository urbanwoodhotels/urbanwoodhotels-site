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
    mobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759174/Online-Test-Result-cover-deisgn-phone_rgwn65.jpg',
  },

  chapters: {
    1: {
      coverDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180171/urbanwood-quiz/gcdgkauygbgerqgpktyv.jpg',
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759175/Online-Test-Result-cover-deisgn-phone-07_n12fth.jpg',
      questionDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759159/Online-Test-Result-cover-deisgn-02_cckv0o.jpg',
      questionMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180171/urbanwood-quiz/gcdgkauygbgerqgpktyv.jpg',
    },
    2: {
      coverDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181295/urbanwood-quiz/cef3e1pdixgsmn57uyyc.jpg',
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759173/Online-Test-Result-cover-deisgn-phone-08_bueluv.jpg',
      questionDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759160/Online-Test-Result-cover-deisgn-04_bg0itr.jpg',
      questionMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181295/urbanwood-quiz/cef3e1pdixgsmn57uyyc.jpg',
    },
    3: {
      coverDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181301/urbanwood-quiz/iatistgbtcfek96cbbpu.jpg',
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759173/Online-Test-Result-cover-deisgn-phone-08_bueluv.jpg',
      questionDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759160/Online-Test-Result-cover-deisgn-03_xfrryd.jpg',
      questionMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181301/urbanwood-quiz/iatistgbtcfek96cbbpu.jpg',
    },
    4: {
      coverDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759144/Ch.4_v2_acykvy.jpg',
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759174/Online-Test-Result-cover-deisgn-phone-10_awgn2u.jpg',
      questionDesktop: 'https://rehttps://res.cloudinary.com/defqvpbk4/image/upload/v1779759158/Online-Test-Result-cover-deisgn-05_xarzwz.jpg',
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
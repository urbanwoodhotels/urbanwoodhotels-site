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
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779760562/ch.1_bl1wur.jpg',
      questionDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759159/Online-Test-Result-cover-deisgn-02_cckv0o.jpg',
      questionMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779760713/ch.1_notext_rep7mt.jpg',
    },
    2: {
      coverDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181295/urbanwood-quiz/cef3e1pdixgsmn57uyyc.jpg',
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779760563/ch.2_tr2j8c.jpg',
      questionDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759160/Online-Test-Result-cover-deisgn-04_bg0itr.jpg',
      questionMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779760714/ch.2_notext_wenrme.jpg',
    },
    3: {
      coverDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779181301/urbanwood-quiz/iatistgbtcfek96cbbpu.jpg',
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779760563/ch.3_c9lof8.jpg',
      questionDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759160/Online-Test-Result-cover-deisgn-03_xfrryd.jpg',
      questionMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779760714/ch.3_notext_zxlocv.jpg',
    },
    4: {
      coverDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759144/Ch.4_v2_acykvy.jpg',
      coverMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779760563/ch.4_qjxous.jpg',
      questionDesktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759158/Online-Test-Result-cover-deisgn-05_xarzwz.jpg',
      questionMobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779760713/ch.4_notext_q6ctjy.jpg',
    },
  },

  form: {
    desktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180154/urbanwood-quiz/enxo8cz5d44zwwnn6me3.jpg',
    mobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759174/Online-Test-Result-cover-deisgn-phone_rgwn65.jpg',
  },

  result: {
    desktop: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779180154/urbanwood-quiz/enxo8cz5d44zwwnn6me3.jpg',
    mobile: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1779759174/Online-Test-Result-cover-deisgn-phone_rgwn65.jpg',
  },
};
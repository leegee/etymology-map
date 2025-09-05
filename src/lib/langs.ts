export const languages: Record<
    string,
    {
        flag: string;
        englishName: string;
        nativeName: string;
        coords: [number, number];
        countryCode: string;
        yearRange: [number, number];
    }
> = {
    en: { flag: "🇬🇧", englishName: "English", nativeName: "English", coords: [51.5074, -2], countryCode: "gb", yearRange: [1500, 9999] },
    de: { flag: "🇩🇪", englishName: "German", nativeName: "Deutsch", coords: [51.1657, 10.4515], countryCode: "de", yearRange: [1050, 9999] },
    nl: { flag: "🇳🇱", englishName: "Dutch", nativeName: "Nederlands", coords: [52.1326, 5.2913], countryCode: "nl", yearRange: [1100, 9999] },
    sv: { flag: "🇸🇪", englishName: "Swedish", nativeName: "Svenska", coords: [62, 18.0686], countryCode: "se", yearRange: [1250, 9999] },
    no: { flag: "🇳🇴", englishName: "Norwegian", nativeName: "Norsk", coords: [59.9139, 10.7522], countryCode: "no", yearRange: [1350, 9999] },
    nn: { flag: "🇳🇴", englishName: "Norwegian Nynorsk", nativeName: "Nynorsk", coords: [62.4722, 6.1540], countryCode: "no", yearRange: [1850, 9999] },
    da: { flag: "🇩🇰", englishName: "Danish", nativeName: "Dansk", coords: [55.6761, 11], countryCode: "dk", yearRange: [1200, 9999] },
    is: { flag: "🇮🇸", englishName: "Icelandic", nativeName: "Íslenska", coords: [64.1355, -21.8954], countryCode: "is", yearRange: [1200, 9999] },
    fo: { flag: "🇫🇴", englishName: "Faroese", nativeName: "Føroyskt", coords: [62.0077, -6.7706], countryCode: "fo", yearRange: [1500, 9999] },
    af: { flag: "🇿🇦", englishName: "Afrikaans", nativeName: "Afrikaans", coords: [-25.7479, 28.2293], countryCode: "za", yearRange: [1700, 9999] },

    yi: { flag: "🇮🇱", englishName: "Yiddish", nativeName: "ייִדיש", coords: [31.7683, 35.2137], countryCode: "il", yearRange: [900, 9999] },
    ang: { flag: "🏴", englishName: "Old English", nativeName: "Ænglisc", coords: [54, 0], countryCode: "gb", yearRange: [700, 1100] },
    ohg: { flag: "🏴", englishName: "Old High German", nativeName: "Althochdeutsch", coords: [50.1109, 8.6821], countryCode: "xx", yearRange: [750, 1050] },
    non: { flag: "🏴", englishName: "Old Norse", nativeName: "Norrœnt", coords: [65, 10.75], countryCode: "xx", yearRange: [800, 1300] },
    got: { flag: "🏴", englishName: "Gothic", nativeName: "Gutisk", coords: [54.6872, 25.2797], countryCode: "xx", yearRange: [300, 600] },
    nds: { flag: "🇩🇪", englishName: "Low German", nativeName: "Plattdüütsch", coords: [52.5200, 13.4050], countryCode: "de", yearRange: [1100, 9999] },
    fry: { flag: "🇳🇱", englishName: "Frisian", nativeName: "Frysk", coords: [53.2012, 5.7999], countryCode: "nl", yearRange: [1200, 9999] },
    frr: { flag: "🇩🇪", englishName: "North Frisian", nativeName: "Nordfriisk", coords: [54.9069, 8.3105], countryCode: "de", yearRange: [1200, 9999] },
    frs: { flag: "🇩🇪", englishName: "East Frisian", nativeName: "Oostfreesk", coords: [53.5735, 7.2070], countryCode: "de", yearRange: [1200, 9999] },
    li: { flag: "🇳🇱", englishName: "Limburgish", nativeName: "Limburgs", coords: [50.9384, 5.3527], countryCode: "nl", yearRange: [1500, 9999] },

    // etymology-only / proto / classical languages
    pie: { flag: "🏴", englishName: "Proto-Indo-European", nativeName: "Proto-Indo-European", coords: [48, 20], countryCode: "xx", yearRange: [-4500, -2500] },
    pit: { flag: "🏴", englishName: "Proto-Italic", nativeName: "Proto-Italic", coords: [42, 12], countryCode: "xx", yearRange: [-1000, -500] },
    pgm: { flag: "🏴", englishName: "Proto-Germanic", nativeName: "Proto-Germanic", coords: [54, 10], countryCode: "xx", yearRange: [-500, 200] },
    la: { flag: "🏴", englishName: "Latin", nativeName: "Latina", coords: [41.9, 12.5], countryCode: "it", yearRange: [-700, 200] },
    lla: { flag: "🏴", englishName: "Late Latin", nativeName: "Latina Tarda", coords: [41.9, 12.5], countryCode: "it", yearRange: [200, 600] },
    grc: { flag: "🏴", englishName: "Ancient Greek", nativeName: "Ἑλληνικά", coords: [37.9838, 23.7275], countryCode: "gr", yearRange: [-900, 300] },
    el: { flag: "🇬🇷", englishName: "Modern Greek", nativeName: "Ελληνικά", coords: [37.9838, 23.7275], countryCode: "gr", yearRange: [1450, 9999] },
    cop: { flag: "🏴", englishName: "Coptic", nativeName: "Ⲙⲉⲧⲣⲉ", coords: [30.0444, 31.2357], countryCode: "eg", yearRange: [200, 1500] },
    egy: { flag: "🏴", englishName: "Egyptian", nativeName: "Egyptian", coords: [30.0444, 31.2357], countryCode: "eg", yearRange: [-3000, -400] },
};

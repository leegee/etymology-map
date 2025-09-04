export const languages: Record<
    string,
    {
        flag: string;
        englishName: string;
        nativeName: string;
        coords: [number, number];
        countryCode: string;
    }
> = {
    en: { flag: "🇬🇧", englishName: "English", nativeName: "English", coords: [51.5074, -0.1278], countryCode: "gb" },
    de: { flag: "🇩🇪", englishName: "German", nativeName: "Deutsch", coords: [51.1657, 10.4515], countryCode: "de" },
    nl: { flag: "🇳🇱", englishName: "Dutch", nativeName: "Nederlands", coords: [52.1326, 5.2913], countryCode: "nl" },
    sv: { flag: "🇸🇪", englishName: "Swedish", nativeName: "Svenska", coords: [59.3293, 18.0686], countryCode: "se" },
    no: { flag: "🇳🇴", englishName: "Norwegian", nativeName: "Norsk", coords: [59.9139, 10.7522], countryCode: "no" },
    nn: { flag: "🇳🇴", englishName: "Norwegian Nynorsk", nativeName: "Nynorsk", coords: [62.4722, 6.1540], countryCode: "no" },
    da: { flag: "🇩🇰", englishName: "Danish", nativeName: "Dansk", coords: [55.6761, 12.5683], countryCode: "dk" },
    is: { flag: "🇮🇸", englishName: "Icelandic", nativeName: "Íslenska", coords: [64.1355, -21.8954], countryCode: "is" },
    fo: { flag: "🇫🇴", englishName: "Faroese", nativeName: "Føroyskt", coords: [62.0077, -6.7706], countryCode: "fo" },
    af: { flag: "🇿🇦", englishName: "Afrikaans", nativeName: "Afrikaans", coords: [-25.7479, 28.2293], countryCode: "za" },

    yi: { flag: "🇮🇱", englishName: "Yiddish", nativeName: "ייִדיש", coords: [31.7683, 35.2137], countryCode: "il" },
    ang: { flag: "🏴", englishName: "Old English", nativeName: "Ænglisc", coords: [52.3555, -1.1743], countryCode: "xx" },
    ohg: { flag: "🏴", englishName: "Old High German", nativeName: "Althochdeutsch", coords: [50.1109, 8.6821], countryCode: "xx" },
    non: { flag: "🏴", englishName: "Old Norse", nativeName: "Norrœnt", coords: [64.9631, -19.0208], countryCode: "xx" },
    got: { flag: "🏴", englishName: "Gothic", nativeName: "Gutisk", coords: [54.6872, 25.2797], countryCode: "xx" },
    nds: { flag: "🇩🇪", englishName: "Low German", nativeName: "Plattdüütsch", coords: [52.5200, 13.4050], countryCode: "de" },
    fry: { flag: "🇳🇱", englishName: "Frisian", nativeName: "Frysk", coords: [53.2012, 5.7999], countryCode: "nl" },
    frr: { flag: "🇩🇪", englishName: "North Frisian", nativeName: "Nordfriisk", coords: [54.9069, 8.3105], countryCode: "de" },
    frs: { flag: "🇩🇪", englishName: "East Frisian", nativeName: "Oostfreesk", coords: [53.5735, 7.2070], countryCode: "de" },
    li: { flag: "🇳🇱", englishName: "Limburgish", nativeName: "Limburgs", coords: [50.9384, 5.3527], countryCode: "nl" }
};

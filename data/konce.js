// ============================================================
//  KONCE HRY a odhlašovací SMS
// ============================================================
//
//  V textech lze použít:
//    {misto} – kde hráč skončil (1. pád, např. „Kohútka")
//    {kde}   – totéž s předložkou v 6. pádě (např. „na Kohútce", z pole "kde" v data/trasa.js)
//    {km}    – na kterém km
//    {cas}   – čas od startu (h:mm)   {obec} – kam jde po odhlášení (z úseku v data/trasa.js)
//    {duvod} – důvod z konce níže
//
//  Pole konce:
//    nadpis   – velký nadpis
//    text     – popis
//    duvod    – věta do SMS (bez tečky na konci)
//    sms      – false = bez odhlašovací SMS (jen lezúň)
//    misto, kde, doObce – (nepovinné) přepíše místo / obec v SMS
//    sdileni  – text, který se sdílí tlačítkem „Sdílet"
//    znacka   – barva pruhu v nadpisu
//    predzvest – (nepovinné) krátká věta, která se ukáže na trase těsně před koncem
// ============================================================

const KONCE = {
  sms: "Končím {kde} (km {km}). {duvod}. Jdu do {obec} a pak na Vsetín. Příště už to fakt nejdu.",
  tlacitkoOdeslat: "Odeslat orgům",
  odeslano: "Orgové SMS přečetli. Smějí se.",

  typy: {
    lezun: {
      nadpis: "VALAŠSKÝ LEZÚŇ",
      text: "V cíli čeká kyselice, lavor a lžíce na boty (puchýř nepustí).",
      sms: false,
      znacka: "cervena",
      sdileni: "Jsem Valašský lezúň za {cas}! Virtuální Špacír 2027. Dáš to?",
      diplom: {
        cas: "Čas",
        boty: "Boty",
        nasranost: "Max. nasranost",
        bufety: "Navštívené bufety",
      },
    },

    neoficialni: {
      nadpis: "Neoficiální lezúň",
      text: "Dorazil jsi za {cas}. Kyselice je studená, ale tvoje.",
      duvod: "Přišel jsem po limitu, ale přišel",
      misto: "Vsetín, cíl",
      kde: "v cíli",
      doObce: "hospody",
      znacka: "zluta",
      sdileni: "Virtuální Špacír: došel jsem za {cas}. Po limitu, ale došel. Ty?",
    },

    energie: {
      nadpis: "Došla energie",
      text: "Usnul jsi na lavičce. Probudil ses v pondělí. Vsetín je pořád stejně daleko.",
      duvod: "Usnul jsem na lavičce",
      predzvest: "Energie: 0. Ta lavička vypadá tak pohodlně…",
      znacka: "modra",
      sdileni: "Virtuální Špacír: padl jsem na km {km} ({misto}) na Energii. Ty?",
    },

    nohy: {
      nadpis: "Došly nohy",
      text: "Svoz. Řidič záchranky je vzhůru od půl třetí a tváří se podle toho.",
      duvod: "Nohy odmítly spolupráci",
      predzvest: "Nohy: 0. Sedáš si a už nevstaneš.",
      znacka: "modra",
      sdileni: "Virtuální Špacír: padl jsem na km {km} ({misto}) na Nohy. Ty?",
    },

    nasranost: {
      nadpis: "Limit nasranosti",
      text: "Překročil jsi limit nasranosti.",
      duvod: "Vykašlal jsem se na to",
      predzvest: "Nasranost: 100. Něco v tobě prasklo.",
      znacka: "cervena",
      sdileni: "Virtuální Špacír: padl jsem na km {km} ({misto}) na Nasranost. Ty?",
    },

    nehoda: {
      nadpis: "Nehoda",
      text: "Trať byla znečištěna. Tvoje pouť tady končí. Otázkou zůstává, jak se v tomhle úboru dostaneš domů. Řidič autobusu už zavrtěl hlavou.",
      duvod: "Technické potíže, nechci o tom mluvit",
      predzvest: "Medvěd vyhrál.",
      znacka: "zelena",
      sdileni: "Virtuální Špacír: na km {km} ({misto}) mě zradil hermelín. Ty?",
    },

    u_cechu: {
      nadpis: "U Čechů",
      text: "Rozumný člověk. Nebo slaboch. Historie rozhodne.",
      duvod: "Jsem rozumný člověk",
      znacka: "zluta",
      sdileni: "Virtuální Špacír: na km {km} jsem rozumně skončil U Čechů. Ty?",
    },

    halenkov: {
      nadpis: "Halenkov",
      text: "Šel jsi do Halenkova a pak na Vsetín. Vlastně jsi to skoro došel. Neoficiálně.",
      duvod: "Jdu s kolegou",
      doObce: "Halenkova",
      znacka: "zelena",
      sdileni: "Virtuální Špacír: na km {km} jsem to vzal přes Halenkov. Ty?",
    },

    vzdal: {
      nadpis: "Odhlášen",
      text: "Odhlásil ses. Nikdo se nediví. Nikdo se ani nezeptal proč.",
      duvod: "Už nemůžu",
      znacka: "modra",
      sdileni: "Virtuální Špacír: vzdal jsem to na km {km} ({misto}). Ty?",
    },
  },
};

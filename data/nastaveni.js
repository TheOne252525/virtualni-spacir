// ============================================================
//  NASTAVENÍ HRY – čísla pro balancování a přepínače
//  Po změně ověř dopad simulací:  node tools/simulace.mjs
// ============================================================
const NASTAVENI = {
  // Úvodní „tisková zpráva" o digitální transformaci Špacíru (true / false)
  TISKOVKA: true,

  // Pravděpodobnost, že na začátku úseku padne náhodná karta (0–1)
  SANCE_KARTY: 0.35,

  // Startovní hodnoty
  START: { energie: 100, nohy: 100, nasranost: 10, boty: 0 },

  // Časový limit pochodu (hodiny:minuty od startu v sobotu 00:00)
  LIMIT: "24:00",

  // Pohyb
  RYCHLOST: 5.2,            // km/h
  NOC: ["00:00", "04:30"],  // v noci se jde pomaleji
  NOC_NASOBIC: 0.95,
  UNAVA_PRAH: 25,           // energie nebo nohy pod tímto prahem…
  UNAVA_NASOBIC: 0.8,       // …zpomalí chůzi (každý zvlášť)
  BOTY_ZPOMALENI: 0.25,     // km/h za každých 1 000 g bláta na botách
  MIN_RYCHLOST: 1.5,        // pomaleji už to nejde ani po čtyřech

  // Pasivní úbytek za každý ušlý kilometr
  ZA_KM: { energie: -0.6, nohy: -0.3, nasranost: 0.25 },

  // Celková délka trasy v km. null = podle GPX (data/profil.js)
  DELKA: null,

  // Popisky na výškovém profilu: [km, text]. Krátké, ať se vejdou na mobil.
  POPISKY: [
    [15.4, "Cáb"],
    [27.8, "Soláň"],
    [38.3, "Vysoká"],
    [44.5, "Makov"],
    [54.6, "Javorník"],
    [65.0, "Kohútka"],
    [80.1, "Makyta"],
    [88.8, "Filka"],
  ],
};

// ============================================================
//  NÁHODNÉ KARTY – každá padne za hru nejvýš jednou
// ============================================================
//
//  Na začátku úseku (po pevné nástraze) padne s pravděpodobností NASTAVENI.SANCE_KARTY
//  jedna karta z těch, které splňují podmínku.
//
//  Pole karty:
//    id, nadpis, text, volby   – volby fungují stejně jako v data/trasa.js
//    podminka  – (nepovinné) kdy může karta padnout:
//        cas: ["01:00", "05:00"]   – jen v tomto čase (hodiny od startu)
//        km:  [30, 80]             – jen v tomto rozsahu km
//        flag: "hermelin"          – jen když hráč dřív zvolil volbu s tímto flagem
//        kmPoFlagu: [6, 15]        – a zároveň je 6–15 km od místa, kde flag dostal
//    vzdy      – (nepovinné) true = když podmínka platí, karta padne určitě
//                (pro následky dřívějších voleb, ať se hráč dočká)
//
//  NOVÁ KARTA: zkopíruj existující blok { … }, změň id a texty, ulož a obnov stránku.
// ============================================================

const KARTY = [
  {
    id: "halucinace",
    nadpis: "Halucinace",
    podminka: { cas: ["01:00", "05:00"] },
    text: "U cesty stojí srna. Je to pařez. Pařez tě zdraví jménem.",
    volby: [
      { text: "Pozdravit", efekt: { nasranost: -5 }, reakce: "Slušnost především." },
      { text: "Ignorovat", reakce: "Pařez se urazil. Uvidíte se příští rok." },
    ],
  },

  {
    id: "medved",
    nadpis: "Medvěd v břiše",
    podminka: { flag: "hermelin", kmPoFlagu: [6, 15] },
    vzdy: true,
    text: "Z břicha se ozve medvěd. Pak křeč.",
    volby: [
      { text: "Rychlá pauza v lese", efekt: { cas: 15, nasranost: -10 },
        reakce: "Les je velký. Les to unese." },
      { text: "Zkusit to přejít", sance: 0.5,
        uspech: { reakce: "Ustál jsi to. Hrdina." },
        neuspech: { konec: "nehoda" } },
    ],
  },

  {
    id: "bumbalka",
    nadpis: "Zkratka",
    podminka: { km: [30, 80] },
    text: "Kolega zná zkratku přes Bumbálku.",
    volby: [
      { text: "Jít s ním", efekt: { cas: 60, nohy: -10 },
        reakce: "Bumbálka. To slovo na trasu nepatří." },
      { text: "Nejít", reakce: "Kolegu jsi už nikdy neviděl. Teda až v cíli, autobusem." },
    ],
  },

  {
    id: "halenkov",
    nadpis: "Kolega končí",
    podminka: { km: [20, 70] },
    text: "Potkáš kolegu, který končí. Půjde prý do Halenkova a pak na Vsetín.",
    volby: [
      { text: "Jít s ním", konec: "halenkov" },
      { text: "Popřát mu hodně štěstí",
        reakce: "Šel stejnou trasu jako ty. Jen s jiným pocitem." },
    ],
  },

  {
    id: "earworm",
    nadpis: "Earworm",
    text: "Trojice před tebou si pouští z mobilu trampskou klasiku. Teď ji máš v hlavě do půlnoci.",
    volby: [
      { text: "Zpívat s nimi", efekt: { nasranost: -5, energie: 5 },
        reakce: "Falešně, ale od srdce." },
      { text: "Předběhnout je", efekt: { energie: -10 },
        reakce: "Písnička jde s tebou." },
    ],
  },

  {
    id: "puchyr",
    nadpis: "Puchýř",
    text: "Cítíš puchýř.",
    volby: [
      { text: "Ošetřit", efekt: { cas: 10, nohy: 5 },
        reakce: "Náplast drží. Zatím." },
      { text: "Neřešit", efekt: { nohy: -15 },
        reakce: "Puchýř si to zapamatoval." },
    ],
  },

  {
    id: "dest",
    nadpis: "Počasí",
    text: "Meteorologické hlášení: oblačnost setrvalá, srážky sílící, atmosféra dobrá.",
    volby: [
      { text: "No tak jo", efekt: { boty: 500, nasranost: 5 },
        reakce: "Boty nasály půl litru atmosféry." },
    ],
  },

  {
    id: "poldecak",
    nadpis: "Slovenský poldecák",
    text: "Slovenský špacírník nabízí poldecák.",
    volby: [
      { text: "Přijmout", efekt: { energie: 10, nasranost: -10 }, reakce: "Na zdravie!" },
      { text: "Odmítnout", reakce: "Urazil ses sám nad sebou." },
    ],
  },

  {
    id: "zizen",
    nadpis: "Žízeň",
    podminka: { flag: "zizen", kmPoFlagu: [5, 15] },
    vzdy: true,
    text: "Tři doušky by byly málo. Ty jsi u studánky nenabral ani ty.",
    volby: [
      { text: "Olíznout mokrý kámen", efekt: { energie: -15 },
        reakce: "Chutná jako kámen." },
    ],
  },

  {
    id: "fotograf",
    nadpis: "Fotograf",
    text: "Za stromem číhá fotograf. „Úsměv!“",
    volby: [
      { text: "Usmát se", efekt: { nasranost: 5 }, reakce: "Fotka bude na webu. Navždy." },
      { text: "Schovat se", efekt: { cas: 5 }, reakce: "Na fotce bude jen tvůj zadek za smrkem." },
    ],
  },
];

// ============================================================
//  TRASA 2027 – úseky a pevné nástrahy
// ============================================================
//
//  Jak to funguje: hráč přijde na začátek úseku (km), uvidí scénu (text + volby),
//  pak možná náhodnou kartu (data/karty.js) a tlačítkem „Jít dál" dojde na začátek
//  dalšího úseku. Poslední úsek končí v cíli.
//
//  Pole úseku:
//    id        – unikátní jméno (bez mezer a diakritiky)
//    misto     – název místa (zobrazí se jako nadpis a v odhlašovací SMS)
//    km        – kde úsek začíná (odhad z GPX, viz README → TODO)
//    waypoint  – (nepovinné) jméno waypointu v GPX; pokud ho GPX obsahuje, km se vezme odtud
//    znacka    – barva turistické značky v nadpisu: "cervena" | "modra" | "zelena" | "zluta" | "ruzova"
//    kde       – místo s předložkou v 6. pádě pro SMS („Končím ___ (km 42)…“), např. "na Kohútce"
//    doObce    – kam se odsud jde po odhlášení, ve 2. pádě („Jdu do ___ a pak na Vsetín")
//    text      – úvodní text scény
//    volby     – tlačítka (žádné volby = jen text a „Jít dál")
//    dovetek   – (nepovinné) věta, která se přidá za reakci na kteroukoli volbu
//    po        – (nepovinné) navazující mini-scéna { text, volby } po první volbě
//    mechanika – (nepovinné) speciální gag, viz níže; jeho čísla a hlášky jsou v "parametry"
//
//  Pole volby:
//    text      – nápis na tlačítku
//    efekt     – změny: cas (minuty), energie, nohy, nasranost, boty (gramy)
//                Záporný cas = ušetřený čas (odečte se z další chůze).
//    reakce    – hláška po volbě
//    flag      – (nepovinné) značka pro pozdější kartu, např. "hermelin"
//    konec     – (nepovinné) id konce z data/konce.js – hra tím skončí
//    bufet     – (nepovinné) true = počítá se jako návštěva bufetu (do diplomu)
//    zakazano  – (nepovinné) true = tlačítko je přeškrtnuté a nejde zmáčknout
//    poznamka  – (nepovinné) drobný text pod tlačítkem
//    hvezdicky – (nepovinné) true = po kliknutí se nabídne 5 hvězdiček k hodnocení
//    sance     – (nepovinné) pravděpodobnost úspěchu 0–1; pak se použije "uspech" nebo "neuspech"
//                (oba mohou mít efekt, reakce, flag, konec)
//
//  Mechaniky: "houpacka", "dilatace", "vecny_sestup", "nepreskocitelne", "blato", "odupavani".
//  V textech hlášek lze použít {ele} (aktuální nadmořská výška) a {minut} (odhad zbývajících minut).
// ============================================================

const TRASA = [
  {
    id: "start",
    kde: "na startu ve Vsetíně",
    misto: "Vsetín, start",
    km: 0,
    znacka: "cervena",
    doObce: "hospody",
    text: "Půlnoční zvon. Dvě stě padesát čelovek se dává do pohybu. Místní se diví, kam spěcháte, když jste přece na Vsetíně. „Abysme to stihli.“",
    volby: [
      { text: "Rozběhnout se s pelotonem", efekt: { energie: -10, cas: -10 },
        reakce: "Prvních 800 metrů v rekordním čase. Zbývá sto kilometrů." },
      { text: "Jít svým tempem", efekt: { nasranost: 5 },
        reakce: "Předběhlo tě čtyřicet lidí. Uvidíš je na Filce." },
      { text: "Ještě si odskočit", efekt: { cas: 10 },
        reakce: "Moudré. Další záchod se dveřmi je za sto kilometrů." },
    ],
  },

  {
    id: "houpacka",
    kde: "v Krošenkách",
    misto: "Lysný a Krošenky",
    km: 3.0,
    znacka: "modra",
    doObce: "Vsetína",
    text: "Na Cáb se v průměru stoupá. Terén se ale pořád nemůže rozhodnout, co vlastně chce.",
    volby: [
      { text: "Počítat převýšení", efekt: { nohy: -10 },
        reakce: "Nastoupáno 420 m. Výš jsi o 90 m. Zbytek sis jen vypůjčil." },
      { text: "Nepočítat", efekt: { nohy: -10, nasranost: -5 },
        reakce: "Nevědomost je blaženost. Nohy to spočítaly za tebe." },
      { text: "Vytáhnout hůlky", efekt: { nasranost: 5 },
        reakce: "Hůlky leží v autě na základně. Jako každý rok." },
    ],
    mechanika: "houpacka",
    parametry: {
      skoky: [60, -45, 70, -50],   // metrů při každém kliknutí na „Jít dál"
      hlasky: [
        "Nahoru. Konečně to někam vede.",
        "A zase dolů. Proč?",
        "Nahoru! Tohle už je určitě ono.",
        "Dolů. Terén si z tebe dělá prdel.",
      ],
    },
  },

  {
    id: "cab",
    kde: "na Vsackém Cábu",
    misto: "Vsacký Cáb",
    km: 15.4,
    znacka: "modra",
    doObce: "Valašské Bystřice",
    text: "Na chatě svítí okno. Ve dveřích stojí pán.",
    volby: [
      { text: "„Dobrý večer, máte otevřeno?“", efekt: { nasranost: 10 }, reakce: "Pán: „Ne.“" },
      { text: "„Můžu si aspoň doplnit vodu?“", efekt: { nasranost: 10 }, reakce: "Pán: „Ne.“" },
      { text: "„Máte to tu krásné!“", efekt: { nasranost: 10 }, reakce: "Pán: „Vím.“" },
    ],
    dovetek: "Pán zavírá dveře. Ještě zaslechneš: „A kolik vás ještě bude?“",
  },

  {
    id: "dilatace",
    kde: "mezi Tanečnicí a Ptáčnicí",
    misto: "Tanečnice → Ptáčnice",
    km: 19.7,
    znacka: "cervena",
    doObce: "Hutiska",
    text: "Jdeš pořád stejně rychle. Kilometry ne.",
    volby: [],
    mechanika: "dilatace",
    parametry: {
      kroku: 3,                                   // kolikrát se km nepohne
      efekt: { cas: 20, energie: -3, nasranost: 5 }, // za každé kliknutí
      hlasky: [
        "Dvacet minut chůze. Kilometr {km}.",
        "Dalších dvacet minut. Kilometr {km}. Pořád.",
      ],
      hlaska: "Na tomto úseku neplatí s = v·t. Stížnosti adresujte A. Einsteinovi, Bern.",
    },
  },

  {
    id: "solan",
    kde: "na Soláni",
    misto: "Soláň, svítání",
    km: 27.8,
    znacka: "zluta",
    doObce: "Hutiska",
    text: "Nad Solání vychází slunce.",
    volby: [
      { text: "Pozdravit slunce", efekt: { nasranost: -10 },
        reakce: "Krásné. Skoro jsi zapomněl, kde jsi." },
      { text: "Zeptat se ho, kde bylo v noci", efekt: { nasranost: -15 },
        reakce: "Ulevilo se ti. Slunce to nese statečně." },
      { text: "Posvačit klobásu", efekt: { energie: 15, cas: 15 },
        reakce: "Klobása. Nejlepší jídlo, jaké jsi kdy jedl. Do příští klobásy." },
    ],
  },

  {
    id: "pila",
    kde: "na hřebeni pod Vysokou",
    misto: "Soláň → Vysoká",
    km: 28.6,
    znacka: "cervena",
    doObce: "Velkých Karlovic",
    text: "U cesty cedule: „Pohodlná hřebenovka ★★★★★ (1 recenze, rok 2009).“ Profil před tebou vypadá jako pila.",
    volby: [
      { text: "Věřit recenzi", efekt: { nohy: -15 },
        reakce: "Tolik nahoru a dolů jsi naposledy zažil na akciovém trhu." },
      { text: "Napsat vlastní recenzi", hvezdicky: true, efekt: { nohy: -15 },
        reakce: "Děkujeme za hodnocení. Bude zohledněno v roce 2087." },
    ],
  },

  {
    id: "vysoka",
    kde: "na Vysoké",
    misto: "Vysoká, 1 024 m",
    km: 38.3,
    znacka: "cervena",
    doObce: "Velkých Karlovic",
    text: "Nejvyšší bod Vsetínských vrchů. Výhled na všechny strany. Kdyby nebyla mlha.",
    volby: [],
  },

  {
    id: "makov",
    kde: "na Makovském průsmyku u Partyzána",
    misto: "Makovský průsmyk, Bufet U Partyzána",
    km: 44.5,
    znacka: "zelena",
    doObce: "Makova",
    text: "Bufet! Na co máš chuť?",
    volby: [
      { text: "Párek", efekt: { energie: 20, cas: 15 }, bufet: true,
        reakce: "Párek. Hořčice. Mír v duši." },
      { text: "Pivo", efekt: { nasranost: -20, energie: -5, cas: 10 }, bufet: true,
        reakce: "Za páté pivo razítko na věrnostní kartičku." },
      { text: "Hermelín", efekt: { energie: 20, cas: 15 }, flag: "hermelin", bufet: true,
        reakce: "Výborný. Jestli ti sedl, zjistíš za pár kilometrů." },
      { text: "Nic, jdu dál", efekt: { nasranost: 10 },
        reakce: "Asketa. Respekt. Lítost." },
    ],
    po: {
      text: "Kam s kelímkem? Směsný odpad je v zeleném pytli, plasty jsou v zeleném pytli.",
      volby: [
        { text: "Do zeleného", reakce: "Správně!" },
        { text: "Do zeleného", reakce: "Taky správně!" },
      ],
    },
  },

  {
    id: "lemesna",
    kde: "na Lemešné",
    misto: "Lemešná",
    km: 45.6,
    znacka: "zelena",
    doObce: "Velkých Karlovic",
    text: "Gratulujeme! Jsi přesně v polovině. Trasy i Lemešné. Z obou stran je to psycho.",
    volby: [
      { text: "Nahoru", efekt: { nohy: -15, energie: -10 },
        reakce: "Rychle a zběsile. Lýtka podávají písemnou stížnost." },
      { text: "Nahoru, ale pomaleji", efekt: { nohy: -10, cas: 20 },
        reakce: "Pomalu, ale stejně nahoru." },
    ],
  },

  {
    id: "studanka",
    kde: "u studánky za Butorkami",
    misto: "Studánka za Butorkami",
    km: 50.0,   // druhá, mírnější část stoupání ze sedla Lemešná
    znacka: "modra",
    doObce: "Velkých Karlovic",
    text: "Studánka. Kape. Opravdu jen kape.",
    volby: [
      { text: "Počkat na plnou láhev", efekt: { cas: 47, energie: 10 },
        reakce: "Voda je ledová a výborná. Stála tě 47 minut." },
      { text: "Nabrat, co nakape", efekt: { energie: 3 },
        reakce: "Máš tři doušky. Rozvrhni je moudře." },
      { text: "Jít dál nasucho", efekt: { energie: -10 }, flag: "zizen",
        reakce: "Statečné. A hloupé." },
    ],
  },

  {
    id: "javornik",
    kde: "na Velkém Javorníku",
    misto: "Stratenec → Velký Javorník",
    km: 52.8,
    znacka: "cervena",
    doObce: "Velkých Karlovic",
    text: "„Pohodlná hřebenovka II. Navazujeme na úspěšný první díl.“ Na Javorníku pohřbíváš vzpomínku na suché ponožky.",
    volby: [
      { text: "Přezout ponožky", efekt: { nohy: 10, cas: 10 },
        reakce: "Suché ponožky. Na celých šest minut." },
      { text: "Neřešit", efekt: { nohy: -10 },
        reakce: "Ponožky se staly součástí chodidla." },
    ],
  },

  {
    id: "kohutka",
    kde: "na Kohútce",
    misto: "Kohútka",
    km: 65.0,
    znacka: "cervena",
    doObce: "Nového Hrozenkova",
    text: "Turisté, kteří sem přijeli autem, jedí borůvkové knedlíky a koukají na tebe jako na zjevení. Asi kvůli tomu, jak voníš.",
    volby: [],
  },

  {
    id: "sestup",
    kde: "na sestupu z Kohútky",
    misto: "Sestup z Kohútky",
    km: 69.0,
    znacka: "zluta",
    doObce: "Halenkova",
    text: "Teď už jen dolů. Nejdřív strmě do Papajského sedla, pak pořád dál až k Čechům. Kolena se ptají, jak dlouho.",
    volby: [],
    mechanika: "vecny_sestup",
    parametry: {
      doKm: 74.0,          // kde je konečně dole (pak se normálně pokračuje)
      tlacitko: "Už jsme dole?",
      efekt: { nohy: -2 }, // za každé kliknutí; kliknutí padnou na km 70, 71, 72, 73, 74
      hlasky: [
        "Papajské sedlo, {ele} m. Ne, dole nejsi. Jen kolena už jsou na dně. Au, au, kolena!",
        "Výškoměr: {ele} m. Ještě ne. Klesá se dál, až k Čechům.",
        "Výškoměr: {ele} m. Dole je ještě níž.",
        "Výškoměr: {ele} m. Pořád ne. Kolena podala výpověď.",
        "Výškoměr: {ele} m. Ano. Teď zase nahoru.",
      ],
    },
  },

  {
    id: "u_cechu",
    kde: "U Čechů",
    misto: "U Čechů (Kychová)",
    km: 74.0,
    znacka: "zluta",
    doObce: "Huslenek",
    text: "U Čechů. Tady se dá ještě rozumně skončit. Dál už je lepší to dojít.",
    volby: [
      { text: "Jít dál", efekt: { nasranost: 5 },
        reakce: "Rozumné rozhodnutí to nebylo." },
      { text: "Skončit", konec: "u_cechu" },
    ],
  },

  {
    id: "makyta",
    kde: "pod Makytou",
    misto: "Makyta (obchvat)",
    km: 76.1,
    znacka: "ruzova",
    doObce: "Huslenek",
    text: "Vrchol Makyty je kousek nad tebou. Cesta na něj vede kolem.",
    volby: [
      { text: "Rovně na vrchol (nejkratší)", zakazano: true, poznamka: "Z environmentálních důvodů." },
      { text: "Po růžové značce", efekt: { cas: 20 },
        reakce: "Ano, existuje růžová značka. Ne, nenajdeš ji v žádné legendě." },
    ],
  },

  {
    id: "kycera",
    kde: "někde mezi Kyčerou a Radošovem",
    misto: "Valašská Kyčera → Radošov",
    km: 80.1,
    znacka: "cervena",
    doObce: "Hovězího",
    text: "Les. Cesta. Les. Tenhle úsek si nikdo nepamatuje, protože se na něm nic neděje.",
    volby: [],
    mechanika: "nepreskocitelne",
    parametry: {
      tlacitko: "Přeskočit úsek",
      odpocet: 5,              // sekund do zpřístupnění tlačítka
      efekt: { nasranost: 15 },
      hlaska: "Úsek přeskočen. Dělám si srandu. Zbývá {minut} minut nudy.",
    },
  },

  {
    id: "filka",
    kde: "pod Filkou",
    misto: "Filka, výstup",
    km: 87.7,
    znacka: "modra",
    doObce: "Hovězího",
    text: "Filka. Kopec jak cyp. Sklon, u kterého se ohlíží i kamzík. Ale nejdřív kvíz: Jaké I se píše ve slově Filka?",
    volby: [
      { text: "Měkké", reakce: "Správně." },
      { text: "Tvrdé", reakce: "Správně." },
      { text: "Sprosté", reakce: "Správně." },
    ],
    po: {
      text: "A teď nahoru.",
      volby: [
        { text: "Klikovat", efekt: { nohy: -15 },
          reakce: "Zákruta. Další zákruta. Pořád Filka." },
        { text: "Po čtyřech", efekt: { nohy: -5, nasranost: 10 },
          reakce: "Důstojnost: 0. Výška: +200 m." },
      ],
    },
  },

  {
    id: "blato",
    kde: "v bahně pod Filkou",
    misto: "Filka, sestup",
    km: 88.8,
    znacka: "modra",
    doObce: "Vsetína",
    text: "Hasiči právě odjíždějí, proudnice ještě kapou. Orgové jen udržují tradiční vlhkost trati.",
    mechanika: "blato",
    parametry: {
      kroku: 3,
      vpred: 0.1,   // km
      vzad: 0.2,    // km
      tlacitko: "Krok vpřed",
      hlaska: "Udělal jsi krok vpřed a dva zpátky. Třikrát. Stále jsi na Filce.",
    },
    volby: [
      { text: "Krajem po trávě", efekt: { boty: 800, cas: 10 },
        reakce: "Chytrý. Skoro čistý." },
      { text: "Středem, rázně", efekt: { boty: 3500, nohy: -10 },
        reakce: "Boty jsou teď třikrát těžší." },
      { text: "Sjet po zadku", efekt: { boty: 1500, cas: -15, nasranost: -10 },
        reakce: "Nejrychlejší úsek dne. Kalhoty už nikdy nebudou stejné." },
    ],
  },

  {
    id: "cyklostezka",
    kde: "na cyklostezce kousek před cílem",
    misto: "Cyklostezka do Vsetína",
    km: 96.6,
    znacka: "zelena",
    doObce: "Vsetína",
    text: "Asfalt. Rovina. Poslední čtyři kilometry. Boty váží, kolik váží.",
    volby: [],
    mechanika: "odupavani",
    parametry: {
      zbyde: 200,   // gramů Filky na botách na posledním kilometru
      hlasky: [
        "Asfalt! Odupáváš Filku.",
        "Cyklisti tě objíždějí obloukem. Za tebou zůstává hnědá stopa.",
        "Poslední kilometr. Už jen 200 gramů Filky navíc.",
        "Nemůžeš se ani hnout. Ale až najdeš hůlky, frčíš domů.",
      ],
    },
  },
];

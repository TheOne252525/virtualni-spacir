# Virtuální Špacír

Webová klikačka: virtuální průchod trasou Špacíru 2027 (100 km za 24 h, Vsetín → Vsetín)
s klasickými nástrahami. Čisté HTML + CSS + JS, bez frameworku, bez buildu, bez CDN.

## Spuštění lokálně

Dvojklik na `index.html`. Funguje i přes `file://` (data jsou `.js`, ne JSON).

- `index.html?debug=1` – staty v číslech, aktuální rychlost a panel **Skok na úsek**.
- Úvodní tiskovou zprávu vypneš v `data/nastaveni.js` → `TISKOVKA: false`.

## Nasazení na GitHub Pages

```bash
git init
git add .
git commit -m "Virtuální Špacír"
git branch -M main
git remote add origin https://github.com/<ucet>/<repo>.git
git push -u origin main
```

Pak na GitHubu: **Settings → Pages → Build and deployment → Source: Deploy from a branch →
Branch: `main`, složka `/ (root)` → Save**. Za minutu je hra na
`https://<ucet>.github.io/<repo>/`. Všechny cesty jsou relativní, nic dalšího se nenastavuje.

(Na Pages se zveřejní i `Spacir.gpx` a `tools/`. Pokud trasu nechcete zveřejnit dopředu, GPX z repa vyřaďte.)

## Kde jsou texty

Texty se upravují jen v `data/` a k tomu není potřeba znát JS. Hlídej jen uvozovky a čárky.

| Soubor | Co obsahuje |
|---|---|
| `data/trasa.js` | úseky trasy, pevné nástrahy, volby, mechaniky (na začátku souboru je popis všech polí) |
| `data/karty.js` | náhodné karty |
| `data/konce.js` | konce hry, šablona odhlašovací SMS, texty pro sdílení |
| `data/texty.js` | úvod, tisková zpráva, popisky tlačítek |
| `data/nastaveni.js` | čísla pro balancování (rychlost, úbytky, šance na kartu), popisky na profilu |
| `data/profil.js` | **generovaný** výškový profil, ručně neupravovat |

Po úpravě stačí obnovit stránku.

## Jak přidat novou kartu

Do pole `KARTY` v `data/karty.js` přidej blok:

```js
{
  id: "klistata",                 // unikátní, bez diakritiky
  nadpis: "Klíště",
  podminka: { km: [40, 90] },     // nepovinné: km, cas ["01:00","05:00"], flag + kmPoFlagu
  text: "Na noze máš klíště. Jmenuje se Pepa.",
  volby: [
    { text: "Vytáhnout", efekt: { cas: 5 }, reakce: "Pepa odchází. Nerad." },
    { text: "Nechat", efekt: { nasranost: 5 }, reakce: "Pepa jde s tebou do cíle." },
  ],
},
```

Efekty: `cas` (minuty; záporné = ušetřený čas), `energie`, `nohy`, `nasranost`, `boty` (gramy).
Volba může mít navíc `flag`, `konec: "id_konce"` nebo `sance: 0.5` s `uspech` / `neuspech`.
Každá karta padne za hru nejvýš jednou. `vzdy: true` = padne určitě, jakmile platí podmínka.

## Výškový profil z GPX

```bash
node tools/gpx2profil.mjs Spacir.gpx
```

Skript zjednoduší stopu na ~300 bodů a zapíše `data/profil.js`. Pokud GPX obsahuje pojmenované
waypointy (`<wpt><name>…</name></wpt>`), uloží jejich km. Když se název waypointu shoduje
s polem `waypoint` úseku v `data/trasa.js`, hra použije km z GPX.

## Balancování

```bash
node tools/simulace.mjs        # 1000 her na strategii, volitelně: [pocet] [seed]
```

Aktuální stav (seed 1, 1000 her):

| Strategie | Dojde | Čas v cíli (medián) |
|---|---|---|
| náhodný, nevzdává se | **40 %** (cíl 40–60 %, na hraně) | 23:47 (polovina po limitu) |
| náhodný, včetně „Skončit" a „Jít s kolegou" | 16 % | 23:39 |
| rozumný | 100 % | **22:26** (cíl 20–23 h) |

Nejčastější příčina konce jsou nohy, nejvíc lidí padá na Filce. Hra má ~40–60 kliknutí,
odhadem 5–10 minut.

Při ladění jsem oproti zadání snížil pasivní úbytek nohou z 0,45 na **0,3 za km**. Se zadanou
hodnotou došlo jen 13 % náhodných hráčů a i rozumný hráč končil s nohama na nule.

## Co jsem rozhodl sám (oproti zadání)

- **Délka a km míst jsou z GPX** (100,66 km). GPX nemá waypointy, takže místa jsem určil
  z extrémů profilu a souřadnic. Viz TODO.
- **Věčný sestup** (z Kohútky přes Papajské sedlo, km 69 → 74): tlačítko „Už jsme dole?".
  První kliknutí padne na Papajské sedlo („Au, au, kolena!"). Výškoměr ukazuje skutečné výšky
  z profilu, při každém kliknutí nohy −2.
- **Houpačka** ukazuje počítadla „Nastoupáno celkem" a „Jsi výš o" se skoky z dat.
- **Odhlásit se:** malé tlačítko v hlavičce slouží jako dobrovolné ukončení (konec `vzdal`).
- **Medvěd v břiše** a **Žízeň** jsou následky dřívějších voleb, takže padnou vždy, když platí
  podmínka. Ostatní karty padají s šancí 35 %.
- Pokud úsek nemá volby, náhodná karta se ukáže přímo v něm. Jinak se ukáže po „Jít dál".
- **SMS skloňuje:** každý úsek má pole `kde` („na Kohútce") a `doObce` („Nového Hrozenkova").
- Doplnil jsem krátké texty tam, kde zadání nic nemělo: Vysoká, Kohútka, Makyta,
  Kyčera–Radošov, reakce na Lemešné „Nahoru", hlášky mechanik, tisková zpráva.
- Navíc je soubor `data/texty.js` (úvod, tisková zpráva, tlačítka) a `data/nastaveni.js`,
  aby žádný text nebyl v JS.

## TODO – ověřit u autora trasy

Km úseků jsou odhad z GPX profilu:

| km | Místo | Poznámka |
|---|---|---|
| 3,0 | Lysný a Krošenky (houpačka) | začátek stoupání |
| 15,4 | Vsacký Cáb | vrchol 830 m v GPX |
| 19,7 | Tanečnice → Ptáčnice (dilatace) | |
| 27,8 | Soláň | |
| 38,3 | Vysoká | max. 1 020 m |
| 44,5 | Makovský průsmyk | sedlo 795 m |
| **45,6** | **Lemešná** | **ověřit**, vrchol v GPX je na km 48,0 (940 m) |
| 50,0 | Studánka za Butorkami | podle autora: druhá, mírnější část stoupání ze sedla Lemešná |
| 52,8 | Stratenec → Velký Javorník | Javorník = km 54,6 (1 070 m) |
| 65,0 | Kohútka | |
| 69,0–74,0 | Sestup (věčný sestup) | Papajské sedlo km 70 (v GPX 70,6 / 700 m), dole 505 m |
| **74,0** | **U Čechů (Kychová)** | místo, kde se dá rozumně skončit; **ověřit**, zvoleno dno údolí za Papajským sedlem |
| 76,1–80,1 | Makyta (obchvat) | |
| 80,1 | Valašská Kyčera → Radošov | |
| 87,7 / 88,8 | Filka výstup / sestup | |
| 96,6 | Cyklostezka | posledních ~4 km |

Ověřit také obce v SMS (`doObce` v `data/trasa.js`). Jsou odhadnuté podle mapy.

## Struktura

```
index.html, style.css
js/hra.js            stav, pohyb, mechaniky (bez DOM, sdílí ho i simulace)
js/ui.js             profil, HUD, scény, konce
data/*.js            texty a čísla
tools/gpx2profil.mjs GPX → data/profil.js
tools/simulace.mjs   headless simulace
```

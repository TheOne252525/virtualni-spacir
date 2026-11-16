// ============================================================
//  HRA – stav, pohyb, mechaniky. Žádný DOM (používá ho i tools/simulace.mjs).
//  Závisí na: NASTAVENI, PROFIL, TRASA, KARTY, KONCE (data/*.js)
// ============================================================
const HRA = (function () {
  "use strict";

  const N = NASTAVENI;
  const STATY = ["energie", "nohy", "nasranost"];

  function hm(s) {
    const [h, m] = String(s).split(":").map(Number);
    return h * 60 + (m || 0);
  }
  const LIMIT = hm(N.LIMIT);
  const NOC_OD = hm(N.NOC[0]), NOC_DO = hm(N.NOC[1]);
  const DELKA = N.DELKA || PROFIL.delka;

  // --- Úseky: km zpřesněné z waypointů GPX (pokud jsou), dopočítaný konec ---
  const wpt = {};
  for (const w of PROFIL.waypointy || []) wpt[w.nazev.trim().toLowerCase()] = w.km;
  const USEKY = TRASA.map((u) => {
    const kopie = Object.assign({}, u);
    if (u.waypoint && wpt[u.waypoint.trim().toLowerCase()] !== undefined) kopie.km = wpt[u.waypoint.trim().toLowerCase()];
    return kopie;
  }).sort((a, b) => a.km - b.km);
  USEKY.forEach((u, i) => { u.konecKm = i + 1 < USEKY.length ? USEKY[i + 1].km : DELKA; u.index = i; });

  // --- Výška z profilu (lineární interpolace) ---
  function vyskaNaKm(km) {
    const b = PROFIL.body;
    if (km <= b[0].km) return b[0].ele;
    if (km >= b[b.length - 1].km) return b[b.length - 1].ele;
    let lo = 0, hi = b.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (b[mid].km <= km) lo = mid; else hi = mid; }
    const t = (km - b[lo].km) / (b[hi].km - b[lo].km || 1);
    return b[lo].ele + t * (b[hi].ele - b[lo].ele);
  }

  // --- Stav ---
  function novaHra(rng) {
    const s = N.START;
    return {
      km: 0, cas: 0,
      energie: s.energie, nohy: s.nohy, nasranost: s.nasranost, boty: s.boty,
      kredit: 0,             // ušetřené minuty (záporný „cas" z voleb), odečtou se z chůze
      flagy: {},             // flag → km, kde byl získán
      historie: [],
      pouziteKarty: [],
      usek: 0,
      konec: null,
      maxNasranost: s.nasranost,
      bufety: 0,
      rng: rng || Math.random,
    };
  }

  function aktualniUsek(stav) { return USEKY[Math.min(stav.usek, USEKY.length - 1)]; }

  function snimek(stav) {
    return { km: stav.km, cas: stav.cas, energie: stav.energie, nohy: stav.nohy, nasranost: stav.nasranost, boty: stav.boty };
  }
  function rozdil(pred, stav) {
    const d = {};
    for (const k of ["cas", "energie", "nohy", "nasranost", "boty"]) {
      const x = stav[k] - pred[k];
      if (Math.abs(x) >= 0.5) d[k] = Math.round(x);
    }
    return d;
  }

  function omez(stav) {
    for (const k of STATY) stav[k] = Math.max(0, Math.min(100, stav[k]));
    stav.boty = Math.max(0, stav.boty);
    stav.maxNasranost = Math.max(stav.maxNasranost, stav.nasranost);
  }

  function ukonci(stav, typ, extra) {
    if (stav.konec) return;
    const u = aktualniUsek(stav);
    stav.konec = Object.assign({ typ, km: stav.km, cas: stav.cas, misto: u.misto, kde: u.kde, doObce: u.doObce }, extra || {});
  }

  function zkontrolujKonec(stav) {
    if (stav.konec) return stav.konec;
    if (stav.energie <= 0) ukonci(stav, "energie");
    else if (stav.nohy <= 0) ukonci(stav, "nohy");
    else if (stav.nasranost >= 100) ukonci(stav, "nasranost");
    return stav.konec;
  }

  function aplikujEfekt(stav, efekt) {
    if (!efekt) return;
    for (const k of STATY) if (efekt[k]) stav[k] += efekt[k];
    if (efekt.boty) stav.boty += efekt.boty;
    if (efekt.cas > 0) stav.cas += efekt.cas;
    if (efekt.cas < 0) stav.kredit += -efekt.cas;
    omez(stav);
  }

  // --- Pohyb ---
  function jeNoc(cas) {
    const t = ((cas % 1440) + 1440) % 1440;
    return NOC_OD <= NOC_DO ? t >= NOC_OD && t < NOC_DO : t >= NOC_OD || t < NOC_DO;
  }

  function rychlost(stav) {
    let v = N.RYCHLOST;
    if (jeNoc(stav.cas)) v *= N.NOC_NASOBIC;
    if (stav.energie < N.UNAVA_PRAH) v *= N.UNAVA_NASOBIC;
    if (stav.nohy < N.UNAVA_PRAH) v *= N.UNAVA_NASOBIC;
    v -= N.BOTY_ZPOMALENI * stav.boty / 1000;
    return Math.max(N.MIN_RYCHLOST, v);
  }

  // Chůze vpřed po kouscích – únava a čas se počítají průběžně, konec může přijít uprostřed.
  function jdi(stav, doKm) {
    const d = doKm - stav.km;
    if (d <= 0) { stav.km = doKm; return; }
    let zbyva = d;
    while (zbyva > 1e-9 && !stav.konec) {
      const c = Math.min(0.25, zbyva);
      let dt = (c / rychlost(stav)) * 60;
      if (stav.kredit > 0) { const u = Math.min(stav.kredit, dt); dt -= u; stav.kredit -= u; }
      stav.cas += dt;
      stav.km += c;
      zbyva -= c;
      for (const k of STATY) stav[k] += N.ZA_KM[k] * c;
      omez(stav);
      zkontrolujKonec(stav);
    }
    if (!stav.konec) stav.km = doKm;
  }

  // Chůze bez postupu (bláto) – stojí jen čas
  function slapejNaMiste(stav, km) {
    stav.cas += (km / rychlost(stav)) * 60;
  }

  function odhadMinut(stav, odKm, doKm) {
    return Math.round(((doKm - odKm) / rychlost(stav)) * 60);
  }

  // --- Šablony v textech ---
  function sablona(text, stav, extra) {
    if (!text) return text;
    const hodnoty = Object.assign({
      km: formatKm(stav.km),
      ele: Math.round(vyskaNaKm(stav.km)),
      cas: formatTrvani(stav.cas),
    }, extra || {});
    return text.replace(/\{(\w+)\}/g, (m, k) => (hodnoty[k] !== undefined ? hodnoty[k] : m));
  }

  // --- Volby ---
  function vyberVolbu(stav, volba, kontext) {
    if (!volba || volba.zakazano || stav.konec) return null;
    const pred = snimek(stav);
    let v = volba, vysledekSance = null;
    if (typeof volba.sance === "number") {
      vysledekSance = stav.rng() < volba.sance;
      v = Object.assign({}, vysledekSance ? volba.uspech : volba.neuspech);
    }
    aplikujEfekt(stav, v.efekt);
    if (volba.flag) stav.flagy[volba.flag] = stav.km;
    if (v.flag) stav.flagy[v.flag] = stav.km;
    if (volba.bufet) stav.bufety++;
    stav.historie.push({ km: stav.km, cas: stav.cas, kde: kontext || aktualniUsek(stav).id, volba: volba.text });
    if (v.konec) ukonci(stav, v.konec);
    else zkontrolujKonec(stav);
    return { reakce: v.reakce ? sablona(v.reakce, stav) : "", rozdil: rozdil(pred, stav), konec: stav.konec, uspech: vysledekSance };
  }

  // --- Náhodné karty ---
  function splnujePodminku(k, stav) {
    const p = k.podminka;
    if (!p) return true;
    if (p.km && (stav.km < p.km[0] || stav.km > p.km[1])) return false;
    if (p.cas) {
      const t = ((stav.cas % 1440) + 1440) % 1440, od = hm(p.cas[0]), do_ = hm(p.cas[1]);
      const v = od <= do_ ? t >= od && t <= do_ : t >= od || t <= do_;
      if (!v) return false;
    }
    if (p.flag) {
      if (stav.flagy[p.flag] === undefined) return false;
      if (p.kmPoFlagu) {
        const d = stav.km - stav.flagy[p.flag];
        if (d < p.kmPoFlagu[0] || d > p.kmPoFlagu[1]) return false;
      }
    }
    return true;
  }

  function vyberKartu(stav) {
    if (stav.konec) return null;
    const mozne = KARTY.filter((k) => stav.pouziteKarty.indexOf(k.id) < 0 && splnujePodminku(k, stav));
    let karta = mozne.find((k) => k.vzdy) || null;
    if (!karta) {
      const nahodne = mozne.filter((k) => !k.vzdy);
      if (nahodne.length && stav.rng() < N.SANCE_KARTY) karta = nahodne[Math.floor(stav.rng() * nahodne.length)];
    }
    if (karta) stav.pouziteKarty.push(karta.id);
    return karta;
  }

  // --- Mechaniky: kroky ---
  // Krok = jedno kliknutí. Pole: tlacitko, doKm, efekt, hlaska, botyNa, naMiste (km bez postupu),
  //        animKm (pro UI: posuny km během animace), houpacka {nastoupano, vys}, gag ("preskocit")
  function predKroky(stav) {
    const u = aktualniUsek(stav);
    const p = u.parametry || {};
    if (u.mechanika !== "blato") return [];
    const kroky = [];
    let km = stav.km;
    for (let i = 0; i < p.kroku; i++) {
      km = km + p.vpred - p.vzad;
      kroky.push({
        tlacitko: p.tlacitko,
        doKm: Math.max(u.km - 1, km),
        naMiste: p.vpred + p.vzad,
        animKm: [p.vpred, -p.vzad],
        hlaska: i === p.kroku - 1 ? p.hlaska : "",
      });
    }
    return kroky;
  }

  function krokyChuze(stav) {
    const u = aktualniUsek(stav);
    const p = u.parametry || {};
    const start = stav.km, cil = u.konecKm;
    const kroky = [];
    const jitDal = TEXTY.tlacitkoJitDal;

    switch (u.mechanika) {
      case "houpacka": {
        let nastoupano = 0, vys = 0;
        p.skoky.forEach((s, i) => {
          if (s > 0) nastoupano += s;
          vys += s;
          kroky.push({
            tlacitko: jitDal,
            doKm: start + ((cil - start) * (i + 1)) / p.skoky.length,
            hlaska: (p.hlasky || [])[i] || "",
            houpacka: { nastoupano, vys, skok: s },
          });
        });
        break;
      }
      case "dilatace": {
        for (let i = 0; i < p.kroku; i++) {
          kroky.push({
            tlacitko: jitDal, doKm: start, efekt: p.efekt,
            hlaska: i === p.kroku - 1 ? p.hlaska : (p.hlasky || [])[i] || "",
          });
        }
        kroky.push({ tlacitko: jitDal, doKm: cil });
        break;
      }
      case "vecny_sestup": {
        const dole = Math.min(p.doKm || cil, cil);
        const n = p.hlasky.length;
        for (let i = 0; i < n; i++) {
          kroky.push({ tlacitko: p.tlacitko, doKm: start + ((dole - start) * (i + 1)) / n, efekt: p.efekt, hlaska: p.hlasky[i] });
        }
        if (dole < cil) kroky.push({ tlacitko: jitDal, doKm: cil });
        break;
      }
      case "nepreskocitelne": {
        kroky.push({ gag: "preskocit", tlacitko: p.tlacitko, doKm: start, hlaska: p.hlaska, minut: odhadMinut(stav, start, cil), odpocet: p.odpocet });
        kroky.push({ tlacitko: jitDal, doKm: cil, efekt: p.efekt });
        break;
      }
      case "odupavani": {
        const n = p.hlasky.length;
        const b0 = stav.boty, zbyde = p.zbyde;
        for (let i = 1; i <= n; i++) {
          const podil = Math.min(i, n - 1) / Math.max(1, n - 1);
          kroky.push({
            tlacitko: jitDal,
            doKm: start + ((cil - start) * i) / n,
            botyNa: Math.round(b0 + (zbyde - b0) * podil),
            hlaska: p.hlasky[i - 1],
          });
        }
        break;
      }
      default:
        kroky.push({ tlacitko: jitDal, doKm: cil });
    }
    return kroky;
  }

  function aplikujKrok(stav, krok) {
    if (stav.konec) return { konec: stav.konec, rozdil: {} };
    const pred = snimek(stav);
    if (krok.naMiste) slapejNaMiste(stav, krok.naMiste);
    if (krok.doKm > stav.km) jdi(stav, krok.doKm);
    else stav.km = krok.doKm;
    if (!stav.konec) {
      aplikujEfekt(stav, krok.efekt);
      if (typeof krok.botyNa === "number") stav.boty = krok.botyNa;
      omez(stav);
      zkontrolujKonec(stav);
    }
    return {
      hlaska: sablona(krok.hlaska, stav, { minut: krok.minut }),
      rozdil: rozdil(pred, stav),
      konec: stav.konec,
    };
  }

  function dalsiUsek(stav) {
    if (stav.konec) return stav.konec;
    stav.usek++;
    if (stav.usek >= USEKY.length) {
      stav.usek = USEKY.length - 1;
      stav.km = DELKA;
      ukonci(stav, stav.cas <= LIMIT ? "lezun" : "neoficialni");
    }
    return stav.konec;
  }

  function vzdat(stav) { ukonci(stav, "vzdal"); return stav.konec; }

  // Debug: skok na úsek (čas se odhadne, staty zůstanou)
  function skokNaUsek(stav, i) {
    const u = USEKY[i];
    if (!u) return;
    stav.usek = i;
    stav.cas = Math.max(stav.cas, Math.round((u.km / N.RYCHLOST) * 60 * 1.1));
    stav.km = u.km;
  }

  // --- Formátování ---
  function formatKm(km) { return (Math.round(km * 10) / 10).toFixed(1).replace(".", ","); }
  function dvojmistne(n) { return String(n).padStart(2, "0"); }
  function formatHodiny(cas) {
    const c = Math.max(0, Math.floor(cas));
    const den = Math.floor(c / 1440);
    const t = c % 1440;
    return { den, text: dvojmistne(Math.floor(t / 60)) + ":" + dvojmistne(t % 60) };
  }
  function formatTrvani(cas) {
    const c = Math.max(0, Math.floor(cas));
    return Math.floor(c / 60) + ":" + dvojmistne(c % 60);
  }

  return {
    USEKY, DELKA, LIMIT,
    novaHra, aktualniUsek, vyskaNaKm, rychlost, jeNoc,
    vyberVolbu, vyberKartu, predKroky, krokyChuze, aplikujKrok, dalsiUsek, vzdat, skokNaUsek,
    sablona, formatKm, formatHodiny, formatTrvani, hm,
  };
})();

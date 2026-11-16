// ============================================================
//  UI – vykreslení profilu, HUD, scén, mechanik a konců.
//  Herní logika je v js/hra.js, texty v data/*.js.
// ============================================================
(function () {
  "use strict";

  const T = TEXTY;
  const DEBUG = new URLSearchParams(location.search).get("debug") === "1";
  const MALO_POHYBU = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PRERUSENO = { preruseno: true };

  const app = document.getElementById("app");
  let stav = null;
  let beh = 0;          // token běhu herní smyčky (skok v debugu / odhlášení ji přeruší)
  let hud = null;
  let oblast = null;    // kontejner scén
  let profilId = 0;

  // ---------- pomocné ----------
  function el(tag, props, ...deti) {
    const e = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === "class") e.className = v;
        else if (k === "text") e.textContent = v;
        else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const d of deti.flat()) {
      if (d === null || d === undefined || d === false) continue;
      e.append(d.nodeType ? d : document.createTextNode(String(d)));
    }
    return e;
  }
  const SVGNS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }
  const cekej = (ms) => new Promise((r) => setTimeout(r, ms));
  function hlidej(token) { if (token !== beh) throw PRERUSENO; }
  function znacka(barva) { return el("span", { class: "znacka z-" + (barva || "cervena"), "aria-hidden": "true" }); }
  function gramy(n) { return Math.round(n).toLocaleString("cs-CZ"); }
  function snimek() {
    return { km: stav.km, cas: stav.cas, energie: stav.energie, nohy: stav.nohy, nasranost: stav.nasranost, boty: stav.boty };
  }
  function ukaz(prvek) {
    if (!prvek || MALO_POHYBU) return;
    requestAnimationFrame(() => prvek.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }
  function toast(text) {
    const t = el("div", { class: "toast", role: "status", text });
    document.body.append(t);
    setTimeout(() => t.classList.add("pryc"), 2200);
    setTimeout(() => t.remove(), 2700);
  }

  // ---------- výškový profil ----------
  function vytvorProfil() {
    const id = "prosleno" + ++profilId;
    const W = 400, H = 104, X0 = 6, X1 = 394, YT = 34, YB = 96;
    const D = HRA.DELKA, minE = PROFIL.minEle, maxE = PROFIL.maxEle;
    const x = (km) => X0 + ((X1 - X0) * km) / D;
    const y = (e) => YB - ((YB - YT) * (e - minE)) / (maxE - minE);
    const body = PROFIL.body;
    const cara = body.map((b, i) => (i ? "L" : "M") + x(b.km).toFixed(1) + "," + y(b.ele).toFixed(1)).join("");
    const plocha = cara + `L${x(D).toFixed(1)},${H}L${x(0).toFixed(1)},${H}Z`;

    const koren = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "profil-svg", role: "img", "aria-label": "Výškový profil trasy" });
    const defs = svg("defs");
    const clip = svg("clipPath", { id });
    const obd = svg("rect", { x: 0, y: 0, width: 0, height: H });
    clip.append(obd); defs.append(clip); koren.append(defs);
    koren.append(svg("path", { d: plocha, class: "profil-plocha" }));
    koren.append(svg("path", { d: plocha, class: "profil-proslo", "clip-path": `url(#${id})` }));
    koren.append(svg("path", { d: cara, class: "profil-cara" }));

    (NASTAVENI.POPISKY || []).forEach(([km, text], i) => {
      const px = x(km), py = y(HRA.vyskaNaKm(km));
      const ty = i % 2 ? 23 : 11;
      koren.append(svg("line", { x1: px, y1: py - 3, x2: px, y2: ty + 3, class: "profil-tick" }));
      const t = svg("text", {
        x: px, y: ty, class: "profil-popisek",
        "text-anchor": px < 30 ? "start" : px > W - 30 ? "end" : "middle",
      });
      t.textContent = text;
      koren.append(t);
    });

    const panak = svg("g", { class: "panak" });
    panak.append(svg("line", { x1: 0, y1: 0, x2: 0, y2: H, class: "panak-cara" }));
    panak.append(svg("circle", { cx: 0, cy: 0, r: 9, class: "panak-zare" }));
    panak.append(svg("circle", { cx: 0, cy: 0, r: 5.5, class: "panak-bod" }));
    koren.append(panak);

    return {
      svg: koren,
      nastav(km) {
        const px = x(km), py = y(HRA.vyskaNaKm(km));
        obd.setAttribute("width", px.toFixed(1));
        panak.setAttribute("transform", `translate(${px.toFixed(1)},${py.toFixed(1)})`);
      },
    };
  }

  // ---------- HUD ----------
  function vytvorHud() {
    const profil = vytvorProfil();
    const km = el("span", { class: "hud-km" });
    const hodiny = el("span", { class: "hud-hodiny" });
    const bary = {};
    const barEls = ["energie", "nohy", "nasranost"].map((k) => {
      const vypln = el("span", { class: "bar-vypln" });
      const cislo = el("span", { class: "bar-cislo" });
      bary[k] = { vypln, cislo, obal: null };
      const obal = el("div", { class: "bar bar-" + k },
        el("div", { class: "bar-popis" }, el("span", { text: T.bary[k] }), cislo),
        el("div", { class: "bar-draha" }, vypln));
      bary[k].obal = obal;
      return obal;
    });
    const boty = el("span", { class: "hud-boty" });
    const rychlost = el("span", { class: "hud-debug" });
    const vzdat = el("button", { class: "hud-vzdat", type: "button", onclick: odhlasit }, T.tlacitkoVzdat);
    const root = el("header", { class: "hud" },
      profil.svg,
      el("div", { class: "hud-obsah" },
        el("div", { class: "hud-radek" }, km, hodiny),
        el("div", { class: "bary" }, barEls),
        el("div", { class: "hud-radek hud-maly" }, el("span", null, boty, DEBUG ? rychlost : null), vzdat)));
    return { root, profil, km, hodiny, bary, boty, rychlost, vzdat };
  }

  function vykresliHud(s) {
    hud.km.innerHTML = "";
    hud.km.append("km ", el("b", { text: HRA.formatKm(s.km) }), " / " + HRA.formatKm(HRA.DELKA));
    const h = HRA.formatHodiny(s.cas);
    hud.hodiny.textContent = (T.dny[h.den] || "někdy") + " " + h.text;
    hud.hodiny.classList.toggle("pozde", s.cas > HRA.LIMIT);
    for (const k of ["energie", "nohy", "nasranost"]) {
      const v = s[k];
      const b = hud.bary[k];
      b.vypln.style.width = v + "%";
      b.cislo.textContent = DEBUG ? Math.round(v) : "";
      b.obal.classList.toggle("kriticke", k === "nasranost" ? v >= 75 : v < 25);
    }
    hud.boty.textContent = `${T.bary.boty}: +${gramy(s.boty)} g`;
    if (DEBUG) hud.rychlost.textContent = ` · ${HRA.rychlost(stav).toFixed(2)} km/h · kredit ${Math.round(stav.kredit)} min`;
    hud.profil.nastav(s.km);
  }

  function animujUsek(z, na, ms) {
    return new Promise((hotovo) => {
      if (MALO_POHYBU || ms <= 0) { vykresliHud(na); hotovo(); return; }
      const t0 = performance.now();
      function snimekAnimace(t) {
        const p = Math.min(1, (t - t0) / ms);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        vykresliHud(Object.assign({}, na, { km: z.km + (na.km - z.km) * e, cas: z.cas + (na.cas - z.cas) * e }));
        if (p < 1) requestAnimationFrame(snimekAnimace); else hotovo();
      }
      requestAnimationFrame(snimekAnimace);
    });
  }
  function animuj(pred) {
    const po = snimek();
    const ms = Math.min(1500, 350 + 110 * Math.abs(po.km - pred.km));
    return animujUsek(pred, po, ms);
  }
  async function animujBlato(pred, posuny) {
    const po = snimek();
    let km = pred.km;
    const casZa = (po.cas - pred.cas) / posuny.length;
    let cas = pred.cas;
    for (const d of posuny) {
      const z = Object.assign({}, po, { km, cas });
      km += d; cas += casZa;
      await animujUsek(z, Object.assign({}, po, { km, cas }), d > 0 ? 300 : 650);
    }
    vykresliHud(po);
  }

  // ---------- scény ----------
  function novaScena({ nadpis, barva, stitek, typ }) {
    const telo = el("div", { class: "karta-telo" });
    const karta = el("section", { class: "karta vjezd" + (typ ? " karta-" + typ : "") },
      el("div", { class: "karta-hlava" }, znacka(barva), el("h2", { text: nadpis }), stitek ? el("span", { class: "karta-stitek", text: stitek }) : null),
      telo);
    oblast.replaceChildren(karta);
    window.scrollTo(0, 0);
    return telo;
  }

  function chips(r) {
    const box = el("div", { class: "chips" });
    const def = [
      ["energie", T.bary.energie, 1, ""], ["nohy", T.bary.nohy, 1, ""], ["nasranost", T.bary.nasranost, -1, ""],
      ["cas", "Čas", -1, " min"], ["boty", T.bary.boty, -1, " g"],
    ];
    for (const [k, popis, smer, jednotka] of def) {
      const v = r && r[k];
      if (!v) continue;
      const hodnota = k === "boty" ? gramy(Math.abs(v)) : Math.abs(v);
      box.append(el("span", { class: "chip " + (v * smer > 0 ? "dobre" : "spatne") }, `${popis} ${v > 0 ? "+" : "−"}${hodnota}${jednotka}`));
    }
    return box;
  }

  function tlacitkoHlavni(kam, text, barva, token, nahradit) {
    return new Promise((hotovo, chyba) => {
      const b = el("button", { class: "tlacitko-hlavni z-" + (barva || "cervena"), type: "button" }, text);
      b.addEventListener("click", () => {
        b.disabled = true;
        if (token !== beh) { chyba(PRERUSENO); return; }
        b.remove();
        hotovo();
      }, { once: true });
      if (nahradit) kam.replaceChildren(b); else kam.append(b);
      ukaz(b);
    });
  }

  function hvezdicky(kam) {
    return new Promise((hotovo) => {
      const rada = el("div", { class: "hvezdicky", role: "group", "aria-label": T.hvezdickyVyzva });
      const tlacitka = [];
      for (let i = 1; i <= 5; i++) {
        const b = el("button", { type: "button", class: "hvezda", "aria-label": i + " z 5" }, "★");
        b.addEventListener("click", () => {
          tlacitka.forEach((t, j) => { t.disabled = true; t.classList.toggle("plna", j < i); });
          setTimeout(() => hotovo(i), 350);
        });
        tlacitka.push(b);
      }
      rada.append(...tlacitka);
      kam.append(el("p", { class: "vyzva", text: T.hvezdickyVyzva }), rada);
      ukaz(rada);
    });
  }

  // Zobrazí text + volby scény (nebo karty), počká na volbu, vyhodnotí ji a ukáže reakci.
  async function volbyScena(telo, scena, barva, kontext, token) {
    if (scena.text) telo.append(el("p", { class: "text", text: HRA.sablona(scena.text, stav) }));
    const volby = scena.volby || [];
    if (!volby.length) return null;
    const box = el("div", { class: "volby" });
    telo.append(box);
    const tlacitka = [];
    const volba = await new Promise((hotovo) => {
      for (const v of volby) {
        const b = el("button", { class: "volba z-" + barva, type: "button", disabled: !!v.zakazano }, v.text);
        b._volba = v;
        b.addEventListener("click", () => hotovo(v));
        tlacitka.push(b);
        box.append(v.poznamka ? el("div", { class: "volba-obal" }, b, el("small", { class: "poznamka", text: v.poznamka })) : b);
      }
      ukaz(box);
    });
    hlidej(token);
    for (const b of tlacitka) {
      b.disabled = true;
      if (b._volba === volba) b.classList.add("zvoleno");
      else if (!b._volba.zakazano) (b.parentElement.classList.contains("volba-obal") ? b.parentElement : b).classList.add("nezvoleno");
    }
    if (volba.hvezdicky) { await hvezdicky(telo); hlidej(token); }
    const pred = snimek();
    const vysl = HRA.vyberVolbu(stav, volba, kontext);
    let reakce = vysl.reakce || "";
    if (scena.dovetek) reakce = (reakce ? reakce + " " : "") + scena.dovetek;
    const blok = el("div", { class: "reakce-blok", "aria-live": "polite" },
      reakce ? el("p", { class: "reakce", text: reakce }) : null,
      chips(vysl.rozdil));
    telo.append(blok);
    ukaz(blok);
    await animuj(pred);
    return vysl;
  }

  // ---------- mechaniky ----------
  function houpackaDisplej() {
    const nast = el("b", { text: "0 m" }), vys = el("b", { text: "0 m" });
    const skok = el("span", { class: "skok" });
    const root = el("div", { class: "vyskomery" },
      el("div", { class: "vyskomer" }, el("span", { text: T.houpacka.nastoupano }), nast),
      el("div", { class: "vyskomer" }, el("span", { text: T.houpacka.vys }), vys, skok));
    return {
      root,
      nastav(h) {
        if (!h) return;
        nast.textContent = h.nastoupano + " m";
        vys.textContent = h.vys + " m";
        skok.textContent = (h.skok > 0 ? "+" : "−") + Math.abs(h.skok) + " m";
        skok.className = "skok " + (h.skok > 0 ? "nahoru" : "dolu");
        void skok.offsetWidth; skok.classList.add("blik");
      },
    };
  }

  function preskocGag(kam, krok, token) {
    return new Promise((hotovo, chyba) => {
      const b = el("button", { class: "tlacitko-hlavni z-cervena skip", type: "button" });
      kam.replaceChildren(b);
      ukaz(b);
      let pokus = 0, zbyva = 0, casovac = null;
      const text = krok.tlacitko || "Přeskočit";
      function tik() {
        if (token !== beh) { clearTimeout(casovac); return; }
        b.textContent = zbyva > 0 ? `${text} (${zbyva})` : `${text} ⏭`;
        b.disabled = zbyva > 0;
        if (zbyva > 0) casovac = setTimeout(() => { zbyva--; tik(); }, 1000);
      }
      function start() { zbyva = krok.odpocet || 5; tik(); }
      b.addEventListener("click", () => {
        if (token !== beh) { chyba(PRERUSENO); return; }
        pokus++;
        if (pokus >= 2) { clearTimeout(casovac); b.remove(); hotovo(); } else start();
      });
      start();
    });
  }

  async function mechanikaKroky(telo, kroky, u, token, jePred) {
    const panel = el("div", { class: "mechanika m-" + u.mechanika });
    telo.append(panel);
    const displej = u.mechanika === "houpacka" ? houpackaDisplej() : null;
    if (displej) panel.append(displej.root);
    const hlaska = el("p", { class: "hlaska", "aria-live": "polite" });
    const chipBox = el("div");
    const akce = el("div", { class: "akce" });
    panel.append(hlaska, chipBox, akce);
    const posledniUsek = u.index === HRA.USEKY.length - 1;

    for (const k of kroky) {
      if (k.gag === "preskocit") await preskocGag(akce, k, token);
      else await tlacitkoHlavni(akce, k.tlacitko || T.tlacitkoJitDal, u.znacka, token, true);
      hlidej(token);
      const pred = snimek();
      const vysl = HRA.aplikujKrok(stav, k);
      if (k.animKm) await animujBlato(pred, k.animKm); else await animuj(pred);
      hlidej(token);
      if (displej) displej.nastav(k.houpacka);
      hlaska.textContent = vysl.hlaska || "";
      hlaska.classList.remove("blik"); void hlaska.offsetWidth; hlaska.classList.add("blik");
      chipBox.replaceChildren(chips(vysl.rozdil));
      ukaz(akce);
      if (stav.konec) return;
    }
    const posledni = kroky[kroky.length - 1];
    if (!jePred && posledni && posledni.hlaska) {
      await tlacitkoHlavni(akce, posledniUsek ? T.tlacitkoCil : T.tlacitkoJitDal, u.znacka, token, true);
    }
  }

  // ---------- herní smyčka (stejný průběh jako v tools/simulace.mjs) ----------
  async function smycka(token) {
    let telo = null;
    try {
      while (!stav.konec) {
        const u = HRA.aktualniUsek(stav);
        const posledniUsek = u.index === HRA.USEKY.length - 1;
        telo = novaScena({ nadpis: u.misto, barva: u.znacka, stitek: "km " + HRA.formatKm(stav.km) });
        let interakce = false;

        if (u.text) telo.append(el("p", { class: "text", text: HRA.sablona(u.text, stav) }));

        // 1) mechanika před volbami (bláto)
        const pred = HRA.predKroky(stav);
        if (pred.length) { await mechanikaKroky(telo, pred, u, token, true); interakce = true; }
        if (stav.konec) break;

        // 2) pevná nástraha
        if ((u.volby || []).length) {
          await volbyScena(telo, { volby: u.volby, dovetek: u.dovetek }, u.znacka, u.id, token);
          interakce = true;
          if (u.po && !stav.konec) {
            telo.append(el("hr", { class: "oddel" }));
            await volbyScena(telo, u.po, u.znacka, u.id, token);
          }
        }
        if (stav.konec) break;

        // 3) náhodná karta
        const karta = HRA.vyberKartu(stav);
        if (karta) {
          if (interakce) {
            await tlacitkoHlavni(telo, T.tlacitkoJitDal, u.znacka, token);
            telo = novaScena({ nadpis: karta.nadpis, barva: "ruzova", stitek: T.nahodaNadpis, typ: "nahoda" });
          } else {
            const vlozka = el("div", { class: "karta-vlozka" },
              el("div", { class: "vlozka-hlava" }, znacka("ruzova"), el("strong", { text: karta.nadpis }), el("span", { class: "karta-stitek", text: T.nahodaNadpis })));
            telo.append(vlozka);
            await volbyScena(vlozka, karta, "ruzova", karta.id, token);
          }
          if (interakce) await volbyScena(telo, karta, "ruzova", karta.id, token);
          if (stav.konec) break;
        }

        // 4) chůze
        const kroky = HRA.krokyChuze(stav);
        const jednoduche = kroky.length === 1 && !kroky[0].hlaska && !kroky[0].gag;
        if (jednoduche) {
          await tlacitkoHlavni(telo, posledniUsek ? T.tlacitkoCil : T.tlacitkoJitDal, u.znacka, token);
          const p = snimek();
          HRA.aplikujKrok(stav, kroky[0]);
          await animuj(p);
        } else {
          await mechanikaKroky(telo, kroky, u, token, false);
        }
        hlidej(token);
        if (stav.konec) break;
        HRA.dalsiUsek(stav);
      }
      hlidej(token);
      const def = KONCE.typy[stav.konec.typ] || {};
      if (def.predzvest && telo) {
        telo.append(el("p", { class: "reakce predzvest", text: def.predzvest }));
      }
      if (telo && !["lezun", "neoficialni"].includes(stav.konec.typ)) {
        await tlacitkoHlavni(telo, T.tlacitkoKonec, "cervena", token);
      }
      zobrazKonec();
    } catch (e) {
      if (e !== PRERUSENO) throw e;
    }
  }

  function odhlasit() {
    if (!stav || stav.konec) return;
    if (!window.confirm(T.potvrzeniVzdat)) return;
    beh++;
    HRA.vzdat(stav);
    zobrazKonec();
  }

  // ---------- konec ----------
  function zobrazKonec() {
    const k = stav.konec;
    const def = KONCE.typy[k.typ] || KONCE.typy.vzdal;
    vykresliHud(snimek());
    hud.vzdat.hidden = true;
    const hodnoty = {
      misto: def.misto || k.misto,
      kde: def.kde || k.kde || "na místě " + k.misto,
      km: HRA.formatKm(k.km),
      cas: HRA.formatTrvani(k.cas),
      obec: def.doObce || k.doObce,
      duvod: def.duvod || "",
    };
    const s = (t) => String(t || "").replace(/\{(\w+)\}/g, (m, x) => (hodnoty[x] !== undefined ? hodnoty[x] : m));
    const telo = novaScena({ nadpis: def.nadpis, barva: def.znacka, typ: "konec " + k.typ });

    if (k.typ === "lezun") {
      const d = def.diplom;
      telo.append(el("div", { class: "diplom" },
        el("div", { class: "diplom-pruhy" }, ["cervena", "modra", "zelena", "zluta", "ruzova"].map((b) => el("span", { class: "z-" + b }))),
        el("p", { class: "diplom-nad", text: T.nazev + " 2027" }),
        el("p", { class: "diplom-titul", text: def.nadpis }),
        el("dl", null,
          el("dt", { text: d.cas }), el("dd", { text: HRA.formatTrvani(k.cas) }),
          el("dt", { text: d.boty }), el("dd", { text: "+" + gramy(stav.boty) + " g" }),
          el("dt", { text: d.nasranost }), el("dd", { text: Math.round(stav.maxNasranost) + " / 100" }),
          el("dt", { text: d.bufety }), el("dd", { text: String(stav.bufety) }))));
    }
    telo.append(el("p", { class: "text", text: s(def.text) }));

    const akce = el("div", { class: "akce konec-akce" });
    const ukazAkce = () => {
      akce.replaceChildren(
        el("button", { class: "tlacitko-hlavni z-zelena", type: "button", onclick: () => sdilej(s(def.sdileni)) }, T.tlacitkoSdilet),
        el("button", { class: "tlacitko-vedlejsi", type: "button", onclick: startHry }, T.tlacitkoZnovu));
      ukaz(akce);
    };

    if (def.sms !== false) {
      const stavSms = el("div", { class: "sms-stav" });
      const sms = el("div", { class: "sms" },
        el("div", { class: "sms-hlava" }, el("span", { class: "sms-avatar", text: "O" }), el("span", { text: "Orgové Špacíru" })),
        el("div", { class: "sms-bublina", text: s(KONCE.sms) }),
        stavSms);
      telo.append(sms);
      const odeslat = el("button", { class: "tlacitko-hlavni z-modra", type: "button" }, KONCE.tlacitkoOdeslat);
      odeslat.addEventListener("click", () => {
        odeslat.remove();
        sms.classList.add("odeslano");
        stavSms.textContent = "Doručeno ✓✓";
        telo.insertBefore(el("p", { class: "reakce", text: KONCE.odeslano }), akce);
        ukazAkce();
      }, { once: true });
      akce.append(odeslat);
      telo.append(akce);
    } else {
      telo.append(akce);
      ukazAkce();
    }
  }

  async function sdilej(text) {
    const url = /^https?:/.test(location.protocol) ? location.origin + location.pathname : "";
    if (navigator.share) {
      try { await navigator.share({ title: T.nazev, text, url: url || undefined }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    const plny = url ? text + " " + url : text;
    try {
      await navigator.clipboard.writeText(plny);
      toast(T.zkopirovano);
      return;
    } catch (e) { /* file:// nebo starý prohlížeč – zkusíme postaru */ }
    const ta = el("textarea", { class: "skryte", readonly: true });
    ta.value = plny;
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    if (ok) toast(T.zkopirovano); else window.prompt("Zkopíruj si:", plny);
  }

  // ---------- úvodní obrazovky ----------
  function pruhy() {
    return el("div", { class: "pruhy", "aria-hidden": "true" }, ["cervena", "modra", "zelena", "zluta", "ruzova"].map((b) => el("span", { class: "z-" + b })));
  }

  function zobrazTiskovku() {
    const tz = T.tiskovka;
    app.replaceChildren(el("main", { class: "obrazovka tiskovka vjezd" },
      el("div", { class: "tz-hlavicka" }, znacka("cervena"), el("span", { text: tz.hlavicka })),
      el("p", { class: "tz-misto", text: tz.misto }),
      el("h1", { text: tz.titulek }),
      tz.odstavce.map((p) => el("p", { text: p })),
      el("button", { class: "tlacitko-hlavni z-cervena", type: "button", onclick: zobrazIntro }, tz.tlacitko)));
    window.scrollTo(0, 0);
  }

  function zobrazIntro() {
    const profil = vytvorProfil();
    profil.nastav(0);
    app.replaceChildren(el("main", { class: "obrazovka uvod vjezd" },
      pruhy(),
      el("h1", { text: T.nazev }),
      el("p", { class: "podtitul", text: T.podtitul }),
      el("div", { class: "uvod-profil" }, profil.svg),
      T.intro.map((p) => el("p", { text: p })),
      el("p", { class: "gag" }, znacka("zluta"), el("span", { text: T.introGag })),
      el("button", { class: "tlacitko-hlavni z-cervena velke", type: "button", onclick: startHry }, T.tlacitkoStart)));
    window.scrollTo(0, 0);
  }

  function debugPanel() {
    const vyber = el("select", { "aria-label": "Úsek" },
      HRA.USEKY.map((u, i) => el("option", { value: i }, `${HRA.formatKm(u.km)} – ${u.misto}`)));
    return el("div", { class: "debug-panel" },
      vyber,
      el("button", {
        type: "button",
        onclick: () => {
          beh++;
          stav.konec = null;
          hud.vzdat.hidden = false;
          HRA.skokNaUsek(stav, Number(vyber.value));
          vykresliHud(snimek());
          smycka(beh);
        },
      }, "Skok na úsek"));
  }

  function startHry() {
    beh++;
    stav = HRA.novaHra();
    hud = vytvorHud();
    oblast = el("main", { class: "oblast" });
    app.replaceChildren(...[hud.root, oblast, DEBUG ? debugPanel() : null].filter(Boolean));
    vykresliHud(snimek());
    smycka(beh);
  }

  if (DEBUG) document.body.classList.add("debug");
  if (NASTAVENI.TISKOVKA) zobrazTiskovku(); else zobrazIntro();
})();

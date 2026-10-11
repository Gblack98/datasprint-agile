(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const css = getComputedStyle(document.documentElement);
  const T = (nom) => css.getPropertyValue('--' + nom).trim();
  const POLICE = '"Bricolage Grotesque", system-ui, sans-serif';
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
  const u = (n) => (n * rem()) / 16;
  const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const JOUR_MS = 864e5;
  const NOMS_JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const INIT_JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const COLONNES = ['date_commande', 'produit', 'categorie', 'quantite', 'prix_unitaire', 'canal', 'zone'];

  const nombres = (opts) => {
    const f = new Intl.NumberFormat('fr-FR', opts);
    return { format: (n) => f.format(n).replace(/\u202f/g, '\u00a0') };
  };
  const nf = nombres();
  const nf2 = nombres({ maximumFractionDigits: 2 });
  const nfPct = nombres({ minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmtJour = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const fmtLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const fmtSemaine = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });

  const date = (j) => new Date(j * JOUR_MS);
  const jourSemaine = (j) => (date(j).getUTCDay() + 6) % 7;
  const maj = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const entier = (n) => nf.format(Math.round(n));
  const fcfa = (n) => entier(n) + ' FCFA';
  const court = (n) => (n >= 1e6 ? nf2.format(n / 1e6) + ' M' : n >= 1e3 ? entier(n / 1e3) + ' k' : entier(n));
  const part = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  const somme = (rows, f) => rows.reduce((a, r) => a + f(r), 0);
  const grouper = (rows, cle, val = (r) => r.ca) => {
    const m = new Map();
    for (const r of rows) m.set(cle(r), (m.get(cle(r)) || 0) + val(r));
    return m;
  };
  const trier = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);

  let lignes = [];
  let jMin = 0, jMax = 0, j0 = 0, nbSem = 1;
  const etat = { periode: 0, categorie: 'toutes', canal: 'tous' };

  function nombre(v) {
    return Number(String(v).replace(/[\s  ]/g, '').replace(',', '.'));
  }

  function lire(texte) {
    const res = Papa.parse(texte.replace(/^﻿/, ''), { header: true, skipEmptyLines: true });
    const manque = COLONNES.filter((c) => !(res.meta.fields || []).includes(c));
    if (manque.length) throw new Error('colonnes manquantes : ' + manque.join(', '));
    const out = [];
    for (const r of res.data) {
      const j = Math.floor(Date.parse(r.date_commande + 'T00:00:00Z') / JOUR_MS);
      const q = nombre(r.quantite);
      const p = nombre(r.prix_unitaire);
      if (!Number.isFinite(j) || !Number.isFinite(q) || !Number.isFinite(p)) continue;
      out.push({ j, produit: r.produit.trim(), categorie: r.categorie.trim(), canal: r.canal.trim(), zone: r.zone.trim(), q, ca: q * p });
    }
    if (!out.length) throw new Error('aucune ligne exploitable');
    return out;
  }

  function fenetre() {
    if (etat.periode === 'tout') return { debut: jMin, fin: jMax, nom: nbSem + ' semaines', precedent: null };
    const k = etat.periode;
    const debut = j0 + 7 * k;
    return {
      debut, fin: debut + 6, nom: 'Semaine ' + (k + 1),
      precedent: k > 0 ? { debut: debut - 7, fin: debut - 1, nom: 'Semaine ' + k } : null,
    };
  }

  function filtrer(w, { sansCategorie = false } = {}) {
    return lignes.filter((r) =>
      r.j >= w.debut && r.j <= w.fin &&
      (sansCategorie || etat.categorie === 'toutes' || r.categorie === etat.categorie) &&
      (etat.canal === 'tous' || r.canal === etat.canal));
  }

  const graphes = {};
  function graphe(id) {
    if (!graphes[id]) {
      const el = $(id);
      graphes[id] = echarts.init(el, null, { renderer: 'svg' });
      new ResizeObserver(() => graphes[id].resize()).observe(el);
    }
    return graphes[id];
  }
  const maj_option = (id, option) => graphe(id).setOption(option, { replaceMerge: ['series'] });

  const anim = { animationDuration: calme ? 0 : 650, animationEasing: 'cubicOut', animationDurationUpdate: calme ? 0 : 450 };
  const infobulle = () => ({
    backgroundColor: T('encre'), borderWidth: 0, padding: [10, 13], confine: true,
    textStyle: { color: '#f4efe4', fontFamily: POLICE, fontSize: u(13) },
    extraCssText: 'border-radius:12px;box-shadow:0 12px 28px -8px rgba(0,0,0,.45);',
  });
  const ligneInfo = (couleur, valeur, nom) =>
    '<div style="display:flex;align-items:center;gap:9px;margin-top:5px">' +
    '<i style="width:14px;height:2px;border-radius:2px;background:' + couleur + '"></i>' +
    '<b style="font-size:15px;font-weight:650">' + esc(valeur) + '</b>' +
    '<span style="color:#a9bbbd">' + esc(nom) + '</span></div>';
  const enTete = (texte) => '<div style="color:#a9bbbd;font-size:12px">' + esc(texte) + '</div>';

  const texteAxe = () => ({ color: T('encre-3'), fontFamily: POLICE, fontSize: u(12) });

  function tableau(id, entetes, rows, numeriques) {
    const el = $(id);
    el.textContent = '';
    const t = document.createElement('table');
    const tete = t.createTHead().insertRow();
    entetes.forEach((h, i) => {
      const th = document.createElement('th');
      th.textContent = h;
      if (numeriques.includes(i)) th.className = 'num';
      tete.append(th);
    });
    const corps = t.createTBody();
    for (const ligne of rows) {
      const tr = corps.insertRow();
      ligne.forEach((c, i) => {
        const td = tr.insertCell();
        td.textContent = c;
        if (numeriques.includes(i)) td.className = 'num';
      });
    }
    el.append(t);
  }

  function legende(id, items) {
    const ul = $(id);
    ul.textContent = '';
    for (const it of items) {
      const li = document.createElement('li');
      const i = document.createElement('i');
      i.style.background = it.couleur;
      li.append(i);
      if (it.fort) {
        li.append(it.nom + ' ');
        const b = document.createElement('b');
        b.textContent = it.fort;
        li.append(b);
        if (it.detail) li.append(' · ' + it.detail);
      } else {
        li.append(it.nom);
      }
      ul.append(li);
    }
  }

  function barresH(id, noms, valeurs, couleurs, etiquette, info, epaisseur = 18) {
    const max = Math.max(...valeurs, 1);
    const h = $(id).clientHeight;
    const ep = h > 30 ? Math.max(5, Math.min(u(epaisseur), h / (noms.length * 1.9))) : u(epaisseur);
    maj_option(id, {
      ...anim,
      grid: { left: 0, right: 8, top: 4, bottom: 4, containLabel: true },
      xAxis: { type: 'value', show: false, max: max * 1.45 },
      yAxis: {
        type: 'category', inverse: true, data: noms,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: T('encre-2'), fontFamily: POLICE, fontSize: u(13.5), width: u(132), overflow: 'truncate', margin: u(12) },
      },
      tooltip: { ...infobulle(), trigger: 'item', formatter: (p) => info(p.dataIndex) },
      series: [{
        type: 'bar', barWidth: ep,
        data: valeurs.map((v, i) => ({ value: v, itemStyle: { color: couleurs[i], borderRadius: [0, 4, 4, 0] } })),
        label: {
          show: true, position: 'right', distance: u(8),
          formatter: (p) => etiquette(p.dataIndex),
          rich: {
            v: { color: T('encre'), fontFamily: POLICE, fontSize: u(13), fontWeight: 650 },
            p: { color: T('encre-3'), fontFamily: POLICE, fontSize: u(12.5) },
          },
        },
        emphasis: { focus: 'self' },
        blur: { itemStyle: { opacity: 0.5 } },
      }],
    });
  }

  const kpi = (rows) => {
    const ca = somme(rows, (r) => r.ca);
    return { ca, n: rows.length, q: somme(rows, (r) => r.q), p: rows.length ? ca / rows.length : 0 };
  };

  function fleche(haut) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', haut ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7');
    svg.append(path);
    return svg;
  }

  function delta(id, a, b, w) {
    const el = $(id);
    el.textContent = '';
    el.className = 'delta';
    const note = document.createElement('span');
    if (!w.precedent) {
      note.textContent = etat.periode === 'tout' ? 'sur ' + nbSem + ' semaines' : 'première semaine';
      el.append(note);
      return;
    }
    if (!b) { note.textContent = 'pas de référence'; el.append(note); return; }
    const v = ((a - b) / b) * 100;
    if (Math.abs(v) < 0.05) { el.append('Stable'); note.textContent = 'vs ' + w.precedent.nom.toLowerCase(); el.append(note); return; }
    el.classList.add(v > 0 ? 'delta--haut' : 'delta--bas');
    el.append(fleche(v > 0), (v > 0 ? '+' : '−') + nfPct.format(Math.abs(v)) + ' %');
    note.textContent = 'vs ' + w.precedent.nom.toLowerCase();
    el.append(note);
  }

  function afficherKpi(cur, prev, w) {
    $('k-ca').textContent = court(cur.ca);
    $('k-n').textContent = entier(cur.n);
    $('k-q').textContent = entier(cur.q);
    $('k-p').textContent = entier(cur.p);
    $('k-ca').title = fcfa(cur.ca);
    $('k-p').title = fcfa(cur.p);
    delta('d-ca', cur.ca, prev && prev.ca, w);
    delta('d-n', cur.n, prev && prev.n, w);
    delta('d-q', cur.q, prev && prev.q, w);
    delta('d-p', cur.p, prev && prev.p, w);
  }

  function dessinerEvolution(w, cur, prev) {
    const jours = [];
    for (let j = w.debut; j <= w.fin; j++) jours.push(j);
    const mCur = grouper(cur, (r) => r.j);
    const serie = jours.map((j) => mCur.get(j) || 0);
    let seriePrec = null;
    if (w.precedent) {
      const mPrec = grouper(prev, (r) => r.j);
      seriePrec = jours.map((_, i) => mPrec.get(w.precedent.debut + i) || 0);
    }
    const court7 = jours.length <= 7;
    const etiq = (j) => (court7 ? fmtSemaine : fmtJour).format(date(j));
    const jade = T('indigo');
    const max = Math.max(...serie);

    const series = [];
    if (seriePrec) {
      series.push({
        name: w.precedent.nom, type: 'line', data: seriePrec, smooth: 0.28, showSymbol: false, z: 1,
        lineStyle: { width: 2, color: T('precedent') }, itemStyle: { color: T('precedent') },
        emphasis: { disabled: true },
      });
    }
    series.push({
      name: w.nom, type: 'line', data: serie, smooth: 0.28, z: 3,
      symbol: 'circle', symbolSize: u(9), showSymbol: false,
      lineStyle: { width: 2, color: jade },
      itemStyle: { color: jade, borderColor: T('carte'), borderWidth: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(62,76,182,0.16)' }, { offset: 1, color: 'rgba(62,76,182,0)' }] } },
      markPoint: max > 0 ? {
        data: [{ type: 'max' }], symbol: 'circle', symbolSize: u(11), animation: false,
        itemStyle: { color: T('safran'), borderColor: T('carte'), borderWidth: 2 },
        label: { show: true, position: 'top', distance: u(6), formatter: (p) => court(p.value), color: T('encre'), fontFamily: POLICE, fontSize: u(12.5), fontWeight: 650 },
      } : undefined,
    });

    maj_option('g-evolution', {
      ...anim,
      grid: { left: 4, right: 26, top: 30, bottom: 6, containLabel: true },
      xAxis: {
        type: 'category', data: jours.map(etiq), boundaryGap: false,
        axisTick: { show: false }, axisLine: { lineStyle: { color: T('trait') } },
        axisLabel: { ...texteAxe(), margin: u(14), hideOverlap: true, interval: court7 ? 0 : (i) => i % 7 === 0 },
      },
      yAxis: {
        type: 'value', min: 0, splitNumber: 4,
        axisLabel: { ...texteAxe(), formatter: (v) => court(v) },
        splitLine: { lineStyle: { color: T('trait'), width: 1, type: 'solid' } },
      },
      tooltip: {
        ...infobulle(), trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: T('encre-3'), width: 1, type: 'solid' } },
        formatter: (p) => {
          const i = p[0].dataIndex;
          let html = enTete(maj(fmtLong.format(date(jours[i]))));
          html += ligneInfo(jade, fcfa(serie[i]), w.nom);
          if (seriePrec) html += ligneInfo(T('precedent'), fcfa(seriePrec[i]), w.precedent.nom + ' · ' + fmtJour.format(date(w.precedent.debut + i)));
          return html;
        },
      },
      series,
    });

    legende('leg-evolution', seriePrec
      ? [{ nom: w.nom, couleur: jade }, { nom: w.precedent.nom, couleur: T('precedent') }]
      : []);

    const entetes = seriePrec ? ['Date', w.nom + ' (FCFA)', w.precedent.nom + ' (FCFA)'] : ['Date', 'CA (FCFA)'];
    tableau('t-evolution', entetes, jours.map((j, i) =>
      seriePrec ? [maj(fmtLong.format(date(j))), entier(serie[i]), entier(seriePrec[i])] : [maj(fmtLong.format(date(j))), entier(serie[i])]),
    seriePrec ? [1, 2] : [1]);
  }

  function dessinerJours(w, cur) {
    const m = grouper(cur, (r) => jourSemaine(r.j));
    const nb = grouper(cur, (r) => jourSemaine(r.j), () => 1);
    const vals = INIT_JOURS.map((_, i) => m.get(i) || 0);
    const max = Math.max(...vals);
    $('s-jours').textContent = etat.periode === 'tout'
      ? "Chiffre d'affaires cumulé sur " + nbSem + ' semaines, en FCFA'
      : "Chiffre d'affaires de la semaine, en FCFA";

    maj_option('g-jours', {
      ...anim,
      grid: { left: 2, right: 6, top: 30, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category', data: INIT_JOURS, axisTick: { show: false },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.14)' } },
        axisLabel: { color: T('bande-texte'), fontFamily: POLICE, fontSize: u(12.5), margin: u(12) },
      },
      yAxis: {
        type: 'value', min: 0, splitNumber: 3,
        axisLabel: { color: T('bande-texte'), fontFamily: POLICE, fontSize: u(11.5), formatter: (v) => court(v) },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.09)', width: 1, type: 'solid' } },
      },
      tooltip: {
        ...infobulle(), trigger: 'item',
        formatter: (p) => enTete(maj(NOMS_JOURS[p.dataIndex])) + ligneInfo(T('safran-clair'), fcfa(vals[p.dataIndex]), (nb.get(p.dataIndex) || 0) + ' commandes'),
      },
      series: [{
        type: 'bar', barWidth: $('g-jours').clientWidth > 40 ? Math.max(6, Math.min(u(20), $('g-jours').clientWidth / (7 * 1.9))) : u(20),
        data: vals.map((v, i) => ({
          value: v,
          itemStyle: { color: v === max && max > 0 ? T('safran-clair') : T('ardoise'), borderRadius: [4, 4, 0, 0] },
          label: { show: v === max && max > 0, position: 'top', distance: u(7), formatter: () => court(v), color: T('bande-clair'), fontFamily: POLICE, fontSize: u(12.5), fontWeight: 650 },
        })),
        emphasis: { focus: 'self' }, blur: { itemStyle: { opacity: 0.55 } },
      }],
    });

    tableau('t-tab-jours', ['Jour', 'CA (FCFA)', 'Commandes'],
      INIT_JOURS.map((_, i) => [maj(NOMS_JOURS[i]), entier(vals[i]), String(nb.get(i) || 0)]), [1, 2]);
  }

  function dessinerCategories(w) {
    const rows = filtrer(w, { sansCategorie: true });
    const tri = trier(grouper(rows, (r) => r.categorie));
    const total = somme(tri, (e) => e[1]);
    const choisie = etat.categorie !== 'toutes';
    $('s-categories').textContent = choisie ? 'Catégorie choisie en couleur, les autres en gris' : "Part du chiffre d'affaires";
    barresH('g-categories', tri.map((e) => e[0]), tri.map((e) => e[1]),
      tri.map((e) => (!choisie || e[0] === etat.categorie ? T('indigo') : T('contexte'))),
      (i) => '{v|' + court(tri[i][1]) + '}{p|  ' + part(tri[i][1], total) + ' %}',
      (i) => enTete(tri[i][0]) + ligneInfo(T('indigo'), fcfa(tri[i][1]), part(tri[i][1], total) + ' % du total'));
    tableau('t-categories', ['Catégorie', 'CA (FCFA)', 'Part'],
      tri.map((e) => [e[0], entier(e[1]), part(e[1], total) + ' %']), [1, 2]);
  }

  function dessinerTop(rows) {
    const ca = grouper(rows, (r) => r.produit);
    const qte = grouper(rows, (r) => r.produit, (r) => r.q);
    const cat = new Map(rows.map((r) => [r.produit, r.categorie]));
    const top = trier(ca).slice(0, 5);
    barresH('g-top', top.map((e) => e[0]), top.map((e) => e[1]), top.map(() => T('indigo')),
      (i) => '{v|' + court(top[i][1]) + '}{p|  ' + qte.get(top[i][0]) + ' u.}',
      (i) => enTete(top[i][0] + ' · ' + cat.get(top[i][0])) + ligneInfo(T('indigo'), fcfa(top[i][1]), qte.get(top[i][0]) + ' unités vendues'));
    tableau('t-top', ['Rang', 'Produit', 'CA (FCFA)', 'Unités'],
      top.map((e, i) => [String(i + 1), e[0], entier(e[1]), String(qte.get(e[0]))]), [2, 3]);
  }

  const COULEURS_CANAL = () => ({ Boutique: T('indigo'), Web: T('safran') });

  function dessinerCanalZone(rows) {
    const total = somme(rows, (r) => r.ca);
    const cCanal = COULEURS_CANAL();
    const canaux = trier(grouper(rows, (r) => r.canal)).sort((a, b) => (a[0] === 'Boutique' ? -1 : b[0] === 'Boutique' ? 1 : 0));
    const couleur = (c) => cCanal[c] || T('rose');

    maj_option('g-canal', {
      ...anim,
      grid: { left: 0, right: 0, top: 6, bottom: 6 },
      xAxis: { type: 'value', show: false, max: Math.max(total, 1) },
      yAxis: { type: 'category', show: false, data: ['canal'] },
      tooltip: {
        ...infobulle(), trigger: 'item',
        formatter: (p) => enTete(p.seriesName) + ligneInfo(couleur(p.seriesName), fcfa(p.value), part(p.value, total) + ' % du total'),
      },
      series: canaux.map(([nom, v], i) => ({
        name: nom, type: 'bar', stack: 'canal', barWidth: u(16), data: [v],
        itemStyle: {
          color: couleur(nom), borderColor: T('carte'), borderWidth: 2,
          borderRadius: canaux.length === 1 ? 4 : i === 0 ? [4, 0, 0, 4] : i === canaux.length - 1 ? [0, 4, 4, 0] : 0,
        },
        emphasis: { focus: 'self' }, blur: { itemStyle: { opacity: 0.55 } },
      })),
    });
    legende('leg-canal', canaux.map(([nom, v]) => ({ nom, couleur: couleur(nom), fort: part(v, total) + ' %', detail: court(v) })));

    const zones = trier(grouper(rows, (r) => r.zone));
    barresH('g-zone', zones.map((e) => e[0]), zones.map((e) => e[1]), zones.map(() => T('indigo')),
      (i) => '{v|' + court(zones[i][1]) + '}{p|  ' + part(zones[i][1], total) + ' %}',
      (i) => enTete('Zone · ' + zones[i][0]) + ligneInfo(T('indigo'), fcfa(zones[i][1]), part(zones[i][1], total) + ' % du total'), 14);

    tableau('t-canal', ['Type', 'Nom', 'CA (FCFA)', 'Part'], [
      ...canaux.map(([n, v]) => ['Canal', n, entier(v), part(v, total) + ' %']),
      ...zones.map(([n, v]) => ['Zone', n, entier(v), part(v, total) + ' %']),
    ], [2, 3]);
  }

  function phrase(parts) {
    const li = document.createElement('li');
    for (const p of parts) {
      if (typeof p === 'string') li.append(p);
      else { const s = document.createElement('strong'); s.textContent = p.fort; li.append(s); }
    }
    return li;
  }

  function dessinerConstats(w, rows, rowsToutesCat) {
    const ol = $('constats');
    ol.textContent = '';
    if (!rows.length) { ol.append(phrase(['Aucune vente pour ces filtres.'])); return; }
    const total = somme(rows, (r) => r.ca);

    if (etat.periode === 'tout') {
      const [jr, v] = trier(grouper(rows, (r) => jourSemaine(r.j)))[0];
      ol.append(phrase(['Le ', { fort: NOMS_JOURS[jr] }, ' est le meilleur jour de la semaine : ' + part(v, total) + " % du chiffre d'affaires sur " + nbSem + ' semaines.']));
    } else {
      const [j, v] = trier(grouper(rows, (r) => r.j))[0];
      ol.append(phrase([{ fort: maj(fmtLong.format(date(j))) }, ' est le meilleur jour : ' + fcfa(v) + ", soit " + part(v, total) + " % du chiffre d'affaires de la semaine."]));
    }

    if (etat.categorie === 'toutes') {
      const cats = trier(grouper(rowsToutesCat, (r) => r.categorie));
      const tot = somme(cats, (e) => e[1]);
      if (cats.length > 1) {
        ol.append(phrase([{ fort: cats[0][0] }, " fait " + part(cats[0][1], tot) + " % du chiffre d'affaires, devant ", { fort: cats[1][0] }, ' (' + part(cats[1][1], tot) + ' %).']));
      } else {
        ol.append(phrase(['Toutes les ventes viennent de la catégorie ', { fort: cats[0][0] }, '.']));
      }
    } else {
      const prods = trier(grouper(rows, (r) => r.produit));
      const u = somme(rows.filter((r) => r.produit === prods[0][0]), (r) => r.q);
      ol.append(phrase(['Dans ' + etat.categorie + ', ', { fort: prods[0][0] }, ' réalise ' + part(prods[0][1], total) + " % du chiffre d'affaires (" + u + ' unités).']));
    }

    const zone = trier(grouper(rows, (r) => r.zone))[0];
    if (etat.canal === 'tous') {
      const canaux = trier(grouper(rows, (r) => r.canal));
      if (canaux.length > 1) {
        ol.append(phrase(['Le canal ', { fort: canaux[0][0] }, ' porte ' + part(canaux[0][1], total) + ' % des ventes, et ', { fort: zone[0] }, ' concentre ' + part(zone[1], total) + " % du chiffre d'affaires."]));
        return;
      }
    }
    ol.append(phrase(['Sur le canal ' + (etat.canal === 'tous' ? 'choisi' : etat.canal) + ', ', { fort: zone[0] }, ' concentre ' + part(zone[1], total) + " % du chiffre d'affaires."]));
  }

  function segmenter(id, options, valeur, quand) {
    const el = $(id);
    el.textContent = '';
    for (const o of options) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(o.valeur === valeur));
      b.textContent = o.label;
      if (o.titre) { b.title = o.titre; b.setAttribute('aria-label', o.titre); }
      b.addEventListener('click', () => {
        el.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', 'false'));
        b.setAttribute('aria-checked', 'true');
        quand(o.valeur);
      });
      el.append(b);
    }
  }

  function construireFiltres() {
    const periodes = [];
    for (let k = 0; k < nbSem; k++) {
      const d = j0 + 7 * k;
      periodes.push({ valeur: k, label: 'S' + (k + 1), titre: 'Semaine ' + (k + 1) + ' : du ' + fmtJour.format(date(d)) + ' au ' + fmtJour.format(date(d + 6)) });
    }
    periodes.push({ valeur: 'tout', label: 'Tout', titre: 'Toute la période' });
    segmenter('f-periode', periodes, etat.periode, (v) => { etat.periode = v; rendre(); });

    const sel = $('f-categorie');
    sel.textContent = '';
    const cats = [...new Set(lignes.map((r) => r.categorie))].sort((a, b) => a.localeCompare(b, 'fr'));
    for (const [v, l] of [['toutes', 'Toutes les catégories'], ...cats.map((c) => [c, c])]) {
      const o = document.createElement('option');
      o.value = v; o.textContent = l;
      sel.append(o);
    }
    sel.value = etat.categorie;
    sel.onchange = () => { etat.categorie = sel.value; rendre(); };

    const canaux = [...new Set(lignes.map((r) => r.canal))].sort((a, b) => (a === 'Boutique' ? -1 : b === 'Boutique' ? 1 : a.localeCompare(b, 'fr')));
    segmenter('f-canal', [{ valeur: 'tous', label: 'Tous' }, ...canaux.map((c) => ({ valeur: c, label: c }))], etat.canal, (v) => { etat.canal = v; rendre(); });
  }

  function rendre() {
    const w = fenetre();
    const cur = filtrer(w);
    const prec = w.precedent ? filtrer(w.precedent) : null;
    const annee = date(w.fin).getUTCFullYear();
    $('periode-texte').textContent = (etat.periode === 'tout' ? 'Ventes' : w.nom) + ' : du ' + fmtJour.format(date(w.debut)) + ' au ' + fmtJour.format(date(w.fin)) + ' ' + annee;

    const vide = cur.length === 0;
    $('message-vide').hidden = !vide;
    $('grille').classList.toggle('est-vide', vide);

    afficherKpi(kpi(cur), prec && kpi(prec), w);
    dessinerEvolution(w, cur, prec);
    dessinerJours(w, cur);
    dessinerCategories(w);
    dessinerTop(cur);
    dessinerCanalZone(cur);
    dessinerConstats(w, cur, filtrer(w, { sansCategorie: true }));
  }

  function initialiser(rows) {
    lignes = rows;
    jMin = Math.min(...rows.map((r) => r.j));
    jMax = Math.max(...rows.map((r) => r.j));
    j0 = jMin - jourSemaine(jMin);
    nbSem = Math.floor((jMax - j0) / 7) + 1;
    etat.periode = nbSem - 1;
    etat.categorie = 'toutes';
    etat.canal = 'tous';
    const h = new URLSearchParams(location.hash.slice(1));
    const s = h.get('s');
    if (s === 'tout') etat.periode = 'tout';
    else if (s && Number(s) >= 1 && Number(s) <= nbSem) etat.periode = Number(s) - 1;
    if (rows.some((r) => r.categorie === h.get('c'))) etat.categorie = h.get('c');
    if (rows.some((r) => r.canal === h.get('k'))) etat.canal = h.get('k');
    construireFiltres();
    rendre();
  }

  // Tableau jumeau de chaque graphique
  document.querySelectorAll('.btn-tableau').forEach((btn) => {
    btn.addEventListener('click', () => {
      const carte = btn.closest('.carte, .jours');
      const actif = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!actif));
      btn.textContent = actif ? 'Tableau' : 'Graphique';
      carte.querySelector('.vue-graphique').hidden = !actif;
      carte.querySelector('.vue-tableau').hidden = actif;
      if (actif) Object.values(graphes).forEach((g) => g.resize());
    });
  });

  let remAvant = rem();
  let minuteur;
  window.addEventListener('resize', () => {
    clearTimeout(minuteur);
    minuteur = setTimeout(() => {
      if (lignes.length && Math.abs(rem() - remAvant) > 0.3) { remAvant = rem(); rendre(); }
    }, 150);
  });

  async function demarrer() {
    try {
      const rep = await fetch('../donnees/ventes.csv');
      if (!rep.ok) throw new Error('HTTP ' + rep.status);
      initialiser(lire(await rep.text()));
    } catch (e) {
      $('chargement').hidden = false;
    }
  }

  $('fichier').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      initialiser(lire(await f.text()));
      $('chargement').hidden = true;
    } catch (err) {
      $('ch-texte').textContent = 'Fichier illisible : ' + err.message + '.';
    }
  });

  const attente = new Promise((ok) => setTimeout(ok, 900));
  Promise.race([document.fonts ? document.fonts.ready : attente, attente]).then(demarrer);
})();

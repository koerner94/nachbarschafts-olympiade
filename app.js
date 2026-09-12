/* Nachbarschafts-Olympiade – App
   Daten liegen als JSON im GitHub-Projekt. Zuschauer lesen nur.
   Wer den Admin-Modus freischaltet und einen GitHub-Schluessel hinterlegt,
   schreibt Aenderungen direkt in das Projekt zurueck – alle anderen sehen sie
   beim naechsten Aktualisieren. */

const DATEIEN = ['konfig.json', 'teilnehmer.json', 'spiele.json', 'ergebnisse.json', 'spruecke.json'];
const SPEICHER = 'olympiade.';

/* Zwei Links auf dieselbe App:
   .../            -> Zuschauer, kann nur lesen
   .../?eintragen  -> Veranstalter, kann nach PIN-Eingabe Ergebnisse eintragen  */
const DARF_EINTRAGEN =
  new URLSearchParams(location.search).has('eintragen') || location.hash.includes('eintragen');

const zustand = {
  konfig: null,
  teilnehmer: null,
  spiele: null,
  ergebnisse: null,
  spruecke: null,
  ansicht: 'rangliste',
  offenesSpiel: null,
  admin: DARF_EINTRAGEN && localStorage.getItem(SPEICHER + 'admin') === '1',
  token: localStorage.getItem(SPEICHER + 'token') || '',
  shas: {},
  dreckig: {},   /* Dateien mit Aenderungen, die noch nicht in GitHub stehen */
  merker: {},    /* die zugehoerigen Daten fuer einen zweiten Sendeversuch */
  laedt: false,
  offline: false,
  zuletzt: null,
  uhr: { laeuft: false, start: 0, dauer: 0, ticker: null }
};

/* ================= Hilfen ================= */

const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(text, dauer = 2600) {
  const t = $('#toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, dauer);
}

function zahl(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}

function zeitText(sek) {
  if (sek === null) return '–';
  const m = Math.floor(sek / 60);
  const s = sek % 60;
  return m > 0 ? `${m}:${s.toFixed(1).padStart(4, '0')} min` : `${s.toFixed(1)} s`;
}

function team(id) {
  return zustand.konfig.teams.find((t) => t.id === id) || { name: '?', farbe: '#888', emoji: '' };
}

function jetzt() {
  return new Date().toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
}

/* ================= Laden ================= */

let rohGeht = true; /* wird auf false gesetzt, sobald GitHub-Roh-Zugriff nicht klappt */

function rohUrl(datei) {
  const g = zustand.konfig?.github;
  if (rohGeht && g && g.besitzer && g.repo && !g.besitzer.startsWith('DEIN')) {
    return `https://raw.githubusercontent.com/${g.besitzer}/${g.repo}/${g.zweig || 'main'}/daten/${datei}?t=${Date.now()}`;
  }
  return null;
}

/* Holt eine Datei. Drei Quellen, in dieser Reihenfolge:
   1. Mit GitHub-Schluessel direkt ueber die Schnittstelle – immer der allerneueste Stand.
   2. Die Kopie auf der eigenen Seite. Die ist frisch, sobald GitHub die Seite neu
      gebaut hat (etwa eine Minute nach dem Speichern).
   3. Die Rohfassung bei GitHub. Die haengt bis zu fuenf Minuten hinterher, weil
      GitHub sie zwischenspeichert – deshalb nur als Notnagel. */
async function holeDatei(datei) {
  const g = zustand.konfig?.github;

  if (zustand.token && g?.besitzer && g?.repo) {
    try {
      const r = await fetch(
        `https://api.github.com/repos/${g.besitzer}/${g.repo}/contents/daten/${datei}?ref=${g.zweig || 'main'}&t=${Date.now()}`,
        { headers: { Authorization: 'Bearer ' + zustand.token, Accept: 'application/vnd.github.raw' }, cache: 'no-store' });
      if (r.ok) return await r.json();
    } catch (e) { /* weiter mit Quelle 2 */ }
  }

  try {
    const r = await fetch(`daten/${datei}?t=${Date.now()}`, { cache: 'no-store' });
    if (r.ok) return await r.json();
  } catch (e) { /* weiter mit Quelle 3 */ }

  const roh = rohUrl(datei);
  if (roh) {
    const r = await fetch(roh, { cache: 'no-store' });
    if (r.ok) return await r.json();
    if (r.status === 404) rohGeht = false;
  }
  throw new Error('Konnte ' + datei + ' nicht laden');
}

async function ladeAlles(still = false) {
  if (zustand.laedt) return;
  zustand.laedt = true;
  $('#knopf-neu').classList.add('dreht');
  try {
    if (!zustand.konfig) {
      const r = await fetch('daten/konfig.json?t=' + Date.now(), { cache: 'no-store' });
      zustand.konfig = await r.json();
    }
    /* allSettled statt all: wenn eine einzelne Datei zickt, sollen die anderen
       trotzdem ankommen. Sonst faellt die ganze App auf den alten Stand zurueck. */
    const geladen = await Promise.allSettled(DATEIEN.map(holeDatei));
    const schluessel = { 'konfig.json': 'konfig', 'teilnehmer.json': 'teilnehmer', 'spiele.json': 'spiele', 'ergebnisse.json': 'ergebnisse', 'spruecke.json': 'spruecke' };
    let geklappt = 0;
    DATEIEN.forEach((datei, i) => {
      if (geladen[i].status !== 'fulfilled') return;
      geklappt++;
      /* Eigene, noch nicht gespeicherte Eingaben duerfen nicht ueberschrieben werden. */
      if (!zustand.dreckig[datei]) zustand[schluessel[datei]] = geladen[i].value;
    });
    if (!geklappt) throw new Error('Keine einzige Datei erreichbar');
    zustand.offline = false;
    zustand.zuletzt = new Date();
    localStorage.setItem(SPEICHER + 'cache', JSON.stringify({
      konfig: zustand.konfig, teilnehmer: zustand.teilnehmer, spiele: zustand.spiele,
      ergebnisse: zustand.ergebnisse, spruecke: zustand.spruecke, zeit: Date.now()
    }));
  } catch (e) {
    zustand.offline = true;
    const cache = localStorage.getItem(SPEICHER + 'cache');
    if (cache && !zustand.spiele) {
      const c = JSON.parse(cache);
      Object.assign(zustand, { konfig: c.konfig, teilnehmer: c.teilnehmer, spiele: c.spiele, ergebnisse: c.ergebnisse, spruecke: c.spruecke });
      zustand.zuletzt = new Date(c.zeit);
    }
    if (!still) toast('Keine Verbindung – zeige den letzten Stand');
  } finally {
    zustand.laedt = false;
    $('#knopf-neu').classList.remove('dreht');
    zeichne();
  }
}

/* ================= Speichern in GitHub ================= */

function b64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

async function speichere(datei, objekt, nachricht) {
  const g = zustand.konfig.github;
  zustand.merker[datei] = { objekt, nachricht };
  if (!zustand.token) {
    zustand.dreckig[datei] = nachricht || 'Änderung';
    toast('Ohne GitHub-Schlüssel nur auf diesem Handy gespeichert');
    return false;
  }
  const basis = `https://api.github.com/repos/${g.besitzer}/${g.repo}/contents/daten/${datei}`;
  const kopf = {
    Authorization: 'Bearer ' + zustand.token,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };
  try {
    for (let versuch = 0; versuch < 2; versuch++) {
      if (!zustand.shas[datei]) {
        const g1 = await fetch(`${basis}?ref=${g.zweig || 'main'}&t=${Date.now()}`, { headers: kopf, cache: 'no-store' });
        if (g1.ok) zustand.shas[datei] = (await g1.json()).sha;
      }
      const r = await fetch(basis, {
        method: 'PUT',
        headers: kopf,
        body: JSON.stringify({
          message: nachricht || 'Olympiade: ' + datei + ' aktualisiert',
          content: b64(JSON.stringify(objekt, null, 2) + '\n'),
          sha: zustand.shas[datei],
          branch: g.zweig || 'main'
        })
      });
      if (r.ok) {
        zustand.shas[datei] = (await r.json()).content.sha;
        delete zustand.dreckig[datei];
        delete zustand.merker[datei];
        return true;
      }
      if (r.status === 409 || r.status === 422) { zustand.shas[datei] = null; continue; }
      const txt = await r.text();
      zustand.dreckig[datei] = nachricht || 'Änderung';
      toast('Speichern fehlgeschlagen (' + r.status + ') – bleibt vorerst hier');
      console.error(txt);
      return false;
    }
    toast('Speichern fehlgeschlagen – jemand war schneller. Bitte neu laden.');
    return false;
  } catch (e) {
    zustand.dreckig[datei] = nachricht || 'Änderung';
    toast('Kein Netz – Eintrag gemerkt, wird später gesendet');
    console.error(e);
    return false;
  }
}

/* Versucht offene Aenderungen erneut zu senden (laeuft bei jedem Aktualisieren mit). */
async function nachsenden() {
  if (!zustand.token) return;
  for (const datei of Object.keys(zustand.dreckig)) {
    const m = zustand.merker[datei];
    if (m) await speichere(datei, m.objekt, m.nachricht);
  }
}

async function speichereErgebnisse() {
  zustand.ergebnisse.aktualisiert = new Date().toISOString();
  const ok = await speichere('ergebnisse.json', zustand.ergebnisse, 'Ergebnis eingetragen');
  if (ok) toast('Gespeichert – alle sehen es jetzt');
  zeichne();
  return ok;
}

/* ================= Show: Kommentator, Konfetti, Fanfare ================= */

/* Wie steht das Spiel gerade? Daraus waehlt der Kommentator seine Schublade. */
function situation() {
  const { punkte, fertig } = punktestand();
  const entschieden = new Set(fertig.map((x) => x.spiel.id));
  const offeneSpiele = aktiveSpiele().filter((sp) => !entschieden.has(sp.id));
  const offen = offeneSpiele.length;
  /* Wie viele Punkte sind ueberhaupt noch zu holen? Danach richtet sich, ob es
     noch spannend ist – nicht nach der blossen Zahl der offenen Spiele.
     Das Finale allein ist fast ein Drittel des Tages wert. */
  const offenePunkte = offeneSpiele.reduce((n, sp) => n + sp.punkte, 0);
  const d = Math.abs(punkte.a - punkte.b);
  const f = punkte.a > punkte.b ? 'a' : 'b';
  const v = f === 'a' ? 'b' : 'a';
  const lage = { f, v, d, offen, offenePunkte };

  if (!fertig.length) return { ...lage, kat: 'start', d: 0 };
  if (!offen) return d === 0 ? { ...lage, kat: 'endeGleich' } : { ...lage, kat: 'ende' };
  if (d === 0) return { ...lage, kat: 'gleich' };
  if (d > offenePunkte) return { ...lage, kat: 'klar' };      /* rechnerisch gelaufen */
  if (offen <= 2) return { ...lage, kat: 'endspurt' };        /* alles haengt am Schluss */
  if (d <= 10) return { ...lage, kat: 'knapp' };
  if (d <= 25) return { ...lage, kat: 'deutlich' };
  return { ...lage, kat: 'klar' };
}

/* Zieht einen Spruch, der auf diesem Handy noch nicht dran war.
   Erst wenn die ganze Schublade durch ist, faengt sie von vorne an. */
function spruchZiehen(kategorie) {
  const pool = zustand.spruecke?.[kategorie] || [];
  if (!pool.length) return '';
  const schluessel = SPEICHER + 'benutzt.' + kategorie;
  let benutzt = [];
  try { benutzt = JSON.parse(localStorage.getItem(schluessel) || '[]'); } catch (e) { benutzt = []; }
  let frei = pool.map((_, i) => i).filter((i) => !benutzt.includes(i));
  if (!frei.length) { benutzt = []; frei = pool.map((_, i) => i); }
  const gewaehlt = frei[Math.floor(Math.random() * frei.length)];
  benutzt.push(gewaehlt);
  try { localStorage.setItem(schluessel, JSON.stringify(benutzt)); } catch (e) { /* egal */ }
  return pool[gewaehlt];
}

function spruchFuellen(text, lage) {
  return text
    .replace(/\{f\}/g, lage.f ? team(lage.f).name : '')
    .replace(/\{v\}/g, lage.v ? team(lage.v).name : '')
    .replace(/\{d\}/g, lage.d % 1 ? lage.d.toFixed(1) : lage.d);
}

/* Ein neuer Spruch kommt nur, wenn sich am Spielstand etwas geaendert hat –
   sonst wuerde bei jedem Aktualisieren ein anderer erscheinen. */
function aktuellerSpruch(erzwingen = false) {
  const lage = situation();
  const { punkte } = punktestand();
  const schluessel = lage.kat + ':' + punkte.a + ':' + punkte.b;
  let gemerkt = null;
  try { gemerkt = JSON.parse(localStorage.getItem(SPEICHER + 'spruch') || 'null'); } catch (e) { /* egal */ }
  if (!erzwingen && gemerkt && gemerkt.schluessel === schluessel && gemerkt.text) return gemerkt.text;
  const text = spruchFuellen(spruchZiehen(lage.kat), lage);
  try { localStorage.setItem(SPEICHER + 'spruch', JSON.stringify({ schluessel, text })); } catch (e) { /* egal */ }
  return text;
}

function kommentarKarte(erzwingen = false) {
  const text = aktuellerSpruch(erzwingen);
  if (!text) return '';
  const wer = zustand.spruecke?.kommentator || 'Der Kommentator';
  return `<div class="kommentar nicht-drucken">
      <span class="mikro">🎤</span>
      <div>
        <div class="wer">${esc(wer)} · am Mikrofon</div>
        <div class="text" id="spruch-text">${esc(text)}</div>
      </div>
      <button class="nochmal" id="knopf-spruch" title="Noch einen Spruch">🔁</button>
    </div>`;
}

/* Konfetti – klein selbst gebaut, damit die App ohne fremde Bibliothek auskommt. */
function konfetti(dauer = 2600) {
  const c = $('#konfetti');
  if (!c) return;
  const ctx = c.getContext('2d');
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  const farben = ['#c9a227', '#e8c96a', '#ffffff', ...(zustand.konfig?.teams || []).map((t) => t.farbe)];
  const teile = Array.from({ length: 120 }, () => ({
    x: Math.random() * c.width,
    y: -20 - Math.random() * c.height,
    b: 5 + Math.random() * 7,
    vy: 2.2 + Math.random() * 3.4,
    vx: -1.1 + Math.random() * 2.2,
    dreh: Math.random() * Math.PI,
    dv: -0.12 + Math.random() * 0.24,
    f: farben[Math.floor(Math.random() * farben.length)]
  }));
  const ende = Date.now() + dauer;
  (function schritt() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const t of teile) {
      t.y += t.vy; t.x += t.vx; t.dreh += t.dv;
      if (t.y > c.height + 20) { t.y = -20; t.x = Math.random() * c.width; }
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.dreh);
      ctx.fillStyle = t.f;
      ctx.fillRect(-t.b / 2, -t.b / 2, t.b, t.b * 0.55);
      ctx.restore();
    }
    if (Date.now() < ende) requestAnimationFrame(schritt);
    else ctx.clearRect(0, 0, c.width, c.height);
  })();
}

function stumm() { return localStorage.getItem(SPEICHER + 'stumm') === '1'; }

/* Kleine Fanfare, komplett im Browser erzeugt – keine Tondatei noetig. */
function fanfare(art = 'sieg') {
  if (stumm()) return;
  try {
    const Ac = window.AudioContext || window.webkitAudioContext;
    if (!Ac) return;
    const ac = new Ac();
    const noten = art === 'sieg' ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 783.99];
    noten.forEach((hz, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle';
      o.frequency.value = hz;
      const t = ac.currentTime + i * 0.13;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      o.connect(g); g.connect(ac.destination);
      o.start(t); o.stop(t + 0.45);
    });
    setTimeout(() => ac.close(), 1600);
  } catch (e) { /* Ton ist Beiwerk, nie ein Grund fuer einen Fehler */ }
}

/* Das Feuer brennt, sobald das erste Spiel entschieden ist. */
function fackelPflegen() {
  const f = $('#fackel');
  if (!f) return;
  const brennt = punktestand().fertig.length > 0;
  f.classList.toggle('aus', !brennt);
  f.title = brennt ? 'Das Feuer brennt – die Spiele laufen' : 'Noch kein Spiel entschieden';
}

/* ================= Punkte rechnen ================= */

function aktiveSpiele() {
  return (zustand.spiele?.spiele || []).filter((s) => s.aktiv !== false);
}

function ergebnisVon(spiel) {
  const e = zustand.ergebnisse?.stand?.[spiel.id];
  if (!e) return null;
  const a = zahl(e.a), b = zahl(e.b);
  let sieger = e.sieger || '';
  if (spiel.typ !== 'sieger' && !sieger) {
    if (a === null || b === null) return null;
    if (a === b) sieger = 'unentschieden';
    else if (spiel.richtung === 'klein') sieger = a < b ? 'a' : 'b';
    else sieger = a > b ? 'a' : 'b';
  }
  if (!sieger) return null;
  return { a, b, sieger, notiz: e.notiz || '' };
}

function punktestand() {
  const p = { a: 0, b: 0 }, fertig = [];
  const anteil = zustand.konfig.punkte_unentschieden_anteil ?? 0.5;
  for (const s of aktiveSpiele()) {
    const e = ergebnisVon(s);
    if (!e) continue;
    if (e.sieger === 'unentschieden') {
      p.a += s.punkte * anteil;
      p.b += s.punkte * anteil;
    } else {
      p[e.sieger] += s.punkte;
    }
    fertig.push({ spiel: s, ergebnis: e });
  }
  return { punkte: p, fertig };
}

function wertText(spiel, v) {
  if (v === null) return '–';
  if (spiel.typ === 'zeit') return zeitText(v);
  return `${String(v).replace('.', ',')} ${spiel.einheit || ''}`.trim();
}

/* ================= Ansichten ================= */

function zeichne() {
  if (!zustand.konfig) return;
  $('#kopf-titel').textContent = zustand.konfig.titel || 'Olympiade';
  const k = zustand.konfig;
  $('#kopf-unter').textContent = [k.untertitel, k.datum, k.ort].filter(Boolean).join(' · ');
  $('#stand-info').textContent = zustand.zuletzt
    ? (zustand.offline ? '⚠ offline – Stand von ' : 'Stand: ') + zustand.zuletzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      + (zustand.admin ? (zustand.token ? ' · Eintragen ✓' : ' · Eintragen (ohne Schlüssel)') : '')
    : '';
  document.querySelectorAll('#navi button').forEach((b) =>
    b.classList.toggle('aktiv', b.dataset.ansicht === zustand.ansicht));
  const ziel = $('#inhalt');
  const offen = Object.keys(zustand.dreckig);
  const banner = offen.length
    ? `<div class="hinweis nicht-drucken"><b>⚠ ${offen.length} Änderung${offen.length > 1 ? 'en' : ''} noch nicht im Netz.</b>
        Sie sind hier gespeichert, aber die anderen sehen sie noch nicht.
        <button class="knopf klein" id="knopf-nachsenden" style="margin-top:8px">Jetzt senden</button></div>`
    : '';
  const neuesHtml = banner + ({
    rangliste: ansichtRangliste,
    spiele: ansichtSpiele,
    teams: ansichtTeams,
    eintragen: ansichtEintragen,
    urkunden: ansichtUrkunden
  }[zustand.ansicht] || ansichtRangliste)();

  /* Nur wirklich neu aufbauen, wenn sich etwas geaendert hat. Sonst wuerde das
     automatische Nachladen alle 25 Sekunden die Seite unnoetig neu setzen. */
  if (neuesHtml !== zeichne.letztesHtml) {
    ziel.innerHTML = neuesHtml;
    zeichne.letztesHtml = neuesHtml;
    bindeEreignisse();
  }

  /* Nach oben springen NUR beim Wechsel der Ansicht – niemals beim Aktualisieren,
     sonst reisst es den Leser mitten aus der Spieleliste heraus. */
  const wo = zustand.ansicht + '/' + (zustand.offenesSpiel || '');
  if (wo !== zeichne.letzterOrt) {
    zeichne.letzterOrt = wo;
    window.scrollTo(0, 0);
  }

  fackelPflegen();
  tonKnopfPflegen();
}

/* ---- Stand ---- */
function medaillenspiegel() {
  const m = { a: { gold: 0, silber: 0, geteilt: 0 }, b: { gold: 0, silber: 0, geteilt: 0 } };
  for (const { ergebnis } of punktestand().fertig) {
    if (ergebnis.sieger === 'unentschieden') { m.a.geteilt++; m.b.geteilt++; }
    else { m[ergebnis.sieger].gold++; m[ergebnis.sieger === 'a' ? 'b' : 'a'].silber++; }
  }
  return m;
}

function ansichtRangliste() {
  const { punkte, fertig } = punktestand();
  const alle = aktiveSpiele();
  const [A, B] = zustand.konfig.teams;
  const summe = punkte.a + punkte.b || 1;
  const fuehrt = punkte.a === punkte.b ? '' : (punkte.a > punkte.b ? 'a' : 'b');
  const offen = alle.length - fertig.length;
  const zahlText = (n) => (n % 1 ? n.toFixed(1) : String(n));

  const karte = (t) => `
    <div class="stand-team ${fuehrt === t.id ? 'fuehrt' : ''}" style="background:${t.farbe}">
      <span class="emoji">${t.emoji || '●'}</span>
      <div class="name">${esc(t.name)}</div>
      <div class="punkte">${zahlText(punkte[t.id])}</div>
      <div class="zusatz">Punkte</div>
    </div>`;

  /* Siegerpodest: das fuehrende Team steht oben. */
  const sortiert = [A, B].slice().sort((x, y) => punkte[y.id] - punkte[x.id]);
  const gleichauf = punkte.a === punkte.b;
  const podest = fertig.length ? `
    <h2 class="abschnitt">Siegerpodest</h2>
    <div class="karte">
      <div class="podest">
        ${sortiert.map((t, i) => `
          <div class="platz ${gleichauf || i === 0 ? 'eins' : 'zwei'}" style="background:${t.farbe}">
            <span class="medaille">${gleichauf ? '🤝' : (i === 0 ? '🥇' : '🥈')}</span>
            <span class="pname">${esc(t.name)}</span>
            <span class="ppunkte">${zahlText(punkte[t.id])}</span>
          </div>`).join('')}
      </div>
    </div>` : '';

  const m = medaillenspiegel();
  const spiegel = fertig.length ? `
    <h2 class="abschnitt">Medaillenspiegel</h2>
    <div class="karte">
      <div class="spiegel-kopf"><span>Team</span><span>🥇</span><span>🥈</span><span>🤝</span></div>
      ${[A, B].map((t) => `<div class="spiegel-zeile">
        <span class="tname">${t.emoji} ${esc(t.name)}</span>
        <span>${m[t.id].gold}</span><span>${m[t.id].silber}</span><span>${m[t.id].geteilt}</span>
      </div>`).join('')}
    </div>` : '';

  const letzte = fertig.slice().reverse().slice(0, 30).map(({ spiel, ergebnis }) => {
    const sg = ergebnis.sieger;
    const gewinner = sg === 'unentschieden' ? 'Unentschieden' : team(sg).name;
    const farbe = sg === 'unentschieden' ? '#7b8794' : team(sg).farbe;
    return `<div class="zeile">
      <div class="haupt">
        <div class="titel">${sg === 'unentschieden' ? '🤝' : '🥇'} ${esc(spiel.name)}</div>
        <div class="unter">${spiel.typ === 'sieger' ? esc(spiel.reihe) :
          esc(team('a').name) + ': ' + wertText(spiel, ergebnis.a) + ' · ' + esc(team('b').name) + ': ' + wertText(spiel, ergebnis.b)}</div>
      </div>
      <span class="punkt-pille" style="background:${farbe}">${esc(gewinner)}</span>
    </div>`;
  }).join('');

  return `
    ${kommentarKarte()}
    <div class="stand-gross">${karte(A)}${karte(B)}</div>
    <div class="balken">
      <div style="width:${(punkte.a / summe) * 100}%;background:${A.farbe}"></div>
      <div style="width:${(punkte.b / summe) * 100}%;background:${B.farbe}"></div>
    </div>
    <p class="fortschritt">${fertig.length} von ${alle.length} Spielen entschieden${offen ? ` · noch ${offen} offen` : ' · alles durch! 🎉'}</p>
    ${!zustand.teilnehmer?.ausgelost ? '<div class="hinweis">Die Teams sind noch nicht ausgelost. Das geht unter <b>Teams</b>.</div>' : ''}
    ${podest}
    ${spiegel}
    <h2 class="abschnitt">Entschiedene Spiele</h2>
    <div class="karte">${letzte || '<p style="color:var(--leise);margin:4px 0">Noch kein Ergebnis eingetragen. Das Feuer wartet.</p>'}</div>`;
}

/* ---- Spiele ---- */
function ansichtSpiele() {
  const reihen = {};
  for (const s of aktiveSpiele()) (reihen[s.reihe || 'Weitere'] ||= []).push(s);
  let html = `<p class="fortschritt">${aktiveSpiele().length} Disziplinen · Tippe ein Spiel für die Regeln</p>`;
  for (const [reihe, liste] of Object.entries(reihen)) {
    html += `<h2 class="abschnitt">${esc(reihe)}</h2><div class="karte">`;
    for (const s of liste) {
      const e = ergebnisVon(s);
      const marke = e
        ? `<span class="marke fertig">${e.sieger === 'unentschieden' ? 'unentschieden' : esc(team(e.sieger).name)}</span>`
        : '<span class="marke offen">offen</span>';
      html += `<div class="zeile" data-regel="${esc(s.id)}" style="cursor:pointer">
        <div class="haupt">
          <div class="titel">${esc(s.name)}</div>
          <div class="unter">${s.punkte} Punkte · ${esc(s.typ === 'sieger' ? 'Sieger zählt' : s.richtung === 'klein' ? 'kleiner ist besser' : 'mehr ist besser')}</div>
        </div>${marke}
      </div>`;
    }
    html += '</div>';
  }
  return html;
}

/* ---- Teams ---- */
function personZeile(pp) {
  const weg = zustand.admin
    ? `<button class="weg-knopf nicht-drucken" data-weg="${esc(pp.name)}" title="Entfernen">✕</button>` : '';
  const unter = [pp.haushalt, pp.kind ? 'Kind' : ''].filter(Boolean).join(' · ');
  return `<div class="zeile">
    <div class="haupt"><div class="titel">${esc(pp.name)}</div>
    ${unter ? `<div class="unter">${esc(unter)}</div>` : ''}</div>${weg}</div>`;
}

function ansichtTeams() {
  const t = zustand.teilnehmer;
  if (!t) return '<p class="laden">…</p>';

  if (!t.ausgelost) {
    return `
      <div class="hinweis">Die Auslosung wird <b>einmal</b> gestartet. Danach steht die Zuordnung
        für alle Handys fest – ändern lässt sie sich trotzdem jederzeit wieder.</div>
      <h2 class="abschnitt">${t.personen.length} Mitspieler</h2>
      <div class="karte">${t.personen.map(personZeile).join('') || 'Noch keine Namen eingetragen.'}</div>
      ${zustand.admin ? `
        <button class="knopf gold" id="knopf-losen">🔥 Auslosung starten</button>
        <button class="knopf grau" id="knopf-person">➕ Person hinzufügen</button>`
        : '<div class="karte" style="text-align:center;color:var(--leise)">Die Auslosung startet der Veranstalter.</div>'}`;
  }

  let html = `<p class="fortschritt">🔥 Ausgelost am ${esc(t.ausgelost_am || '')}</p>`;
  for (const tm of zustand.konfig.teams) {
    const leute = t.personen.filter((pp) => pp.team === tm.id);
    html += `<h2 class="abschnitt" style="color:${tm.farbe}">${tm.emoji} ${esc(tm.name)} · ${leute.length} Leute</h2>
      <div class="karte">${leute.map(personZeile).join('') || 'Niemand zugeteilt'}</div>`;
  }
  const ohne = t.personen.filter((pp) => !pp.team);
  if (ohne.length) {
    html += `<h2 class="abschnitt">Noch ohne Team</h2><div class="karte">${ohne.map(personZeile).join('')}</div>`;
  }
  if (zustand.admin) {
    html += `
      <button class="knopf" id="knopf-person">➕ Person hinzufügen</button>
      <button class="knopf grau" id="knopf-neulosen">🎲 Alles neu auslosen</button>`;
  }
  return html;
}

/* Nimmt jemanden auf. Vor der Auslosung landet die Person nur auf der Liste,
   danach kommt sie ins kleinere Team – bei Gleichstand entscheidet das Los. */
async function personHinzufuegen(name, haushalt, kind) {
  const liste = zustand.teilnehmer.personen;
  if (liste.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
    toast(name + ' ist schon dabei');
    return;
  }
  let ziel = '';
  if (zustand.teilnehmer.ausgelost) {
    const anzahl = {
      a: liste.filter((x) => x.team === 'a').length,
      b: liste.filter((x) => x.team === 'b').length
    };
    ziel = anzahl.a === anzahl.b ? (Math.random() < 0.5 ? 'a' : 'b') : (anzahl.a < anzahl.b ? 'a' : 'b');
  }
  liste.push({ name, haushalt: haushalt || '', kind: !!kind, team: ziel });
  await speichere('teilnehmer.json', zustand.teilnehmer, 'Mitspieler ' + name + ' aufgenommen');
  if (ziel) { toast(name + ' → ' + team(ziel).name); konfetti(1500); fanfare('kurz'); }
  else toast(name + ' steht auf der Liste');
  zeichne();
}

async function personEntfernen(name) {
  zustand.teilnehmer.personen = zustand.teilnehmer.personen.filter((x) => x.name !== name);
  if (zustand.ergebnisse?.auszeichnungen) delete zustand.ergebnisse.auszeichnungen[name];
  await speichere('teilnehmer.json', zustand.teilnehmer, 'Mitspieler ' + name + ' entfernt');
  toast(name + ' ist raus');
  zeichne();
}

/* ---- Eintragen ---- */
function ansichtEintragen() {
  if (!DARF_EINTRAGEN) return ansichtRangliste();
  if (!zustand.admin) {
    return `<div class="karte">
      <h2 style="margin-top:0">Nur für den Veranstalter</h2>
      <p style="color:var(--leise);font-size:14px">Zum Eintragen von Ergebnissen brauchst du die PIN.</p>
      <label class="feld"><span>PIN</span><input type="password" inputmode="numeric" id="pin-feld" placeholder="••••"></label>
      <button class="knopf" id="knopf-pin">Freischalten</button>
    </div>`;
  }
  if (zustand.offenesSpiel) return formularSpiel(zustand.offenesSpiel);

  const reihen = {};
  for (const s of aktiveSpiele()) (reihen[s.reihe || 'Weitere'] ||= []).push(s);
  let html = zustand.token
    ? ''
    : `<div class="hinweis">Kein GitHub-Schlüssel hinterlegt. Eingaben bleiben nur auf diesem Handy.
       <button class="knopf klein" id="knopf-token" style="margin-top:8px">Schlüssel eintragen</button></div>`;
  html += '<p class="fortschritt">Spiel antippen und Ergebnis eintragen</p>';
  for (const [reihe, liste] of Object.entries(reihen)) {
    html += `<h2 class="abschnitt">${esc(reihe)}</h2><div class="karte">`;
    for (const s of liste) {
      const e = ergebnisVon(s);
      html += `<div class="zeile" data-spiel="${esc(s.id)}" style="cursor:pointer">
        <div class="haupt"><div class="titel">${esc(s.name)}</div>
        <div class="unter">${e ? (e.sieger === 'unentschieden' ? 'Unentschieden' : esc(team(e.sieger).name) + ' gewinnt') : 'noch offen'}</div></div>
        <span class="marke ${e ? 'fertig' : 'offen'}">${e ? '✓' : '›'}</span>
      </div>`;
    }
    html += '</div>';
  }
  html += `<div class="knopf-reihe">
      <button class="knopf grau" id="knopf-token">GitHub-Schlüssel</button>
      <button class="knopf grau" id="knopf-abmelden">Admin beenden</button>
    </div>`;
  return html;
}

function formularSpiel(id) {
  const s = aktiveSpiele().find((x) => x.id === id);
  if (!s) { zustand.offenesSpiel = null; return ansichtEintragen(); }
  const e = zustand.ergebnisse.stand[s.id] || {};
  const [A, B] = zustand.konfig.teams;

  const uhrTeil = s.typ === 'zeit' ? `
    <div class="karte">
      <div class="uhr" id="uhr-anzeige">0.0</div>
      <div class="knopf-reihe">
        <button class="knopf" id="uhr-start">Start</button>
        <button class="knopf grau" id="uhr-null">Zurück</button>
      </div>
      <div class="knopf-reihe">
        <button class="knopf klein" id="uhr-a" style="background:${A.farbe};flex:1">→ ${esc(A.name)}</button>
        <button class="knopf klein" id="uhr-b" style="background:${B.farbe};flex:1">→ ${esc(B.name)}</button>
      </div>
    </div>` : '';

  const felder = s.typ === 'sieger' ? `
    <div class="karte">
      <span style="font-size:12.5px;color:var(--leise);font-weight:600">Wer hat gewonnen?</span>
      <div class="team-wahl" style="margin-top:8px">
        <button data-sieger="a" style="background:${A.farbe}" class="${e.sieger && e.sieger !== 'a' ? 'aus' : ''}">${A.emoji} ${esc(A.name)}</button>
        <button data-sieger="b" style="background:${B.farbe}" class="${e.sieger && e.sieger !== 'b' ? 'aus' : ''}">${B.emoji} ${esc(B.name)}</button>
      </div>
      <button class="knopf grau klein" data-sieger="unentschieden" style="width:100%;margin-top:8px">Unentschieden</button>
    </div>` : `
    <div class="karte">
      <label class="feld"><span>${esc(A.name)} – ${esc(s.einheit || 'Wert')}</span>
        <input type="text" inputmode="decimal" id="wert-a" value="${esc(e.a ?? '')}" placeholder="z. B. 32,4"></label>
      <label class="feld"><span>${esc(B.name)} – ${esc(s.einheit || 'Wert')}</span>
        <input type="text" inputmode="decimal" id="wert-b" value="${esc(e.b ?? '')}" placeholder="z. B. 35,1"></label>
      <p style="font-size:12.5px;color:var(--leise);margin:0">${s.richtung === 'klein' ? 'Der kleinere Wert gewinnt.' : 'Der größere Wert gewinnt.'} Sieg gibt ${s.punkte} Punkte.</p>
    </div>`;

  return `
    <button class="knopf grau klein" id="zurueck" style="margin-bottom:12px">‹ Zurück</button>
    <h2 style="margin:0 0 4px;font-size:20px">${esc(s.name)}</h2>
    <p style="color:var(--leise);font-size:13px;margin:0 0 12px">${esc(s.reihe)} · ${s.punkte} Punkte</p>
    <div class="karte"><div style="font-size:14px">${esc(s.regel)}</div>
      <div style="font-size:12.5px;color:var(--leise);margin-top:8px"><b>Material:</b> ${esc(s.material)}</div></div>
    ${uhrTeil}
    ${felder}
    <label class="feld"><span>Notiz (freiwillig)</span><input type="text" id="notiz" value="${esc(e.notiz || '')}" placeholder="z. B. Fotofinish"></label>
    <button class="knopf" id="knopf-speichern">Ergebnis speichern</button>
    ${e.a !== undefined || e.sieger ? '<button class="knopf grau" id="knopf-loeschen" style="margin-top:8px">Ergebnis löschen</button>' : ''}`;
}

/* ---- Urkunden ---- */
function ansichtUrkunden() {
  const t = zustand.teilnehmer;
  const { punkte } = punktestand();
  if (!t?.ausgelost) return '<div class="hinweis">Urkunden gibt es erst nach der Auslosung.</div>';
  const sieger = punkte.a === punkte.b ? null : (punkte.a > punkte.b ? 'a' : 'b');
  const k = zustand.konfig;

  const urkunde = (p) => {
    const tm = team(p.team);
    const gewonnen = sieger === p.team;
    const ehre = zustand.ergebnisse.auszeichnungen?.[p.name] || '';
    return `<div class="urkunde">
      <div class="kranz">${gewonnen ? '🏆' : '🎖️'}</div>
      <div class="u-titel">Urkunde</div>
      <div class="u-anlass">${esc(k.titel)}${k.datum ? ' · ' + esc(k.datum) : ''}${k.ort ? ' · ' + esc(k.ort) : ''}</div>
      <div class="u-linie" aria-hidden="true"><span>🌿</span></div>
      <div class="u-name">${esc(p.name)}</div>
      <div class="u-text">hat an der Nachbarschafts-Olympiade teilgenommen und für
        <b style="color:${tm.farbe}">${esc(tm.name)}</b> gekämpft.</div>
      <div class="u-platz">${gewonnen ? '🥇 Siegerteam' : sieger === null ? '🤝 Unentschieden' : '🥈 Zweiter Platz'}
        · ${punkte[p.team] % 1 ? punkte[p.team].toFixed(1) : punkte[p.team]} Punkte</div>
      ${ehre ? `<div class="u-text u-ehre">Besondere Auszeichnung: <b>${esc(ehre)}</b></div>` : ''}
      <div class="u-linie" aria-hidden="true"><span>🌿</span></div>
      <div class="u-fuss"><span>${esc(k.untertitel || '')}</span><span>Unterschrift: ______________</span></div>
    </div>`;
  };

  let html = `<div class="hinweis nicht-drucken">Auf „Alle drucken" tippen und im Druckfenster <b>Als PDF sichern</b> wählen – je Person eine Seite.</div>
    <button class="knopf nicht-drucken" id="knopf-drucken">🖨️ Alle Urkunden drucken</button>`;
  if (zustand.admin) {
    html += `<button class="knopf grau nicht-drucken" id="knopf-ehre" style="margin-top:8px">Auszeichnungen vergeben</button>`;
  }
  html += t.personen.slice().sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name)).map(urkunde).join('');
  return html;
}

/* ================= Auslosung ================= */

function mische(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Verteilt die Namen zufaellig, achtet dabei auf zwei Dinge:
   Kinder und Erwachsene werden getrennt gemischt (gleichmaessige Verteilung),
   und Leute aus demselben Haushalt landen moeglichst in verschiedenen Teams. */
function loseAus(personen) {
  const zaehler = { a: 0, b: 0 };
  const haushalte = {};
  const ergebnis = [];
  const gruppen = [personen.filter((p) => p.kind), personen.filter((p) => !p.kind)];
  for (const gruppe of gruppen) {
    for (const p of mische(gruppe)) {
      const h = (p.haushalt || '').trim();
      let ziel;
      if (h && haushalte[h] !== undefined) {
        const gegen = haushalte[h] === 'a' ? 'b' : 'a';
        ziel = gegen;
        haushalte[h] = gegen;
      } else {
        ziel = zaehler.a === zaehler.b ? (Math.random() < 0.5 ? 'a' : 'b') : (zaehler.a < zaehler.b ? 'a' : 'b');
        if (h) haushalte[h] = ziel;
      }
      zaehler[ziel]++;
      ergebnis.push({ ...p, team: ziel });
    }
  }
  return ergebnis;
}

async function starteAuslosung() {
  const personen = zustand.teilnehmer.personen;
  if (!personen.length) { toast('Es sind noch keine Namen eingetragen'); return; }
  const gezogen = loseAus(personen);

  dialogZeigen('🔥 Eröffnungszeremonie', '<div id="los-buehne"></div>', null, 'Fertig');
  fanfare('kurz');
  $('#dialog-ok').disabled = true;
  $('#dialog-abbrechen').hidden = true;
  const buehne = $('#los-buehne');
  for (let i = 0; i < gezogen.length; i++) {
    const p = gezogen[i];
    const tm = team(p.team);
    await new Promise((r) => setTimeout(r, 420));
    const d = document.createElement('div');
    d.className = 'los-name';
    d.style.background = tm.farbe;
    d.textContent = `${p.name} → ${tm.name}`;
    buehne.appendChild(d);
    buehne.scrollTop = buehne.scrollHeight;
  }
  $('#dialog-ok').disabled = false;

  konfetti(3400);
  fanfare('sieg');
  zustand.teilnehmer.personen = gezogen;
  zustand.teilnehmer.ausgelost = true;
  zustand.teilnehmer.ausgelost_am = jetzt();
  const ok = await speichere('teilnehmer.json', zustand.teilnehmer, 'Auslosung der Teams');
  if (ok) toast('Auslosung steht – auf allen Handys gleich');
}

/* ================= Stoppuhr ================= */

function uhrText(ms) { return (ms / 1000).toFixed(1); }

function uhrZeichne() {
  const u = zustand.uhr;
  const ms = u.dauer + (u.laeuft ? Date.now() - u.start : 0);
  const el = $('#uhr-anzeige');
  if (el) el.textContent = uhrText(ms);
  return ms;
}

function uhrUmschalten() {
  const u = zustand.uhr;
  if (u.laeuft) {
    u.dauer += Date.now() - u.start;
    u.laeuft = false;
    clearInterval(u.ticker);
    $('#uhr-start').textContent = 'Weiter';
    $('#uhr-anzeige')?.classList.remove('laeuft');
  } else {
    u.start = Date.now();
    u.laeuft = true;
    u.ticker = setInterval(uhrZeichne, 100);
    $('#uhr-start').textContent = 'Stopp';
    $('#uhr-anzeige')?.classList.add('laeuft');
  }
  uhrZeichne();
}

function uhrZuruecksetzen() {
  const u = zustand.uhr;
  clearInterval(u.ticker);
  Object.assign(u, { laeuft: false, start: 0, dauer: 0, ticker: null });
  const b = $('#uhr-start'); if (b) b.textContent = 'Start';
  uhrZeichne();
}

/* ================= Dialog ================= */

let dialogOk = null;
function dialogZeigen(titel, html, beiOk, okText = 'OK') {
  $('#dialog-titel').textContent = titel;
  $('#dialog-inhalt').innerHTML = html;
  $('#dialog-ok').textContent = okText;
  $('#dialog-ok').disabled = false;
  $('#dialog-abbrechen').hidden = false;
  dialogOk = beiOk;
  $('#dialog').hidden = false;
}
function dialogSchliessen() { $('#dialog').hidden = true; dialogOk = null; }

/* ================= Ereignisse ================= */

function bindeEreignisse() {
  document.querySelectorAll('[data-regel]').forEach((el) => el.onclick = () => {
    const s = aktiveSpiele().find((x) => x.id === el.dataset.regel);
    dialogZeigen(s.name, `<p style="font-size:14.5px;margin-top:0">${esc(s.regel)}</p>
      <p style="font-size:13px;color:var(--leise)"><b>Material:</b> ${esc(s.material)}<br>
      <b>Wertung:</b> ${s.punkte} Punkte für den Sieg${s.typ !== 'sieger' ? ` · ${s.richtung === 'klein' ? 'kleiner' : 'größer'} ist besser (${esc(s.einheit)})` : ''}</p>`,
      null, 'Schließen');
    $('#dialog-abbrechen').hidden = true;
  });

  document.querySelectorAll('[data-spiel]').forEach((el) => el.onclick = () => {
    zustand.offenesSpiel = el.dataset.spiel;
    uhrZuruecksetzen();
    zeichne();
  });

  const setzen = (id, fn) => { const el = $('#' + id); if (el) el.onclick = fn; };

  setzen('zurueck', () => { zustand.offenesSpiel = null; uhrZuruecksetzen(); zeichne(); });

  setzen('knopf-pin', () => {
    const eingabe = $('#pin-feld').value.trim();
    if (eingabe && eingabe === String(zustand.konfig.admin_pin)) {
      zustand.admin = true;
      localStorage.setItem(SPEICHER + 'admin', '1');
      toast('Admin-Modus an');
      zeichne();
    } else toast('PIN stimmt nicht');
  });

  setzen('knopf-abmelden', () => {
    zustand.admin = false;
    localStorage.removeItem(SPEICHER + 'admin');
    zeichne();
  });

  setzen('knopf-token', () => {
    dialogZeigen('GitHub-Schlüssel',
      `<p style="font-size:13.5px;margin-top:0">Der Schlüssel (Fine-grained Token mit Schreibrecht „Contents") bleibt nur auf diesem Handy gespeichert. Ohne ihn siehst du Änderungen nur selbst.</p>
       <input type="password" id="token-feld" placeholder="github_pat_…" value="${esc(zustand.token)}">`,
      () => {
        zustand.token = $('#token-feld').value.trim();
        localStorage.setItem(SPEICHER + 'token', zustand.token);
        zustand.shas = {};
        toast(zustand.token ? 'Schlüssel gespeichert' : 'Schlüssel gelöscht');
        zeichne();
      }, 'Speichern');
  });

  setzen('knopf-losen', () => {
    dialogZeigen('Auslosung starten?',
      '<p style="font-size:14px;margin:0">Die Teams werden jetzt zufällig gezogen. Das passiert nur <b>einmal</b> – danach steht die Zuordnung für alle fest.</p>',
      () => { dialogSchliessen(); starteAuslosung(); }, 'Losen!');
  });

  setzen('knopf-person', () => {
    const spaeter = zustand.teilnehmer.ausgelost;
    dialogZeigen(spaeter ? 'Nachzügler zulosen' : 'Person hinzufügen',
      `<p style="font-size:13.5px;margin-top:0">${spaeter
        ? 'Wer später kommt, wird dem <b>kleineren Team</b> zugeschlagen – bei Gleichstand entscheidet das Los. Die Auslosung von vorhin bleibt unangetastet.'
        : 'Kommt einfach mit auf die Liste. Zugeteilt wird erst bei der Auslosung.'}</p>
       <label class="feld"><span>Vorname</span><input type="text" id="person-name" placeholder="z. B. Andi"></label>
       <label class="feld"><span>Haushalt (freiwillig)</span><input type="text" id="person-haushalt" placeholder="z. B. Nr. 12"></label>
       <label class="haken"><input type="checkbox" id="person-kind"> Ist ein Kind</label>`,
      async () => {
        const name = $('#person-name')?.value.trim();
        if (!name) { toast('Kein Name eingegeben'); return; }
        await personHinzufuegen(name, $('#person-haushalt')?.value.trim(), $('#person-kind')?.checked);
      }, spaeter ? 'Zulosen' : 'Aufnehmen');
  });

  document.querySelectorAll('[data-weg]').forEach((el) => el.onclick = () => {
    const name = el.dataset.weg;
    dialogZeigen(name + ' entfernen?',
      '<p style="font-size:14px;margin:0">Die Person verschwindet von der Liste und bekommt keine Urkunde mehr. Die Punkte der Teams bleiben unverändert.</p>',
      () => personEntfernen(name), 'Entfernen');
  });

  setzen('knopf-spruch', () => {
    const el = $('#spruch-text');
    if (el) el.textContent = aktuellerSpruch(true);
  });

  setzen('knopf-neulosen', () => {
    dialogZeigen('Wirklich neu auslosen?',
      '<p style="font-size:14px;margin:0">Die bisherige Zuordnung wird verworfen und alle Handys zeigen danach die neue Einteilung. Nur machen, wenn wirklich noch nicht gespielt wurde.</p>',
      () => { dialogSchliessen(); starteAuslosung(); }, 'Neu losen');
  });

  setzen('uhr-start', uhrUmschalten);
  setzen('uhr-null', uhrZuruecksetzen);
  ['a', 'b'].forEach((t) => setzen('uhr-' + t, () => {
    const u = zustand.uhr;
    const ms = u.dauer + (u.laeuft ? Date.now() - u.start : 0);
    const feld = $('#wert-' + t);
    if (feld) { feld.value = uhrText(ms).replace('.', ','); toast('Zeit übernommen'); }
  }));

  document.querySelectorAll('[data-sieger]').forEach((el) => el.onclick = () => {
    document.querySelectorAll('[data-sieger]').forEach((x) => {
      if (x.dataset.sieger !== 'unentschieden') x.classList.toggle('aus', x.dataset.sieger !== el.dataset.sieger);
    });
    el.dataset.gewaehlt = '1';
    $('#knopf-speichern').dataset.sieger = el.dataset.sieger;
    toast(el.dataset.sieger === 'unentschieden' ? 'Unentschieden gewählt' : team(el.dataset.sieger).name + ' gewählt');
  });

  setzen('knopf-speichern', async () => {
    const s = aktiveSpiele().find((x) => x.id === zustand.offenesSpiel);
    const eintrag = { notiz: $('#notiz')?.value.trim() || '' };
    if (s.typ === 'sieger') {
      const w = $('#knopf-speichern').dataset.sieger || zustand.ergebnisse.stand[s.id]?.sieger;
      if (!w) { toast('Bitte erst den Sieger antippen'); return; }
      eintrag.sieger = w;
    } else {
      const a = zahl($('#wert-a').value), b = zahl($('#wert-b').value);
      if (a === null || b === null) { toast('Bitte beide Werte eintragen'); return; }
      eintrag.a = a; eintrag.b = b;
    }
    zustand.ergebnisse.stand[s.id] = eintrag;
    zustand.offenesSpiel = null;
    uhrZuruecksetzen();
    await speichereErgebnisse();
    const durch = punktestand().fertig.length === aktiveSpiele().length;
    konfetti(durch ? 5000 : 1800);
    fanfare(durch ? 'sieg' : 'kurz');
  });

  setzen('knopf-loeschen', async () => {
    delete zustand.ergebnisse.stand[zustand.offenesSpiel];
    zustand.offenesSpiel = null;
    await speichereErgebnisse();
  });

  setzen('knopf-drucken', () => window.print());

  setzen('knopf-nachsenden', async () => {
    if (!zustand.token) { toast('Dafür fehlt der GitHub-Schlüssel'); return; }
    await nachsenden();
    toast(Object.keys(zustand.dreckig).length ? 'Klappt noch nicht – später nochmal' : 'Alles gesendet');
    zeichne();
  });

  setzen('knopf-ehre', () => {
    const reihen = zustand.teilnehmer.personen.map((p) =>
      `<label class="feld"><span>${esc(p.name)}</span>
       <input type="text" data-ehre="${esc(p.name)}" value="${esc(zustand.ergebnisse.auszeichnungen?.[p.name] || '')}" placeholder="z. B. Schnellster Sackhüpfer"></label>`).join('');
    dialogZeigen('Auszeichnungen', reihen, async () => {
      zustand.ergebnisse.auszeichnungen ||= {};
      document.querySelectorAll('[data-ehre]').forEach((el) => {
        const v = el.value.trim();
        if (v) zustand.ergebnisse.auszeichnungen[el.dataset.ehre] = v;
        else delete zustand.ergebnisse.auszeichnungen[el.dataset.ehre];
      });
      await speichereErgebnisse();
    }, 'Speichern');
  });
}

/* ================= Kopfleiste ================= */

function tonKnopfPflegen() {
  const b = $('#knopf-ton');
  if (!b) return;
  b.textContent = stumm() ? '🔇' : '🔊';
  b.classList.toggle('stumm', stumm());
}

$('#knopf-ton').onclick = () => {
  localStorage.setItem(SPEICHER + 'stumm', stumm() ? '0' : '1');
  tonKnopfPflegen();
  toast(stumm() ? 'Ton aus' : 'Ton an');
  if (!stumm()) fanfare('kurz');
};

/* Kleines Osterei: fuenfmal auf die Fackel tippen, dann vergibt Kalle
   die Goldene Ananas an irgendeinen Mitspieler. Ohne jede Bedeutung. */
let fackelTipps = 0, fackelUhr = null;
$('#fackel').onclick = () => {
  fackelTipps++;
  clearTimeout(fackelUhr);
  fackelUhr = setTimeout(() => { fackelTipps = 0; }, 2500);
  if (fackelTipps < 5) return;
  fackelTipps = 0;
  const leute = zustand.teilnehmer?.personen || [];
  if (!leute.length) { toast('Erst braucht es Mitspieler'); return; }
  const wer = leute[Math.floor(Math.random() * leute.length)].name;
  const text = (spruchZiehen('ananas') || 'Die Goldene Ananas geht an {name}.').replace(/\{name\}/g, wer);
  konfetti(2600);
  fanfare('sieg');
  dialogZeigen('🍍 Goldene Ananas', `<p style="font-size:15px;margin:0">${esc(text)}</p>`, null, 'Verdient!');
  $('#dialog-abbrechen').hidden = true;
};

/* ================= Start ================= */

if (!DARF_EINTRAGEN) {
  const reiter = document.querySelector('#navi button[data-ansicht="eintragen"]');
  if (reiter) reiter.remove();
  if (zustand.ansicht === 'eintragen') zustand.ansicht = 'rangliste';
}

document.querySelectorAll('#navi button').forEach((b) => b.onclick = () => {
  zustand.ansicht = b.dataset.ansicht;
  zustand.offenesSpiel = null;
  uhrZuruecksetzen();
  zeichne();
});

$('#knopf-neu').onclick = () => ladeAlles();
$('#dialog-abbrechen').onclick = dialogSchliessen;
$('#dialog-ok').onclick = () => { const f = dialogOk; dialogSchliessen(); if (f) f(); };
$('#dialog').onclick = (e) => { if (e.target.id === 'dialog') dialogSchliessen(); };

ladeAlles().then(() => {
  const fertig = zustand.spiele ? punktestand().fertig.length : 0;
  const alle = zustand.spiele ? aktiveSpiele().length : 0;
  if (alle && fertig === alle && !sessionStorage.getItem(SPEICHER + 'gefeiert')) {
    sessionStorage.setItem(SPEICHER + 'gefeiert', '1');
    konfetti(4000);
  }
});
setInterval(async () => {
  if (document.hidden || zustand.offenesSpiel || !$('#dialog').hidden) return;
  await nachsenden();
  ladeAlles(true);
}, 25000);
document.addEventListener('visibilitychange', async () => {
  if (document.hidden) return;
  await nachsenden();
  ladeAlles(true);
});

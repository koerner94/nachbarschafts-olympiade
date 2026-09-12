# Nachbarschafts-Olympiade

Eine kleine Web-App fürs Handy. Läuft über GitHub Pages – kein App Store, keine
Installation, nur ein Link. Zwei Teams, alle Disziplinen, Punktestand live,
Stoppuhr und Urkunden zum Ausdrucken.

## Die zwei Links

| Zweck | Link |
|---|---|
| **Nur zuschauen** (für alle Nachbarn) | https://koerner94.github.io/nachbarschafts-olympiade/ |
| **Ergebnisse eintragen** (für dich) | https://koerner94.github.io/nachbarschafts-olympiade/?eintragen |

PIN für den Eintrage-Link: **2026** (änderbar in `daten/konfig.json`).

Im Zuschauer-Link gibt es den Reiter „Eintragen" gar nicht erst. Der Eintrage-Link
fragt zusätzlich nach der PIN aus `daten/konfig.json`.

Wichtig und ehrlich: Die beiden Links sind eine **Bedienhilfe, kein Schloss**. Wer den
Zuschauer-Link hat, könnte `?eintragen` anhängen. Wirklich schreiben kann trotzdem nur,
wer die PIN **und** den GitHub-Schlüssel hat – der liegt nur auf deinem Handy.

## Auf dem Handy wie eine App

Link öffnen → Teilen-Menü → „Zum Startbildschirm hinzufügen". Danach liegt ein
Symbol auf dem Handy und die Seite öffnet ohne Browser-Leiste.

## Die Dateien

```
index.html            die App
app.js                die gesamte Logik
stil.css              das Aussehen
manifest.json         damit "Zum Startbildschirm" funktioniert
daten/konfig.json     Titel, Datum, Teamnamen, PIN, GitHub-Adresse
daten/teilnehmer.json alle Mitspieler + Team nach der Auslosung
daten/spiele.json     alle Disziplinen mit Regeln und Punkten
daten/ergebnisse.json wird von der App geschrieben
daten/spruecke.json    die Sprüche des Kommentators
daten/ablauf.json      der Zeitplan für den Reiter „Ablauf"
```

## Zeitplan (Begrüßung ab 15:00, erstes Spiel 15:30, Essen 18:30)

Reihenfolge wie festgelegt. Die Nummer vor jedem Spiel steht auch in der App –
und der ganze Plan steht dort im Reiter **🕒 Ablauf**, mit Uhrzeiten, Dauer und Punkten.
Erledigte Spiele werden dort grau, das nächste wird golden hervorgehoben.
Zeiten ändern: `daten/ablauf.json`.

| Uhrzeit | Nr | Was | Dauer |
|---|---|---|---|
| 15:00 | | Ankommen & Begrüßung, gegen 15:25 **Auslosung in der App** | 30 min |
| **15:30** | 1 | XXL Jenga | 20 min |
| 15:55 | 2 | Sackwerfen – *Toni steigt hier ein* | 15 min |
| 16:15 | 3 | Blind schmecken | 15 min |
| 16:35 | 4 | Dosenwerfen | 12 min |
| 16:50 | 5 | Wäschekorb-Basketball | 12 min |
| 17:05 | 6 | Kronkorken-Weitschnippen | 8 min |
| 17:15 | | **Pause**, Getränke, Grill anwerfen | 15 min |
| 17:30 | 7 | Montagsmaler | 20 min |
| 17:55 | 8 | Limbo | 12 min |
| 18:10 | | Tische decken (20 min Luft) | |
| **18:30** | | **Essen** | |
| 19:15 | 9 | 🔥 **Wikingerschach – das Finale** (**40 Punkte**) | 25 min |
| 19:45 | | **Siegerehrung, Urkunden, Goldene Ananas** | |

Zwischen den Spielen sind jeweils 3 bis 5 Minuten zum Umbauen eingeplant.
Der frühere Start verschafft euch **20 Minuten Puffer vor dem Essen** – die waren
vorher nicht da.

### Toni

Toni steht ganz normal in der Auslosung und bekommt damit ein zufälliges Team –
er kommt nur später dazu. In der Teams-Liste steht bei ihm „kommt gegen 16 Uhr".
Durch den früheren Start verpasst er jetzt XXL Jenga und eventuell den Anfang
vom Sackwerfen.

### Achtung Tageslicht

Ende September geht die Sonne gegen **19:30 Uhr** unter. Wikingerschach im Dunkeln
funktioniert nicht – man sieht die Klötze nicht mehr. Deshalb steht das Finale hier
schon um 19:15. Falls das Essen länger dauert: Baustrahler ans Kubb-Feld stellen.
Oder ihr nutzt den neuen Puffer und esst schon um 18:15 – dann kann das Finale um
19:00 losgehen und ihr habt sicher genug Licht.

### Punkteverteilung

125 Punkte insgesamt: **85 vor dem Essen, 40 im Finale.** Das Wikingerschach ist damit
fast ein Drittel des ganzen Tages wert. Wer vorher mit weniger als 40 Punkten hinten
liegt, kann den Tag dort noch drehen.

| Nr | Spiel | Punkte |
|---|---|---|
| 9 | Wikingerschach (Finale) | 40 |
| 1 | XXL Jenga | 15 |
| 7 | Montagsmaler | 15 |
| 2 | Sackwerfen | 10 |
| 3 | Blind schmecken | 10 |
| 4 | Dosenwerfen | 10 |
| 5 | Wäschekorb-Basketball | 10 |
| 8 | Limbo | 10 |
| 6 | Kronkorken-Weitschnippen | 5 |

Kalle rechnet mit: Solange der Rückstand kleiner ist als die noch zu holenden Punkte,
sagt er „hier ist noch alles offen" statt „das ist gelaufen".

## Leute hinzufügen, entfernen, neu auslosen

Alles unter „Teams", wenn du mit der PIN freigeschaltet bist:

* **➕ Person hinzufügen** – vor der Auslosung kommt sie nur auf die Liste, danach wird
  sie dem kleineren Team zugelost (bei Gleichstand entscheidet das Los).
* **✕ neben einem Namen** – Person entfernen, wenn jemand absagt.
* **🎲 Alles neu auslosen** – wirft die bisherige Einteilung weg und zieht komplett neu.
  Alle Handys zeigen danach die neue Einteilung.

## Wie aktuell sehen die anderen den Punktestand?

Die App holt die Daten in dieser Reihenfolge:

1. **Mit GitHub-Schlüssel** (dein Handy): direkt bei GitHub – immer sofort aktuell.
2. **Ohne Schlüssel** (alle anderen): von der eigenen Seite. GitHub baut die Seite nach
   jedem Eintrag neu, das dauert etwa **eine Minute**. Danach sehen es alle.
3. Notfalls die Rohfassung bei GitHub – die hängt bis zu fünf Minuten hinterher und
   wird nur benutzt, wenn die ersten beiden Wege nicht gehen.

Kurz: Du siehst deinen Eintrag sofort, die Nachbarn nach etwa einer Minute.

## Kalle vom Balkon, der Kommentator

Oben auf der Stand-Seite sitzt ein Kommentator und kommentiert den Spielstand. Er merkt
sich, welchen Spruch er auf diesem Handy schon gebracht hat, und **wiederholt keinen**,
solange noch ungenutzte übrig sind. Ein neuer Spruch kommt automatisch, sobald sich der
Punktestand ändert – oder sofort über den Knopf 🔁.

Seine Sprüche stehen in `daten/spruecke.json`, sortiert nach Spielsituation
(`start`, `gleich`, `knapp`, `deutlich`, `klar`, `endspurt`, `ende`, `endeGleich`).
Eigene Insider-Witze einfach in die passende Liste eintragen – `{f}` ist das führende
Team, `{v}` das verfolgende, `{d}` der Punkteabstand.

## Die Spielereien

* **Die Fackel** oben links brennt erst, wenn das erste Spiel entschieden ist.
* **Konfetti und Fanfare** bei jedem Ergebnis, bei der Auslosung und am Ende.
  Ton lässt sich mit dem Lautsprecher-Knopf oben abschalten.
* **Siegerpodest und Medaillenspiegel** auf der Stand-Seite.
* **Goldene Ananas**: fünfmal auf die Fackel tippen. Mehr wird hier nicht verraten.

## Zum Design

Bewusst **ohne** die olympischen Ringe und ohne offizielles Emblem – die sind geschützt.
Verwendet werden nur allgemeine Wettkampf-Motive: Fackel, Lorbeer, Siegerpodest,
Medaillen. Für ein privates Nachbarschaftsfest ist das unproblematisch.

## Die Auslosung

Läuft **genau einmal**: Reiter „Teams" → „Auslosung jetzt starten". Die Namen werden
einzeln aufgedeckt und danach in `daten/teilnehmer.json` gespeichert. Ab dem Moment
sehen alle Handys dieselbe Einteilung.

Die Ziehung ist zufällig, achtet aber auf zwei Dinge:
Kinder werden gleichmäßig auf beide Teams verteilt, und wer denselben `haushalt`
eingetragen hat, landet möglichst im gegnerischen Team – Ehepaare treten also
gegeneinander an.

## Ergebnisse eintragen

Reiter „Eintragen" → PIN → Spiel antippen.

* **Zeit-Spiele**: Stoppuhr benutzen, dann „→ Team" tippen. Die Zeit landet im Feld.
* **Weiten und Stückzahlen**: einfach eintippen, Komma ist erlaubt.
* **Tauziehen und Co.**: nur das Siegerteam antippen.

Wer gewinnt, rechnet die App selbst aus (`richtung` in `spiele.json`: kleiner oder
größer ist besser). Bei Gleichstand bekommen beide die halbe Punktzahl.

Ohne Netz bleibt der Eintrag auf dem Handy, oben erscheint ein Warnhinweis, und die App
schickt ihn beim nächsten Aktualisieren automatisch nach. Solange etwas offen ist,
überschreibt das automatische Nachladen die Eingabe nicht.

## GitHub-Schlüssel (nur für dein Handy)

Damit die App schreiben darf, braucht sie einen Fine-grained Token:

1. github.com → Settings → Developer settings → Personal access tokens → Fine-grained
2. Repository access: nur dieses Projekt
3. Permissions → Repository permissions → **Contents: Read and write**
4. Token kopieren, in der App unter „Eintragen" → „GitHub-Schlüssel" einfügen

Der Schlüssel bleibt im Browser dieses einen Handys. Gib ihn niemandem weiter.

## Spiele anpassen

In `daten/spiele.json` steht jede Disziplin. `"aktiv": false` blendet sie aus,
ohne sie zu löschen. Punkte, Regeln und Material lassen sich frei ändern.

## Urkunden

Reiter „Urkunden" → „Alle Urkunden drucken" → im Druckfenster „Als PDF sichern".
Je Person eine A4-Seite. Ehrentitel („Schnellster Sackhüpfer") vergibst du vorher
über „Auszeichnungen vergeben".

---

## Wer was gemacht hat

| Rolle | Wer |
|---|---|
| Ausgerichtet von | **Lea Steinker** |
| App gebaut von | **André Steinker** · aka **King of Kotelett** 👑 |

Steht in `daten/konfig.json` unter `veranstalter`, `entwickler` und `beiname` – dort
änderbar. Erscheint als Fußzeile unter jeder Seite der App und auf jeder Urkunde:
Lea auf der Unterschriftszeile, André klein in der Fußzeile.

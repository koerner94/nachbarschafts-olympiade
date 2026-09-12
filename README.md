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
```

## Zeitplan (Start 15:30, Essen 18:30)

Acht Spiele vor dem Essen (114 Minuten reine Spielzeit), **Wikingerschach als Finale
danach**. Dazu Begrüßung, Auslosung, Umbau zwischen den Stationen und eine Pause.

| Uhrzeit | Was |
|---|---|
| 15:30 | Ankommen, Begrüßung, **Auslosung in der App** |
| 15:45 | XXL Jenga (20 min) |
| 16:10 | Sackwerfen (15 min) |
| 16:30 | Dosenwerfen (12 min) |
| 16:45 | Wäschekorb-Basketball (12 min) |
| 17:00 | Kronkorken-Weitschnippen (8 min) |
| 17:10 | **Pause**, Getränke, Grill anwerfen |
| 17:30 | Montagsmaler (20 min) |
| 17:55 | Limbo (12 min) |
| 18:10 | Blind schmecken (15 min) – direkt vors Essen, alle sind hungrig |
| **18:30** | **Essen** |
| 19:15 | 🔥 **WIKINGERSCHACH – Das Finale** (25 min, **40 Punkte**) |
| 19:45 | **Siegerehrung, Urkunden, Goldene Ananas** |

### Achtung Tageslicht

Ende September geht die Sonne gegen **19:30 Uhr** unter. Wikingerschach im Dunkeln
funktioniert nicht – man sieht die Klötze nicht mehr. Deshalb steht das Finale hier
schon um 19:15 und nicht erst um 19:30. Drei Möglichkeiten, falls es eng wird:

1. Essen um 18:15 beginnen, Finale um 19:00.
2. Baustrahler oder Gartenbeleuchtung ans Kubb-Feld stellen.
3. Essenspause auf 45 Minuten begrenzen und pünktlich anpfeifen.

### Punkteverteilung

125 Punkte gibt es insgesamt: **85 vor dem Essen, 40 im Finale.** Das Wikingerschach
ist damit fast ein Drittel des ganzen Tages wert. Wer vorher mit weniger als 40 Punkten
hinten liegt, kann den Tag dort noch drehen – und das ist praktisch immer der Fall.
Nur bei einem Vorsprung von über 40 Punkten steht der Sieger schon vor dem Essen fest.

| Spiel | Punkte |
|---|---|
| Wikingerschach (Finale) | 40 |
| XXL Jenga | 15 |
| Montagsmaler | 15 |
| Sackwerfen | 10 |
| Dosenwerfen | 10 |
| Wäschekorb-Basketball | 10 |
| Blind schmecken | 10 |
| Limbo | 10 |
| Kronkorken-Weitschnippen | 5 |

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

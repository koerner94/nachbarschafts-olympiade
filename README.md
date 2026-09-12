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
```

## Nachzügler

Kommt jemand erst später dazu, gibt es unter „Teams" den Knopf **„Nachzügler zulosen".**
Die Person landet im kleineren Team, bei Gleichstand entscheidet das Los. Die eigentliche
Auslosung bleibt dabei unangetastet.

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

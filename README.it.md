# 🦄 Magic Calendar

[English](README.md) · Italiano

Calendario desktop personalizzabile per famiglie.

Magic Calendar aiuta a organizzare attività, impegni e routine quotidiane con un’interfaccia semplice, pulita e pensata per l’uso reale.

---

## 📥 Download

👉 **[Scarica l'ultima versione](../../releases/latest)**

| Il tuo computer | File da scaricare |
|---|---|
| Mac con Apple Silicon (M1 e successivi) | `Magic-Calendar-X.Y.Z-mac-arm64.dmg` |
| Mac con processore Intel | `Magic-Calendar-X.Y.Z-mac-x64.dmg` |
| Windows (64 bit) | `Magic-Calendar-X.Y.Z-win-x64.exe` |

Requisiti: macOS 13 Ventura o successivo, Windows 10 o successivo (64 bit).

Non sai che Mac hai? Menu Apple  → *Informazioni su questo Mac*: "Chip Apple M…" vuol dire Apple Silicon,
"Processore Intel…" vuol dire Intel. I file `.zip`, `.yml` e `.blockmap` della release servono agli
aggiornamenti automatici: non vanno scaricati.

---

## ⚠️ Primo avvio su macOS

L’app non è firmata, quindi macOS potrebbe bloccarla.

Se vedi:

- "Impossibile verificare lo sviluppatore" o "Apple non è riuscita a verificare…"  
  → apri *Impostazioni di Sistema → Privacy e sicurezza*, scorri in basso e premi **Apri comunque**

- "App danneggiata"  
  → apri Terminale e lancia:

```bash
xattr -dr com.apple.quarantine "/Applications/Magic Calendar.app"
```

---

## ✨ Funzionalità

- Vista mensile e settimanale
- Temi grafici personalizzabili
- Emoji e immagini personalizzate
- Tipologie di giorno per famiglie
- Supporto italiano / inglese
- Salvataggio automatico
- Esportazione PDF
- Calendari multipli
- Oggi evidenziato, giorni passati attenuati, festività italiane
- Conteggio dei giorni e conto alla rovescia al prossimo giorno di ogni tipo
- Backup e ripristino di tutti i dati in un file
- Selezione di più giorni, schemi settimanali (anche a settimane alterne), Annulla/Ripristina

---

## 🎨 Temi

Alla prima apertura puoi scegliere il tema predefinito.  
Puoi cambiarlo in qualsiasi momento nelle Impostazioni.

---

## 🛠 Installazione

### macOS
1. Scarica il `.dmg` adatto al tuo Mac (`-mac-arm64` o `-mac-x64`, vedi sopra)
2. Aprilo e trascina l’app in Applicazioni
3. Espelli l’immagine disco e apri l’app da Applicazioni (non dall’immagine disco: da lì non può
   aggiornarsi)
4. Solo al primo avvio: *Impostazioni di Sistema → Privacy e sicurezza → Apri comunque*

### Windows
1. Scarica `-win-x64.exe`
2. Esegui l’installer

---

## 🧑‍💻 Sviluppo

```bash
git clone https://github.com/marcorosso768/magic-calendar
cd magic-calendar
npm install
npm start
```

Build:

```bash
npm run build:mac
npm run build:win
```

---

## 📍 Dati

| Sistema | Percorso |
|--------|---------|
| macOS | `~/Library/Application Support/Magic Calendar/` |
| Windows | `%APPDATA%\Magic Calendar\` |

I calendari sono in `calendari/`, le settimane e la routine in `weekly.json`, le impostazioni in
`settings.json`, le immagini in `images/`. Ogni file viene scritto in modo atomico e la versione precedente
resta come `.bak`.

---

## 🔄 Aggiornamenti

L'app controlla se c'è una nuova versione pochi secondi dopo l'avvio (e dal menu: *Controlla aggiornamenti…*).
Se c'è, propone **Installa aggiornamento**:

- **Windows**: l'aggiornamento viene scaricato e installato al riavvio.
- **macOS**: l'app non è firmata con un Developer ID Apple, quindi non può usare l'installatore standard.
  Scarica la nuova versione, ne verifica l'integrità, si sostituisce in Applicazioni e si riavvia.
  Serve che l'app sia in una cartella scrivibile (di solito Applicazioni): se è aperta dall'immagine disco
  o non può sostituirsi, apre invece la pagina di download.

---

## 🚀 Pubblicare una nuova versione

1. Scrivi le note della nuova versione in `build-resources/release-notes.md`.
2. Fai commit delle modifiche e aumenta la versione:

```bash
git add .
git commit -m "…"
npm version patch      # oppure minor / major
git push --follow-tags
```

`npm version` aggiorna `package.json` e `package-lock.json`, fa il commit e crea il tag `vX.Y.Z`;
`git push --follow-tags` invia `main` e il tag. Il tag avvia GitHub Actions, che compila le versioni Mac
e Windows e pubblica una sola release con questi file:

| File | Per |
|---|---|
| `Magic-Calendar-X.Y.Z-mac-arm64.dmg` | Mac Apple Silicon, download |
| `Magic-Calendar-X.Y.Z-mac-x64.dmg` | Mac Intel, download |
| `Magic-Calendar-X.Y.Z-win-x64.exe` | Windows, installazione e aggiornamento |
| `Magic-Calendar-X.Y.Z-mac-arm64.zip`, `-mac-x64.zip` | Mac, aggiornamento dall'app |
| `latest-mac.yml`, `latest.yml`, `*.blockmap` | dati per l'aggiornamento dall'app |

La release viene pubblicata solo se entrambe le piattaforme compilano, e la compilazione si ferma se il
tag e `package.json` non coincidono.

---

## Licenza

Questo progetto è gratuito per uso personale ed educativo.

L’uso commerciale non è consentito senza autorizzazione esplicita dell’autore.

Licenze commerciali disponibili su richiesta.

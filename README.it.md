# 🦄 Magic Calendar

[English](README.md) · Italiano

Calendario desktop personalizzabile per famiglie.

Magic Calendar aiuta a organizzare attività, impegni e routine quotidiane con un’interfaccia semplice, pulita e pensata per l’uso reale.

---

## 📥 Download

👉 **[Scarica l'ultima versione](../../releases/latest)**

### Mac
- Apple Silicon (M1 / M2 / M3) → scarica `arm64 .dmg`
- Mac Intel → scarica `x64 .dmg`

### Windows
- Scarica il file `.exe`

---

## ⚠️ Primo avvio su macOS

L’app non è firmata, quindi macOS potrebbe bloccarla.

Se vedi:

- "Impossibile verificare lo sviluppatore"  
  → tasto destro → Apri

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

---

## 🎨 Temi

Alla prima apertura puoi scegliere il tema predefinito.  
Puoi cambiarlo in qualsiasi momento nelle Impostazioni.

---

## 🛠 Installazione

### macOS
1. Scarica il file `.dmg`
2. Aprilo
3. Trascina l’app in Applicazioni
4. Apri Applicazioni
5. Tasto destro → Apri

### Windows
1. Scarica il file `.exe`
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
| macOS | `~/Library/Application Support/magic-calendar/` |
| Windows | `%APPDATA%\magic-calendar\` |

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

1. Aggiorna `"version"` in `package.json` (es. `1.1.0`) e le note in `build-resources/release-notes.md`.
2. Fai commit e push su `main`.
3. Crea e pubblica il tag: `git tag v1.1.0 && git push origin v1.1.0`.

GitHub Actions compila le versioni Mac e Windows, le carica in una release con i file per gli
aggiornamenti (`latest-mac.yml`, `latest.yml`) e la pubblica. La compilazione si ferma se il tag e
`package.json` non coincidono.

---

## Licenza

Questo progetto è gratuito per uso personale ed educativo.

L’uso commerciale non è consentito senza autorizzazione esplicita dell’autore.

Licenze commerciali disponibili su richiesta.

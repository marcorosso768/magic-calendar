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

---

## Licenza

Questo progetto è gratuito per uso personale ed educativo.

L’uso commerciale non è consentito senza autorizzazione esplicita dell’autore.

Licenze commerciali disponibili su richiesta.

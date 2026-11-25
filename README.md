# Eniminds — sito e CMS autogestito

Sito multipagina con un pannello editoriale personalizzato, senza WordPress né servizi CMS esterni. Il sito esistente online non è stato modificato. Il progetto rimane una proposta da approvare prima della pubblicazione.

## Avvio in locale

Servono Node.js 22.21 o superiore (versione 22) e npm.

1. Nella cartella del progetto esegui:

   ```sh
   npm ci
   cp .env.example .env
   ```

2. Apri `.env` con un editor e imposta `CMS_USERNAME` e una password personale nel campo `CMS_PASSWORD`. In produzione servono almeno 16 caratteri e una password robusta e unica. Non inviarla in chat e non aggiungere `.env` a Git. Se manca uno dei due valori, il sito funziona ma il pannello resta disabilitato. Per lo sviluppo locale puoi lasciare gli altri valori così come sono.
3. Avvia sito e server contenuti con:

   ```sh
   npm run dev
   ```

4. Apri l'URL del sito mostrato dal comando e aggiungi `/admin/` al suo indirizzo. Accedi con username e password configurati. Il pannello salva solo sul server che stai usando, non modifica il sito già online.

Per verificare il progetto: `npm test`. Per preparare una build: `npm run build`.

## Come si usa il pannello

- **Homepage:** modifica i testi principali e l'immagine di apertura.
- **Servizi, Organizzazioni e Residenziale:** modifica i testi e le immagini delle rispettive sezioni della homepage.
- **Pagine:** seleziona una pagina e modifica titoli, testi, immagini e schede esistenti.
- **Dati e contatti:** modifica e-mail, indirizzo, dati societari e presentazione nel footer.
- **Articoli:** crea una bozza, assegna uno slug univoco (`parole-separate-da-trattini`), completa titolo, data, sommario e testo e seleziona **Pubblicato** quando è pronto. Gli articoli pubblicati compaiono nel blog del nuovo sito. Il testo usa paragrafi semplici: separali con una riga vuota.
- Le immagini si possono caricare in formato JPG, PNG o WebP, fino a 3 MB. Sono pubblicamente accessibili tramite il loro URL anche prima della pubblicazione delle modifiche, quindi non caricare materiale riservato.
- Premi **Pubblica modifiche** per salvare tutte le modifiche delle varie sezioni. Se un'altra sessione ha salvato prima, il sistema segnala il conflitto: ricarica e ricontrolla i dati prima di riprovare. Non esiste ancora un salvataggio automatico o una cronologia delle revisioni.

Il pannello modifica i campi previsti, non è un editor visuale completo: numero e struttura delle schede, navigazione, logo, stile, pagina contatti e alcune etichette restano nel codice. Il modulo contatti apre il programma e-mail del visitatore: non invia direttamente dal server.

## Dati e backup

In locale e su server Node tradizionale, i contenuti vengono conservati nel file `content.json` della directory `CMS_DATA_DIR`, di default `.cms-data/`. Su Vercel si usano invece database Neon e Vercel Blob: vedi [la guida Vercel](deploy/VERCEL.md). Le immagini caricate sono nella sua sottocartella `media/`. La directory non viene committata. **Prima di aggiornamenti o migrazioni, fai backup completi e periodici dell'intera directory, incluse le immagini**, e prova il ripristino. Se viene persa, si perdono anche modifiche, bozze e immagini caricate. Non usare storage temporaneo o filesystem non persistente.

Con storage locale il CMS è progettato per una sola istanza Node.js; le sessioni sono in memoria e si perdono al riavvio. Su Vercel le sessioni e i contenuti sono nel database condiviso. In entrambi i casi è prevista una sola password amministratore e le sessioni scadono dopo otto ore. Non sono previsti utenti multipli, recupero password, autenticazione a due fattori o backup automatici. Per cambiare credenziali, modifica `CMS_USERNAME` e `CMS_PASSWORD` nell'ambiente e riavvia il processo. In alternativa a `CMS_PASSWORD` è supportato `CMS_PASSWORD_HASH` (formato `scrypt:salt:hash`); non impostarli entrambi. Le configurazioni contrassegnate `CMS_PREVIEW_ONLY=true` non possono avviarsi in produzione.

## Produzione: requisiti e limiti

Per il solo ambiente di test non commerciale su Vercel Hobby vedi [deploy/VERCEL.md](deploy/VERCEL.md). Per un server Node.js autogestito con filesystem persistente, HTTPS e reverse proxy:

1. Configura `CMS_USERNAME`, una password robusta e segreta `CMS_PASSWORD` (oppure il suo hash `CMS_PASSWORD_HASH`), un percorso persistente e protetto `CMS_DATA_DIR` e `CMS_PUBLIC_ORIGIN` con l'origine HTTPS esatta del sito (per esempio `https://www.esempio.it`, senza percorsi). Non usare `.env.example` come configurazione di produzione.
2. Esegui `npm ci`, `npm test`, `npm run build` e quindi `npm start`. Il reverse proxy deve servire il sito e `/admin/`, `/api/`, `/media/` sotto la stessa origine HTTPS. Conserva sia `dist/` sia `.ssr/` generati dalla build: il server rende le pagine con i contenuti salvati. `npm run preview` mostra solo la build statica e **non** avvia il CMS.
3. Proteggi l'accesso amministrativo anche a livello di rete (per esempio con VPN o accesso ristretto); configura firewall, monitoraggio, aggiornamenti e backup verificati. Il pannello ha cookie HttpOnly/SameSite/Secure in produzione, controllo dell'origine e token CSRF, limiti sui tentativi e validazione dei dati, ma **non ha ancora ricevuto un audit di sicurezza indipendente**.
4. Verifica ripristino backup, accesso, caricamento immagini e pubblicazione in staging prima di esporlo pubblicamente. Non eseguire più istanze contemporaneamente sullo stesso archivio: non esistono blocchi tra processi.

Gli articoli sono renderizzati dal server per i visitatori e i motori di ricerca. Vanno ancora configurati canonical, sitemap, redirect 301, Search Console e gestione completa dei vecchi URL. Le pagine generate staticamente in `dist/` non sono una copia aggiornata dei contenuti del CMS: in produzione serve il server Node, non un hosting esclusivamente statico.

## Prima del lancio

- Validare contenuti, servizi, indirizzi, dati societari e condizioni normative. Sostituire il marchio provvisorio e le immagini generate con AI, inclusa quella del team.
- Completare e verificare la pagina evento SPS 2026, il form di contatto e le modalità di invio. Valutare privacy, cookie, analytics e sicurezza con i professionisti competenti.
- Pianificare migrazione, redirect, dominio, hosting e accessi. Non modificare DNS o sito esistente senza approvazione.

## Skill di progetto

`skills-lock.json` registra le skill installate. Le copie locali in `.agents/skills/`, `.claude/skills/` e `agent/skills/` sono escluse dal repository. Per ripristinarle in un nuovo clone usare `npx skills experimental_install -y` e verificare le fonti prima dell'uso.

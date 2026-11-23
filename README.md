# Eniminds — proposta di rifacimento

Proposta multipagina per il sito Eniminds, basata sull'analisi pubblica in `ANALISI-SITO-ENIMINDS.md`. Il progetto **non modifica il sito online** e richiede validazione prima della pubblicazione.

## Avvio e verifica

Richiede Node.js 20.19+ oppure 22.12+ e npm.

```sh
npm ci
npm run dev       # anteprima di sviluppo
npm test          # build e test dei percorsi e dei contenuti
npm run preview   # anteprima della build
```

La build crea in `dist/` HTML prerenderizzato per ciascuna pagina nota, metadati per pagina e risorse locali. Pubblicare il contenuto di `dist/` su un hosting statico che serva `index.html` nelle directory. Configurare una vera pagina 404 HTTP per gli URL sconosciuti e verificare eventuali varianti degli URL prima della migrazione; il fallback SPA di Vite non sostituisce una configurazione di produzione.

## Pagine e contenuti

Sono presenti home, chi siamo, vision e mission, priorità, consulenze, organizzazioni, residenziale, contatti, approfondimenti e una pagina provvisoria per l'URL dell'evento SPS 2026. L'URL dell'articolo segnaposto esistente viene mantenuto con una pagina non indicizzabile. Controllare i contenuti dell'evento e decidere con il cliente se conservare, reindirizzare o rimuovere la pagina e il vecchio articolo.

La pagina contatti prepara un'e-mail nel programma di posta dell'utente: **non invia messaggi dal server**. Senza un client di posta configurato il visitatore può scrivere direttamente a `info@eniminds.com`. Un servizio di invio autonomo richiede backend, protezione anti-abuso e verifica della privacy.

## WordPress / CMS

La connessione al CMS è **predisposta ma non configurata**. Se si imposta `VITE_WORDPRESS_URL` (vedi `.env.example`) all'URL pubblico di un WordPress di staging, il frontend legge via REST:

- il contenuto delle pagine con gli slug corrispondenti e lo mostra come approfondimento aggiuntivo; l'HTML viene sanitizzato;
- gli articoli pubblicati nel blog, con link alla pagina dell'articolo sul WordPress configurato. L'articolo segnaposto `titolo-articolo` viene escluso.

Il browser deve poter accedere all'API WordPress con CORS consentito. L'URL è pubblico, non contiene credenziali e viene incorporato nella build: ricostruire dopo le modifiche. In caso di API non disponibile, le pagine conservano i contenuti locali; il blog mostra un messaggio di errore.

**Limiti importanti:** i testi principali, immagini, menu e layout restano nel codice (`src/content.js` e componenti React); questo collegamento non è un CMS completo per modificarli. Anche la home non è ancora gestita dal CMS e gli articoli puntano al WordPress, non a pagine native del nuovo frontend. La redazione CMS viene caricata nel browser dopo l'HTML prerenderizzato, quindi la sua indicizzazione non è garantita. Prima del rilascio occorre definire e implementare il modello editoriale completo, pagine degli articoli, rendering SEO lato build/server e CORS. Non collegare il WordPress di produzione senza accordo e verifica dei suoi contenuti e delle sue integrazioni.

## Prima della pubblicazione

- Validare testi, servizi, dati aziendali e condizioni normative; non sono state inventate testimonianze o statistiche.
- Sostituire il marchio tipografico provvisorio con il logo ufficiale e le immagini illustrative generate con AI con materiali approvati. In particolare la foto del team è illustrativa e non ritrae necessariamente il personale Eniminds.
- Collegare e testare il CMS e l'invio dei contatti. Riesaminare privacy, cookie, analytics e conservazione dei dati con il responsabile competente.
- Concordare dominio e hosting, SEO/canonical/sitemap, redirect 301, Search Console e verificare l'intero inventario dei vecchi URL; non modificare DNS o sito esistente senza approvazione.
- Verificare accessibilità, prestazioni, immagini e contenuti definitivi su browser e dispositivi reali.

## Skill di progetto

`skills-lock.json` registra le skill installate. Le copie locali in `.agents/skills/`, `.claude/skills/` e `agent/skills/` sono escluse dal repository per evitare di includere migliaia di file di terze parti. Per ripristinarle in un nuovo clone usare `npx skills experimental_install -y` e verificare la compatibilità e la fiducia delle fonti prima dell'uso.

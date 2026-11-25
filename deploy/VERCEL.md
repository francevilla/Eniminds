# Test non commerciale: Vercel Hobby, Neon e Blob

Questa configurazione è preparata per una **preview di test**, non è stata ancora collaudata su Vercel o su un account Neon/Blob reale. È indispensabile verificare il deploy e il suo comportamento prima dell'uso. Nessun servizio è stato attivato automaticamente. Il piano Hobby è consentito da Vercel solo per uso personale o non commerciale; consulta i [termini](https://vercel.com/legal/terms#4-hobby-plan).

Il CMS è scritto in questo repository: Neon e Blob sono solo database e archiviazione, **non CMS**. Le sessioni e il limite dei tentativi sono condivisi nel database; l'aggiornamento dei contenuti usa una revisione atomica. Le immagini caricate sono pubbliche, anche prima della pubblicazione. Non caricare dati riservati; il controllo immagini è basato sulla firma e non è una bonifica completa del file. Limite: 3 MB per immagine, sotto il limite delle richieste Vercel dopo codifica base64. Non c'è MFA né audit di sicurezza indipendente.

## Configurazione dell'ambiente di prova

1. Collega il repository al progetto Vercel, senza distribuire automaticamente in produzione questo ramo finché non hai verificato tutto. Mantieni l'attuale deployment e DNS invariati. Le modifiche devono essere pubblicate su GitHub prima che Vercel possa creare una preview di questo ramo. L'output statico contiene solo asset: le pagine e le API passano dalla Function.
2. Nel Marketplace Vercel crea un database Neon **dedicato alla prova** e connettilo al progetto nell'ambiente Preview. Controlla piano, limiti, regione e costi prima di confermare. Apri l'editor SQL di Neon e applica integralmente `deploy/schema.sql` al database di prova. Non usare database di produzione. L'integrazione fornisce le credenziali: verifica che sia disponibile la variabile `DATABASE_URL` in Preview; se il nome è diverso, crea tale variabile in Vercel con la stringa di connessione Neon, senza condividerla o committarla.
3. In Storage crea un Blob store **Public** separato e collegalo solo all'ambiente Preview. Le immagini saranno accessibili a chi conosce l'URL. La connessione al progetto abilita OIDC e `BLOB_STORE_ID`; controlla che sia presente nelle variabili. Vedi [documentazione Blob](https://vercel.com/docs/vercel-blob/using-blob-sdk). Non usare lo stesso store per ambienti diversi.
4. In Project Settings → Environment Variables configura **per Preview** `CMS_STORAGE=neon`, `CMS_USERNAME` e `CMS_PASSWORD_HASH`. Abilita anche le system environment variables di Vercel: la preview usa `VERCEL_ENV` e `VERCEL_URL` per consentire le richieste dalla sua origine HTTPS. Usa l'URL specifico del deployment, non un alias di branch o dominio diverso: l'origine del login deve corrispondere esattamente. In produzione, se successivamente abilitata, serve `CMS_PUBLIC_ORIGIN` con l'URL HTTPS esatto. Non impostare `CMS_PASSWORD` insieme all'hash.
5. Crea una nuova password casuale e robusta, diversa da quella già condivisa per la vecchia anteprima. Per generare l'hash in una shell bash su un computer fidato con Node 22:

   ```sh
   read -r -s -p 'Nuova password: ' CMS_NEW_PASSWORD; printf '\n'
   printf '%s' "$CMS_NEW_PASSWORD" | node scripts/hash-cms-password.mjs
   unset CMS_NEW_PASSWORD
   ```

   Inserisci l'hash direttamente nella dashboard Vercel. Non inviare password, stringhe di connessione, token o hash in chat. Il controllo del formato dell'hash non verifica la robustezza della password.
6. Crea una nuova preview e verifica build e log. Usa Vercel Authentication per restringere l'accesso al deployment di prova. Apri l'URL del deployment seguito da `/admin/`; verifica login, rifiuto di password e origini errate, protezione CSRF, modifica, conflitto, bozze, pubblicazione, HTML pubblico aggiornato, upload e logout. Verifica la persistenza dopo un nuovo deployment. Non usare DNS di produzione per questi test.

Le variabili modificate su Vercel richiedono un nuovo deployment. Il dominio Vercel e il database non vengono creati da questi file. Non riutilizzare le credenziali di `.env` locale: la vecchia password di anteprima è nota e debole. Il database è l'unica fonte persistente dei contenuti di test, non i file `.cms-data/` locali.

## Limiti e cura dei dati

- Hobby prevede quote: Blob può diventare non accessibile al superamento dei limiti; consulta [prezzi e limiti Blob](https://vercel.com/docs/vercel-blob/usage-and-pricing) e le condizioni correnti di Neon. Non è garantito che l'uso rimanga gratuito.
- Fai backup periodici e test di ripristino sia del database sia dei file Blob. Non cancellare database/store se contengono dati da conservare. Sono servizi distinti con propri limiti e politiche.
- Le sessioni scadono dopo 8 ore; cambiare password non revoca quelle già attive. Per revocarle subito elimina le righe di `cms_sessions` dal database. Il limite login condiviso può bloccare temporaneamente anche l'amministratore legittimo.
- La configurazione non è adatta a dati sensibili o produzione senza hardening, audit, monitoraggio, gestione backup e privacy. Prima di un eventuale uso commerciale occorre verificare termini e piano appropriato.

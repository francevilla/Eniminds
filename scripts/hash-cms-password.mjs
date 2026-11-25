import { readFileSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';

// Read from a pipe, not argv, to keep passwords out of shell history and process listings.
if (process.stdin.isTTY) {
  console.error('Fornisci la password tramite stdin, senza inserirla come argomento. Vedi deploy/README.md.');
  process.exit(1);
}
const password = readFileSync(0, 'utf8');
if (password.length < 16 || password.length > 512 || /[\r\n]/.test(password)) {
  console.error('La password deve avere tra 16 e 512 caratteri e non contenere a capo.');
  process.exit(1);
}
const salt = randomBytes(32);
const hash = scryptSync(password, salt, 32);
console.log(`scrypt:${salt.toString('hex')}:${hash.toString('hex')}`);

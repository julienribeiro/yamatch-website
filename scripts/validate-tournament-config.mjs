import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function validateTournamentConfig(html) {
  const url = html.match(/var SUPABASE_URL = '([^']+)'/)?.[1];
  const key = html.match(/var SUPABASE_ANON_KEY = '([^']+)'/)?.[1];
  if (url !== 'https://kxwmjjgtnrhcpgopevzb.supabase.co' ||
      key !== 'sb_publishable_Y-UOHfc7Z5wVnKhTTlb7iA_umRJArOf') {
    throw new Error('La page tournoi publique doit utiliser le couple URL/clé publishable PROD.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateTournamentConfig(await readFile(new URL('../website/tournament/index.html', import.meta.url), 'utf8'));
  console.log('Configuration publique tournoi PROD validée.');
}

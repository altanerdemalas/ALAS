import { readFileSync, writeFileSync, existsSync } from 'node:fs';

/**
 * Ayarların okunduğu ve yazıldığı .env yolu. Tek kaynak olması önemli:
 * dotenv başka, yazıcı başka dosyaya bakarsa testler gerçek anahtarı
 * yükleyip ücretli API çağrısı yapabilir.
 */
export const ENV_FILE = process.env.ALAS_ENV_FILE || new URL('../../.env', import.meta.url).pathname;

/**
 * .env dosyasındaki bir değeri günceller; diğer satırlar ve yorumlar korunur.
 * Anahtar dosyada yoksa sonuna eklenir.
 */
export function setEnvValue(key, value) {
  const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8').split('\n') : [];
  const pattern = new RegExp(`^\\s*${key}\\s*=`);
  const index = lines.findIndex((line) => pattern.test(line));
  const entry = `${key}=${value}`;

  if (index === -1) lines.push(entry);
  else lines[index] = entry;

  writeFileSync(ENV_FILE, lines.join('\n'), { mode: 0o600 });
}

/** Anahtarı panelde göstermek için maskeler: sk-ant-…4f2a */
export function maskSecret(value) {
  if (!value) return null;
  return value.length <= 12 ? '••••' : `${value.slice(0, 7)}…${value.slice(-4)}`;
}

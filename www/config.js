/* Настройки игры. Значения __В_ТАКОМ_ВИДЕ__ автоматически подставляет GitHub Actions при сборке APK. */
window.CFG = {
  VERSION: '__VERSION__',          // берётся из package.json
  REPO: '__REPO__',                // твой GitHub-репозиторий (подставляется сам)
  UPDATE_URL: '',                  // пусто = https://raw.githubusercontent.com/<репозиторий>/main/version.json
  TG: 'https://t.me/pasekagame',   // Telegram-канал с обновлениями
  SB_URL: '__SB_URL__',            // Supabase: Project URL (секрет SUPABASE_URL)
  EVENTS_URL: '',                  // пусто = events.json из твоего репозитория (событие для всех игроков)
  ADMIN_PIN: '__ADMIN_PIN__',      // PIN админ-панели (секрет ADMIN_PIN), без секрета: 1234
  SB_KEY: '__SB_KEY__'             // Supabase: anon public key (секрет SUPABASE_KEY)
};

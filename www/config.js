/* Настройки игры. Значения __В_ТАКОМ_ВИДЕ__ автоматически подставляет GitHub Actions при сборке APK. */
window.CFG = {
  VERSION: '__VERSION__',          // берётся из package.json
  REPO: '__REPO__',                // твой GitHub-репозиторий (подставляется сам)
  UPDATE_URL: '',                  // пусто = https://raw.githubusercontent.com/<репозиторий>/main/version.json
  TG: 'https://t.me/pasekagame',   // Telegram-канал с обновлениями
  SB_URL: '__SB_URL__',            // Supabase: Project URL (секрет SUPABASE_URL)
  SB_KEY: '__SB_KEY__'             // Supabase: anon public key (секрет SUPABASE_KEY)
};

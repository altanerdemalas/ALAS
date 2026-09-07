#!/bin/bash
#
# ALAS — macOS tek adımlık kurulum.
#
#   curl -fsSL https://raw.githubusercontent.com/altanerdemalas/ALAS/refs/heads/claude/printify-ai-ecommerce-nfp5vq/scripts/mac-kur.sh | bash
#
# Yaptıkları: Node.js kontrolü → kodu ~/ALAS içine indirme → bağımlılık kurulumu
# → paneli derleme → masaüstüne çift tıklanabilir ALAS.app oluşturma → başlatma.
# Tekrar çalıştırıldığında günceller; data/ ve .env korunur.

set -euo pipefail

BRANCH="claude/printify-ai-ecommerce-nfp5vq"
TARBALL="https://github.com/altanerdemalas/ALAS/archive/refs/heads/${BRANCH}.tar.gz"
NODE_PKG="https://nodejs.org/dist/v24.20.0/node-v24.20.0.pkg"
APP_DIR="$HOME/ALAS"
DESKTOP_APP="$HOME/Desktop/ALAS.app"
PORT=3001

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
step() { printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
die()  { printf '\n\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

[ "$(uname)" = "Darwin" ] || die "Bu kurulum betiği yalnızca macOS içindir."

echo
bold "ALAS — Printify POD araştırma ve öğrenme ajanı"
echo   "Kurulum yeri: $APP_DIR   ·   Masaüstü kısayolu: ALAS.app"

# ---------------------------------------------------------------- 1. Node.js

step "Node.js kontrol ediliyor"

# node:sqlite (yerleşik veritabanı) 22.5 ile geldi; altı çalışmaz.
node_yeterli() {
  command -v node >/dev/null 2>&1 || return 1
  local v major minor
  v="$(node -v 2>/dev/null | tr -d 'v')" || return 1
  major="${v%%.*}"; minor="$(echo "$v" | cut -d. -f2)"
  [ "$major" -gt 22 ] || { [ "$major" -eq 22 ] && [ "$minor" -ge 5 ]; }
}

if node_yeterli; then
  ok "Node.js $(node -v) kurulu"
else
  if command -v node >/dev/null 2>&1; then
    warn "Node.js $(node -v) çok eski (en az v22.5 gerekiyor)"
  else
    warn "Node.js kurulu değil"
  fi

  echo
  echo "  Node.js resmi kurulum paketini indirip kurabilirim."
  echo "  Kurulum için Mac şifreni soracak (sudo). Kaynak: nodejs.org"
  printf "  Otomatik kurayım mı? [E/h] "
  # curl | bash ile çalışırken stdin borudan gelir; yanıtı doğrudan terminalden oku.
  read -r cevap < /dev/tty || cevap="h"

  case "${cevap:-e}" in
    [eEyY]*)
      step "Node.js indiriliyor"
      pkg="$(mktemp -t node).pkg"
      curl -fL# "$NODE_PKG" -o "$pkg" || die "Node.js indirilemedi."
      ok "İndirildi"
      step "Node.js kuruluyor (şifreni isteyecek)"
      sudo installer -pkg "$pkg" -target / || die "Node.js kurulumu başarısız."
      rm -f "$pkg"
      export PATH="/usr/local/bin:$PATH"
      node_yeterli || die "Node.js kuruldu ama bulunamadı. Terminali kapatıp açıp betiği tekrar çalıştır."
      ok "Node.js $(node -v) kuruldu"
      ;;
    *)
      open "https://nodejs.org/en/download" 2>/dev/null || true
      die "Node.js gerekli. Açtığım sayfadan LTS sürümünü kurup bu komutu tekrar çalıştır."
      ;;
  esac
fi

# Başlatıcıya gömülecek tam yol. Sistemde birden fazla Node olabilir
# (eski /usr/local/bin sürümü, nvm, homebrew); .app'in doğrulanan sürümü
# kullanması için yolu sabitliyoruz — PATH tahminine güvenmiyoruz.
NODE_BIN="$(command -v node)"
ok "Kullanılacak Node: $NODE_BIN"

# ------------------------------------------------------------------ 2. Kaynak

step "Program indiriliyor"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
curl -fL# "$TARBALL" -o "$tmp/alas.tar.gz" || die "Kod indirilemedi. İnternet bağlantını kontrol et."
tar -xzf "$tmp/alas.tar.gz" -C "$tmp" || die "Arşiv açılamadı."
src="$(find "$tmp" -maxdepth 1 -type d -name 'ALAS-*' | head -1)"
[ -n "$src" ] || die "Arşiv içeriği beklenenden farklı."

mkdir -p "$APP_DIR"
# Kullanıcı verisi (veritabanı) ve anahtarlar korunur; kod dosyaları tazelenir.
for item in server src public package.json package-lock.json index.html vite.config.js eslint.config.js README.md .env.example scripts; do
  [ -e "$src/$item" ] && cp -R "$src/$item" "$APP_DIR/"
done
mkdir -p "$APP_DIR/data"
ok "Kod $APP_DIR içine yerleşti"

if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  ok ".env oluşturuldu (API anahtarlarını sonra buraya girebilirsin)"
else
  ok "Mevcut .env korundu"
fi

# ------------------------------------------------------------- 3. Bağımlılık

step "Bağımlılıklar kuruluyor (1-2 dakika sürebilir)"
cd "$APP_DIR"
npm install --no-audit --no-fund >/dev/null 2>&1 || die "npm install başarısız. '$APP_DIR' içinde 'npm install' komutunu elle çalıştırıp hatayı gör."
ok "Kuruldu"

step "Panel derleniyor"
npm run build >/dev/null 2>&1 || die "Derleme başarısız."
ok "Derlendi"

# --------------------------------------------------------------- 4. ALAS.app

step "Masaüstü uygulaması oluşturuluyor"

rm -rf "$DESKTOP_APP"
mkdir -p "$DESKTOP_APP/Contents/MacOS" "$DESKTOP_APP/Contents/Resources"

cat > "$DESKTOP_APP/Contents/MacOS/ALAS" <<LAUNCHER
#!/bin/bash
# ALAS başlatıcı: sunucu çalışmıyorsa başlatır, sonra paneli tarayıcıda açar.
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:\$PATH"
APP_DIR="$APP_DIR"
PORT=$PORT
URL="http://127.0.0.1:\$PORT"

# Kurulumda doğrulanan Node. Taşınmış olabilir; o zaman PATH'e düşeriz.
NODE_BIN="$NODE_BIN"
[ -x "\$NODE_BIN" ] || NODE_BIN="\$(command -v node || true)"
if [ -z "\$NODE_BIN" ]; then
  osascript -e 'display alert "Node.js bulunamadı" message "ALAS kurulum komutunu tekrar çalıştır."'
  exit 1
fi

cd "\$APP_DIR" 2>/dev/null || {
  osascript -e 'display alert "ALAS bulunamadı" message "Program klasörü silinmiş görünüyor. Kurulum komutunu tekrar çalıştır."'
  exit 1
}
mkdir -p "\$APP_DIR/data"

if ! curl -fs -o /dev/null "\$URL/api/status"; then
  nohup "\$NODE_BIN" server/index.js >> "\$APP_DIR/data/sunucu.log" 2>&1 &
  for _ in \$(seq 1 60); do
    curl -fs -o /dev/null "\$URL/api/status" && break
    sleep 0.25
  done
fi

if curl -fs -o /dev/null "\$URL/api/status"; then
  open "\$URL"
else
  osascript -e 'display alert "ALAS başlatılamadı" message "Ayrıntı için ~/ALAS/data/sunucu.log dosyasına bak."'
fi
LAUNCHER
chmod +x "$DESKTOP_APP/Contents/MacOS/ALAS"

cat > "$DESKTOP_APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>ALAS</string>
  <key>CFBundleDisplayName</key><string>ALAS</string>
  <key>CFBundleIdentifier</key><string>com.alas.pod.launcher</string>
  <key>CFBundleExecutable</key><string>ALAS</string>
  <key>CFBundleIconFile</key><string>alas</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>LSUIElement</key><true/>
</dict>
</plist>
PLIST

# sips ve iconutil macOS'ta yerleşiktir; ikon üretimi başarısız olursa kurulum devam eder.
if [ -f "$APP_DIR/scripts/alas-icon.png" ]; then
  iconset="$tmp/alas.iconset"
  mkdir -p "$iconset"
  for size in 16 32 128 256 512; do
    sips -z $size $size "$APP_DIR/scripts/alas-icon.png" --out "$iconset/icon_${size}x${size}.png" >/dev/null 2>&1 || true
    sips -z $((size*2)) $((size*2)) "$APP_DIR/scripts/alas-icon.png" --out "$iconset/icon_${size}x${size}@2x.png" >/dev/null 2>&1 || true
  done
  iconutil -c icns "$iconset" -o "$DESKTOP_APP/Contents/Resources/alas.icns" >/dev/null 2>&1 || true
fi

xattr -dr com.apple.quarantine "$DESKTOP_APP" 2>/dev/null || true
touch "$DESKTOP_APP"
ok "Masaüstünde ALAS.app hazır"

# Sunucuyu durdurmak için küçük yardımcı (nadiren gerekir).
cat > "$APP_DIR/durdur.command" <<'STOP'
#!/bin/bash
pkill -f "node server/index.js" && echo "ALAS durduruldu." || echo "ALAS zaten çalışmıyor."
sleep 1
STOP
chmod +x "$APP_DIR/durdur.command"

# ------------------------------------------------------------------ 5. Başlat

step "Başlatılıyor"
open "$DESKTOP_APP"

echo
bold "Kurulum tamam."
printf '\n'
printf '  • Masaüstündeki \033[1mALAS\033[0m ikonuna çift tıklayarak açarsın.\n'
printf '  • Program klasörü: %s\n' "$APP_DIR"
printf '  • Durdurmak için:  %s/durdur.command (çift tıkla)\n' "$APP_DIR"
printf '  • Güncellemek için bu kurulum komutunu tekrar çalıştır.\n\n'
printf '  Şu an demo modunda çalışıyor. Canlı araştırma için %s/.env\n' "$APP_DIR"
printf "  dosyasına ANTHROPIC_API_KEY ekleyip ALAS'ı kapatıp aç.\n\n"

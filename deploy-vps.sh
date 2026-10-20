#!/bin/bash
# ==============================================================================
# SMART SCHOOL ATTENDANCE SYSTEM (SSAS) - SMP NEGERI 3 JEMBER
# SCRIPT DEPLOYMENT OTOMATIS KE VPS (UBUNTU / DEBIAN)
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}=================================================================${NC}"
echo -e "${GREEN}   🚀 OTOMATISASI DEPLOYMENT SSAS KE VPS (SMP NEGERI 3 JEMBER)${NC}"
echo -e "${CYAN}=================================================================${NC}"
echo ""

# Pastikan script dijalankan sebagai root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Script ini harus dijalankan sebagai root (atau gunakan sudo).${NC}"
  exit 1
fi

# 1. Tanya Domain
echo -e "${YELLOW}📌 Konfigurasi Alamat Akses:${NC}"
read -p "👉 Masukkan nama domain Anda (Contoh: absensi.smpn3jember.sch.id), atau tekan ENTER jika ingin menggunakan IP VPS saja: " USER_DOMAIN

if [ -z "$USER_DOMAIN" ]; then
  DOMAIN_CONF="_"
  DISPLAY_URL="http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
  USE_SSL="n"
  echo -e "${BLUE}ℹ️ Menggunakan IP VPS: ${DISPLAY_URL}${NC}"
else
  DOMAIN_CONF="$USER_DOMAIN"
  DISPLAY_URL="http://${USER_DOMAIN}"
  echo -e "${GREEN}✓ Domain dikonfigurasi: ${USER_DOMAIN}${NC}"
  read -p "👉 Apakah ingin langsung memasang SSL HTTPS gratis (Let's Encrypt)? (y/n) [default: y]: " ASK_SSL
  USE_SSL=${ASK_SSL:-y}
fi

echo ""
echo -e "${BLUE}⏳ [1/6] Memperbarui sistem dan menginstal dependensi (Node.js 20, Nginx, Git, PM2)...${NC}"
apt update -y && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx certbot python3-certbot-nginx ufw
npm install -g pm2

# Setup Firewall
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true

echo -e "${GREEN}✓ Dependensi sistem berhasil diinstal.${NC}"
echo ""

# 2. Unduh atau Update Repositori
TARGET_DIR="/var/www/ssas-sekolah"
echo -e "${BLUE}⏳ [2/6] Menyiapkan source code di ${TARGET_DIR}...${NC}"
if [ -d "$TARGET_DIR/.git" ]; then
  echo "Mengunduh pembaruan terbaru dari GitHub..."
  cd "$TARGET_DIR"
  git reset --hard
  git pull origin main
else
  mkdir -p /var/www
  cd /var/www
  rm -rf ssas-sekolah
  git clone https://github.com/scitech-official/ssas-sekolah.git
  cd "$TARGET_DIR"
fi

echo -e "${GREEN}✓ Source code siap.${NC}"
echo ""

# 3. Setup Backend
echo -e "${BLUE}⏳ [3/6] Menginstal dan menjalankan Backend API...${NC}"
cd "$TARGET_DIR/backend"

# Buat file .env backend
cat << 'EOF' > .env
PORT=5000
DATABASE_URL="postgresql://postgres.xxwpzwrufvozpvqmusix:Sc1tcch_a26@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.xxwpzwrufvozpvqmusix:Sc1tcch_a26@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
JWT_SECRET="smp3_jember_secret_key_super_secure_2026"
FONNTE_API_TOKEN=""
FONNTE_MOCK_MODE=true
CLIENT_URL="*"
KIOSK_SECRET_KEY="smp3_kiosk_gate_token_2026"
EOF

npm install --production=false
npx prisma generate

# Jalankan backend dengan PM2
pm2 stop ssas-backend 2>/dev/null || true
pm2 delete ssas-backend 2>/dev/null || true
pm2 start src/server.js --name "ssas-backend"
pm2 save
pm2 startup systemd -u root --hp /root || true

echo -e "${GREEN}✓ Backend aktif 24 jam dengan PM2.${NC}"
echo ""

# 4. Setup Frontend
echo -e "${BLUE}⏳ [4/6] Mengompilasi (build) Frontend React...${NC}"
cd "$TARGET_DIR/frontend"

# Buat file .env frontend
cat << 'EOF' > .env
VITE_API_BASE_URL="/api"
EOF

npm install
npm run build

echo -e "${GREEN}✓ Frontend berhasil dikompilasi.${NC}"
echo ""

# 5. Konfigurasi Nginx
echo -e "${BLUE}⏳ [5/6] Mengonfigurasi Nginx Web Server & Reverse Proxy...${NC}"

cat << EOF > /etc/nginx/sites-available/ssas
server {
    listen 80;
    server_name ${DOMAIN_CONF};

    # Frontend Static Distribution
    location / {
        root ${TARGET_DIR}/frontend/dist;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Optimasi Upload & Timeout
    client_max_body_size 20M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
EOF

ln -sf /etc/nginx/sites-available/ssas /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo -e "${GREEN}✓ Nginx aktif dan berjalan lancar.${NC}"
echo ""

# 6. Pasang SSL jika diminta
if [ "$USE_SSL" = "y" ] || [ "$USE_SSL" = "Y" ]; then
  if [ "$DOMAIN_CONF" != "_" ]; then
    echo -e "${BLUE}⏳ [6/6] Memasang Sertifikat SSL HTTPS Let's Encrypt untuk ${USER_DOMAIN}...${NC}"
    certbot --nginx -d "${USER_DOMAIN}" --non-interactive --agree-tos -m "admin@${USER_DOMAIN}" --redirect || {
      echo -e "${YELLOW}⚠️ Pemasangan SSL otomatis tertunda. Pastikan domain ${USER_DOMAIN} sudah diarahkan (DNS A Record) ke IP VPS ini.${NC}"
    }
    DISPLAY_URL="https://${USER_DOMAIN}"
  fi
fi

# Tampilkan Banner Selesai
echo ""
echo -e "${CYAN}=================================================================${NC}"
echo -e "${GREEN}🎉 SELAMAT! SISTEM SSAS SMPN 3 JEMBER BERHASIL DI-DEPLOY KE VPS!${NC}"
echo -e "${CYAN}=================================================================${NC}"
echo ""
echo -e "🌐 Alamat Web Aplikasi:  ${YELLOW}${DISPLAY_URL}${NC}"
echo -e "⚙️  Backend Status:       ${GREEN}Online (PM2: ssas-backend)${NC}"
echo -e "📁 Lokasi Proyek:        ${TARGET_DIR}"
echo ""
echo -e "${CYAN}Perintah Berguna di VPS:${NC}"
echo -e "  • Pantau Log WA Fonnte:   ${YELLOW}pm2 logs ssas-backend${NC}"
echo -e "  • Restart Backend:        ${YELLOW}pm2 restart ssas-backend${NC}"
echo -e "  • Cek Status Nginx:       ${YELLOW}systemctl status nginx${NC}"
echo ""
echo -e "${GREEN}Sistem sudah siap digunakan 24/7 dengan antrean WhatsApp lancar!${NC}"
echo -e "${CYAN}=================================================================${NC}"

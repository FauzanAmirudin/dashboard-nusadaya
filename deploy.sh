#!/usr/bin/env bash

# ==============================================================================
# NUSADAYA DASHBOARD — AUTOMATED DOCKER DEPLOYMENT SCRIPT
# ==============================================================================
# Script ini dirancang untuk setup & deploy otomatis pada VPS baru (Ubuntu/Debian)
# Penggunaan:
#   chmod +x deploy.sh
#   ./deploy.sh          -> Setup & deploy pertama kali
#   ./deploy.sh update   -> Pull update git terbaru & rebuild container
#   ./deploy.sh restart  -> Restart seluruh container
#   ./deploy.sh status   -> Cek status container & resource
#   ./deploy.sh logs     -> Live logs container
#   ./deploy.sh db:push  -> Push migrasi skema database
#   ./deploy.sh seed     -> Jalankan seeding data awal
# ==============================================================================

set -e

# Warna Terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

banner() {
    echo -e "${CYAN}"
    echo "=========================================================="
    echo "    NUSADAYA DASHBOARD — PRODUCTION DEPLOYMENT MANAGER   "
    echo "=========================================================="
    echo -e "${NC}"
}

# 1. Pengecekan Hak Akses Root / Sudo
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_warn "Script sebaiknya dijalankan dengan sudo atau akses root untuk setup Docker & Swap."
    fi
}

# 2. Setup SWAP Memory Otomatis (Mencegah OOM saat Next.js build)
setup_swap() {
    TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_RAM_MB=$((TOTAL_RAM_KB / 1024))
    EXISTING_SWAP=$(swapon --show | wc -l)

    log_info "Memeriksa kapasitas RAM VPS: ${TOTAL_RAM_MB} MB..."

    if [ "$TOTAL_RAM_MB" -lt 3500 ] && [ "$EXISTING_SWAP" -le 1 ]; then
        log_warn "RAM terdeteksi < 3.5 GB dan belum ada SWAP memory aktif."
        log_info "Membuat SWAP 2 GB otomatis untuk mencegah build out-of-memory..."

        if [ "$EUID" -eq 0 ]; then
            if [ ! -f /swapfile ]; then
                fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
                chmod 600 /swapfile
                mkswap /swapfile
                swapon /swapfile
                if ! grep -q "/swapfile" /etc/fstab; then
                    echo '/swapfile none swap sw 0 0' >> /etc/fstab
                fi
                log_success "SWAP 2 GB berhasil dibuat dan diaktifkan."
            fi
        else
            log_warn "Lewati pembuatan swap karena bukan user root. Pastikan VPS Anda memiliki cukup RAM."
        fi
    else
        log_success "Kapasitas RAM / Swap sudah memadai."
    fi
}

# 3. Pengecekan & Instalasi Docker & Docker Compose
check_docker() {
    log_info "Memeriksa instalasi Docker & Docker Compose..."

    if ! command -v docker &> /dev/null; then
        log_warn "Docker belum terpasang. Memulai instalasi otomatis Docker Engine..."
        if [ "$EUID" -eq 0 ]; then
            apt-get update -y
            apt-get install -y curl ca-certificates gnupg lsb-release
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            rm -f get-docker.sh
            systemctl enable docker
            systemctl start docker
            log_success "Docker berhasil diinstall!"
        else
            log_error "Docker belum terinstall. Jalankan script ini sebagai root/sudo untuk instalasi otomatis."
            exit 1
        fi
    else
        log_success "Docker terdeteksi: $(docker --version)"
    fi

    if ! docker compose version &> /dev/null; then
        log_warn "Docker Compose plugin belum terpasang. Menginstall docker-compose-plugin..."
        if [ "$EUID" -eq 0 ]; then
            apt-get update -y
            apt-get install -y docker-compose-plugin
            log_success "Docker Compose plugin berhasil diinstall!"
        else
            log_error "Docker Compose belum terinstall."
            exit 1
        fi
    else
        log_success "Docker Compose terdeteksi: $(docker compose version)"
    fi
}

# 4. Inisialisasi File Lingkungan (.env)
setup_env() {
    if [ ! -f .env ]; then
        log_warn "File .env belum ditemukan. Membuat dari .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
        else
            log_error "File .env.example tidak ditemukan!"
            exit 1
        fi

        # Generate Password & Secret acak yang kuat
        DB_PASS=$(openssl rand -hex 16 2>/dev/null || date +%s%N | sha256sum | head -c 32)
        JWT_SEC=$(openssl rand -hex 24 2>/dev/null || date +%s%N | sha256sum | head -c 48)

        # Ganti placeholder di .env
        sed -i "s/POSTGRES_PASSWORD=ganti_dengan_password_db_yang_kuat/POSTGRES_PASSWORD=${DB_PASS}/g" .env
        sed -i "s/ganti_dengan_password_db_yang_kuat/${DB_PASS}/g" .env
        sed -i "s/JWT_SECRET=ganti_dengan_jwt_secret_acak_minimal_32_karakter/JWT_SECRET=${JWT_SEC}/g" .env

        # Deteksi IP Public VPS jika memungkinkan
        PUBLIC_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || echo "localhost")

        echo ""
        echo -e "${YELLOW}------------------------------------------------------------${NC}"
        echo -e "${YELLOW}KONFIGURASI ALAMAT AKSES (IP ATAU DOMAIN)${NC}"
        echo -e "${YELLOW}Terdeteksi IP VPS: ${CYAN}${PUBLIC_IP}${NC}"
        echo -e "${YELLOW}------------------------------------------------------------${NC}"
        read -p "Masukkan IP VPS atau Domain Anda (tekan Enter untuk '${PUBLIC_IP}'): " USER_HOST
        SERVER_HOST=${USER_HOST:-$PUBLIC_IP}

        # Update URLs di .env
        sed -i "s|FRONTEND_URL=http://localhost|FRONTEND_URL=http://${SERVER_HOST}|g" .env
        sed -i "s|NEXT_PUBLIC_API_URL=http://localhost:3001|NEXT_PUBLIC_API_URL=http://${SERVER_HOST}:3001|g" .env
        sed -i "s|ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://localhost:3000|ALLOWED_ORIGINS=http://${SERVER_HOST},http://${SERVER_HOST}:80,http://${SERVER_HOST}:3001,http://localhost,http://localhost:80|g" .env

        log_success "File .env berhasil dibuat dengan password database dan JWT secret yang aman!"
    else
        log_info "File .env sudah ada. Menggunakan konfigurasi yang ada."
    fi
}

# 5. Build & Jalankan Docker Container
start_containers() {
    log_info "Memulai proses build & deployment Docker..."
    docker compose build --pull
    docker compose up -d

    log_info "Menunggu database PostgreSQL siap..."
    RETRIES=15
    until docker compose exec -T db pg_isready -U postgres -d nusadaya &> /dev/null || [ $RETRIES -eq 0 ]; do
        echo -n "."
        sleep 2
        RETRIES=$((RETRIES - 1))
    done
    echo ""

    if [ $RETRIES -eq 0 ]; then
        log_error "PostgreSQL gagal siap dalam batas waktu yang ditentukan."
        docker compose logs db
        exit 1
    fi
    log_success "Database PostgreSQL siap!"

    log_info "Menerapkan migrasi skema database (drizzle db push)..."
    docker compose exec -T api bun run db:push || {
        log_warn "drizzle db:push selesai dengan catatan."
    }

    # Cek apakah database perlu di-seed
    echo ""
    read -p "Apakah Anda ingin menjalankan seed data default/pengguna awal? (y/N): " RUN_SEED
    if [[ "$RUN_SEED" =~ ^[Yy]$ ]]; then
        log_info "Menjalankan database seeder..."
        docker compose exec -T api bun run seed || log_warn "Seed script selesai."
        log_success "Database seed selesai dijalankan!"
    fi
}

# 6. Status & Informasi Akses
show_info() {
    echo ""
    log_success "=========================================================="
    log_success "        APLIKASI NUSADAYA BERHASIL DI-DEPLOY!            "
    log_success "=========================================================="

    # Ambil host dari .env
    SERVER_URL=$(grep FRONTEND_URL .env | cut -d '=' -f2 | tr -d ' ' || echo "http://localhost")
    API_URL=$(grep NEXT_PUBLIC_API_URL .env | cut -d '=' -f2 | tr -d ' ' || echo "http://localhost:3001")

    echo -e "Frontend Web (Port 80) : ${CYAN}${SERVER_URL}${NC}"
    echo -e "Backend API  (Port 3001): ${CYAN}${API_URL}${NC}"
    echo -e "API Docs Swagger       : ${CYAN}${API_URL}/docs${NC}"
    echo ""
    echo -e "Perintah Pemeliharaan:"
    echo -e "  - Cek log aplikasi    : ${YELLOW}./deploy.sh logs${NC}"
    echo -e "  - Cek status container : ${YELLOW}./deploy.sh status${NC}"
    echo -e "  - Update kode terbaru  : ${YELLOW}./deploy.sh update${NC}"
    echo -e "  - Restart container    : ${YELLOW}./deploy.sh restart${NC}"
    echo "=========================================================="
}

# ==============================================================================
# SUBCOMMAND HANDLERS
# ==============================================================================

cmd_status() {
    banner
    log_info "Status Container Docker:"
    docker compose ps
    echo ""
    log_info "Penggunaan Resource (Stats):"
    docker stats --no-stream
}

cmd_logs() {
    log_info "Menampilkan live logs container (Ctrl+C untuk keluar)..."
    docker compose logs -f
}

cmd_restart() {
    banner
    log_info "Merestart seluruh container..."
    docker compose restart
    log_success "Container berhasil direstart!"
}

cmd_stop() {
    banner
    log_warn "Menghentikan seluruh container..."
    docker compose down
    log_success "Container dihentikan."
}

cmd_db_push() {
    banner
    log_info "Mendorong migrasi skema database..."
    docker compose exec api bun run db:push
    log_success "Skema database diperbarui."
}

cmd_seed() {
    banner
    log_info "Menjalankan seeding data..."
    docker compose exec api bun run seed
    log_success "Seeding data selesai."
}

cmd_update() {
    banner
    log_info "Mengambil update terbaru dari GitHub..."
    git pull origin main
    log_info "Membangun ulang container..."
    docker compose build
    docker compose up -d
    log_info "Mendorong pembaruan skema database..."
    docker compose exec -T api bun run db:push || true
    log_success "Pembaruan berhasil diterapkan!"
    cmd_status
}

# ==============================================================================
# MAIN DISPATCHER
# ==============================================================================

ACTION="${1:-deploy}"

case "$ACTION" in
    status)
        cmd_status
        ;;
    logs)
        cmd_logs
        ;;
    restart)
        cmd_restart
        ;;
    stop)
        cmd_stop
        ;;
    db:push)
        cmd_db_push
        ;;
    seed)
        cmd_seed
        ;;
    update)
        cmd_update
        ;;
    deploy)
        banner
        check_root
        setup_swap
        check_docker
        setup_env
        start_containers
        show_info
        ;;
    *)
        echo "Penggunaan: $0 {deploy|update|restart|stop|logs|status|db:push|seed}"
        exit 1
        ;;
esac

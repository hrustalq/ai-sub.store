#!/usr/bin/env bash
#
# Install or refresh the nginx site for ai-sub.store.
# Run as root, or via: sudo /opt/ai-sub.store/scripts/nginx/install-nginx-site.sh
#
# Environment:
#   DOMAIN            Hostname only, e.g. ai-sub.store
#   PUBLIC_BASE_URL   Optional; https://ai-sub.store (DOMAIN is derived if unset)
#   LETSENCRYPT_EMAIL Required on first run to obtain a certificate
#   APP_PORT          App listen port on localhost (default: 3000)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_NAME="ai-sub.store"
SITE_AVAILABLE="/etc/nginx/sites-available/${SITE_NAME}"
SITE_ENABLED="/etc/nginx/sites-enabled/${SITE_NAME}"
CERT_DIR=""
APP_PORT="${APP_PORT:-3000}"

log() {
  printf '==> %s\n' "$*"
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    die "run as root: sudo $0"
  fi
}

normalize_domain() {
  local raw="${DOMAIN:-${PUBLIC_BASE_URL:-ai-sub.store}}"
  raw="${raw#https://}"
  raw="${raw#http://}"
  raw="${raw%%/*}"
  raw="${raw%%:*}"
  printf '%s' "${raw}"
}

render_template() {
  local template="$1"
  local output="$2"
  local domain="$3"

  sed \
    -e "s|__DOMAIN__|${domain}|g" \
    -e "s|127.0.0.1:3000|127.0.0.1:${APP_PORT}|g" \
    "${template}" >"${output}"
}

enable_site() {
  ln -sf "${SITE_AVAILABLE}" "${SITE_ENABLED}"
  if [[ -f /etc/nginx/sites-enabled/default ]]; then
    rm -f /etc/nginx/sites-enabled/default
  fi
}

reload_nginx() {
  nginx -t
  systemctl reload nginx
}

obtain_certificate() {
  local domain="$1"

  [[ -n "${LETSENCRYPT_EMAIL:-}" ]] || die "set LETSENCRYPT_EMAIL for the first certificate run"

  log "requesting Let's Encrypt certificate for ${domain}"
  certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d "${domain}" \
    --email "${LETSENCRYPT_EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --non-interactive
}

ensure_ssl_params() {
  if [[ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]]; then
    mkdir -p /etc/letsencrypt
    curl -fsSL https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
      -o /etc/letsencrypt/options-ssl-nginx.conf
  fi

  if [[ ! -f /etc/letsencrypt/ssl-dhparams.pem ]]; then
    openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
  fi
}

main() {
  require_root

  command -v nginx >/dev/null 2>&1 || die "nginx is not installed; run scripts/setup-nginx-certbot.sh first"
  command -v certbot >/dev/null 2>&1 || die "certbot is not installed; run scripts/setup-nginx-certbot.sh first"

  local domain
  domain="$(normalize_domain)"
  [[ -n "${domain}" ]] || die "set DOMAIN or PUBLIC_BASE_URL"

  CERT_DIR="/etc/letsencrypt/live/${domain}"
  mkdir -p /var/www/certbot

  if [[ ! -f "${CERT_DIR}/fullchain.pem" ]]; then
    log "no certificate yet — using HTTP bootstrap config"
    render_template "${SCRIPT_DIR}/ai-sub.store.bootstrap.conf" "${SITE_AVAILABLE}" "${domain}"
    enable_site
    reload_nginx
    obtain_certificate "${domain}"
    ensure_ssl_params
  fi

  log "installing HTTPS nginx config for ${domain}"
  render_template "${SCRIPT_DIR}/ai-sub.store.conf" "${SITE_AVAILABLE}" "${domain}"
  enable_site
  reload_nginx
  log "nginx is serving https://${domain}"
}

main "$@"

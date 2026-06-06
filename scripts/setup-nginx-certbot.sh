#!/usr/bin/env bash
#
# One-time VPS setup: nginx, certbot, sudo access for deploy user, TLS site.
#
# Run on the VPS as root:
#   scp -r scripts/nginx scripts/setup-nginx-certbot.sh root@5.42.126.174:/tmp/
#   ssh root@5.42.126.174 \
#     'DOMAIN=ai-sub.store LETSENCRYPT_EMAIL=you@example.com DEPLOY_USER=deploy bash /tmp/setup-nginx-certbot.sh'
#
# Prerequisites:
#   - DNS A record for DOMAIN → VPS public IP
#   - Port 80 and 443 open in the firewall / security group
#   - Docker app listening on 127.0.0.1:3000 (docker-compose.prod.yml)

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
DOMAIN="${DOMAIN:-ai-sub.store}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
SCRIPT_ROOT="${SCRIPT_ROOT:-/opt/ai-sub.store}"
NGINX_SCRIPT="${SCRIPT_ROOT}/scripts/nginx/install-nginx-site.sh"
SUDOERS_FILE="/etc/sudoers.d/ai-sub-store-nginx"

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

install_packages() {
  log "installing nginx and certbot"
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx certbot curl openssl
  systemctl enable nginx
  systemctl start nginx
}

install_nginx_scripts() {
  local bundled_dir
  bundled_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/nginx"

  [[ -d "${bundled_dir}" ]] || die "bundled nginx scripts not found at ${bundled_dir}"

  log "installing nginx scripts to ${SCRIPT_ROOT}/scripts/nginx"
  mkdir -p "${SCRIPT_ROOT}/scripts/nginx"
  cp -a "${bundled_dir}/." "${SCRIPT_ROOT}/scripts/nginx/"
  chmod +x "${SCRIPT_ROOT}/scripts/nginx/install-nginx-site.sh"
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${SCRIPT_ROOT}/scripts"
}

configure_sudo_for_deploy() {
  cat >"${SUDOERS_FILE}" <<EOF
# Managed by ai-sub.store — allow deploy user to refresh nginx after releases.
# Command must match exactly (no env prefixes): sudo /opt/ai-sub.store/scripts/nginx/install-nginx-site.sh
${DEPLOY_USER} ALL=(root) NOPASSWD: ${NGINX_SCRIPT}
EOF
  chmod 440 "${SUDOERS_FILE}"
  visudo -cf "${SUDOERS_FILE}"
  log "sudoers configured for ${DEPLOY_USER}"
}

configure_certbot_renewal() {
  local hook_dir="/etc/letsencrypt/renewal-hooks/deploy"
  mkdir -p "${hook_dir}"
  cat >"${hook_dir}/reload-nginx.sh" <<'EOF'
#!/bin/sh
systemctl reload nginx
EOF
  chmod 755 "${hook_dir}/reload-nginx.sh"
  log "certbot renewal hook installed"
}

run_from_bundled_scripts() {
  local bundled_dir
  bundled_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  if [[ -x "${bundled_dir}/nginx/install-nginx-site.sh" ]]; then
    log "using bundled nginx scripts from ${bundled_dir}"
    DOMAIN="${DOMAIN}" \
      LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL}" \
      bash "${bundled_dir}/nginx/install-nginx-site.sh"
    return
  fi

  if [[ -x "${NGINX_SCRIPT}" ]]; then
    DOMAIN="${DOMAIN}" \
      LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL}" \
      bash "${NGINX_SCRIPT}"
    return
  fi

  die "nginx install script not found; deploy the app first or copy scripts/nginx to ${SCRIPT_ROOT}"
}

print_summary() {
  cat <<EOF

nginx + certbot bootstrap complete.

  domain:   ${DOMAIN}
  site:     /etc/nginx/sites-available/ai-sub.store
  cert:     /etc/letsencrypt/live/${DOMAIN}/

Verify:
  curl -I https://${DOMAIN}/health/ready
  certbot renew --dry-run

After the first GitHub deploy, the workflow can refresh nginx with:
  sudo ${NGINX_SCRIPT}

EOF
}

main() {
  require_root
  [[ -n "${LETSENCRYPT_EMAIL}" ]] || die "set LETSENCRYPT_EMAIL (Let's Encrypt account email)"

  install_packages
  install_nginx_scripts
  configure_certbot_renewal
  configure_sudo_for_deploy
  run_from_bundled_scripts
  print_summary
}

main "$@"

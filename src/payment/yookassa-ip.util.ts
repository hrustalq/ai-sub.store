/** YooKassa webhook source IPs — https://yookassa.ru/developers/using-api/webhooks */
const YOOKASSA_IPV4_CIDRS = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.154.128/25',
] as const;

const YOOKASSA_IPV4_HOSTS = ['77.75.156.11', '77.75.156.35'] as const;

function ipv4ToInt(ip: string): number | undefined {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return undefined;
  }

  let value = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return undefined;
    }
    value = (value << 8) + octet;
  }

  return value >>> 0;
}

function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [network, prefixLengthRaw] = cidr.split('/');
  const prefixLength = Number(prefixLengthRaw);
  const ipInt = ipv4ToInt(ip);
  const networkInt = ipv4ToInt(network);

  if (
    ipInt === undefined ||
    networkInt === undefined ||
    !Number.isInteger(prefixLength) ||
    prefixLength < 0 ||
    prefixLength > 32
  ) {
    return false;
  }

  const mask = prefixLength === 0 ? 0 : (~0 << (32 - prefixLength)) >>> 0;
  return (ipInt & mask) === (networkInt & mask);
}

export function isYooKassaWebhookIp(ip: string): boolean {
  const normalized = ip.replace(/^::ffff:/, '');

  if (normalized.includes(':')) {
    return normalized.toLowerCase().startsWith('2a02:5180:');
  }

  if (
    YOOKASSA_IPV4_HOSTS.includes(
      normalized as (typeof YOOKASSA_IPV4_HOSTS)[number],
    )
  ) {
    return true;
  }

  return YOOKASSA_IPV4_CIDRS.some((cidr) => isIpv4InCidr(normalized, cidr));
}

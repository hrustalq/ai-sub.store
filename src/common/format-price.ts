export const PAYMENT_CURRENCY = 'RUB' as const;

export function formatPriceRub(amount: number): string {
  const rounded = Number.isInteger(amount)
    ? amount.toString()
    : amount.toFixed(2).replace(/\.?0+$/, '');
  return `${rounded} ₽`;
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPakistaniPhoneNumber(phone: string): string {
  // Ensure it starts with +92
  if (!phone.startsWith('92')) {
    return phone;
  }

  const digits = phone.replace('92', '');
  const operatorCode = digits.slice(0, 3); // 346
  const subscriber = digits.slice(3); // 5959471

  return `+92 ${operatorCode}-${subscriber}`;
}

export function formatPakistaniCurrency(amount: number) {
  return amount.toLocaleString('en-PK', {
    style: 'currency',
    currency: 'PKR',
    currencyDisplay: 'narrowSymbol',
    notation: amount >= 1_000_000 ? 'compact' : 'standard', // 10 Lakh = 1 Million
    compactDisplay: 'short', // shows 1M, 2B
    numberingSystem: 'latn',
    useGrouping: true,
    minimumFractionDigits: amount >= 1_000_000 ? 1 : 0, // force 1 decimal when compact
    maximumFractionDigits: 2, // cap at 1 decimal
    roundingMode: 'floor',
  });
}

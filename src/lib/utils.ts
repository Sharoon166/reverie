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
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'PKR',
    roundingMode: 'floor',
  });
}

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatSpeed(mbps: number | null | undefined): string {
  if (mbps === null || mbps === undefined) return 'N/A';
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(1)} Gbps`;
  }
  return `${mbps} Mbps`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Never';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getProviderColor(slug: string): string {
  const colors: Record<string, string> = {
    comcast: '#0070d1',
    'comcast-business': '#0070d1',
    att: '#00a8e0',
    'att-business': '#00a8e0',
    verizon: '#cd040b',
    'verizon-business': '#cd040b',
    tmobile: '#e20074',
    'tmobile-business': '#e20074',
    spectrum: '#0077c8',
    'spectrum-business': '#0077c8',
    cox: '#f26522',
    'cox-business': '#f26522',
    optimum: '#003d79',
    'optimum-business': '#003d79',
  };
  return colors[slug] || '#6b7280';
}

export function getProviderBadgeClass(slug: string): string {
  const classes: Record<string, string> = {
    'comcast-business': 'provider-badge-comcast',
    'att-business': 'provider-badge-att',
    'verizon-business': 'provider-badge-verizon',
    'tmobile-business': 'provider-badge-tmobile',
    'spectrum-business': 'provider-badge-spectrum',
  };
  return classes[slug] || 'bg-gray-500 text-white';
}

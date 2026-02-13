import { ProviderCollector } from './base';
import { ComcastBusinessCollector } from './providers/comcast-business';
import { ATTBusinessCollector } from './providers/att-business';
import { VerizonBusinessCollector } from './providers/verizon-business';
import { TMobileBusinessCollector } from './providers/tmobile-business';
import { SpectrumBusinessCollector } from './providers/spectrum-business';
import { CoxBusinessCollector } from './providers/cox-business';
import { OptimumBusinessCollector } from './providers/optimum-business';

// Registry of all available collectors
const collectors: Map<string, ProviderCollector> = new Map();

// Register collectors
function registerCollector(collector: ProviderCollector) {
  collectors.set(collector.providerSlug, collector);
}

// Initialize collectors
registerCollector(new ComcastBusinessCollector());
registerCollector(new ATTBusinessCollector());
registerCollector(new VerizonBusinessCollector());
registerCollector(new TMobileBusinessCollector());
registerCollector(new SpectrumBusinessCollector());
registerCollector(new CoxBusinessCollector());
registerCollector(new OptimumBusinessCollector());

export function getCollectorForProvider(slug: string): ProviderCollector | undefined {
  return collectors.get(slug);
}

export function getAllCollectors(): ProviderCollector[] {
  return Array.from(collectors.values());
}

export function getAvailableProviderSlugs(): string[] {
  return Array.from(collectors.keys());
}

import type { NotifierConfig, NotifierProvider, WhatsAppConfig, DiscordConfig, MultiProviderConfig } from '../types/notifier';
import { ProviderError } from '../types/errors';
import { WhatsAppGreenApiProvider } from './whatsapp-greenapi';
import { DiscordProvider } from './discord';

export class ProviderRegistry {
  static getProviders(config: NotifierConfig): NotifierProvider[] {
    if ('providers' in config) {
      return this.getMultiProviders(config as MultiProviderConfig);
    }

    // Legacy single provider config - no longer supported
    throw new ProviderError('Config must use multi-provider structure with providers object');
  }

  static getProvider(config: WhatsAppConfig | DiscordConfig): NotifierProvider {
    switch (config.provider) {
      case 'whatsapp-greenapi':
        return new WhatsAppGreenApiProvider(config as WhatsAppConfig);
      case 'discord':
        return new DiscordProvider(config as DiscordConfig);
      default:
        const _exhaustiveCheck: never = config;
        throw new ProviderError('Unknown provider type');
    }
  }

  private static getMultiProviders(config: MultiProviderConfig): NotifierProvider[] {
    const providers: NotifierProvider[] = [];

    for (const [key, providerConfig] of Object.entries(config.providers || {})) {
      if (!providerConfig || !(providerConfig as any).enabled) {
        continue;
      }

      try {
        providers.push(this.getProvider(providerConfig as any));
      } catch (e) {
        console.error(`[Multi-Notifier] Failed to create provider ${key}:`, (e as Error).message);
      }
    }

    return providers;
  }
}

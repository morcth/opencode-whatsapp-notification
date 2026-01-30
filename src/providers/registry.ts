import type { NotifierConfig, NotifierProvider } from '../types/notifier';
import { ProviderError } from '../types/errors';
import { WhatsAppGreenApiProvider } from './whatsapp-greenapi';

export class ProviderRegistry {
  static getProvider(config: NotifierConfig): NotifierProvider {
    switch (config.provider) {
      case 'whatsapp-greenapi':
        return new WhatsAppGreenApiProvider(config as any);
      default:
        throw new ProviderError(config.provider);
    }
  }
}

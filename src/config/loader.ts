import type { NotifierConfig } from '../types/notifier';
import { ConfigError } from '../types/errors';

export class ConfigLoader {
  async load(projectConfig: any): Promise<NotifierConfig> {
    const notifierConfig = projectConfig?.notifier;

    if (!notifierConfig) {
      throw new ConfigError('Missing notifier config in opencode.json');
    }

    const provider = notifierConfig.provider;
    if (provider !== 'whatsapp-greenapi') {
      throw new ConfigError(`Unsupported provider: ${provider}`);
    }

    if (!notifierConfig.enabled) {
      return { provider, enabled: false, fallbackConfigPath: '' };
    }

    if (!notifierConfig.apiUrl || !notifierConfig.instanceId || !notifierConfig.apiToken || !notifierConfig.chatId) {
      throw new ConfigError('Missing required WhatsApp config fields: apiUrl, instanceId, apiToken, chatId');
    }

    return {
      provider: 'whatsapp-greenapi',
      enabled: true,
      apiUrl: notifierConfig.apiUrl,
      instanceId: notifierConfig.instanceId,
      apiToken: notifierConfig.apiToken,
      chatId: notifierConfig.chatId,
      timeout: notifierConfig.timeout || 10000
    };
  }
}

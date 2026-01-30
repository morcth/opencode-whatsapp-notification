import type { NotifierConfig } from '../types/notifier';
import { ConfigError } from '../types/errors';

interface PartialProjectConfig {
  notifier?: {
    provider?: string;
    enabled?: boolean;
    apiUrl?: string;
    instanceId?: string;
    apiToken?: string;
    chatId?: string;
    timeout?: number;
  };
}

export class ConfigLoader {
  load(projectConfig: PartialProjectConfig): NotifierConfig {
    const notifierConfig = projectConfig?.notifier;

    if (!notifierConfig) {
      throw new ConfigError('Missing notifier config in opencode.json');
    }

    if (notifierConfig.provider !== 'whatsapp-greenapi') {
      throw new ConfigError(`Unsupported provider: ${notifierConfig.provider}`);
    }

    if (!notifierConfig.enabled) {
      return { provider: 'whatsapp-greenapi', enabled: false, fallbackConfigPath: '' };
    }

    const apiUrl = notifierConfig.apiUrl?.trim();
    const instanceId = notifierConfig.instanceId?.trim();
    const apiToken = notifierConfig.apiToken?.trim();
    const chatId = notifierConfig.chatId?.trim();

    if (!apiUrl || !instanceId || !apiToken || !chatId) {
      throw new ConfigError('Missing required WhatsApp config fields: apiUrl, instanceId, apiToken, chatId');
    }

    try {
      new URL(apiUrl);
    } catch {
      throw new ConfigError('Invalid apiUrl format: must be a valid URL');
    }

    const timeout = notifierConfig.timeout ?? 10000;
    if (timeout <= 0) {
      throw new ConfigError('Invalid timeout: must be a positive number');
    }

    return {
      provider: 'whatsapp-greenapi',
      enabled: true,
      apiUrl,
      instanceId,
      apiToken,
      chatId,
      timeout
    };
  }
}

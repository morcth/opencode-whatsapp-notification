import type { NotifierProvider, NotificationPayload, WhatsAppConfig } from '../types/notifier';
import { TransportError } from '../types/errors';

export class WhatsAppGreenApiProvider implements NotifierProvider {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async send(eventType: string, payload: NotificationPayload): Promise<void> {
    // Stub - implemented in Task 5
  }

  validateConfig(config: WhatsAppConfig): boolean {
    return !!(config.apiUrl && config.instanceId && config.apiToken && config.chatId);
  }
}

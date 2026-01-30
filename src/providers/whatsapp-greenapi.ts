import type { NotifierProvider, NotificationPayload, WhatsAppConfig, ValidationResult } from '../types/notifier';

export class WhatsAppGreenApiProvider implements NotifierProvider {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async send(eventType: string, payload: NotificationPayload): Promise<void> {
    // Stub - implemented in Task 5
  }

  validateConfig(config: unknown): ValidationResult {
    const errors: string[] = [];
    const cfg = config as Partial<WhatsAppConfig>;

    if (!cfg.apiUrl) errors.push('apiUrl is required');
    if (!cfg.instanceId) errors.push('instanceId is required');
    if (!cfg.apiToken) errors.push('apiToken is required');
    if (!cfg.chatId) errors.push('chatId is required');

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }
}

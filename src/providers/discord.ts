import type { NotifierProvider, NotificationPayload, DiscordConfig } from '../types/notifier';

export class DiscordProvider implements NotifierProvider {
  name = 'Discord';
  private config: DiscordConfig;

  constructor(config: DiscordConfig) {
    this.config = config;
  }

  async send(eventType: string, payload: NotificationPayload): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  validateConfig(config: unknown): { valid: true } | { valid: false; errors: string[] } {
    const discordConfig = config as DiscordConfig;
    if (!discordConfig.webhookUrl) {
      return { valid: false, errors: ['Missing webhookUrl'] };
    }
    return { valid: true };
  }
}

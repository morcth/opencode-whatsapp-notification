import type { NotifierProvider, NotificationPayload, DiscordConfig } from '../types/notifier';

interface DiscordEmbed {
  title: string;
  color: number;
  fields: Array<{ name: string; value: string; inline: boolean }>;
  footer: { text: string };
  timestamp: string;
}

export class DiscordProvider implements NotifierProvider {
  name = 'Discord';
  private config: DiscordConfig;

  constructor(config: DiscordConfig) {
    this.config = config;
  }

  async send(eventType: string, payload: NotificationPayload): Promise<void> {
    const embed = this.formatEmbed(eventType, payload);
    const body = {
      username: this.config.username || 'OpenCode Notifier',
      avatar_url: this.config.avatarUrl,
      embeds: [embed]
    };

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Discord webhook failed: ${response.status} ${text}`);
    }
  }

  private formatEmbed(eventType: string, payload: NotificationPayload): DiscordEmbed {
    const color = payload.eventType === 'session.idle' ? 0x00ff00 : 0xffa500;
    const title = payload.eventType === 'session.idle' ? 'Session Idle' : 'Permission Required';

    const fields = [
      { name: 'Peak Tokens', value: `${payload.peakTokens.toLocaleString()} tokens`, inline: true },
      { name: 'Peak Context', value: `${payload.peakContextPercentage}%`, inline: true },
      { name: 'Model', value: payload.modelName, inline: false }
    ];

    if (payload.eventType === 'permission.asked' && payload.pendingCommand) {
      fields.splice(2, 0, {
        name: 'Pending Command',
        value: `\`\`\`bash\n${payload.pendingCommand}\n\`\`\``,
        inline: false
      });
    }

    return {
      title,
      color,
      fields,
      footer: { text: payload.sessionId },
      timestamp: payload.timestamp
    };
  }

  validateConfig(config: unknown): { valid: true } | { valid: false; errors: string[] } {
    const discordConfig = config as DiscordConfig;
    const errors: string[] = [];

    if (!discordConfig.webhookUrl) {
      errors.push('Missing webhookUrl');
    }

    if (discordConfig.webhookUrl && !discordConfig.webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      errors.push('webhookUrl must be a valid Discord webhook URL');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }
}

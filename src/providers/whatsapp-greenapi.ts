import type { NotifierProvider, NotificationPayload, WhatsAppConfig } from '../types/notifier';
import { TransportError } from '../types/errors';

export class WhatsAppGreenApiProvider implements NotifierProvider {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async send(eventType: string, payload: NotificationPayload): Promise<void> {
    const message = this.formatMessage(payload);
    const url = `${this.config.apiUrl}/waInstance${this.config.instanceId}/sendMessage/${this.config.apiToken}`;
    const body = {
      chatId: this.config.chatId,
      message
    };
    console.log('[WhatsApp Provider] Send called for', eventType, 'to', this.config.chatId);

    let lastError: Error | null = null;
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          console.log('[WhatsApp Provider] Success!');
          return;
        }

        const status = response.status;
        const responseText = await response.text();

        if (status === 401 || status === 400) {
          throw new TransportError(status, `Auth/Client error: ${status}`);
        }

        if (status >= 500 && status < 600) {
          if (attempt < maxAttempts) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            lastError = new TransportError(status, responseText);
            continue;
          }
          throw new TransportError(status, responseText);
        }

        throw new TransportError(status, responseText);
      } catch (e: any) {
        if (e.name === 'TransportError') throw e;
        if (attempt < maxAttempts) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          lastError = e;
          continue;
        }
        lastError = e;
      }
    }

    throw lastError || new TransportError(0, 'Unknown error');
  }

  validateConfig(config: unknown): { valid: true } | { valid: false; errors: string[] } {
    const whatsappConfig = config as WhatsAppConfig;
    if (!!(whatsappConfig.apiUrl && whatsappConfig.instanceId && whatsappConfig.apiToken && whatsappConfig.chatId)) {
      return { valid: true };
    }
    return { valid: false, errors: ['Missing required fields'] };
  }

  private formatMessage(payload: NotificationPayload): string {
    const title = payload.eventType === 'permission.asked' ? 'Permission Required' : 'Session Idle';
    const sections = [
      `${title}`,
      '',
      `Event: ${payload.eventType}`,
      `Session ID: ${payload.sessionId}`,
      `Timestamp: ${payload.timestamp}`,
      `Project: ${payload.projectName}`,
      '',
      `Peak Tokens: ${payload.peakTokens.toLocaleString()} tokens`,
      `Peak Context: ${payload.peakContextPercentage}%`,
      `Model: ${payload.modelName}`,
      '',
      '---',
      '',
      payload.lastText.substring(0, 1500)
    ];

    if (payload.eventType === 'permission.asked' && payload.pendingCommand) {
      sections.splice(6, 0, '', 'Pending Command:', `\`\`\`\`bash\n${payload.pendingCommand}\n\`\`\``);
    }

    return sections.join('\n');
  }
}

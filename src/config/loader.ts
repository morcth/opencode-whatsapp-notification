import * as path from 'path';
import { fileURLToPath } from 'url';
import type { NotifierConfig, MultiProviderConfig, WhatsAppConfig, DiscordConfig } from '../types/notifier';
import { ConfigError } from '../types/errors';
import { DiscordProvider } from '../providers/discord';
import { WhatsAppGreenApiProvider } from '../providers/whatsapp-greenapi';

interface MultiProviderConfigFile {
  enabled?: boolean;
  providers?: {
    discord?: Partial<DiscordConfig>;
    'whatsapp-greenapi'?: Partial<WhatsAppConfig>;
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ConfigLoader {
  private readonly configPath: string;
  private readonly fs: any;

  constructor(configPath?: string, fs?: any) {
    if (configPath) {
      this.configPath = configPath;
    } else {
      this.configPath = path.join(__dirname, 'config.json');
    }
    console.log('[ConfigLoader] Loading config from:', this.configPath);
    this.fs = fs;
  }

  private getFs() {
    if (this.fs) {
      return this.fs;
    }
    return import('fs/promises');
  }

  async load(): Promise<NotifierConfig> {
    let config: any;

    const fs = await this.getFs();

    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      config = JSON.parse(configContent);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        throw new ConfigError(`Config file not found at ${this.configPath}. Create a config.json file in plugin directory.`);
      }
      if (e instanceof SyntaxError) {
        throw new ConfigError(`Invalid JSON in config file at ${this.configPath}`);
      }
      throw new ConfigError(`Failed to read config file: ${e.message}`);
    }

    if (!config) {
      throw new ConfigError('Config file is empty');
    }

    const enabled = config.enabled ?? true;

    if (!enabled) {
      return { enabled: false } as NotifierConfig;
    }

    if (config.providers) {
      return this.loadMultiProviderConfig(config);
    }

    throw new ConfigError('Invalid config: must have providers object');
  }

  private loadMultiProviderConfig(config: any): MultiProviderConfig {
    const providers: any = {};

    if (config.providers.discord) {
      const discordConfig = config.providers.discord;
      const enabled = discordConfig.enabled ?? true;

      if (enabled) {
        const validation = new DiscordProvider(discordConfig as DiscordConfig).validateConfig(discordConfig);

        if (!validation.valid) {
          throw new ConfigError(`Discord config validation failed: ${validation.errors.join(', ')}`);
        }

        providers.discord = {
          provider: 'discord',
          enabled: true,
          webhookUrl: discordConfig.webhookUrl,
          username: discordConfig.username,
          avatarUrl: discordConfig.avatarUrl
        };
      }
    }

    if (config.providers['whatsapp-greenapi']) {
      const whatsappConfig = config.providers['whatsapp-greenapi'];
      const enabled = whatsappConfig.enabled ?? true;

      if (enabled) {
        const validation = new WhatsAppGreenApiProvider(whatsappConfig as WhatsAppConfig).validateConfig(whatsappConfig);

        if (!validation.valid) {
          throw new ConfigError(`WhatsApp config validation failed: ${validation.errors.join(', ')}`);
        }

        providers['whatsapp-greenapi'] = {
          provider: 'whatsapp-greenapi',
          enabled: true,
          apiUrl: whatsappConfig.apiUrl,
          instanceId: whatsappConfig.instanceId,
          apiToken: whatsappConfig.apiToken,
          chatId: whatsappConfig.chatId,
          timeout: whatsappConfig.timeout ?? 10000
        };
      }
    }

    if (Object.keys(providers).length === 0) {
      console.log('[Multi-Notifier] All providers disabled, no notifications will be sent');
      return { enabled: true, providers: {} };
    }

    return {
      enabled: true,
      providers
    };
  }
}

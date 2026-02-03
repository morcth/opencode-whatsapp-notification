import * as path from 'path';
import * as url from 'url';
import { fileURLToPath } from 'url';
import type { NotifierConfig } from '../types/notifier';
import { ConfigError } from '../types/errors';

interface WhatsAppConfigFile {
  provider?: string;
  enabled?: boolean;
  apiUrl?: string;
  instanceId?: string;
  apiToken?: string;
  chatId?: string;
  timeout?: number;
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
    let config: WhatsAppConfigFile;

    const fs = await this.getFs();

    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      config = JSON.parse(configContent);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        throw new ConfigError(`Config file not found at ${this.configPath}. Create a config.json file in the plugin directory.`);
      }
      if (e instanceof SyntaxError) {
        throw new ConfigError(`Invalid JSON in config file at ${this.configPath}`);
      }
      throw new ConfigError(`Failed to read config file: ${e.message}`);
    }

    if (!config) {
      throw new ConfigError('Config file is empty');
    }

    if (config.provider !== 'whatsapp-greenapi') {
      throw new ConfigError(`Unsupported provider: ${config.provider}`);
    }

    if (!config.enabled) {
      return { provider: 'whatsapp-greenapi', enabled: false };
    }

    const apiUrl = config.apiUrl?.trim();
    const instanceId = config.instanceId?.trim();
    const apiToken = config.apiToken?.trim();
    const chatId = config.chatId?.trim();

    if (!apiUrl || !instanceId || !apiToken || !chatId) {
      throw new ConfigError('Missing required WhatsApp config fields: apiUrl, instanceId, apiToken, chatId');
    }

    try {
      new URL(apiUrl);
    } catch {
      throw new ConfigError('Invalid apiUrl format: must be a valid URL');
    }

    const timeout = config.timeout ?? 10000;
    if (timeout <= 0) {
      throw new ConfigError('Invalid timeout: must be a positive number');
    }

    const result = {
      provider: 'whatsapp-greenapi' as const,
      enabled: true,
      apiUrl,
      instanceId,
      apiToken,
      chatId,
      timeout
    };
    console.log('[ConfigLoader] Config loaded successfully, enabled:', result.enabled, 'chatId:', chatId);
    return result;
  }
}

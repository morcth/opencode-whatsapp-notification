import { describe, it, expect, beforeEach, vi } from 'bun:test';
import { ConfigError } from '../../src/types/errors';

const mockReadFile = (content: string | Error) => {
  return {
    readFile: async () => {
      if (content instanceof Error) {
        throw content;
      }
      return content;
    }
  };
};

describe('ConfigLoader', () => {
  let ConfigLoader: any;
  let originalLoad: any;

  beforeEach(async () => {
    const module = await import('../../src/config/loader');
    ConfigLoader = module.ConfigLoader;
    
    const currentLoad = ConfigLoader.prototype.load;
    
    if ((currentLoad as any).mockRestore) {
      (currentLoad as any).mockRestore();
    }
    
    if (!originalLoad) {
      originalLoad = ConfigLoader.prototype.load;
    }
  });



  it('should throw ConfigError when config file does not exist', async () => {
    const error = new Error('File not found') as any;
    error.code = 'ENOENT';
    const mockFs = mockReadFile(error);

    const loader = new ConfigLoader('/test/config.json', mockFs);
    await expect(loader.load()).rejects.toThrow(ConfigError);
  });

  it('should throw ConfigError when config file has invalid JSON', async () => {
    const mockFs = mockReadFile('invalid json');

    const loader = new ConfigLoader('/test/config.json', mockFs);
    await expect(loader.load()).rejects.toThrow(ConfigError);
  });

  it('should throw ConfigError when config file is empty', async () => {
    const mockFs = mockReadFile(JSON.stringify({}));

    const loader = new ConfigLoader('/test/config.json', mockFs);
    await expect(loader.load()).rejects.toThrow(ConfigError);
  });

  it('should throw ConfigError when provider is unknown', async () => {
    const mockFs = mockReadFile(JSON.stringify({
      provider: 'unknown-provider',
      enabled: true
    }));

    const loader = new ConfigLoader('/test/config.json', mockFs);
    await expect(loader.load()).rejects.toThrow(ConfigError);
  });

  it('should throw ConfigError when required fields are missing', async () => {
    const mockFs = mockReadFile(JSON.stringify({
      provider: 'whatsapp-greenapi',
      enabled: true,
      instanceId: '12345'
    }));

    const loader = new ConfigLoader('/test/config.json', mockFs);
    await expect(loader.load()).rejects.toThrow(ConfigError);
  });



  it('should throw ConfigError when required fields are empty strings', async () => {
    const mockFs = mockReadFile(JSON.stringify({
      provider: 'whatsapp-greenapi',
      enabled: true,
      apiUrl: '',
      instanceId: '',
      apiToken: '',
      chatId: ''
    }));

    const loader = new ConfigLoader('/test/config.json', mockFs);
    await expect(loader.load()).rejects.toThrow(ConfigError);
  });

  it('should throw ConfigError for invalid URL format', async () => {
    const mockFs = mockReadFile(JSON.stringify({
      provider: 'whatsapp-greenapi',
      enabled: true,
      apiUrl: 'not-a-valid-url',
      instanceId: '12345',
      apiToken: 'test-token',
      chatId: '11001100110@c.us'
    }));

    const loader = new ConfigLoader('/test/config.json', mockFs);
    await expect(loader.load()).rejects.toThrow(ConfigError);
  });



  it('should throw ConfigError for negative timeout', async () => {
    const mockFs = mockReadFile(JSON.stringify({
      provider: 'whatsapp-greenapi',
      enabled: true,
      apiUrl: 'https://api.green-api.com',
      instanceId: '12345',
      apiToken: 'test-token',
      chatId: '11001100110@c.us',
      timeout: -1000
    }));

    const loader = new ConfigLoader('/test/config.json', mockFs);
    await expect(loader.load()).rejects.toThrow(ConfigError);
  });

  it('should throw ConfigError for zero timeout', async () => {
    const mockFs = mockReadFile(JSON.stringify({
      provider: 'whatsapp-greenapi',
      enabled: true,
      apiUrl: 'https://api.green-api.com',
      instanceId: '12345',
      apiToken: 'test-token',
      chatId: '11001100110@c.us',
      timeout: 0
    }));

    const loader = new ConfigLoader('/test/config.json', mockFs);
    await expect(loader.load()).rejects.toThrow(ConfigError);
  });

  it('should throw ConfigError when required fields are whitespace-only strings', async () => {
    const mockFs = mockReadFile(JSON.stringify({
      provider: 'whatsapp-greenapi',
      enabled: true,
      apiUrl: '   ',
      instanceId: '  ',
      apiToken: '\t',
      chatId: '\n'
    }));

    const loader = new ConfigLoader('/test/config.json', mockFs);
    await expect(loader.load()).rejects.toThrow(ConfigError);
  });

  describe('Multi-provider config validation', () => {
    it('should return disabled config when enabled is false', async () => {
      const mockFs = mockReadFile(JSON.stringify({
        enabled: false,
        providers: {
          discord: {
            enabled: true,
            webhookUrl: 'https://discord.com/api/webhooks/test'
          }
        }
      }));

      const loader = new ConfigLoader(undefined, mockFs);
      const config = await loader.load();

      expect(config).toEqual({ enabled: false });
      expect('providers' in config).toBe(false);
    });

    it('should load valid multi-provider config', async () => {
      const mockFs = mockReadFile(JSON.stringify({
        enabled: true,
        providers: {
          discord: {
            enabled: true,
            webhookUrl: 'https://discord.com/api/webhooks/test',
            username: 'TestBot'
          },
          'whatsapp-greenapi': {
            enabled: true,
            apiUrl: 'https://api.green-api.com',
            instanceId: '123',
            apiToken: 'test',
            chatId: '11001100110@c.us'
          }
        }
      }));

      const loader = new ConfigLoader(undefined, mockFs);
      const config = await loader.load();

      expect(config.enabled).toBe(true);
      expect('providers' in config).toBe(true);
      expect((config as any).providers?.discord?.webhookUrl).toBeDefined();
    });

    it('should throw ConfigError for invalid Discord webhook URL', async () => {
      const mockFs = mockReadFile(JSON.stringify({
        enabled: true,
        providers: {
          discord: {
            enabled: true,
            webhookUrl: 'https://not-discord.com/webhook'
          }
        }
      }));

      const loader = new ConfigLoader(undefined, mockFs);

      await expect(loader.load()).rejects.toThrow('Discord config validation failed');
    });

    it('should throw ConfigError for partial provider config (missing fields)', async () => {
      const mockFs = mockReadFile(JSON.stringify({
        enabled: true,
        providers: {
          discord: {
            enabled: true
            // Missing webhookUrl
          }
        }
      }));

      const loader = new ConfigLoader(undefined, mockFs);

      await expect(loader.load()).rejects.toThrow('Discord config validation failed');
    });

    it('should handle all providers disabled', async () => {
      const mockFs = mockReadFile(JSON.stringify({
        enabled: true,
        providers: {
          discord: {
            enabled: false,
            webhookUrl: 'https://discord.com/api/webhooks/test'
          },
          'whatsapp-greenapi': {
            enabled: false,
            apiUrl: 'https://api.green-api.com',
            instanceId: '123',
            apiToken: 'test',
            chatId: '11001100110@c.us'
          }
        }
      }));

      const loader = new ConfigLoader(undefined, mockFs);
      const config = await loader.load();

      expect(config.enabled).toBe(true);
      expect((config as any).providers).toEqual({});
    });
  });
});

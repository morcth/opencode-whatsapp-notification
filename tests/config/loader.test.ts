import { ConfigLoader } from '../../src/config/loader';
import { ConfigError } from '../../src/types/errors';

describe('ConfigLoader', () => {
  it('should load valid whatsapp config from project.config', async () => {
    const mockProjectConfig = {
      notifier: {
        provider: 'whatsapp-greenapi',
        enabled: true,
        apiUrl: 'https://api.green-api.com',
        instanceId: '12345',
        apiToken: 'test-token',
        chatId: '11001100110@c.us'
      }
    };
    const loader = new ConfigLoader();
    const config = await loader.load(mockProjectConfig);
    expect(config.provider).toBe('whatsapp-greenapi');
    expect(config.enabled).toBe(true);
    expect((config as any).apiUrl).toBe('https://api.green-api.com');
  });

  it('should throw ConfigError when provider is unknown', async () => {
    const mockProjectConfig = {
      notifier: {
        provider: 'unknown-provider' as any,
        enabled: true
      }
    };
    const loader = new ConfigLoader();
    await expect(loader.load(mockProjectConfig)).rejects.toThrow(ConfigError);
  });

  it('should throw ConfigError when required fields are missing', async () => {
    const mockProjectConfig = {
      notifier: {
        provider: 'whatsapp-greenapi',
        enabled: true,
        instanceId: '12345'
        // Missing: apiUrl, apiToken, chatId
      }
    };
    const loader = new ConfigLoader();
    await expect(loader.load(mockProjectConfig)).rejects.toThrow(ConfigError);
  });
});

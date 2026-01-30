import { ConfigLoader } from '../../src/config/loader';
import { ConfigError } from '../../src/types/errors';

describe('ConfigLoader', () => {
  it('should load valid whatsapp config from project.config', () => {
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
    const config = loader.load(mockProjectConfig);
    expect(config.provider).toBe('whatsapp-greenapi');
    expect(config.enabled).toBe(true);
    expect(config.apiUrl).toBe('https://api.green-api.com');
  });

  it('should throw ConfigError when provider is unknown', () => {
    const mockProjectConfig = {
      notifier: {
        provider: 'unknown-provider' as any,
        enabled: true
      }
    };
    const loader = new ConfigLoader();
    expect(() => loader.load(mockProjectConfig)).toThrow(ConfigError);
  });

  it('should throw ConfigError when required fields are missing', () => {
    const mockProjectConfig = {
      notifier: {
        provider: 'whatsapp-greenapi',
        enabled: true,
        instanceId: '12345'
      }
    };
    const loader = new ConfigLoader();
    expect(() => loader.load(mockProjectConfig)).toThrow(ConfigError);
  });

  it('should throw ConfigError when notifier config object is missing entirely', () => {
    const loader = new ConfigLoader();
    expect(() => loader.load({})).toThrow(ConfigError);
  });

  it('should return fallback path when config is disabled', () => {
    const mockProjectConfig = {
      notifier: {
        provider: 'whatsapp-greenapi',
        enabled: false
      }
    };
    const loader = new ConfigLoader();
    const config = loader.load(mockProjectConfig);
    expect(config.provider).toBe('whatsapp-greenapi');
    expect(config.enabled).toBe(false);
    expect(config.fallbackConfigPath).toBe('');
  });

  it('should throw ConfigError when required fields are empty strings', () => {
    const mockProjectConfig = {
      notifier: {
        provider: 'whatsapp-greenapi',
        enabled: true,
        apiUrl: '',
        instanceId: '',
        apiToken: '',
        chatId: ''
      }
    };
    const loader = new ConfigLoader();
    expect(() => loader.load(mockProjectConfig)).toThrow(ConfigError);
  });

  it('should throw ConfigError for invalid URL format', () => {
    const mockProjectConfig = {
      notifier: {
        provider: 'whatsapp-greenapi',
        enabled: true,
        apiUrl: 'not-a-valid-url',
        instanceId: '12345',
        apiToken: 'test-token',
        chatId: '11001100110@c.us'
      }
    };
    const loader = new ConfigLoader();
    expect(() => loader.load(mockProjectConfig)).toThrow(ConfigError);
  });

  it('should use default timeout when not specified', () => {
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
    const config = loader.load(mockProjectConfig);
    expect(config.timeout).toBe(10000);
  });

  it('should throw ConfigError for negative timeout', () => {
    const mockProjectConfig = {
      notifier: {
        provider: 'whatsapp-greenapi',
        enabled: true,
        apiUrl: 'https://api.green-api.com',
        instanceId: '12345',
        apiToken: 'test-token',
        chatId: '11001100110@c.us',
        timeout: -1000
      }
    };
    const loader = new ConfigLoader();
    expect(() => loader.load(mockProjectConfig)).toThrow(ConfigError);
  });

  it('should throw ConfigError for zero timeout', () => {
    const mockProjectConfig = {
      notifier: {
        provider: 'whatsapp-greenapi',
        enabled: true,
        apiUrl: 'https://api.green-api.com',
        instanceId: '12345',
        apiToken: 'test-token',
        chatId: '11001100110@c.us',
        timeout: 0
      }
    };
    const loader = new ConfigLoader();
    expect(() => loader.load(mockProjectConfig)).toThrow(ConfigError);
  });

  it('should throw ConfigError when required fields are whitespace-only strings', () => {
    const mockProjectConfig = {
      notifier: {
        provider: 'whatsapp-greenapi',
        enabled: true,
        apiUrl: '   ',
        instanceId: '  ',
        apiToken: '\t',
        chatId: '\n'
      }
    };
    const loader = new ConfigLoader();
    expect(() => loader.load(mockProjectConfig)).toThrow(ConfigError);
  });
});

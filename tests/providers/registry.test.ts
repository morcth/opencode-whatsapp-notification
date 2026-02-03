import { describe, it, expect } from 'bun:test';
import { ProviderRegistry } from '../../src/providers/registry';
import type { MultiProviderConfig } from '../../src/types/notifier';

describe('ProviderRegistry', () => {
  it('should return array of enabled providers', () => {
    const config: MultiProviderConfig = {
      enabled: true,
      providers: {
        discord: {
          provider: 'discord',
          enabled: true,
          webhookUrl: 'https://discord.com/api/webhooks/test'
        },
        'whatsapp-greenapi': {
          provider: 'whatsapp-greenapi',
          enabled: true,
          apiUrl: 'https://api.green-api.com',
          instanceId: '123',
          apiToken: 'test',
          chatId: '11001100110@c.us'
        }
      }
    };

    const providers = ProviderRegistry.getProviders(config);

    expect(providers).toHaveLength(2);
    expect(providers[0]?.name).toBe('Discord');
    expect(providers[1]?.name).toBe('WhatsApp Green-API');
  });

  it('should skip disabled providers', () => {
    const config: MultiProviderConfig = {
      enabled: true,
      providers: {
        discord: {
          provider: 'discord',
          enabled: false,
          webhookUrl: 'https://discord.com/api/webhooks/test'
        },
        'whatsapp-greenapi': {
          provider: 'whatsapp-greenapi',
          enabled: true,
          apiUrl: 'https://api.green-api.com',
          instanceId: '123',
          apiToken: 'test',
          chatId: '11001100110@c.us'
        }
      }
    };

    const providers = ProviderRegistry.getProviders(config);

    expect(providers).toHaveLength(1);
    expect(providers[0]?.name).toBe('WhatsApp Green-API');
  });

  it('should skip unknown provider and log error', () => {
    const config: MultiProviderConfig = {
      enabled: true,
      providers: {
        discord: {
          provider: 'discord',
          enabled: true,
          webhookUrl: 'https://discord.com/api/webhooks/test'
        }
      } as any
    };

    // Add unknown provider
    (config as any).providers.unknown = { provider: 'unknown', enabled: true };

    const providers = ProviderRegistry.getProviders(config as any);

    expect(providers).toHaveLength(1);
    expect(providers[0]?.name).toBe('Discord');
  });
});

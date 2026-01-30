import { ProviderRegistry } from '../../src/providers/registry';
import { ProviderError } from '../../src/types/errors';

describe('ProviderRegistry', () => {
  it('should return WhatsAppGreenApiProvider instance for whatsapp-greenapi', () => {
    const config = {
      provider: 'whatsapp-greenapi',
      enabled: true,
      apiUrl: 'https://api.green-api.com',
      instanceId: '12345',
      apiToken: 'test-token',
      chatId: '11001100110@c.us'
    };
    const provider = ProviderRegistry.getProvider(config);
    expect(provider).toBeDefined();
    expect(provider.send).toBeDefined();
    expect(provider.validateConfig).toBeDefined();
  });

  it('should throw ProviderError for unknown provider', () => {
    const config = {
      provider: 'unknown-provider' as any,
      enabled: true
    };
    expect(() => ProviderRegistry.getProvider(config)).toThrow(ProviderError);
  });
});

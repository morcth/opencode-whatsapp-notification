import { describe, it, expect, beforeEach } from 'bun:test';
import { DiscordProvider } from '../../src/providers/discord';

describe('DiscordProvider', () => {
  let mockFetch: any;

  beforeEach(() => {
    let callCount = 0;
    mockFetch = async (input: any, init?: RequestInit): Promise<Response> => {
      callCount++;
      return {
        ok: true,
        json: () => Promise.resolve({})
      } as Response;
    };
    global.fetch = mockFetch;
  });

  it('should have name property', () => {
    const provider = new DiscordProvider({
      provider: 'discord',
      enabled: true,
      webhookUrl: 'https://discord.com/api/webhooks/test',
      username: 'TestBot'
    });

    expect(provider.name).toBe('Discord');
  });

  it('should implement NotifierProvider interface', () => {
    const provider = new DiscordProvider({
      provider: 'discord',
      enabled: true,
      webhookUrl: 'https://discord.com/api/webhooks/test'
    });

    expect(provider.send).toBeDefined();
    expect(provider.validateConfig).toBeDefined();
  });
});

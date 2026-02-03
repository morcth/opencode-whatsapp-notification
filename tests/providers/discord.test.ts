import { describe, it, expect, beforeEach } from 'bun:test';
import { DiscordProvider } from '../../src/providers/discord';

describe('DiscordProvider', () => {
  let mockFetch: any;
  let fetchCalls: any[] = [];

  beforeEach(() => {
    fetchCalls = [];
    mockFetch = async (input: any, init?: RequestInit): Promise<Response> => {
      fetchCalls.push({ input, init });
      return {
        ok: true,
        json: () => Promise.resolve({})
      } as Response;
    };
    mockFetch.mock = { calls: [] };
    mockFetch.mock.calls = fetchCalls;
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

  it('should format session.idle event correctly', async () => {
    const provider = new DiscordProvider({
      provider: 'discord',
      enabled: true,
      webhookUrl: 'https://discord.com/api/webhooks/test',
      username: 'TestBot',
      avatarUrl: 'https://example.com/avatar.png'
    });

    const payload = {
      eventType: 'session.idle' as const,
      sessionId: 'sess_123',
      timestamp: '2026-02-03T00:00:00Z',
      projectName: 'test-project',
      peakTokens: 50000,
      peakContextPercentage: 25,
      modelName: 'gpt-4',
      lastText: 'Response completed successfully'
    };

    await provider.send('session.idle', payload);

    expect(fetchCalls.length).toBe(1);
    expect(fetchCalls[0].input).toBe('https://discord.com/api/webhooks/test');
    expect(fetchCalls[0].init?.method).toBe('POST');
    expect(fetchCalls[0].init?.headers).toEqual({ 'Content-Type': 'application/json' });

    const body = JSON.parse(fetchCalls[0].init?.body as string);

    expect(body.embeds).toBeDefined();
    expect(body.embeds[0].color).toBe(0x00ff00);
    expect(body.username).toBe('TestBot');
    expect(body.avatar_url).toBe('https://example.com/avatar.png');
    expect(body.embeds[0].footer).toEqual({ text: 'sess_123' });
  });

  it('should format permission.asked event correctly', async () => {
    const provider = new DiscordProvider({
      provider: 'discord',
      enabled: true,
      webhookUrl: 'https://discord.com/api/webhooks/test'
    });

    const payload = {
      eventType: 'permission.asked' as const,
      sessionId: 'sess_456',
      timestamp: '2026-02-03T00:00:00Z',
      projectName: 'test-project',
      peakTokens: 10000,
      peakContextPercentage: 5,
      modelName: 'gpt-4',
      lastText: 'Need permission to run command',
      pendingCommand: 'npm install'
    };

    await provider.send('permission.asked', payload);

    const body = JSON.parse(fetchCalls[0].init?.body as string);

    expect(body.embeds[0].color).toBe(0xffa500);
  });

  it('should include all required embed fields', async () => {
    const provider = new DiscordProvider({
      provider: 'discord',
      enabled: true,
      webhookUrl: 'https://discord.com/api/webhooks/test'
    });

    const payload = {
      eventType: 'session.idle' as const,
      sessionId: 'sess_123',
      timestamp: '2026-02-03T00:00:00Z',
      projectName: 'test-project',
      peakTokens: 50000,
      peakContextPercentage: 25,
      modelName: 'gpt-4',
      lastText: 'Response completed successfully'
    };

    await provider.send('session.idle', payload);

    const body = JSON.parse(fetchCalls[0].init?.body as string);
    const fields = body.embeds[0].fields;

    const fieldNames = fields.map((f: any) => f.name);
    expect(fieldNames).toContain('Peak Tokens');
    expect(fieldNames).toContain('Peak Context');
    expect(fieldNames).toContain('Model');
  });

  it('should validate webhook URL format', () => {
    const provider = new DiscordProvider({
      provider: 'discord',
      enabled: true,
      webhookUrl: 'https://discord.com/api/webhooks/test'
    });

    expect(provider.validateConfig({
      webhookUrl: 'https://discord.com/api/webhooks/abc123/def456'
    })).toEqual({ valid: true });

    expect(provider.validateConfig({
      webhookUrl: 'https://not-discord.com/webhook'
    })).toEqual({
      valid: false,
      errors: ['webhookUrl must be a valid Discord webhook URL']
    });

    expect(provider.validateConfig({
      enabled: true
    })).toEqual({
      valid: false,
      errors: ['Missing webhookUrl']
    });
  });
});

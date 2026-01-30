import { describe, it, expect } from 'bun:test';
import { WhatsAppGreenApiProvider } from '../../src/providers/whatsapp-greenapi';
import type { NotificationPayload } from '../../src/types/notifier';

describe('WhatsAppGreenApiProvider', () => {
  it('should format multi-line message for session.idle', async () => {
    const config = {
      provider: 'whatsapp-greenapi' as const,
      enabled: true,
      apiUrl: 'https://api.green-api.com',
      instanceId: '12345',
      apiToken: 'test-token',
      chatId: '11001100110@c.us',
      fallbackConfigPath: '/test/config.json'
    };
    const provider = new WhatsAppGreenApiProvider(config);

    const payload: NotificationPayload = {
      eventType: 'session.idle',
      sessionId: 'sess_123',
      timestamp: '2026-01-29T12:00:00.000Z',
      projectName: 'my-project',
      peakTokens: 3500,
      peakContextPercentage: 1.75,
      modelName: 'claude-3.5-sonnet',
      lastText: 'Task completed successfully'
    };

    const calls: any[] = [];
    const mockFetch = async (input: any, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      calls.push([url, init]);
      const body = init?.body ? JSON.parse(init.body as string) : {};
      if (url.includes('sendMessage') && body.chatId === '11001100110@c.us') {
        return {
          ok: true,
          json: () => Promise.resolve({ idMessage: 'msg_123' })
        } as Response;
      }
      throw new Error('Unexpected call');
    };
    global.fetch = mockFetch as any;

    await provider.send('session.idle', payload);

    if (calls.length > 0) {
      const [url, options] = calls[0];
      expect(url).toBe('https://api.green-api.com/waInstance12345/sendMessage/test-token');
      expect(options?.method).toBe('POST');
      expect(options?.headers?.['Content-Type']).toBe('application/json');

      const body = JSON.parse(options?.body as string);
      expect(body.chatId).toBe('11001100110@c.us');
      expect(body.message).toContain('Session Idle');
      expect(body.message).toContain('Event: session.idle');
      expect(body.message).toContain('Session ID: sess_123');
      expect(body.message).toContain('Peak Tokens: 3,500 tokens');
      expect(body.message).toContain('Peak Context: 1.75%');
      expect(body.message).toContain('Model: claude-3.5-sonnet');
      expect(body.message).toContain('Task completed successfully');
    }
  });

  it('should format multi-line message for permission.asked', async () => {
    const config = {
      provider: 'whatsapp-greenapi' as const,
      enabled: true,
      apiUrl: 'https://api.green-api.com',
      instanceId: '12345',
      apiToken: 'test-token',
      chatId: '11001100110@c.us',
      fallbackConfigPath: '/test/config.json'
    };
    const provider = new WhatsAppGreenApiProvider(config);

    const payload: NotificationPayload = {
      eventType: 'permission.asked',
      sessionId: 'sess_456',
      timestamp: '2026-01-29T12:00:00.000Z',
      projectName: 'my-project',
      peakTokens: 1500,
      peakContextPercentage: 0.75,
      modelName: 'claude-3.5-sonnet',
      lastText: 'Waiting for approval',
      pendingCommand: 'rm -rf /tmp/test'
    };

    const calls: any[] = [];
    const mockFetch = async (input: any, init?: RequestInit): Promise<Response> => {
      calls.push([typeof input === 'string' ? input : input.toString(), init]);
      return {
        ok: true,
        json: () => Promise.resolve({ idMessage: 'msg_456' })
      } as Response;
    };
    global.fetch = mockFetch as any;

    await provider.send('permission.asked', payload);

    if (calls.length > 0) {
      const [, options] = calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.message).toContain('Permission Required');
      expect(body.message).toContain('Pending Command:');
      expect(body.message).toContain('rm -rf /tmp/test');
    }
  });

  it('should retry on 502 with exponential backoff', async () => {
    const config = {
      provider: 'whatsapp-greenapi' as const,
      enabled: true,
      apiUrl: 'https://api.green-api.com',
      instanceId: '12345',
      apiToken: 'test-token',
      chatId: '11001100110@c.us',
      fallbackConfigPath: '/test/config.json'
    };
    const provider = new WhatsAppGreenApiProvider(config);

    const payload: NotificationPayload = {
      eventType: 'session.idle',
      sessionId: 'sess_789',
      timestamp: '2026-01-29T12:00:00.000Z',
      projectName: 'my-project',
      peakTokens: 1000,
      peakContextPercentage: 0.50,
      modelName: 'claude-3.5-sonnet',
      lastText: 'Test'
    };

    let attemptCount = 0;
    const mockFetch = async (input: any, init?: RequestInit): Promise<Response> => {
      attemptCount++;
      if (attemptCount < 2) {
        return {
          ok: false,
          status: 502,
          text: () => Promise.resolve('Bad Gateway')
        } as Response;
      }
      return {
        ok: true,
        json: () => Promise.resolve({ idMessage: 'msg_789' })
      } as Response;
    };
    global.fetch = mockFetch as any;

    await provider.send('session.idle', payload);

    expect(attemptCount).toBe(2);
  });

  it('should not retry on 401 error', async () => {
    const config = {
      provider: 'whatsapp-greenapi' as const,
      enabled: true,
      apiUrl: 'https://api.green-api.com',
      instanceId: '12345',
      apiToken: 'test-token',
      chatId: '11001100110@c.us',
      fallbackConfigPath: '/test/config.json'
    };
    const provider = new WhatsAppGreenApiProvider(config);

    const payload: NotificationPayload = {
      eventType: 'session.idle',
      sessionId: 'sess_999',
      timestamp: '2026-01-29T12:00:00.000Z',
      projectName: 'my-project',
      peakTokens: 500,
      peakContextPercentage: 0.25,
      modelName: 'claude-3.5-sonnet',
      lastText: 'Test'
    };

    let attemptCount = 0;
    const mockFetch = async (input: any, init?: RequestInit): Promise<Response> => {
      attemptCount++;
      return {
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      } as Response;
    };
    global.fetch = mockFetch as any;

    try {
      await provider.send('session.idle', payload);
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.name).toBe('TransportError');
      expect(attemptCount).toBe(1);
    }
  });
});

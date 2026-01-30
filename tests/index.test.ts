import { WhatsAppNotificationPlugin } from '../src/index';
import type { Plugin } from '@opencode-ai/plugin';

describe('WhatsAppNotificationPlugin', () => {
  it('should subscribe to session.idle and permission.asked events', async () => {
    const mockClient = {
      app: { log: () => Promise.resolve() },
      session: { get: () => Promise.resolve({ data: { id: 'sess_123', model: { name: 'test-model', limit: { context: 200000 } } } }),
        messages: () => Promise.resolve({ data: [] })
      }
    };
    const mockProject = {
      config: {
        notifier: {
          provider: 'whatsapp-greenapi',
          enabled: true,
          apiUrl: 'https://api.green-api.com',
          instanceId: '12345',
          apiToken: 'test-token',
          chatId: '11001100110@c.us'
        }
      },
      name: 'test-project'
    };

    const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject }) as Plugin;

    expect(plugin.event).toBeDefined();
  });

  it('should not send notification when enabled is false', async () => {
    const mockClient = {
      app: { log: () => Promise.resolve() }
    };
    const mockProject = {
      config: {
        notifier: {
          provider: 'whatsapp-greenapi',
          enabled: false
        }
      },
      name: 'test-project'
    };

    let sendCalled = false;
    global.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      sendCalled = true;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}) } as Response);
    };

    const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject }) as Plugin;

    await plugin.event!({
      event: {
        type: 'session.idle',
        properties: { sessionID: 'sess_123' }
      }
    });

    expect(sendCalled).toBe(false);
  });
});

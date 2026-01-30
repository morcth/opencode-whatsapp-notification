import { WhatsAppNotificationPlugin } from '../src/index';
import type { Plugin } from '@opencode-ai/plugin';

describe('WhatsAppNotificationPlugin', () => {
  it('should subscribe to session.idle and permission.asked events', async () => {
    const mockClient = {
      app: { log: vi.fn().mockResolvedValue(undefined) },
      session: { get: vi.fn().mockResolvedValue({ data: { id: 'sess_123', model: { name: 'test-model', limit: { context: 200000 } } } }),
        messages: vi.fn().mockResolvedValue({ data: [] })
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
      app: { log: vi.fn().mockResolvedValue(undefined) }
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

  describe('session.idle event handling', () => {
    it('should fetch session and messages and send notification', async () => {
      const mockClient = {
        app: { log: vi.fn().mockResolvedValue(undefined) },
        session: {
          get: vi.fn().mockResolvedValue({
            data: {
              id: 'sess_123',
              model: { name: 'test-model', limit: { context: 200000 } },
              startedAt: '2024-01-01T00:00:00Z'
            }
          }),
          messages: vi.fn().mockResolvedValue({
            data: [
              { id: 'msg_1', role: 'user', content: 'Hello' },
              { id: 'msg_2', role: 'assistant', content: 'Hi there!' }
            ]
          })
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

      let fetchCalled = false;
      let fetchUrl: string = '';
      let fetchBody: any = null;
      global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        fetchCalled = true;
        fetchUrl = input.toString();
        if (init && init.body) {
          fetchBody = JSON.parse(init.body as string);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) } as Response);
      });

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject }) as Plugin;

      await plugin.event!({
        event: {
          type: 'session.idle',
          properties: { sessionID: 'sess_123' }
        }
      });

      expect(mockClient.session.get).toHaveBeenCalledWith({ path: { id: 'sess_123' } });
      expect(mockClient.session.messages).toHaveBeenCalledWith({ path: { id: 'sess_123' } });
      expect(fetchCalled).toBe(true);
      expect(fetchUrl).toContain('https://api.green-api.com/waInstance12345/sendMessage/test-token');
      expect(fetchBody).toBeDefined();
      expect(fetchBody?.chatId).toBe('11001100110@c.us');
      expect(fetchBody?.message).toBeDefined();
      expect(fetchBody?.message).toContain('session.idle');
    });

    it('should wait 1.5 seconds before processing idle event', async () => {
      const mockClient = {
        app: { log: vi.fn().mockResolvedValue(undefined) },
        session: {
          get: vi.fn().mockResolvedValue({ data: { id: 'sess_123' } }),
          messages: vi.fn().mockResolvedValue({ data: [] })
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}) } as Response);

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject }) as Plugin;

      const startTime = Date.now();
      await plugin.event!({
        event: {
          type: 'session.idle',
          properties: { sessionID: 'sess_123' }
        }
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(1500);
    });

    it('should not fetch session data if sessionId is missing', async () => {
      const mockClient = {
        app: { log: vi.fn().mockResolvedValue(undefined) },
        session: {
          get: vi.fn().mockResolvedValue({ data: { id: 'sess_123' } }),
          messages: vi.fn().mockResolvedValue({ data: [] })
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

      let fetchCalled = false;
      global.fetch = vi.fn().mockImplementation(() => {
        fetchCalled = true;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) } as Response);
      });

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject }) as Plugin;

      await plugin.event!({
        event: {
          type: 'session.idle',
          properties: {}
        }
      });

      expect(mockClient.session.get).not.toHaveBeenCalled();
      expect(mockClient.session.messages).not.toHaveBeenCalled();
      expect(fetchCalled).toBe(false);
    });
  });

  describe('permission.asked event handling', () => {
    it('should fetch session and messages and send notification', async () => {
      const mockClient = {
        app: { log: vi.fn().mockResolvedValue(undefined) },
        session: {
          get: vi.fn().mockResolvedValue({
            data: {
              id: 'sess_123',
              model: { name: 'test-model', limit: { context: 200000 } },
              startedAt: '2024-01-01T00:00:00Z'
            }
          }),
          messages: vi.fn().mockResolvedValue({
            data: [
              { id: 'msg_1', role: 'user', content: 'Hello' }
            ]
          })
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

      let fetchCalled = false;
      let fetchUrl: string = '';
      let fetchBody: any = null;
      global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        fetchCalled = true;
        fetchUrl = input.toString();
        if (init && init.body) {
          fetchBody = JSON.parse(init.body as string);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) } as Response);
      });

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject }) as Plugin;

      await plugin.event!({
        event: {
          type: 'permission.asked',
          properties: { id: 'sess_123' }
        }
      });

      expect(mockClient.session.get).toHaveBeenCalledWith({ path: { id: 'sess_123' } });
      expect(mockClient.session.messages).toHaveBeenCalledWith({ path: { id: 'sess_123' } });
      expect(fetchCalled).toBe(true);
      expect(fetchUrl).toContain('https://api.green-api.com/waInstance12345/sendMessage/test-token');
      expect(fetchBody).toBeDefined();
      expect(fetchBody?.chatId).toBe('11001100110@c.us');
      expect(fetchBody?.message).toBeDefined();
      expect(fetchBody?.message).toContain('permission.asked');
    });

    it('should not wait for permission.asked events', async () => {
      const mockClient = {
        app: { log: vi.fn().mockResolvedValue(undefined) },
        session: {
          get: vi.fn().mockResolvedValue({ data: { id: 'sess_123' } }),
          messages: vi.fn().mockResolvedValue({ data: [] })
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}) } as Response);

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject }) as Plugin;

      const startTime = Date.now();
      await plugin.event!({
        event: {
          type: 'permission.asked',
          properties: { id: 'sess_123' }
        }
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1500);
    });
  });

  describe('error handling', () => {
    it('should log errors via client.app.log when session.get fails', async () => {
      const mockClient = {
        app: { log: vi.fn().mockResolvedValue(undefined) },
        session: {
          get: vi.fn().mockRejectedValue(new Error('Session fetch failed')),
          messages: vi.fn().mockResolvedValue({ data: [] })
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}) } as Response);

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject }) as Plugin;

      await plugin.event!({
        event: {
          type: 'session.idle',
          properties: { sessionID: 'sess_123' }
        }
      });

      expect(mockClient.app.log).toHaveBeenCalledWith({
        body: {
          service: 'whatsapp-notifier',
          level: 'error',
          message: 'Notification error: Session fetch failed'
        }
      });
    });

    it('should log errors via client.app.log when provider.send fails', async () => {
      const mockClient = {
        app: { log: vi.fn().mockResolvedValue(undefined) },
        session: {
          get: vi.fn().mockResolvedValue({ data: { id: 'sess_123' } }),
          messages: vi.fn().mockResolvedValue({ data: [] })
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      } as Response);

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject }) as Plugin;

      await plugin.event!({
        event: {
          type: 'session.idle',
          properties: { sessionID: 'sess_123' }
        }
      });

      expect(mockClient.app.log).toHaveBeenCalledWith({
        body: {
          service: 'whatsapp-notifier',
          level: 'error',
          message: expect.stringContaining('Auth/Client error')
        }
      });
    });

    it('should use properties.id as fallback for sessionId', async () => {
      const mockClient = {
        app: { log: vi.fn().mockResolvedValue(undefined) },
        session: {
          get: vi.fn().mockResolvedValue({ data: { id: 'sess_123' } }),
          messages: vi.fn().mockResolvedValue({ data: [] })
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

      let fetchCalled = false;
      global.fetch = vi.fn().mockImplementation(() => {
        fetchCalled = true;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) } as Response);
      });

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject }) as Plugin;

      await plugin.event!({
        event: {
          type: 'permission.asked',
          properties: { id: 'sess_123' }
        }
      });

      expect(mockClient.session.get).toHaveBeenCalledWith({ path: { id: 'sess_123' } });
      expect(fetchCalled).toBe(true);
    });
  });
});

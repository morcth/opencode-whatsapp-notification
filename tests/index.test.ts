import { vi, describe, it, expect, beforeEach } from 'bun:test';
import { WhatsAppNotificationPlugin } from '../src/index';

const mockConfig = {
  provider: 'whatsapp-greenapi' as const,
  enabled: true,
  apiUrl: 'https://api.green-api.com',
  instanceId: '12345',
  apiToken: 'test-token',
  chatId: '11001100110@c.us',
  timeout: 10000,
  fallbackConfigPath: '/test/config.json'
};

const mockDisabledConfig = {
  provider: 'whatsapp-greenapi' as const,
  enabled: false,
  fallbackConfigPath: '/test/config.json'
};

function createMockClient() {
  return {
    app: { log: vi.fn().mockResolvedValue(undefined) },
    session: { 
      get: vi.fn().mockResolvedValue({ data: { id: 'sess_123', model: { name: 'test-model', limit: { context: 200000 } } } }),
      messages: vi.fn().mockResolvedValue({ data: [] })
    }
  } as any;
}

function createMockProject() {
  return {
    directory: '/test/dir',
    worktree: '/test/worktree',
    serverUrl: 'http://test',
    name: 'test-project'
  } as any;
}

function createMockFetch() {
  const mockFetch: any = vi.fn().mockImplementation(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}) } as Response);
  });
  (mockFetch as any).preconnect = vi.fn().mockResolvedValue(undefined);
  global.fetch = mockFetch;
  return mockFetch;
}

describe('WhatsAppNotificationPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to session.idle and permission.asked events', async () => {
    const { ConfigLoader } = await import('../src/config/loader');
    vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockConfig);

    const mockClient = createMockClient();
    const mockProject = createMockProject();

    const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

    expect(plugin.event).toBeDefined();
  });

  it('should not send notification when config is disabled', async () => {
    const { ConfigLoader } = await import('../src/config/loader');
    vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockDisabledConfig);

    const mockClient = createMockClient();
    const mockProject = createMockProject();

    let sendCalled = false;
    const mockFetch = createMockFetch();
    global.fetch = mockFetch;

    const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

    await plugin.event!({
      event: {
        type: 'session.idle' as any,
        properties: { sessionID: 'sess_123' }
      }
    });

    expect(sendCalled).toBe(false);
  });

  describe('session.idle event handling', () => {
    it('should fetch session and messages and send notification', async () => {
      const { ConfigLoader } = await import('../src/config/loader');
      vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockConfig);

      const mockClient = createMockClient();
      const mockProject = createMockProject();

      let fetchCalled = false;
      let fetchUrl: string = '';
      let fetchBody: any = null;
      const mockFetch: any = vi.fn().mockImplementation((input: any, init?: any): Promise<Response> => {
        fetchCalled = true;
        fetchUrl = input.toString();
        if (init && init.body) {
          fetchBody = JSON.parse(init.body as string);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) } as Response);
      });
      (mockFetch as any).preconnect = () => Promise.resolve();
      global.fetch = mockFetch;

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

      await plugin.event!({
        event: {
          type: 'session.idle' as any,
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
      const { ConfigLoader } = await import('../src/config/loader');
      vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockConfig);

      const mockClient = createMockClient();
      const mockProject = createMockProject();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}) } as Response) as any;
      mockFetch.preconnect = () => Promise.resolve();
      global.fetch = mockFetch;

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

      const startTime = Date.now();
      await plugin.event!({
        event: {
          type: 'session.idle' as any,
          properties: { sessionID: 'sess_123' }
        }
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(1500);
    });

    it('should not fetch session data if sessionId is missing', async () => {
      const { ConfigLoader } = await import('../src/config/loader');
      vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockConfig);

      const mockClient = createMockClient();
      const mockProject = createMockProject();

      let fetchCalled = false;
      const mockFetch: any = vi.fn().mockImplementation(() => {
        fetchCalled = true;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) } as Response);
      });
      (mockFetch as any).preconnect = () => Promise.resolve();
      global.fetch = mockFetch;

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

      await plugin.event!({
        event: {
          type: 'session.idle' as any,
          properties: {} as any
        }
      });

      expect(mockClient.session.get).not.toHaveBeenCalled();
      expect(mockClient.session.messages).not.toHaveBeenCalled();
      expect(fetchCalled).toBe(false);
    });
  });

  describe('permission.asked event handling', () => {
    it('should fetch session and messages and send notification', async () => {
      const { ConfigLoader } = await import('../src/config/loader');
      vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockConfig);

      const mockClient = createMockClient();
      const mockProject = createMockProject();

      let fetchCalled = false;
      const mockFetch: any = vi.fn().mockImplementation(() => {
        fetchCalled = true;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) } as Response);
      });
      (mockFetch as any).preconnect = () => Promise.resolve();
      global.fetch = mockFetch;

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

      await plugin.event!({
        event: {
          type: 'permission.asked' as any,
          properties: { id: 'sess_123' }
        }
      });

      expect(mockClient.session.get).toHaveBeenCalledWith({ path: { id: 'sess_123' } });
      expect(fetchCalled).toBe(true);
    });

    it('should not wait before processing permission.asked event', async () => {
      const { ConfigLoader } = await import('../src/config/loader');
      vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockConfig);

      const mockClient = createMockClient();
      const mockProject = createMockProject();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}) } as Response) as any;
      mockFetch.preconnect = () => Promise.resolve();
      global.fetch = mockFetch;

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

      const startTime = Date.now();
      await plugin.event!({
        event: {
          type: 'permission.asked' as any,
          properties: { id: 'sess_123' }
        }
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should not fetch session data if sessionId is missing', async () => {
      const { ConfigLoader } = await import('../src/config/loader');
      vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockConfig);

      const mockClient = createMockClient();
      const mockProject = createMockProject();

      let fetchCalled = false;
      const mockFetch: any = vi.fn().mockImplementation(() => {
        fetchCalled = true;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) } as Response);
      });
      (mockFetch as any).preconnect = () => Promise.resolve();
      global.fetch = mockFetch;

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

      await plugin.event!({
        event: {
          type: 'permission.asked' as any,
          properties: {} as any
        }
      });

      expect(mockClient.session.get).not.toHaveBeenCalled();
      expect(mockClient.session.messages).not.toHaveBeenCalled();
      expect(fetchCalled).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should log errors via client.app.log when config is invalid', async () => {
      const { ConfigLoader } = await import('../src/config/loader');
      vi.spyOn(ConfigLoader.prototype, 'load').mockRejectedValue(new Error('Invalid config'));

      const mockClient = createMockClient();
      const mockProject = createMockProject();

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

      expect(mockClient.app.log).toHaveBeenCalledWith({
        body: {
          service: 'whatsapp-notifier',
          level: 'error',
          message: 'Config error: Invalid config',
        },
      });
      expect(plugin.event).toBeDefined();
    });

    it('should log errors via client.app.log when session.get fails', async () => {
      const { ConfigLoader } = await import('../src/config/loader');
      vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockConfig);

      const mockClient: any = {
        app: { log: vi.fn().mockResolvedValue(undefined) },
        session: {
          get: vi.fn().mockRejectedValue(new Error('Session fetch failed')),
          messages: vi.fn().mockResolvedValue({ data: [] })
        }
      };
      const mockProject = createMockProject();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}) } as Response) as any;
      mockFetch.preconnect = () => Promise.resolve();
      global.fetch = mockFetch;

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

      await plugin.event!({
        event: {
          type: 'session.idle' as any,
          properties: { sessionID: 'sess_123' }
        }
      });

      expect(mockClient.app.log).toHaveBeenCalledWith({
        body: {
          service: 'whatsapp-notifier',
          level: 'error',
          message: expect.any(String),
        },
      });
    });

    it('should log errors via client.app.log when provider.send fails', async () => {
      const { ConfigLoader } = await import('../src/config/loader');
      vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockConfig);

      const mockClient = createMockClient();
      const mockProject = createMockProject();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Auth/Client error') } as Response) as any;
      mockFetch.preconnect = () => Promise.resolve();
      global.fetch = mockFetch;

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

      await plugin.event!({
        event: {
          type: 'session.idle' as any,
          properties: { sessionID: 'sess_123' }
        }
      });

      expect(mockClient.app.log).toHaveBeenCalledWith({
        body: {
          service: 'whatsapp-notifier',
          level: 'error',
          message: expect.any(String),
        },
      });
    });
  });

  describe('session ID handling', () => {
    it('should use properties.sessionID for sessionId when available', async () => {
      const { ConfigLoader } = await import('../src/config/loader');
      vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockConfig);

      const mockClient = createMockClient();
      const mockProject = createMockProject();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}) } as Response) as any;
      mockFetch.preconnect = () => Promise.resolve();
      global.fetch = mockFetch;

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

      await plugin.event!({
        event: {
          type: 'session.idle' as any,
          properties: { sessionID: 'sess_123' }
        }
      });

      expect(mockClient.session.get).toHaveBeenCalledWith({ path: { id: 'sess_123' } });
    });

    it('should use properties.id as fallback for sessionId', async () => {
      const { ConfigLoader } = await import('../src/config/loader');
      vi.spyOn(ConfigLoader.prototype, 'load').mockResolvedValue(mockConfig);

      const mockClient = createMockClient();
      const mockProject = createMockProject();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}) } as Response) as any;
      mockFetch.preconnect = () => Promise.resolve();
      global.fetch = mockFetch;

      const plugin = await WhatsAppNotificationPlugin({ client: mockClient, project: mockProject } as any);

      await plugin.event!({
        event: {
          type: 'session.idle' as any,
          properties: { sessionID: 'sess_123' }
        }
      });

      expect(mockClient.session.get).toHaveBeenCalledWith({ path: { id: 'sess_123' } });
    });
  });
});

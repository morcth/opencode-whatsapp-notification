import { describe, it, expect, vi, beforeEach } from 'bun:test';
import { dispatchNotification } from '../src/dispatcher';

describe('dispatchNotification', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      app: { log: vi.fn().mockResolvedValue(undefined) }
    };
  });

  it('should send to all enabled providers', async () => {
    const mockProvider1 = { name: 'Discord', send: vi.fn().mockResolvedValue(undefined) };
    const mockProvider2 = { name: 'WhatsApp', send: vi.fn().mockResolvedValue(undefined) };

    const payload = {
      eventType: 'session.idle',
      sessionId: 'sess_123',
      timestamp: '2026-02-03T00:00:00Z',
      projectName: 'test',
      peakTokens: 1000,
      peakContextPercentage: 10,
      modelName: 'gpt-4',
      lastText: 'Test'
    };

    await dispatchNotification(mockClient, [mockProvider1, mockProvider2], 'session.idle', payload);

    expect(mockProvider1.send).toHaveBeenCalledWith('session.idle', payload);
    expect(mockProvider2.send).toHaveBeenCalledWith('session.idle', payload);
    expect(mockClient.app.log).toHaveBeenCalledWith({
      body: { service: 'multi-notifier', level: 'info', message: expect.stringContaining('Discord: SUCCESS') }
    });
  });

  it('should continue if one provider fails', async () => {
    const mockProvider1 = { name: 'Discord', send: vi.fn().mockResolvedValue(undefined) };
    const mockProvider2 = {
      name: 'WhatsApp',
      send: vi.fn().mockRejectedValue(new Error('Connection timeout'))
    };

    const payload = {
      eventType: 'session.idle',
      sessionId: 'sess_123',
      timestamp: '2026-02-03T00:00:00Z',
      projectName: 'test',
      peakTokens: 1000,
      peakContextPercentage: 10,
      modelName: 'gpt-4',
      lastText: 'Test'
    };

    await dispatchNotification(mockClient, [mockProvider1, mockProvider2], 'session.idle', payload);

    expect(mockProvider1.send).toHaveBeenCalled();
    expect(mockProvider2.send).toHaveBeenCalled();
    expect(mockClient.app.log).toHaveBeenCalledWith({
      body: { service: 'multi-notifier', level: 'error', message: expect.stringContaining('WhatsApp: FAILED') }
    });
  });

  it('should handle empty providers array', async () => {
    const payload = {
      eventType: 'session.idle',
      sessionId: 'sess_123',
      timestamp: '2026-02-03T00:00:00Z',
      projectName: 'test',
      peakTokens: 1000,
      peakContextPercentage: 10,
      modelName: 'gpt-4',
      lastText: 'Test'
    };

    await expect(dispatchNotification(mockClient, [], 'session.idle', payload)).resolves.not.toThrow();
  });
});

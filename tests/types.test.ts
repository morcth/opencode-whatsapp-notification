import { describe, it, expect } from 'bun:test';
import { ConfigError, ProviderError, TransportError } from '../src/types/errors';
import type { NotificationPayload, NotifierProvider, WhatsAppConfig, ValidationResult } from '../src/types/notifier';

describe('Error Types', () => {
  it('ConfigError should have correct message', () => {
    const err = new ConfigError('Missing required field');
    expect(err.name).toBe('ConfigError');
    expect(err.message).toBe('Missing required field');
  });

  it('ProviderError should have correct message', () => {
    const err = new ProviderError('unknown-provider');
    expect(err.name).toBe('ProviderError');
    expect(err.message).toContain('unknown-provider');
  });

  it('TransportError should have status and message', () => {
    const err = new TransportError(502, 'Server error');
    expect(err.name).toBe('TransportError');
    expect(err.status).toBe(502);
    expect(err.message).toContain('Server error');
  });

  it('ConfigError instanceof works correctly', () => {
    const err = new ConfigError('Test error');
    expect(err instanceof ConfigError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('ProviderError instanceof works correctly', () => {
    const err = new ProviderError('test-provider');
    expect(err instanceof ProviderError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('TransportError instanceof works correctly', () => {
    const err = new TransportError(500, 'Test error');
    expect(err instanceof TransportError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});

describe('Notifier Types', () => {
  it('NotificationPayload should accept valid data', () => {
    const payload: NotificationPayload = {
      eventType: 'session.idle',
      sessionId: 'session-123',
      timestamp: '2024-01-29T12:00:00.000Z',
      projectName: 'test-project',
      peakTokens: 1000,
      peakContextPercentage: 75,
      modelName: 'gpt-4',
      lastText: 'Hello world',
      pendingCommand: 'help'
    };
    expect(payload.peakContextPercentage).toBe(75);
    expect(typeof payload.timestamp).toBe('string');
  });

  it('NotificationPayload should work with permission.asked event', () => {
    const payload: NotificationPayload = {
      eventType: 'permission.asked',
      sessionId: 'session-456',
      timestamp: '2024-01-29T12:00:00.000Z',
      projectName: 'test-project',
      peakTokens: 500,
      peakContextPercentage: 50,
      modelName: 'gpt-3.5-turbo',
      lastText: 'Execute command'
    };
    expect(payload.eventType).toBe('permission.asked');
    expect(payload.pendingCommand).toBeUndefined();
  });

  it('NotifierProvider should have correct types', () => {
    const provider: NotifierProvider = {
      async send(eventType: string, payload: NotificationPayload): Promise<void> {
        return;
      }
    };
    expect(typeof provider.send).toBe('function');
  });

  it('NotifierProvider should support optional validateConfig', () => {
    const result: ValidationResult = { valid: true };
    const provider: NotifierProvider = {
      async send(eventType: string, payload: NotificationPayload): Promise<void> {
        return;
      },
      validateConfig(config: unknown): ValidationResult {
        return result;
      }
    };
    expect(provider.validateConfig).toBeDefined();
    expect(provider.validateConfig!({})).toEqual(result);
  });

  it('validateConfig can return invalid result', () => {
    const result: ValidationResult = { valid: false, errors: ['Missing apiToken'] };
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing apiToken');
  });

  it('WhatsAppConfig should have correct structure', () => {
    const config: WhatsAppConfig = {
      provider: 'whatsapp-greenapi',
      enabled: true,
      apiUrl: 'https://api.example.com',
      instanceId: 'instance-123',
      apiToken: 'token-abc',
      chatId: '1234567890',
      timeout: 5000
    };
    expect(config.provider).toBe('whatsapp-greenapi');
    expect(config.timeout).toBe(5000);
  });
});

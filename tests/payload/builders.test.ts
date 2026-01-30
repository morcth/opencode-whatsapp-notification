import { vi, describe, it, expect } from 'bun:test';
import { buildSessionIdlePayload, buildPermissionAskedPayload } from '../../src/payload/builders';
import type { NotificationPayload } from '../../src/types/notifier';

describe('Payload Builders', () => {
  it('should build session.idle payload with corrected peak labels', () => {
    const mockSession = {
      id: 'sess_123',
      model: { name: 'claude-3.5-sonnet', limit: { context: 200000 } }
    };
    const mockMessages = [
      {
        info: { role: 'assistant', tokens: { input: 1000, output: 2000, cache: { read: 500 } } },
        parts: [{ type: 'text', text: 'Task completed successfully' }]
      }
    ];
    const mockProject = { name: 'my-project' };

    const payload = buildSessionIdlePayload(mockSession, mockMessages, mockProject);

    expect(payload.eventType).toBe('session.idle');
    expect(payload.sessionId).toBe('sess_123');
    expect(payload.peakTokens).toBe(3500); // 1000 + 2000 + 500
    expect(payload.peakContextPercentage).toBeCloseTo(1.75); // 3500 / 200000 * 100
    expect(payload.modelName).toBe('claude-3.5-sonnet');
    expect(payload.lastText).toBe('Task completed successfully');
    expect(payload.pendingCommand).toBeUndefined();
  });

  it('should build permission.asked payload with pending command', () => {
    const mockSession = {
      id: 'sess_456',
      model: { name: 'claude-3.5-sonnet', limit: { context: 200000 } }
    };
    const mockMessages = [
      {
        info: { role: 'assistant', tokens: { input: 500, output: 1000 } },
        parts: [
          { type: 'tool', state: { status: 'pending', input: { command: 'rm -rf /tmp/test' } } }
        ]
      }
    ];
    const mockProject = { name: 'my-project' };

    const payload = buildPermissionAskedPayload(mockSession, mockMessages, mockProject);

    expect(payload.eventType).toBe('permission.asked');
    expect(payload.sessionId).toBe('sess_456');
    expect(payload.peakTokens).toBe(1500);
    expect(payload.peakContextPercentage).toBe(0.75);
    expect(payload.pendingCommand).toBe('rm -rf /tmp/test');
  });

  it('should handle missing token data gracefully', () => {
    const mockSession = {
      id: 'sess_789',
      model: { name: 'unknown-model' }
    };
    const mockMessages = [{ parts: [{ type: 'text', text: 'No token info' }] }];
    const mockProject = { name: 'my-project' };

    const payload = buildSessionIdlePayload(mockSession, mockMessages, mockProject);

    expect(payload.peakTokens).toBe(0);
    expect(payload.peakContextPercentage).toBe(0);
    expect(payload.lastText).toBe('No token info');
  });
});

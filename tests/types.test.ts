import { ConfigError, ProviderError, TransportError } from '../src/types/errors';

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

  it('TransportError should have status and sanitized response', () => {
    const err = new TransportError(502, 'Server error');
    expect(err.name).toBe('TransportError');
    expect(err.status).toBe(502);
    expect(err.message).toContain('Server error');
  });
});

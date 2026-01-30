export class ConfigError extends Error {
  override name = 'ConfigError';
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ConfigError.prototype);
  }
}

export class ProviderError extends Error {
  override name = 'ProviderError';
  constructor(providerName: string) {
    super(`Unknown provider: ${providerName}`);
    Object.setPrototypeOf(this, ProviderError.prototype);
  }
}

export class TransportError extends Error {
  override name = 'TransportError';
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    Object.setPrototypeOf(this, TransportError.prototype);
  }
}

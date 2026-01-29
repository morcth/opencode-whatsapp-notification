export class ConfigError extends Error {
  name = 'ConfigError';
  constructor(message: string) {
    super(message);
  }
}

export class ProviderError extends Error {
  name = 'ProviderError';
  constructor(providerName: string) {
    super(`Unknown provider: ${providerName}`);
  }
}

export class TransportError extends Error {
  name = 'TransportError';
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export interface NotificationPayload {
  eventType: 'session.idle' | 'permission.asked';
  sessionId: string;
  timestamp: string;
  projectName: string;
  peakTokens: number;
  peakContextPercentage: string;
  modelName: string;
  lastText: string;
  pendingCommand?: string;
}

export interface NotifierProvider {
  send(eventType: string, payload: NotificationPayload): Promise<void>;
  validateConfig?(config: unknown): boolean;
}

export type ProviderType = 'whatsapp-greenapi';

export interface WhatsAppConfig {
  provider: 'whatsapp-greenapi';
  enabled: boolean;
  apiUrl: string;
  instanceId: string;
  apiToken: string;
  chatId: string;
  timeout?: number;
}

export interface FallbackConfigPath {
  provider: ProviderType;
  enabled: boolean;
  fallbackConfigPath: string;
}

export type NotifierConfig = WhatsAppConfig | FallbackConfigPath;

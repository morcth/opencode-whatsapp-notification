export interface NotificationPayload {
  eventType: 'session.idle' | 'permission.asked';
  sessionId: string;
  timestamp: string;
  projectName: string;
  peakTokens: number;
  peakContextPercentage: number;
  modelName: string;
  lastText: string;
  pendingCommand?: string;
}

export type ValidationResult = { valid: true } | { valid: false; errors: string[] };

export interface NotifierProvider {
  send(eventType: string, payload: NotificationPayload): Promise<void>;
  validateConfig?(config: unknown): ValidationResult;
}

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
  provider: 'whatsapp-greenapi';
  enabled: boolean;
  fallbackConfigPath: string;
}

export type NotifierConfig = WhatsAppConfig | FallbackConfigPath;

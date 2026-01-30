import type { NotificationPayload } from '../types/notifier';

export function buildSessionIdlePayload(session: any, messages: any[], project: any): NotificationPayload {
  const sessionId = session.id || session.properties?.sessionID || session.properties?.id;
  const modelName = session.model?.name || messages[messages.length - 1]?.info?.modelID || 'Unknown';

  let peakTokens = 0;
  let peakContextPercentage = 0;
  let lastText = 'Response completed.';

  messages.forEach((m: any) => {
    const isAssistant = (m.info?.role || m.role) === 'assistant';
    if (isAssistant) {
      const t = m.info?.tokens || m.tokens;
      if (t) {
        const turnTotal = (t.input || 0) + (t.output || 0) + (t.cache?.read || 0);
        peakTokens = Math.max(peakTokens, turnTotal);
      }
    }

    const text = m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n');
    if (text) lastText = text;
  });

  if (peakTokens > 0 && session.model?.limit?.context) {
    peakContextPercentage = (peakTokens / session.model.limit.context) * 100;
  }

  return {
    eventType: 'session.idle',
    sessionId,
    timestamp: new Date().toISOString(),
    projectName: project.name,
    peakTokens,
    peakContextPercentage,
    modelName,
    lastText,
  };
}

export function buildPermissionAskedPayload(session: any, messages: any[], project: any): NotificationPayload {
  const basePayload = buildSessionIdlePayload(session, messages, project);
  let pendingCommand = '';

  messages.forEach((m: any) => {
    const isAssistant = (m.info?.role || m.role) === 'assistant';
    if (isAssistant && m.parts) {
      const toolPart = m.parts.find((p: any) => p.type === 'tool' && (p.state?.status === 'pending' || p.state?.status === 'running'));
      if (toolPart) {
        const input = toolPart.state?.input || {};
        pendingCommand = input.command || input.filePath || JSON.stringify(input);
      }
    }
  });

  return {
    ...basePayload,
    eventType: 'permission.asked',
    pendingCommand: pendingCommand || 'Check terminal for details',
  };
}

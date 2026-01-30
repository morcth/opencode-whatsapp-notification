import type { Plugin } from '@opencode-ai/plugin';
import { ConfigLoader } from './config/loader';
import { ProviderRegistry } from './providers/registry';
import { buildSessionIdlePayload, buildPermissionAskedPayload } from './payload/builders';
import { ConfigError } from './types/errors';
import type { NotificationPayload } from './types/notifier';

export const WhatsAppNotificationPlugin: Plugin = async ({ client, project }) => {
  const loader = new ConfigLoader();
  let config;

  try {
    config = await loader.load();
  } catch (e: any) {
    await client.app.log({
      body: {
        service: 'whatsapp-notifier',
        level: 'error',
        message: `Config error: ${e.message}`,
      },
    });
    return { event: async () => {} };
  }

  if (!config.enabled) {
    return { event: async () => {} };
  }

  const provider = ProviderRegistry.getProvider(config);

  return {
    event: async ({ event }) => {
      try {
        console.log('[WhatsApp Notifier] Event received:', event.type, event.properties);
        if (event.type === 'session.idle') {
          await handleNotification(provider, client, project, event, 'idle');
        } else if ((event.type as string) === 'permission.asked') {
          await handleNotification(provider, client, project, event, 'permission');
        } else {
          console.log('[WhatsApp Notifier] Ignoring event type:', event.type);
        }
      } catch (e: any) {
        console.error('[WhatsApp Notifier] Error:', e);
        await client.app.log({
          body: {
            service: 'whatsapp-notifier',
            level: 'error',
            message: `Notification error: ${e.message}`,
          },
        });
      }
    },
  };
};

async function handleNotification(
  provider: any,
  client: any,
  project: any,
  event: any,
  type: 'idle' | 'permission'
) {
  const sessionId = event.properties?.sessionID || event.properties?.id;
  console.log('[WhatsApp Notifier] Processing notification, sessionId:', sessionId, 'type:', type);
  if (!sessionId) {
    console.log('[WhatsApp Notifier] No sessionId found, skipping');
    return;
  }

  if (type === 'idle') {
    console.log('[WhatsApp Notifier] Waiting 1.5s for idle event...');
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('[WhatsApp Notifier] Fetching session and messages...');
  const [sRes, mRes] = await Promise.all([
    client.session.get({ path: { id: sessionId } }),
    client.session.messages({ path: { id: sessionId } })
  ]);

  const session = (sRes as any).data || sRes;
  const messages = (mRes as any).data || mRes || [];
  console.log('[WhatsApp Notifier] Session:', session ? 'found' : 'not found', 'Messages:', messages.length);

  const payload = type === 'idle'
    ? buildSessionIdlePayload(session, messages, project)
    : buildPermissionAskedPayload(session, messages, project);

  console.log('[WhatsApp Notifier] Sending notification via provider...');
  await provider.send(type === 'idle' ? 'session.idle' : 'permission.asked', payload);
  console.log('[WhatsApp Notifier] Notification sent successfully');
}

export default WhatsAppNotificationPlugin;

import type { Plugin } from '@opencode-ai/plugin';
import { ConfigLoader } from './config/loader';
import { ProviderRegistry } from './providers/registry';
import { dispatchNotification } from './dispatcher';
import { buildSessionIdlePayload, buildPermissionAskedPayload } from './payload/builders';
import { ConfigError } from './types/errors';
import type { NotificationPayload } from './types/notifier';

export const MultiNotificationPlugin: Plugin = async ({ client, project }) => {
  const loader = new ConfigLoader();
  let config;

  try {
    config = await loader.load();
  } catch (e: any) {
    await client.app.log({
      body: {
        service: 'multi-notifier',
        level: 'error',
        message: `Config error: ${e.message}`,
      },
    });
    return { event: async () => {} };
  }

  if (!config.enabled) {
    return { event: async () => {} };
  }

  const providers = ProviderRegistry.getProviders(config);

  return {
    event: async ({ event }) => {
      try {
        console.log('[Multi-Notifier] Event type:', event.type);
        console.log('[Multi-Notifier] Event properties keys:', Object.keys(event.properties || {}));

        if (event.type === 'session.idle') {
          await handleNotification(providers, client, project, event, 'idle');
        } else if ((event.type as string) === 'permission.asked') {
          await handleNotification(providers, client, project, event, 'permission');
        } else {
          console.log('[Multi-Notifier] Ignoring event type:', event.type);
        }
      } catch (e: any) {
        console.error('[Multi-Notifier] Error:', e);
        await client.app.log({
          body: {
            service: 'multi-notifier',
            level: 'error',
            message: `Notification error: ${e.message}`,
          },
        });
      }
    },
  };
};

async function handleNotification(
  providers: any[],
  client: any,
  project: any,
  event: any,
  type: 'idle' | 'permission'
) {
  const sessionId = event.properties?.sessionID || event.properties?.id;
  console.log('[Multi-Notifier] Processing notification, sessionId:', sessionId, 'type:', type);
  if (!sessionId) {
    console.log('[Multi-Notifier] No sessionId found, skipping');
    return;
  }

  if (type === 'idle') {
    console.log('[Multi-Notifier] Waiting 1.5s for idle event...');
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('[Multi-Notifier] Fetching session and messages...');
  const [sRes, mRes] = await Promise.all([
    client.session.get({ path: { id: sessionId } }),
    client.session.messages({ path: { id: sessionId } })
  ]);

  const session = (sRes as any).data || sRes;
  const messages = (mRes as any).data || mRes || [];
  console.log('[Multi-Notifier] Session:', session ? 'found' : 'not found', 'Messages:', messages.length);

  const payload = type === 'idle'
    ? buildSessionIdlePayload(session, messages, project)
    : buildPermissionAskedPayload(session, messages, project);

  console.log('[Multi-Notifier] Dispatching notification to', providers.length, 'provider(s)...');
  await dispatchNotification(client, providers, type === 'idle' ? 'session.idle' : 'permission.asked', payload);
  console.log('[Multi-Notifier] Notification dispatch complete');
}

export default MultiNotificationPlugin;

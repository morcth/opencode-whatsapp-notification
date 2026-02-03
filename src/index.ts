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

        if (event.type === 'session.idle') {
          await handleNotification(providers, client, project, event, 'idle');
        } else if ((event.type as string) === 'permission.asked') {
          await handleNotification(providers, client, project, event, 'permission');
        } else {
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
  if (!sessionId) {
    return;
  }

  if (type === 'idle') {
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  const [sRes, mRes] = await Promise.all([
    client.session.get({ path: { id: sessionId } }),
    client.session.messages({ path: { id: sessionId } })
  ]);

  const session = (sRes as any).data || sRes;
  const messages = (mRes as any).data || mRes || [];

  const payload = type === 'idle'
    ? buildSessionIdlePayload(session, messages, project)
    : buildPermissionAskedPayload(session, messages, project);

  await dispatchNotification(client, providers, type === 'idle' ? 'session.idle' : 'permission.asked', payload);
}

export default MultiNotificationPlugin;

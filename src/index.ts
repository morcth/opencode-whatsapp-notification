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
    config = await loader.load(project.config);
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
        if (event.type === 'session.idle') {
          await handleNotification(client, project, event, 'idle');
        } else if (event.type === 'permission.asked') {
          await handleNotification(client, project, event, 'permission');
        }
      } catch (e: any) {
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
  client: any,
  project: any,
  event: any,
  type: 'idle' | 'permission'
) {
  const sessionId = event.properties?.sessionID || event.properties?.id;
  if (!sessionId) return;

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

  const provider = ProviderRegistry.getProvider({ provider: 'whatsapp-greenapi', enabled: true } as any);
  await provider.send(type === 'idle' ? 'session.idle' : 'permission.asked', payload);
}

export default WhatsAppNotificationPlugin;

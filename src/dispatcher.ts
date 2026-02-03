import type { NotifierProvider, NotificationPayload } from './types/notifier';

export async function dispatchNotification(
  client: any,
  providers: NotifierProvider[],
  eventType: string,
  payload: NotificationPayload
): Promise<void> {
  if (providers.length === 0) {
    console.log('[Multi-Notifier] No providers enabled, skipping notification');
    await Promise.resolve();
    return;
  }

  const results = await Promise.allSettled(
    providers.map(provider => provider.send(eventType, payload))
  );

  results.forEach((result, index) => {
    const provider = providers[index];
    if (!provider) return;

    if (result.status === 'fulfilled') {
      console.log(`[Multi-Notifier] ${provider.name}: SUCCESS`);
      client.app.log({
        body: {
          service: 'multi-notifier',
          level: 'info',
          message: `${provider.name}: SUCCESS`
        }
      });
    } else {
      const error = result.reason;
      console.error(`[Multi-Notifier] ${provider.name}: FAILED - ${error.message}`);

      client.app.log({
        body: {
          service: 'multi-notifier',
          level: 'error',
          message: `${provider.name}: FAILED - ${error.message}`
        }
      });
    }
  });

  await Promise.resolve();
}

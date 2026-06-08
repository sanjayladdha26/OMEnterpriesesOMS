import webpush from 'web-push';
import { createServerSupabaseClient } from './supabase/server';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    'mailto:support@omenterprises.com',
    publicVapidKey,
    privateVapidKey
  );
}

export async function sendNotificationToUser(userId: string, payload: { title: string, body?: string, icon?: string, url?: string }) {
  if (!publicVapidKey || !privateVapidKey) {
    console.error("VAPID keys not configured.");
    return;
  }

  const supabase = await createServerSupabaseClient();
  
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error || !subscriptions) {
    console.error('Failed to get subscriptions', error);
    return;
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/file.svg',
    url: payload.url || '/'
  });

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    try {
      await webpush.sendNotification(pushSubscription, notificationPayload);
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      } else {
        console.error('Error sending push notification', error);
      }
    }
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/file.svg',
    url: payload.url || '/',
  });
}

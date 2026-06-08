import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendNotificationToUser } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const message = body.message || "This is a test notification!";

    await sendNotificationToUser(user.id, {
      title: "Test Notification",
      body: message,
      url: "/"
    });

    return NextResponse.json({ success: true, message: "Notification triggered" });
  } catch (error) {
    console.error('Error in test notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

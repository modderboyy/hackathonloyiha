import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Autentifikatsiya noto'g'ri" }, { status: 401 });
    }

    const { recipient_id, content, chat_type } = await request.json();

    if (!recipient_id || !content) {
      return NextResponse.json({ error: "recipient_id va content talab qilinadi" }, { status: 400 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profil topilmadi" }, { status: 404 });
    }

    // Save chat message
    const { data: chatMessage, error: chatError } = await supabase
      .from("chat_messages")
      .insert({
        sender_id: user.id,
        recipient_id,
        content,
        created_at: new Date().toISOString(),
        chat_type: chat_type || "general",
      })
      .select()
      .single();

    if (chatError) {
      console.error("Chat error:", chatError);
      return NextResponse.json({ error: "Chat xabari saqlanmadi", details: chatError.message }, { status: 500 });
    }

    // Create notification for recipient
    if (chat_type === "patient" || chat_type === "clinic") {
      const notificationTitle = chat_type === "patient" ? `${profile.full_name} dan xabar` : `${profile.full_name} dan klinika xabari`;

      await supabase.from("notifications").insert({
        recipient_id,
        type: "info",
        title: notificationTitle,
        body: content.substring(0, 100),
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, data: chatMessage });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Autentifikatsiya noto'g'ri" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get("recipient_id");

    if (!recipientId) {
      return NextResponse.json({ error: "recipient_id talab qilinadi" }, { status: 400 });
    }

    // Get chat messages
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Get messages error:", error);
      return NextResponse.json({ error: "Xabarlar yuklanmadi" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: messages || [] });
  } catch (err) {
    console.error("Chat GET error:", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

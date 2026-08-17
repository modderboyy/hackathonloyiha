"use client";

import {
  SendRounded,
  PersonRounded,
  LocalHospitalRounded,
  AttachFileRounded,
  EmojiEmotionsRounded,
  CloseRounded,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  Badge,
} from "@mui/material";
import { useState, useMemo, useEffect } from "react";
import { useData } from "@/lib/data";

export function ChatOverview() {
  const { profile, patients, facilities, chatMessages } = useData();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Array<{ 
    id: string; 
    sender: string; 
    senderId: string;
    senderType: "own" | "other"; 
    content: string; 
    timestamp: string;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const chats = useMemo(() => {
    // Role-based chat filtering
    if (profile?.role === "patient") {
      // Patients see clinics they're registered with
      return (facilities || []).slice(0, 5).map((facility) => ({
        id: facility.id,
        type: "clinic" as "clinic",
        name: facility.name || "Klinika",
        avatar: facility.name?.split(" ").map((p) => p[0]).join("").slice(0, 2) || "KL",
        lastMessage: "Yangi xabar mavjud",
        unread: 1,
        timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      }));
    }
    // Doctors/clinic staff see their patients
    return (patients || []).slice(0, 5).map((patient, index) => ({
      id: patient.id,
      type: "patient" as "patient",
      name: patient.full_name || `Bemor ${index + 1}`,
      avatar: patient.full_name?.split(" ").map((p) => p[0]).join("").slice(0, 2) || "BP",
      lastMessage: "Salomalaikum, o'zim ozdim",
      unread: index % 3 === 0 ? 2 : 0,
      timestamp: `${10 + index}:${20 + index * 5}`,
    }));
  }, [patients, facilities, profile?.role]);

  const clinicChats = useMemo(() => {
    // Only show clinic chats if user is a patient
    if (profile?.role === "patient") {
      return [];
    }
    // Show associated clinics or facility
    return (facilities || []).filter((f) => !profile?.clinic_id || f.id === profile.clinic_id).slice(0, 3).map((clinic) => ({
      id: clinic.id,
      type: "clinic" as "clinic",
      name: clinic.name || "Klinika",
      avatar: clinic.name?.split(" ").map((p) => p[0]).join("").slice(0, 2) || "KL",
      lastMessage: "Tizim xabarlari va eʼlonlar",
      unread: 0,
      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    }));
  }, [facilities, profile?.clinic_id, profile?.role]);

  const allChats = [...chats, ...clinicChats];
  const selectedChat = selectedChatId ? allChats.find((c) => c.id === selectedChatId) : null;

  // Load messages when chat changes
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    // Load from chatMessages or initialize with demo
    const chatMsgs = (chatMessages || [])
      .filter((msg: any) => 
        (msg.client_id === selectedChat.id || msg.recipient_id === selectedChat.id)
      )
      .map((msg: any) => ({
        id: msg.id,
        sender: msg.sender_name || profile?.full_name || "Siz",
        senderId: msg.sender_id,
        senderType: msg.sender_id === profile?.id ? ("own" as const) : ("other" as const),
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      }));

    if (chatMsgs.length === 0) {
      // Initialize with demo message
      setMessages([{
        id: `demo_${selectedChat.id}`,
        sender: selectedChat.name,
        senderId: selectedChat.id,
        senderType: "other",
        content: "Salom! Bugungi kuni nima yangi?",
        timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } else {
      setMessages(chatMsgs);
    }
  }, [selectedChat, chatMessages, profile?.id, profile?.full_name]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat || !profile?.id) return;

    setLoading(true);
    try {
      const newMessage = {
        id: `msg_${Date.now()}`,
        sender: profile.full_name || "Siz",
        senderId: profile.id,
        senderType: "own" as const,
        content: messageText.trim(),
        timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages([...messages, newMessage]);
      setMessageText("");

      // Save to API
      try {
        await fetch("/api/admin/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient_id: selectedChat.id,
            content: messageText.trim(),
            chat_type: selectedChat.type,
          }),
        });
      } catch (err) {
        console.error("Failed to save message:", err);
      }

      // Simulate response after delay
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now() + 1}`,
            sender: selectedChat.name,
            senderId: selectedChat.id,
            senderType: "other" as const,
            content: "Xabaringiz qabul qilindi. Rahmat!",
            timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: 27, md: 32 } }}>
          💬 Chat
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Bemorlar va klinikalar bilan muloqot
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* Chat List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <CardContent sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1F2937" }}>
                  Chatlar
                </Typography>

                <Divider />

                {/* Patient Chats */}
                <Box>
                  <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    👤 Bemorlar
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {chats.map((chat) => (
                      <Paper
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        sx={{
                          p: 1.5,
                          cursor: "pointer",
                          borderRadius: 2,
                          bgcolor: selectedChatId === chat.id ? "#EFF4FF" : "#FFFFFF",
                          border: selectedChatId === chat.id ? "2px solid #155EEF" : "1px solid #E5E7EB",
                          transition: "all 0.2s ease",
                          "&:hover": { bgcolor: "#F9FAFB", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
                        }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Avatar sx={{ width: 40, height: 40, bgcolor: "#DBEAFE", color: "#155EEF", fontWeight: 800, fontSize: 12 }}>
                            {chat.avatar}
                          </Avatar>
                          <Box flex={1} minWidth={0}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                              <Typography variant="body2" fontWeight={700} sx={{ color: "#1F2937" }}>
                                {chat.name}
                              </Typography>
                              {chat.unread > 0 && (
                                <Box
                                  sx={{
                                    bgcolor: "#EF4444",
                                    color: "#FFFFFF",
                                    borderRadius: "50%",
                                    width: 20,
                                    height: 20,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    fontWeight: 800,
                                  }}
                                >
                                  {chat.unread}
                                </Box>
                              )}
                            </Stack>
                            <Typography variant="caption" sx={{ color: "#6B7280", display: "block", mt: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {chat.lastMessage}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>

                <Divider />

                {/* Clinic Chats */}
                <Box>
                  <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    🏥 Klinikalar
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {clinicChats.map((chat) => (
                      <Paper
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        sx={{
                          p: 1.5,
                          cursor: "pointer",
                          borderRadius: 2,
                          bgcolor: selectedChatId === chat.id ? "#EAFBF3" : "#FFFFFF",
                          border: selectedChatId === chat.id ? "2px solid #0F6E5C" : "1px solid #E5E7EB",
                          transition: "all 0.2s ease",
                          "&:hover": { bgcolor: "#F9FAFB", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
                        }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Avatar sx={{ width: 40, height: 40, bgcolor: "#EAFBF3", color: "#0F6E5C", fontWeight: 800, fontSize: 12 }}>
                            {chat.avatar}
                          </Avatar>
                          <Box flex={1} minWidth={0}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                              <Typography variant="body2" fontWeight={700} sx={{ color: "#1F2937" }}>
                                {chat.name}
                              </Typography>
                              {chat.unread > 0 && (
                                <Box
                                  sx={{
                                    bgcolor: "#EF4444",
                                    color: "#FFFFFF",
                                    borderRadius: "50%",
                                    width: 20,
                                    height: 20,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    fontWeight: 800,
                                  }}
                                >
                                  {chat.unread}
                                </Box>
                              )}
                            </Stack>
                            <Typography variant="caption" sx={{ color: "#6B7280", display: "block", mt: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {chat.lastMessage}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat Messages */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            {selectedChat ? (
              <>
                {/* Header */}
                <CardContent sx={{ p: 2, borderBottom: "1px solid #E5E7EB" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: selectedChat.type === "clinic" ? "#EAFBF3" : "#DBEAFE",
                        color: selectedChat.type === "clinic" ? "#0F6E5C" : "#155EEF",
                        fontWeight: 800,
                      }}
                    >
                      {selectedChat.avatar}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "#1F2937" }}>
                        {selectedChat.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#6B7280" }}>
                        {selectedChat.type === "clinic" ? "🏥 Klinika" : "👤 Bemor"}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>

                {/* Messages */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    p: 2.5,
                    bgcolor: "#F9FAFB",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    minHeight: "300px",
                  }}
                >
                  {messages.length === 0 ? (
                    <Box sx={{ textAlign: "center", mt: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Hozircha xabarlashtirilgan xabar yo'q
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((msg) => (
                      <Stack
                        key={msg.id}
                        direction={msg.senderType === "own" ? "row-reverse" : "row"}
                        spacing={1}
                        alignItems="flex-end"
                      >
                        <Avatar sx={{ width: 32, height: 32, bgcolor: msg.senderType === "own" ? "#155EEF" : "#E5E7EB", color: msg.senderType === "own" ? "#FFFFFF" : "#6B7280", fontSize: 12, fontWeight: 800 }}>
                          {msg.sender.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                        </Avatar>
                        <Paper
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: msg.senderType === "own" ? "#155EEF" : "#FFFFFF",
                            color: msg.senderType === "own" ? "#FFFFFF" : "#1F2937",
                            maxWidth: "70%",
                            wordWrap: "break-word",
                          }}
                        >
                          <Typography variant="body2">{msg.content}</Typography>
                          <Typography variant="caption" sx={{ color: msg.senderType === "own" ? "rgba(255,255,255,0.7)" : "#9CA3AF", display: "block", mt: 0.5 }}>
                            {msg.timestamp}
                          </Typography>
                        </Paper>
                      </Stack>
                    ))
                  )}
                </Box>

                {/* Input */}
                <Box sx={{ p: 2, borderTop: "1px solid #E5E7EB", bgcolor: "#FFFFFF" }}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Xabara yozing..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmojiEmotionsRounded sx={{ color: "#6B7280", cursor: "pointer" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <AttachFileRounded sx={{ color: "#6B7280", cursor: "pointer" }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "#F9FAFB",
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      sx={{
                        bgcolor: "#155EEF",
                        borderRadius: 2,
                        minWidth: 44,
                        "&:hover": { bgcolor: "#1E40AF" },
                      }}
                    >
                      <SendRounded />
                    </Button>
                  </Stack>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  flexDirection: "column",
                  gap: 2,
                  color: "#6B7280",
                }}
              >
                <Typography variant="h5">💬</Typography>
                <Typography variant="body2">Chat tanlang boshlash uchun</Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

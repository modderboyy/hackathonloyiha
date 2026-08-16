import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';

const int _PAGE_SIZE = 20;

/// AI chatbot — xabarlar database'da saqlanadi, lokal kesh + pagination.
class ChatScreen extends StatefulWidget {
  final bool embedded;
  const ChatScreen({super.key, this.embedded = false});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  final ScrollController _scroll = ScrollController();

  final List<ChatMessage> _messages = [];
  bool _thinking = false;
  bool _loadingMore = false;
  bool _hasMore = true;
  int _offset = 0;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _initialLoad());
  }

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    _controller.dispose();
    super.dispose();
  }

  // Lokal kesh kaliti
  String get _cacheKey => 'chat_${context.read<AppState>().db.userId}';

  void _onScroll() {
    // Tepaga chiqqanda eski xabarlarni yuklash
    if (_scroll.position.pixels <= 40 && !_loadingMore && _hasMore) {
      _loadMore();
    }
  }

  Future<void> _initialLoad() async {
    final db = context.read<AppState>().db;

    // 1. Lokal keshdan darhol ko'rsatish (offline tez)
    final local = await _readLocal();
    if (local.isNotEmpty && mounted) {
      setState(() {
        _messages.addAll(local);
      });
    }

    // 2. Serverdan oxirgi 20 tani olish
    final remote = await db.getChatMessages(limit: _PAGE_SIZE, offset: 0);
    if (remote.isNotEmpty) {
      _offset = remote.length;
      if (mounted) {
        setState(() {
          // Lokalni server bilan sinxronlash (server hukmron)
          _messages.clear();
          _messages.addAll(remote);
        });
        await _writeLocal(remote);
        WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
      }
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore) return;
    setState(() => _loadingMore = true);
    final db = context.read<AppState>().db;
    final older = await db.getChatMessages(limit: _PAGE_SIZE, offset: _offset);
    if (older.isEmpty) {
      setState(() {
        _hasMore = false;
        _loadingMore = false;
      });
      return;
    }
    setState(() {
      _offset += older.length;
      _messages.insertAll(0, older);
      _loadingMore = false;
    });
  }

  Future<List<ChatMessage>> _readLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_cacheKey);
      if (raw == null) return [];
      final list = jsonDecode(raw) as List;
      return list.map((e) => ChatMessage.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _writeLocal(List<ChatMessage> messages) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = messages.map((m) => m.toJson()).toList();
      await prefs.setString(_cacheKey, jsonEncode(list));
    } catch (_) {}
  }

  void _scrollToBottom() {
    if (_scroll.hasClients) {
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();

    final state = context.read<AppState>();
    final db = state.db;

    // Foydalanuvchi xabarini saqlash
    final userMsg = ChatMessage(role: 'user', content: text, createdAt: DateTime.now());
    setState(() {
      _messages.add(userMsg);
      _thinking = true;
    });
    _scrollToBottom();

    // Database'ga yozish
    ChatMessage? savedUser;
    try {
      savedUser = await db.saveChatMessage(role: 'user', content: text);
    } catch (_) {}

    // AI javobi
    final reply = await state.askAI(text);
    final assistantMsg = ChatMessage(role: 'assistant', content: reply, createdAt: DateTime.now());
    if (!mounted) return;
    setState(() {
      _messages.add(assistantMsg);
      _thinking = false;
    });
    _scrollToBottom();

    try {
      await db.saveChatMessage(role: 'assistant', content: reply);
    } catch (_) {}

    // Lokal keshni yangilash (faqat oxirgi 50 tasini saqlaymiz)
    await _writeLocal(_messages.length > 50 ? _messages.sublist(_messages.length - 50) : _messages);
  }

  @override
  Widget build(BuildContext context) {
    final body = Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primaryDarker, AppColors.bg, AppColors.primaryDark],
        ),
      ),
      child: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_thinking ? 1 : 0) + (_loadingMore ? 1 : 0),
              itemBuilder: (context, i) {
                // Yuklash indikatori (tepada)
                if (_loadingMore && i == 0) {
                  return const Padding(
                    padding: EdgeInsets.all(12),
                    child: Center(
                      child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.cyan)),
                    ),
                  );
                }
                final msgIndex = i - (_loadingMore ? 1 : 0);
                if (msgIndex >= _messages.length) {
                  // typing indikator
                  return const Align(
                    alignment: Alignment.centerLeft,
                    child: Padding(
                      padding: EdgeInsets.all(8),
                      child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.cyan)),
                    ),
                  );
                }
                final m = _messages[msgIndex];
                final isUser = m.role == 'user';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                    decoration: BoxDecoration(
                      color: isUser ? AppColors.accent : AppColors.surface,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(12),
                        topRight: const Radius.circular(12),
                        bottomLeft: Radius.circular(isUser ? 12 : 0),
                        bottomRight: Radius.circular(isUser ? 0 : 12),
                      ),
                      boxShadow: [
                        BoxShadow(color: (isUser ? AppColors.accent : Colors.black).withOpacity(0.15), blurRadius: 8),
                      ],
                    ),
                    child: Text(
                      m.content,
                      style: TextStyle(color: isUser ? Colors.white : AppColors.textPrimary),
                    ),
                  ),
                );
              },
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface.withOpacity(0.6),
                        border: Border.all(color: AppColors.accent.withOpacity(0.2)),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextField(
                        controller: _controller,
                        style: const TextStyle(color: AppColors.textPrimary),
                        cursorColor: AppColors.accent,
                        decoration: const InputDecoration(
                          hintText: 'Xabaringizni yozing...',
                          hintStyle: TextStyle(color: AppColors.textMuted),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      onPressed: _thinking ? null : _send,
                      icon: const Icon(Icons.send, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );

    if (widget.embedded) return body;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.primaryDarker,
        title: const Row(
          children: [
            Icon(Icons.smart_toy, color: AppColors.cyan),
            SizedBox(width: 8),
            Text('AI yordamchi', style: TextStyle(color: AppColors.textPrimary)),
          ],
        ),
      ),
      body: body,
    );
  }
}

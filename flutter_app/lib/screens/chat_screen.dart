import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';

/// AI chatbot — bemor bilan suhbat
class ChatScreen extends StatefulWidget {
  final bool embedded;
  const ChatScreen({super.key, this.embedded = false});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  final List<ChatMessage> _messages = [];
  bool _thinking = false;

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _messages.add(ChatMessage(role: 'user', content: text));
      _thinking = true;
    });
    _controller.clear();
    final reply = await context.read<AppState>().askAI(text);
    if (!mounted) return;
    setState(() {
      _messages.add(ChatMessage(role: 'assistant', content: reply));
      _thinking = false;
    });
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
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_thinking ? 1 : 0),
              itemBuilder: (context, i) {
                if (i == _messages.length) {
                  return const Align(
                    alignment: Alignment.centerLeft,
                    child: Padding(
                      padding: EdgeInsets.all(8),
                      child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.cyan)),
                    ),
                  );
                }
                final m = _messages[i];
                final isUser = m.role == 'user';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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

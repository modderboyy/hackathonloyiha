import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/app_state.dart';
import 'chat_screen.dart';
import 'lock_screen.dart';
import 'profile_screen.dart';

/// Bosh ekran — sog'liq holati, obuna, so'nggi tekshiruvlar va AI chatbot.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Bloklangan holatni tekshirish
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppState>().checkLocked();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    // Telefon qulflangan bo'lsa — bloklash ekrani
    if (state.locked) return const LockScreen();

    return Scaffold(
      appBar: AppBar(
        title: const Text('CareLink'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileScreen())),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async => await state.logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => state.loadAll(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Salomlashish
            Card(
              child: ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFF1E3A8A),
                  child: Icon(Icons.person, color: Colors.white),
                ),
                title: Text('Salom, ${state.profile?.fullName ?? "bemor"}!'),
                subtitle: Text(state.isPremium ? 'Premium obuna faol ✓' : 'Obuna faol emas'),
              ),
            ),
            const SizedBox(height: 16),

            // Sog'liq holati
            if (state.health != null) ...[
              const Text('Sog\'liq holati', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _infoRow('Kasallik', state.health!.currentCondition ?? "Ko'rsatilmagan"),
                      if (state.health!.avgBpSys != null)
                        _infoRow('Qon bosimi', '${state.health!.avgBpSys}/${state.health!.avgBpDia}'),
                      if (state.health!.avgHeartRate != null) _infoRow('Puls', '${state.health!.avgHeartRate}'),
                      if (state.health!.avgSpo2 != null) _infoRow('SpO₂', '${state.health!.avgSpo2}%'),
                      if (state.health!.allergies != null) _infoRow('Allergiya', state.health!.allergies!),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // AI chatbot
            const Text('AI yordamchi', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Card(
              child: ListTile(
                leading: const Icon(Icons.smart_toy, color: Color(0xFF1E3A8A)),
                title: const Text('Chatbot bilan suhbat'),
                subtitle: const Text('Savollaringizga javob beradi, holatingizni kuzatadi'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChatScreen())),
              ),
            ),
            const SizedBox(height: 16),

            // So'nggi tekshiruvlar
            const Text('So\'nggi tekshiruvlar', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (state.checkins.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Hozircha tekshiruvlar yo\'q. Premium obuna bilan har soatda AI sizni tekshiradi.'),
                ),
              )
            else
              ...state.checkins.take(5).map((c) => Card(
                    child: ListTile(
                      leading: Icon(
                        c.status == 'answered_fine' ? Icons.check_circle : c.status == 'answered_bad' ? Icons.warning : c.status == 'locked' ? Icons.lock : Icons.hourglass_bottom,
                        color: c.status == 'answered_fine' ? Colors.green : c.status == 'answered_bad' ? Colors.orange : c.status == 'locked' ? Colors.red : Colors.grey,
                      ),
                      title: Text(c.aiMessage, maxLines: 2, overflow: TextOverflow.ellipsis),
                      subtitle: Text('${_statusLabel(c.status)} · ${c.createdAt.toString().substring(0, 16)}'),
                    ),
                  )),

            // Tekshiruv javobi (eng so'nggi 'sent' bo'lsa)
            if (state.checkins.isNotEmpty && state.checkins.first.status == 'sent') ...[
              const SizedBox(height: 16),
              Card(
                color: const Color(0xFFEFF6FF),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('Oxirgi tekshiruv:', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(state.checkins.first.aiMessage),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: FilledButton(
                              onPressed: () => state.answerCheckin(state.checkins.first.id, 'Yaxshiman', isBad: false),
                              style: FilledButton.styleFrom(backgroundColor: Colors.green),
                              child: const Text('Yaxshiman'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: FilledButton(
                              onPressed: () => state.answerCheckin(state.checkins.first.id, 'Yomonman', isBad: true),
                              style: FilledButton.styleFrom(backgroundColor: Colors.red),
                              child: const Text('Yomonman'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(width: 120, child: Text(label, style: const TextStyle(color: Colors.grey))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }

  String _statusLabel(String s) {
    switch (s) {
      case 'sent': return 'Yuborildi';
      case 'answered_fine': return 'Yaxshiman';
      case 'answered_bad': return 'Yomonman';
      case 'sms_sent': return 'SMS yuborildi';
      case 'locked': return 'Qulflandi';
      case 'escalated': return 'Kuchaytirildi';
      default: return s;
    }
  }
}

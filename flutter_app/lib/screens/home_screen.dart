import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';
import '../widgets/health_dashboard.dart';
import '../widgets/typewriter.dart';
import 'chat_screen.dart';
import 'lock_screen.dart';
import 'profile_screen.dart';
import 'reminders_screen.dart';
import 'subscription_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppState>().checkLocked();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    if (state.locked) return const LockScreen();
    if (!state.hasSubscription) return const SubscriptionScreen();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.primaryDarker,
        elevation: 0,
        title: const Text(
          'CareLink',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
            color: AppColors.textPrimary,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.alarm, color: AppColors.cyan),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const RemindersScreen())),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline, color: AppColors.textSecondary),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileScreen())),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.textSecondary),
            onPressed: () async => await state.logout(),
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.primaryDarker, AppColors.bg, AppColors.primaryDark],
          ),
        ),
        child: RefreshIndicator(
          onRefresh: () => state.loadAll(),
          color: AppColors.cyan,
          backgroundColor: AppColors.surface,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Salomlashish
              GlassCard(
                cut: 14,
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.person, color: Colors.white, size: 26),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Salom, ${state.profile?.fullName ?? "bemor"}!',
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Row(
                            children: [
                              StatusDot(
                                color: state.hasSubscription ? AppColors.emerald : AppColors.red,
                                pulse: true,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                _subLabel(state),
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Dori-darmon (sinxronlangan)
              if (state.medications.isNotEmpty) ...[
                const NeonText('DORI-DARMONLAR', size: 16),
                const SizedBox(height: 10),
                ...state.medications.map((m) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: GlassCard(
                        cut: 10,
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: AppColors.accent.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.medication, color: AppColors.cyan, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(m.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                                  if (m.dosage != null || m.frequency != null)
                                    Text(
                                      [m.dosage, m.frequency].whereType<String>().join(' · '),
                                      style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    )),
                const SizedBox(height: 16),
              ],

              // Sog'liq paneli
              const NeonText('SOG\'LIQ HOLATI', size: 16),
              const SizedBox(height: 10),
              HealthDashboard(health: state.health),
              const SizedBox(height: 16),

              // AI chatbot
              const NeonText('AI YORDAMCHI', size: 16),
              const SizedBox(height: 10),
              GestureDetector(
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChatScreen())),
                child: GlassCard(
                  cut: 12,
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          gradient: AppColors.neonGradient,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.smart_toy, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Chatbot bilan suhbat', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                            Text('Holatingizni kuzatadi, savollarga javob beradi', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: AppColors.textMuted),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // So'nggi tekshiruvlar
              const NeonText('SO\'NGGI TEKSHIRUVLAR', size: 16),
              const SizedBox(height: 10),
              if (state.checkins.isEmpty)
                const GlassCard(
                  cut: 10,
                  child: Text('Hozircha tekshiruvlar yo\'q. Premium obuna bilan har soatda AI sizni tekshiradi.', style: TextStyle(color: AppColors.textSecondary)),
                )
              else
                ...state.checkins.take(5).map((c) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: GlassCard(
                        cut: 10,
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            Icon(_checkinIcon(c.status), color: _checkinColor(c.status), size: 22),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(c.aiMessage, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13)),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${_statusLabel(c.status)} · ${c.createdAt.toString().substring(0, 16)}',
                                    style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    )),

              // Faol tekshiruvga javob
              if (state.checkins.isNotEmpty && state.checkins.first.status == 'sent') ...[
                const SizedBox(height: 12),
                GlassCard(
                  cut: 14,
                  tint: AppColors.primaryDark,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.notifications_active, color: AppColors.cyan, size: 18),
                          SizedBox(width: 8),
                          Text('OXIRGI TEKSHIRUV', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Typewriter(
                        text: state.checkins.first.aiMessage,
                        speed: const Duration(milliseconds: 25),
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.4),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: SlantButton(
                              label: 'YAXSHIMAN',
                              icon: Icons.check,
                              onPressed: () => state.answerCheckin(state.checkins.first.id, 'Yaxshiman', isBad: false),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: SlantButton(
                              label: 'YOMONMAN',
                              icon: Icons.warning,
                              outline: true,
                              onPressed: () => state.answerCheckin(state.checkins.first.id, 'Yomonman', isBad: true),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _subLabel(AppState state) {
    final sub = state.subscription;
    if (sub == null) return 'Obuna yo\'q';
    if (sub.isClinic) {
      final days = sub.expiresAt?.difference(DateTime.now()).inDays;
      return 'Klinik obuna ✓ (${days != null && days > 0 ? "$days kun qoldi" : "faol"})';
    }
    return 'Individual obuna ✓';
  }

  IconData _checkinIcon(String s) {
    switch (s) {
      case 'answered_fine': return Icons.check_circle;
      case 'answered_bad': return Icons.warning;
      case 'locked': return Icons.lock;
      default: return Icons.hourglass_bottom;
    }
  }

  Color _checkinColor(String s) {
    switch (s) {
      case 'answered_fine': return AppColors.emerald;
      case 'answered_bad': return AppColors.amber;
      case 'locked': return AppColors.red;
      default: return AppColors.textMuted;
    }
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

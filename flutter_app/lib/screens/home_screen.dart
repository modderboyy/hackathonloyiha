import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';
import '../widgets/health_dashboard.dart';
import '../widgets/typewriter.dart';
import 'chat_screen.dart';
import 'lock_screen.dart';
import 'profile_screen.dart';
import 'reminders_screen.dart';
import 'stats_screen.dart';
import 'subscription_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;

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
        backgroundColor: AppColors.bgCard,
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
            icon: const Icon(Icons.logout, color: AppColors.textSecondary),
            onPressed: () async => await state.logout(),
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.bgGradient,
        ),
        child: IndexedStack(
          index: _tab,
          children: [
            _HomeTab(),
            const StatsScreen(),
            const ChatScreen(embedded: true),
            const ProfileScreen(embedded: true),
          ],
        ),
      ),
      bottomNavigationBar: _BottomNav(current: _tab, onTap: (i) => setState(() => _tab = i)),
    );
  }
}

// =====================================================================
// Bosh sahifa (tab)
// =====================================================================
class _HomeTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return RefreshIndicator(
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

          // Klinikadan discharge vaqtida kelgan AI-safe care context.
          if (state.health?.hospitalDiagnosis != null || state.health?.treatmentSummary != null || state.health?.dischargeRecommendations != null) ...[
            const NeonText('KLINIK CARE REJASI', size: 16),
            const SizedBox(height: 10),
            _ClinicalCarePlan(health: state.health!),
            const SizedBox(height: 16),
          ],

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
                              Text(
                                [if (m.dosage != null) m.dosage!, m.scheduleLabel].join(' · '),
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
              tint: AppColors.accent.withOpacity(0.08),
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

class _ClinicalCarePlan extends StatelessWidget {
  final HealthData health;
  const _ClinicalCarePlan({required this.health});

  @override
  Widget build(BuildContext context) {
    final rows = <(IconData, String, String?)>[
      (Icons.medical_information_outlined, 'Tashxis', health.hospitalDiagnosis),
      (Icons.description_outlined, 'Davolash yakuni', health.treatmentSummary),
      (Icons.lightbulb_outline, 'Tavsiyalar', health.dischargeRecommendations),
    ].where((row) => row.$3 != null && row.$3!.trim().isNotEmpty).toList();

    return GlassCard(
      cut: 14,
      tint: AppColors.primary.withOpacity(0.035),
      child: Column(
        children: rows.map((row) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.10), borderRadius: BorderRadius.circular(10)),
                child: Icon(row.$1, color: AppColors.primary, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(row.$2, style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text(row.$3!, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, height: 1.35)),
                  ],
                ),
              ),
            ],
          ),
        )).toList(),
      ),
    );
  }
}

// =====================================================================
// Bottom navigation bar
// =====================================================================
class _BottomNav extends StatelessWidget {
  final int current;
  final ValueChanged<int> onTap;

  const _BottomNav({required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final items = [
      (icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Bosh sahifa'),
      (icon: Icons.insights_outlined, activeIcon: Icons.insights, label: 'Statistika'),
      (icon: Icons.chat_bubble_outline, activeIcon: Icons.chat_bubble, label: 'Chat'),
      (icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profil'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        border: const Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: items.asMap().entries.map((e) {
            final i = e.key;
            final item = e.value;
            final active = current == i;
            return Expanded(
              child: InkWell(
                onTap: () => onTap(i),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        active ? item.activeIcon : item.icon,
                        color: active ? AppColors.cyan : AppColors.textMuted,
                        size: 22,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.label,
                        style: TextStyle(
                          color: active ? AppColors.cyan : AppColors.textMuted,
                          fontSize: 10,
                          fontWeight: active ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';
import '../widgets/health_dashboard.dart';
import '../widgets/typewriter.dart';
import 'auth/login_screen.dart';
import 'chat_screen.dart';
import 'lock_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';
import 'reminders_screen.dart';
import 'search_screen.dart';
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

    if (!state.isLoggedIn) return const LoginScreen();
    if (state.locked) return const LockScreen();
    if (!state.hasSubscription) return const SubscriptionScreen();

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.bgGradient),
        child: SafeArea(
          child: Column(
            children: [
              _MobileTopBar(
                tab: _tab,
                state: state,
                onNotifications: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                onMore: _showMore,
              ),
              Expanded(
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
            ],
          ),
        ),
      ),
      bottomNavigationBar: _BottomNav(current: _tab, onTap: (i) => setState(() => _tab = i)),
    );
  }

  void _showMore() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => SafeArea(
        child: Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(24)),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 38, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(99))),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.alarm_outlined, color: AppColors.primary),
                title: const Text('Eslatmalar'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => const RemindersScreen()));
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout, color: AppColors.red),
                title: const Text('Hisobdan chiqish'),
                onTap: () async {
                  Navigator.pop(sheetContext);
                  await context.read<AppState>().logout();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MobileTopBar extends StatelessWidget {
  final int tab;
  final AppState state;
  final VoidCallback onNotifications;
  final VoidCallback onMore;

  const _MobileTopBar({required this.tab, required this.state, required this.onNotifications, required this.onMore});

  @override
  Widget build(BuildContext context) {
    final title = switch (tab) {
      1 => 'Haftalik tahlil',
      2 => 'CareLink AI',
      3 => 'Profil',
      _ => '',
    };
    final words = (state.profile?.fullName ?? '').trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty).toList();
    final initials = words.isEmpty ? 'B' : words.take(2).map((part) => part[0]).join().toUpperCase();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 8),
      child: Row(
        children: [
          if (tab == 0)
            Container(
              width: 42,
              height: 42,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.bgCard,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
              ),
              child: Text(initials, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
            )
          else
            const SizedBox(width: 42),
          Expanded(
            child: tab == 0
                ? const SizedBox()
                : Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 25, fontFamily: 'serif', fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          ),
          if (tab == 1)
            _TopCircleButton(icon: Icons.calendar_month_outlined, onTap: () {})
          else if (tab == 0)
            _TopCircleButton(icon: Icons.notifications_none_rounded, onTap: onNotifications, hasDot: state.unreadNotificationCount > 0)
          else
            const SizedBox(width: 42),
          const SizedBox(width: 8),
          _TopCircleButton(icon: Icons.more_horiz_rounded, onTap: onMore),
        ],
      ),
    );
  }
}

class _TopCircleButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool hasDot;
  const _TopCircleButton({required this.icon, required this.onTap, this.hasDot = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(color: AppColors.bgCard, shape: BoxShape.circle, border: Border.all(color: AppColors.border)),
            child: Icon(icon, color: AppColors.textPrimary, size: 21),
          ),
          if (hasDot)
            Positioned(right: 7, top: 7, child: Container(width: 7, height: 7, decoration: const BoxDecoration(color: AppColors.red, shape: BoxShape.circle))),
        ],
      ),
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
    final firstName = (state.profile?.fullName ?? 'Bemor').trim().split(RegExp(r'\s+')).first;
    return RefreshIndicator(
      onRefresh: () => state.loadAll(),
      color: AppColors.cyan,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Xayrli kun, $firstName',
            style: const TextStyle(color: AppColors.textPrimary, fontFamily: 'serif', fontSize: 32, fontWeight: FontWeight.w600, letterSpacing: -0.8),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              StatusDot(color: state.hasSubscription ? AppColors.emerald : AppColors.red),
              const SizedBox(width: 7),
              Text(_subLabel(state), style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 18),
          GestureDetector(
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CareSearchScreen())),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 13),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(15), border: Border.all(color: AppColors.border)),
              child: const Row(
                children: [
                  Icon(Icons.search_rounded, color: AppColors.textMuted, size: 21),
                  SizedBox(width: 10),
                  Text('Dori yoki tahlil natijasini qidiring...', style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          const _SafetyPanel(),
          const SizedBox(height: 18),

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

class _SafetyPanel extends StatelessWidget {
  const _SafetyPanel();

  Future<void> _showResult(BuildContext context, Future<dynamic> Function() action) async {
    final result = await action();
    if (!context.mounted) return;
    final ok = result?.ok == true;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(result?.message?.toString() ?? (ok ? 'Yuborildi' : 'Xatolik yuz berdi')),
      backgroundColor: ok ? AppColors.emerald : AppColors.red,
      behavior: SnackBarBehavior.floating,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final state = context.read<AppState>();
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(color: const Color(0xFFFFFAEB), borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFFEDF89))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(children: [Icon(Icons.health_and_safety_outlined, color: AppColors.amber, size: 20), SizedBox(width: 8), Text('Tezkor yordam paneli', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800)), Spacer(), Text('FAOL', style: TextStyle(color: AppColors.amber, fontSize: 10, fontWeight: FontWeight.w800))]),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _SafetyButton(label: 'SOS', icon: Icons.sos_rounded, color: AppColors.red, onTap: () => _showResult(context, state.triggerSos))),
            const SizedBox(width: 8),
            Expanded(child: _SafetyButton(label: '103', icon: Icons.phone_in_talk_rounded, color: AppColors.primary, onTap: () { state.callEmergency103(); })),
            const SizedBox(width: 8),
            Expanded(child: _SafetyButton(label: 'Yaqinlarga', icon: Icons.group_outlined, color: AppColors.emerald, onTap: () => _showResult(context, state.notifyFamily))),
          ]),
        ],
      ),
    );
  }
}

class _SafetyButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _SafetyButton({required this.label, required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withOpacity(0.22))),
      child: Column(children: [Icon(icon, color: color, size: 19), const SizedBox(height: 4), Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w800))]),
    ),
  );
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
      (icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Bosh sahifa'),
      (icon: Icons.insights_outlined, activeIcon: Icons.insights_rounded, label: 'Tahlil'),
      (icon: Icons.chat_bubble_outline_rounded, activeIcon: Icons.chat_bubble_rounded, label: 'AI chat'),
      (icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profil'),
    ];

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
        child: Container(
          height: 68,
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: AppColors.bgCard.withOpacity(0.97),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.border),
            boxShadow: const [BoxShadow(color: Color(0x14101828), blurRadius: 20, offset: Offset(0, 7))],
          ),
          child: Row(
            children: items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              final active = current == index;
              return Expanded(
                child: GestureDetector(
                  onTap: () => onTap(index),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    curve: Curves.easeOut,
                    height: double.infinity,
                    decoration: BoxDecoration(
                      color: active ? AppColors.surface : Colors.transparent,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(active ? item.activeIcon : item.icon, color: active ? AppColors.textPrimary : AppColors.textMuted, size: 21),
                        const SizedBox(height: 3),
                        Text(item.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: active ? AppColors.textPrimary : AppColors.textMuted, fontSize: 10, fontWeight: active ? FontWeight.w700 : FontWeight.w500)),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}

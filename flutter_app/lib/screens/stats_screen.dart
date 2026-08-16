import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';
import '../services/health_analyzer.dart';

/// Statistika ekrani — vizual grafiklar va ko'rsatkichlar.
class StatsScreen extends StatelessWidget {
  const StatsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final problems = HealthAnalyzer.analyze(state.health);

    final vitals = [
      (label: 'QON BOSIMI', value: state.health?.avgBpSys?.toString() ?? '—', color: AppColors.accent),
      (label: 'PULS', value: state.health?.avgHeartRate?.toString() ?? '—', color: AppColors.cyan),
      (label: 'HARORAT', value: state.health?.avgTemperature?.toString() ?? '—', color: AppColors.amber),
      (label: 'SpO₂', value: state.health?.avgSpo2?.toString() ?? '—', color: AppColors.emerald),
    ];

    return Container(
      decoration: const BoxDecoration(
        gradient: AppColors.bgGradient,
      ),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const NeonText('STATISTIKA', size: 22),
          const SizedBox(height: 6),
          const Text('Sog\'liq ko\'rsatkichlaringiz tahlili', style: TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 16),

          // Umumiy holat
          GlassCard(
            cut: 14,
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.insights, color: AppColors.cyan, size: 26),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        HealthAnalyzer.overallStatus(problems).toUpperCase(),
                        style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 2),
                      Text('${problems.length} ta e\'tibor talab qiladigan holat', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Vitallar panjasi
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.6,
            children: vitals.map((v) => StatTile(
              value: v.value,
              label: v.label,
              icon: Icons.monitor_heart,
              color: v.color,
            )).toList(),
          ),
          const SizedBox(height: 16),

          // Tekshiruvlar statistikasi
          const NeonText('TEKSHIRUVLAR', size: 16),
          const SizedBox(height: 10),
          GlassCard(
            cut: 12,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _statRow('Jami tekshiruvlar', state.checkins.length.toString(), Icons.hourglass_bottom, AppColors.accent),
                const SizedBox(height: 10),
                _statRow('Yaxshiman javoblari', state.checkins.where((c) => c.status == 'answered_fine').length.toString(), Icons.check_circle, AppColors.emerald),
                const SizedBox(height: 10),
                _statRow('Yomonman javoblari', state.checkins.where((c) => c.status == 'answered_bad').length.toString(), Icons.warning, AppColors.amber),
                const SizedBox(height: 10),
                _statRow('Bloklanishlar', state.checkins.where((c) => c.status == 'locked').length.toString(), Icons.lock, AppColors.red),
              ],
            ),
          ),
          const SizedBox(height:16),

          // Dori-darmon soni
          const NeonText('OBUNA & MA\'LUMOTLAR', size: 16),
          const SizedBox(height: 10),
          GlassCard(
            cut: 12,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _statRow('Faol obuna', state.hasSubscription ? '✓ Faol' : '✗ Yo\'q', Icons.workspace_premium, state.hasSubscription ? AppColors.emerald : AppColors.red),
                const SizedBox(height: 10),
                _statRow('Dori-darmonlar', state.medications.length.toString(), Icons.medication, AppColors.cyan),
                const SizedBox(height: 10),
                _statRow('Eslatmalar', state.reminderList.length.toString(), Icons.alarm, AppColors.amber),
              ],
            ),
          ),

          // Grafik (oxirgi 6 ta tekshiruv vaqti)
          const SizedBox(height: 16),
          const NeonText('FAOLLIK', size: 16),
          const SizedBox(height: 10),
          GlassCard(
            cut: 12,
            child: state.checkins.isEmpty
                ? const Text('Hozircha faollik yo\'q', style: TextStyle(color: AppColors.textMuted))
                : _ActivityBars(checkins: state.checkins.take(7).toList().reversed.toList()),
          ),
        ],
      ),
    );
  }

  Widget _statRow(String label, String value, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 10),
        Expanded(child: Text(label, style: const TextStyle(color: AppColors.textSecondary))),
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 15)),
      ],
    );
  }
}

/// Faollik grafigi — oxirgi tekshiruvlar balandlik sifatida
class _ActivityBars extends StatelessWidget {
  final List checkins;

  const _ActivityBars({required this.checkins});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: checkins.map((c) {
          final status = (c as dynamic).status as String;
          final color = status == 'answered_fine'
              ? AppColors.emerald
              : status == 'answered_bad'
                  ? AppColors.amber
                  : status == 'locked'
                      ? AppColors.red
                      : AppColors.accent;
          final height = status == 'locked' ? 90.0 : status == 'answered_bad' ? 60.0 : status == 'answered_fine' ? 40.0 : 25.0;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    height: height,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [color.withOpacity(0.9), color.withOpacity(0.3)],
                      ),
                      boxShadow: [BoxShadow(color: color.withOpacity(0.4), blurRadius: 8)],
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

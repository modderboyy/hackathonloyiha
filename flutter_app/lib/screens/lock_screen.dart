import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';

/// BLOKLASH ekrani — bemor javob bermasa telefon qulflanadi.
class LockScreen extends StatelessWidget {
  const LockScreen({super.key});

  Future<void> _call(String number) async {
    final uri = Uri.parse('tel:$number');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1A0A0A), AppColors.primaryDarker],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Spacer(),
                // Pulsatsiyalanuvchi qulf
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.red.withOpacity(0.6), width: 2),
                    boxShadow: [
                      BoxShadow(color: AppColors.red.withOpacity(0.5), blurRadius: 24, spreadRadius: 2),
                    ],
                  ),
                  child: const Icon(Icons.lock, color: AppColors.red, size: 40),
                ),
                const SizedBox(height: 20),
                const NeonText('QURILMA QULFLANDI', size: 22, color: Colors.white, align: TextAlign.center),
                const SizedBox(height: 8),
                const Text(
                  'Siz tekshiruv xabariga javob bermadingiz.\nIltimos holatingizni bildiring.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 32),

                // Favqulodda raqamlar
                Row(
                  children: [
                    _Emergency(
                      number: Config.emergency102,
                      label: 'POLITSIYA',
                      icon: Icons.local_police,
                      color: AppColors.accent,
                      onTap: () => _call(Config.emergency102),
                    ),
                    const SizedBox(width: 14),
                    _Emergency(
                      number: Config.emergency103,
                      label: 'TEZ YORDAM',
                      icon: Icons.medical_services,
                      color: AppColors.red,
                      onTap: () => _call(Config.emergency103),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                SlantButton(
                  label: 'YAXSHIMAN',
                  icon: Icons.check,
                  onPressed: () {
                    state.unlock();
                    if (state.checkins.isNotEmpty) {
                      state.answerCheckin(state.checkins.first.id, 'Yaxshiman', isBad: false);
                    }
                  },
                ),
                const SizedBox(height: 12),
                SlantButton(
                  label: 'YOMONMAN — TEZ YORDAM',
                  icon: Icons.warning,
                  outline: true,
                  onPressed: () => _call(Config.emergency103),
                ),
                const SizedBox(height: 12),
                Center(
                  child: TextButton(
                    onPressed: () => state.unlock(),
                    child: const Text('YOPISH', style: TextStyle(color: AppColors.textMuted)),
                  ),
                ),
                const Spacer(),
                const Text(
                  'Favqulodda vaziyatda 103 ga qo\'ng\'iroq qiling.',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Emergency extends StatelessWidget {
  final String number;
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _Emergency({
    required this.number,
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: GlassCard(
          padding: const EdgeInsets.symmetric(vertical: 22),
          cut: 14,
          tint: AppColors.surface,
          child: Column(
            children: [
              Icon(icon, color: color, size: 36),
              const SizedBox(height: 8),
              Text(
                number,
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                  color: color,
                  shadows: [Shadow(color: color.withOpacity(0.6), blurRadius: 14)],
                ),
              ),
              Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}

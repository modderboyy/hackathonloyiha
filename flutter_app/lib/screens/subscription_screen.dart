import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';
import 'clinic_code_screen.dart';
import 'home_screen.dart';

/// Obuna ekrani — obunasiz ilovani ishlatish mumkin emas.
class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.primaryDarker, AppColors.bg, AppColors.primaryDark],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 12),
                const NeonText('OBUNA TANLASH', size: 24, align: TextAlign.center),
                const SizedBox(height: 8),
                const Text(
                  'Davom etish uchun obuna faollashtiring',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 8),
                const Center(child: AccentLine(width: 60)),
                const SizedBox(height: 32),

                // --- B2C Individual ---
                GlassCard(
                  cut: 16,
                  tint: AppColors.primaryDark,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.person, color: AppColors.accent, size: 22),
                          const SizedBox(width: 10),
                          const NeonText('INDIVIDUAL', size: 18),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.accent.withOpacity(0.2),
                              border: Border.all(color: AppColors.accent.withOpacity(0.5)),
                            ),
                            child: const Text('B2C', style: TextStyle(color: AppColors.cyan, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        '\$${Config.premiumPriceUsd.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          shadows: [Shadow(color: AppColors.accent, blurRadius: 20)],
                        ),
                      ),
                      const Text('/ oy', style: TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(height: 16),
                      const _Feature('Har soatda AI tekshiruvi'),
                      const _Feature('Push bildirishnomalar va SMS'),
                      const _Feature('Dori-darmon eslatmalari'),
                      const _Feature('24/7 AI chatbot'),
                      const SizedBox(height: 20),
                      SlantButton(
                        label: 'SOTIB OLISH',
                        icon: Icons.bolt,
                        loading: state.loading,
                        onPressed: () => _showPayment(context),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // --- B2B Klinik ---
                GlassCard(
                  cut: 16,
                  tint: AppColors.bgCard,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.local_hospital, color: AppColors.emerald, size: 22),
                          const SizedBox(width: 10),
                          const NeonText('KLINIK', size: 18),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.emerald.withOpacity(0.2),
                              border: Border.all(color: AppColors.emerald.withOpacity(0.5)),
                            ),
                            child: const Text('B2B', style: TextStyle(color: AppColors.emerald, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'TEKIN',
                        style: TextStyle(
                          fontSize: 40,
                          fontWeight: FontWeight.bold,
                          color: AppColors.emerald,
                          shadows: [Shadow(color: AppColors.emerald, blurRadius: 20)],
                        ),
                      ),
                      const Text('Klinikangiz to\'laydi', style: TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(height: 16),
                      const _Feature('Statsionar davolash davomida faol'),
                      const _Feature('Dori-darmon va ma\'lumotlar avtomatik sinxron'),
                      const _Feature('Shifokor tavsiyalari to\'g\'ridan keladi'),
                      const SizedBox(height: 20),
                      SlantButton(
                        label: 'KLINIK KODNI KIRITISH',
                        icon: Icons.key,
                        outline: true,
                        onPressed: state.loading
                            ? null
                            : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ClinicCodeScreen())),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 28),
                const Text(
                  'Kodingiz yo\'qmi? Yaqin klinika yoki punktga boring — shifokor sizga statsionar kod beradi.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _showPayment(BuildContext context) async {
    final state = context.read<AppState>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bgCard,
        title: const Text('To\'lov (demo)', style: TextStyle(color: AppColors.textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Premium obuna — 1 oy', style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 8),
            Text(
              '\$${Config.premiumPriceUsd.toStringAsFixed(2)}',
              style: const TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.bold,
                color: AppColors.accent,
              ),
            ),
            const SizedBox(height: 12),
            const Text('Demo rejim: haqiqiy to\'lov olinmaydi.', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor', style: TextStyle(color: AppColors.textMuted))),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
            child: const Text('To\'lash'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      await state.buyIndividual();
      if (context.mounted) {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
      }
    }
  }
}

class _Feature extends StatelessWidget {
  final String text;
  const _Feature(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: AppColors.cyan, size: 16),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(color: AppColors.textSecondary))),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';
import 'clinic_code_screen.dart';
import 'demo_payment_screen.dart';

/// Obuna ekrani — obunasiz ilovani ishlatish mumkin emas.
class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.bgGradient,
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

                // --- B2C Individual (deep blue premium karta) ---
                ClipPath(
                  clipper: const SlantClipper(cut: 16),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: const BoxDecoration(
                      gradient: AppColors.primaryGradient,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.person, color: Colors.white, size: 22),
                            const SizedBox(width: 10),
                            const Text('INDIVIDUAL', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.15),
                                border: Border.all(color: Colors.white.withOpacity(0.4)),
                              ),
                              child: const Text('B2C', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
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
                            shadows: [Shadow(color: Colors.white24, blurRadius: 20)],
                          ),
                        ),
                        const Text('/ oy', style: TextStyle(color: Colors.white70)),
                        const SizedBox(height: 16),
                        const _Feature('Har soatda AI tekshiruvi', light: true),
                        const _Feature('Push bildirishnomalar va SMS', light: true),
                        const _Feature('Dori-darmon eslatmalari', light: true),
                        const _Feature('24/7 AI chatbot', light: true),
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
                      const _Feature('Faol klinika obunasi bilan tekin'),
                      const _Feature('Klinika obunasi holati kod kiritilganda tekshiriladi'),
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
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const DemoPaymentScreen()),
    );
  }

}

class _Feature extends StatelessWidget {
  final String text;
  final bool light;
  const _Feature(this.text, {this.light = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(Icons.check_circle, color: light ? Colors.white70 : AppColors.cyan, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(color: light ? Colors.white : AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

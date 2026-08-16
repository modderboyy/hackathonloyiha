import 'package:flutter/material.dart';
import 'package:forui/forui.dart';
import 'package:provider/provider.dart';
import '../config.dart';
import '../state/app_state.dart';
import 'clinic_code_screen.dart';
import 'home_screen.dart';

/// Obuna ekrani — obunasiz ilovani ishlatish mumkin emas.
/// B2C (individual, $5/oy) yoki B2B (klinik, tekin — klinika to'laydi).
class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return FScaffold(
      header: const FHeader(title: Text('CareLink Premium')),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 8),
            Text(
              'Davom etish uchun obuna kerak',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Ikki xil obuna mavjud — o\u2019zingizga mosini tanlang',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 28),

            // --- B2C: Individual ---
            FCard(
              title: const Text('Individual obuna', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              subtitle: const Text('Shaxsiy foydalanish uchun'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    '\$${Config.premiumPriceUsd.toStringAsFixed(0)} / oy',
                    style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
                  ),
                  const SizedBox(height: 8),
                  const _Feature('Har soatda AI tekshiruvi'),
                  const _Feature('Push bildirishnomalar va SMS'),
                  const _Feature('Dori-darmon eslatmalari'),
                  const _Feature('24/7 AI chatbot'),
                  const SizedBox(height: 16),
                  FButton(
                    onPress: state.loading ? null : () => _showPayment(context),
                    child: const Text('Sotib olish'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // --- B2B: Klinik ---
            FCard(
              title: const Text('Klinik obuna', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              subtitle: const Text('Klinikangiz to\u2019laydi — siz uchun tekin'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'TEKIN',
                    style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                  ),
                  const SizedBox(height: 8),
                  const _Feature('Statsionar davolash davomida faol'),
                  const _Feature('Dori-darmon va bemor ma\u2019lumotlari avtomatik sinxron'),
                  const _Feature('Shifokor tavsiyalari to\u2019g\u2019ridan-to\u2019g\u2019ri keladi'),
                  const SizedBox(height: 16),
                  FButton(
                    onPress: state.loading
                        ? null
                        : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ClinicCodeScreen())),
                    variant: FButtonVariant.outline,
                    child: const Text('Klinik kodni kiritish'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Text(
              'Klinik kodingiz yo\u2019qmi? Yaqin klinika yoki punktga borib, to\u2019liq tekshiruvdan o\u2019ting — shifokor sizga statsionar kod beradi.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  // Demo to'lov dialogi
  Future<void> _showPayment(BuildContext context) async {
    final state = context.read<AppState>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('To\u2019lov (demo)'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Premium obuna — 1 oy'),
            const SizedBox(height: 8),
            Text(
              '\$${Config.premiumPriceUsd.toStringAsFixed(2)}',
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
            ),
            const SizedBox(height: 12),
            const Text('Demo rejim: haqiqiy to\u2019lov olinmaydi.', style: TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor qilish')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF1E3A8A)),
            child: const Text('To\u2019lash'),
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
          const Icon(Icons.check, color: Color(0xFF10B981), size: 18),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}

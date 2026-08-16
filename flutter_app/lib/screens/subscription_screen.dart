import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config.dart';
import '../state/app_state.dart';
import 'home_screen.dart';

/// Premium obuna — oylik $5
class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Premium obuna')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF1E3A8A), Color(0xFF172554)]),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.workspace_premium, color: Colors.amber, size: 56),
                    const SizedBox(height: 12),
                    const Text('CareLink Premium', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                    const SizedBox(height: 8),
                    Text('\$${Config.premiumPriceUsd.toStringAsFixed(0)} / oy', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.amber)),
                    const SizedBox(height: 16),
                    const _Feature(text: 'Har soatda AI tekshiruvi'),
                    const _Feature(text: 'Push bildirishnomalar'),
                    const _Feature(text: 'Javob bermasangiz SMS xabar'),
                    const _Feature(text: 'Favqulodda holatda avtomatik bloklash'),
                    const _Feature(text: '24/7 AI chatbot yordami'),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              if (state.isPremium)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12)),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.green),
                      const SizedBox(width: 12),
                      Expanded(child: Text('Obuna faol. Keyingi to\'lovgacha kuzatuv davom etadi.', style: TextStyle(color: Colors.green.shade800))),
                    ],
                  ),
                )
              else
                FilledButton(
                  onPressed: state.loading
                      ? null
                      : () async {
                          await state.buyPremium();
                          if (context.mounted) {
                            Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
                          }
                        },
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    backgroundColor: const Color(0xFF1E3A8A),
                  ),
                  child: state.loading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text('Premium olish — \$${Config.premiumPriceUsd.toStringAsFixed(0)}/oy'),
                ),
              const SizedBox(height: 12),
              if (!state.isPremium)
                TextButton(
                  onPressed: () => Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen())),
                  child: const Text('Hozircha o\'tkazib yuborish'),
                ),
              const SizedBox(height: 8),
              const Text(
                'To\'lov demo rejimda (haqiqiy to\'lov gateway — Payme/Click — keyinroq ulanadi).',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Feature extends StatelessWidget {
  final String text;
  const _Feature({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          const Icon(Icons.check, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(color: Colors.white))),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';
import '../state/app_state.dart';

/// BLOKLASH ekrani — bemor javob bermasa, telefon qulflanadi.
/// 102 (politsiya), 103 (tez tibbiy yordam), Yopish, Yaxshiman, Yomonman.
class LockScreen extends StatelessWidget {
  const LockScreen({super.key});

  Future<void> _call(String number) async {
    final uri = Uri.parse('tel:$number');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              const Icon(Icons.lock, color: Colors.redAccent, size: 64),
              const SizedBox(height: 16),
              const Text(
                'Qurilma qulflandi',
                style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Siz tekshiruv xabariga javob bermadingiz. Iltimos, holatingizni bildiring.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 32),

              // Favqulodda raqamlar
              Row(
                children: [
                  _EmergencyButton(
                    number: Config.emergency102,
                    label: 'Politsiya',
                    icon: Icons.local_police,
                    color: Colors.blue,
                    onTap: () => _call(Config.emergency102),
                  ),
                  const SizedBox(width: 16),
                  _EmergencyButton(
                    number: Config.emergency103,
                    label: 'Tez yordam',
                    icon: Icons.medical_services,
                    color: Colors.red,
                    onTap: () => _call(Config.emergency103),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Holat tugmalari
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    state.unlock();
                    state.answerCheckin(state.checkins.isNotEmpty ? state.checkins.first.id : '', 'Yaxshiman', isBad: false);
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                  ),
                  child: const Text('Yaxshiman', style: TextStyle(fontSize: 18)),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => _call(Config.emergency103),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.red,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                  ),
                  child: const Text('Yomonman — tez yordam chaqirish', style: TextStyle(fontSize: 18)),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => state.unlock(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white54),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Yopish'),
                ),
              ),
              const Spacer(),
              const Text(
                'Favqulodda vaziyatda 103 ga qo\'ng\'iroq qiling.',
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmergencyButton extends StatelessWidget {
  final String number;
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _EmergencyButton({
    required this.number,
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 24),
          decoration: BoxDecoration(
            color: Colors.white10,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withOpacity(0.5)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 40),
              const SizedBox(height: 8),
              Text(number, style: TextStyle(color: color, fontSize: 28, fontWeight: FontWeight.bold)),
              Text(label, style: const TextStyle(color: Colors.white70)),
            ],
          ),
        ),
      ),
    );
  }
}

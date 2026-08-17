import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/emergency_service.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';

/// SOS yuborish, queue code va qisqa cancel oynasi.
class SosScreen extends StatefulWidget {
  const SosScreen({super.key});

  @override
  State<SosScreen> createState() => _SosScreenState();
}

class _SosScreenState extends State<SosScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;
  Timer? _timer;
  EmergencyResult? _result;
  bool _sending = true;
  bool _cancelling = false;
  int _secondsLeft = 25;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);
    WidgetsBinding.instance.addPostFrameCallback((_) => _send());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulse.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() { _sending = true; _result = null; _secondsLeft = 25; });
    final result = await context.read<AppState>().triggerSos();
    if (!mounted) return;
    setState(() { _sending = false; _result = result; });
    if (result.ok) _startCountdown();
  }

  void _startCountdown() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsLeft <= 0) { timer.cancel(); return; }
      if (mounted) setState(() => _secondsLeft -= 1);
    });
  }

  Future<void> _cancel() async {
    final alertId = _result?.alertId;
    if (alertId == null || _secondsLeft <= 0) return;
    setState(() => _cancelling = true);
    final result = await context.read<AppState>().emergency.cancelSos(alertId);
    if (!mounted) return;
    setState(() { _cancelling = false; _result = result; });
    if (result.ok) _timer?.cancel();
  }

  @override
  Widget build(BuildContext context) {
    final success = _result?.ok == true;
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFF2A0E16), Color(0xFF0B1F4A)])),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(width: 42, height: 42, decoration: BoxDecoration(color: Colors.white.withOpacity(0.12), shape: BoxShape.circle), child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18)),
                  ),
                ),
                const Spacer(),
                AnimatedBuilder(
                  animation: _pulse,
                  builder: (_, child) => Transform.scale(scale: 1 + _pulse.value * 0.08, child: child),
                  child: Container(
                    width: 128,
                    height: 128,
                    decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.red.withOpacity(0.18), border: Border.all(color: AppColors.red, width: 2), boxShadow: [BoxShadow(color: AppColors.red.withOpacity(0.55), blurRadius: 30, spreadRadius: 4)]),
                    child: const Icon(Icons.sos_rounded, color: Colors.white, size: 64),
                  ),
                ),
                const SizedBox(height: 28),
                Text(_sending ? 'SOS yuborilmoqda…' : success ? 'SOS yuborildi' : 'SOS yuborilmadi', textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontFamily: 'serif', fontSize: 32, fontWeight: FontWeight.w600)),
                const SizedBox(height: 10),
                Text(_sending ? 'Joylashuv aniqlanmoqda va klinikaga xabar yuborilmoqda.' : _result?.message ?? '', textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFFD0D5DD), fontSize: 14, height: 1.45)),
                if (success && _result?.queueCode != null) ...[
                  const SizedBox(height: 22),
                  Container(padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15), decoration: BoxDecoration(color: Colors.white.withOpacity(0.12), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.18))), child: Column(children: [const Text('QUEUE CODE', style: TextStyle(color: Color(0xFFB2C5E5), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 2)), const SizedBox(height: 5), Text(_result!.queueCode!, style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: 2))])),
                  const SizedBox(height: 14),
                  Text(_secondsLeft > 0 ? 'Bekor qilish uchun $_secondsLeft soniya qoldi' : 'SOS klinika navbatiga yuborildi', style: const TextStyle(color: Color(0xFFFFD3D0), fontSize: 12)),
                ],
                const Spacer(),
                if (!_sending && !success) ...[
                  _ActionButton(label: 'QAYTA URINISH', icon: Icons.refresh_rounded, color: Colors.white, onTap: _send),
                  const SizedBox(height: 12),
                ],
                if (success && _secondsLeft > 0 && _result?.status != 'cancelled') ...[
                  _ActionButton(label: _cancelling ? 'BEKOR QILINMOQDA…' : 'SOS NI BEKOR QILISH', icon: Icons.close_rounded, color: const Color(0xFFFFD3D0), onTap: _cancelling ? null : _cancel, outline: true),
                  const SizedBox(height: 12),
                ],
                _ActionButton(label: '103 GA QO‘NG‘IROQ', icon: Icons.phone_in_talk_rounded, color: Colors.white, onTap: () { context.read<AppState>().callEmergency103(); }),
                const SizedBox(height: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;
  final bool outline;
  const _ActionButton({required this.label, required this.icon, required this.color, required this.onTap, this.outline = false});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Opacity(
      opacity: onTap == null ? 0.5 : 1,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(color: outline ? Colors.transparent : color.withOpacity(0.18), borderRadius: BorderRadius.circular(15), border: Border.all(color: color.withOpacity(0.8))),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(icon, color: color, size: 19), const SizedBox(width: 8), Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 13))]),
      ),
    ),
  );
}

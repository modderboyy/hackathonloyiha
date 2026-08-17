import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';
import 'home_screen.dart';

/// Individual obuna uchun xavfsiz demo checkout.
/// Karta raqami serverga yuborilmaydi va haqiqiy pul yechilmaydi.
class DemoPaymentScreen extends StatefulWidget {
  const DemoPaymentScreen({super.key});

  @override
  State<DemoPaymentScreen> createState() => _DemoPaymentScreenState();
}

class _DemoPaymentScreenState extends State<DemoPaymentScreen> {
  final _number = TextEditingController(text: '8600 0000 0000 0000');
  final _holder = TextEditingController(text: 'DEMO KARTA');
  final _expiry = TextEditingController(text: '12/30');
  final _cvv = TextEditingController(text: '123');
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _number.dispose();
    _holder.dispose();
    _expiry.dispose();
    _cvv.dispose();
    super.dispose();
  }

  Future<void> _pay() async {
    final digits = _number.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 16 || _holder.text.trim().isEmpty || _expiry.text.trim().length < 5 || _cvv.text.trim().length < 3) {
      setState(() => _error = 'Demo karta ma\'lumotlarini to\'liq kiriting.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      // Hozircha demo to‘lov: real gateway ulanmaguncha faqat obuna yozuvi yaratiladi.
      await context.read<AppState>().buyIndividual();
      if (!mounted) return;
      await _success();
    } catch (_) {
      if (mounted) setState(() => _error = 'Demo to\'lovni yakunlab bo\'lmadi. Internetni tekshiring.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _success() async {
    final goHome = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        icon: const Icon(Icons.check_circle, color: AppColors.emerald, size: 52),
        title: const Text('Demo to\'lov qabul qilindi', textAlign: TextAlign.center),
        content: Text(
          '\$${Config.premiumPriceUsd.toStringAsFixed(0)} individual obuna 30 kun davomida faol. Haqiqiy mablag\' yechilmadi.',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Davom etish'),
          ),
        ],
      ),
    );
    if (goHome == true && mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Demo to\'lov'),
        backgroundColor: AppColors.bgCard,
      ),
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.bgGradient),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const NeonText('DEMO KARTA ORQALI', size: 20, align: TextAlign.center),
                const SizedBox(height: 8),
                const Text(
                  'Haqiqiy karta yechilmaydi. Bu checkout faqat oqimni sinash uchun.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 22),
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(.30), blurRadius: 26, offset: const Offset(0, 12))],
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(children: [Icon(Icons.credit_card, color: Colors.white), Spacer(), Text('CARELINK DEMO', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w700))]),
                      SizedBox(height: 28),
                      Text('8600 0000 0000 0000', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
                      SizedBox(height: 22),
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('DEMO KARTA', style: TextStyle(color: Colors.white70, fontSize: 12)), Text('12/30', style: TextStyle(color: Colors.white70, fontSize: 12))]),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                GlassCard(
                  cut: 14,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      GlassInput(label: 'KARTA RAQAMI', controller: _number, keyboardType: TextInputType.number, hint: '8600 0000 0000 0000', onChanged: (_) => setState(() => _error = null)),
                      const SizedBox(height: 14),
                      GlassInput(label: 'KARTA EGASI', controller: _holder, hint: 'DEMO KARTA'),
                      const SizedBox(height: 14),
                      Row(children: [
                        Expanded(child: GlassInput(label: 'MUDDAT', controller: _expiry, hint: '12/30')),
                        const SizedBox(width: 12),
                        Expanded(child: GlassInput(label: 'CVV', controller: _cvv, obscure: true, keyboardType: TextInputType.number, hint: '123')),
                      ]),
                      if (_error != null) ...[
                        const SizedBox(height: 14),
                        Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12)),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                GlassCard(
                  cut: 14,
                  tint: AppColors.primary.withOpacity(.05),
                  child: Row(
                    children: [
                      const Icon(Icons.receipt_long, color: AppColors.primary),
                      const SizedBox(width: 12),
                      const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Individual CareLink', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary)), Text('30 kunlik AI monitoring va reminders', style: TextStyle(fontSize: 12, color: AppColors.textSecondary))])),
                      Text('\$${Config.premiumPriceUsd.toStringAsFixed(0)}', style: const TextStyle(color: AppColors.primary, fontSize: 22, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                SlantButton(
                  label: _busy ? 'TEKSHIRILMOQDA...' : 'DEMO KARTA BILAN TO\'LASH',
                  icon: Icons.lock_outline,
                  loading: _busy,
                  onPressed: _pay,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

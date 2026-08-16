import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';
import 'home_screen.dart';

/// Klinik (B2B) obuna — faqat kod kiritish.
/// Kod klinikani avtomatik bog'laydi (klinika tanlash shart emas).
class ClinicCodeScreen extends StatefulWidget {
  const ClinicCodeScreen({super.key});

  @override
  State<ClinicCodeScreen> createState() => _ClinicCodeScreenState();
}

class _ClinicCodeScreenState extends State<ClinicCodeScreen> {
  final _code = TextEditingController();
  String? _error;
  bool _busy = false;

  Future<void> _activate() async {
    final code = _code.text.trim();
    if (code.isEmpty) {
      setState(() => _error = 'Kodni kiriting');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    String? error;
    try {
      error = await context.read<AppState>().activateClinic(code);
    } catch (e) {
      error = 'Xatolik: ${e.toString()}';
    }
    if (!mounted) return;
    setState(() => _busy = false);
    if (error != null) {
      setState(() => _error = error);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Klinik obuna faollashtirildi! Ma\u2019lumotlar sinxronlandi.'),
          backgroundColor: AppColors.emerald,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
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
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: AppColors.textSecondary),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 4),
                    const NeonText('KLINIK OBUNA', size: 20),
                  ],
                ),
                const SizedBox(height: 16),
                GlassCard(
                  cut: 14,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const NeonText('STATSIONAR KODI', size: 14),
                      const SizedBox(height: 6),
                      const Text(
                        'Bu kodni klinikangizdagi shifokor statsionardan chiqarishda beradi',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                      const SizedBox(height: 14),
                      GlassInput(
                        label: 'KOD',
                        controller: _code,
                        hint: 'Masalan: A1B2C3D4',
                        textCapitalization: TextCapitalization.characters,
                        onChanged: (_) => setState(() => _error = null),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 10),
                        Text(_error!, style: const TextStyle(color: AppColors.red)),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                SlantButton(
                  label: _busy ? 'FAOLLASHTIRILMOQDA...' : 'FAOLLASHTIRISH',
                  icon: Icons.key,
                  loading: _busy,
                  onPressed: _activate,
                ),
                const SizedBox(height: 18),
                const Text(
                  'Kod kiritilgach klinika avtomatik aniqlanadi va statsionar muddati davomida barcha tibbiy ma\u2019lumotlaringiz (dori-darmon, tavsiyalar, bemor ma\u2019lumotlari) hisobingizga sinxronlanadi.',
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
}

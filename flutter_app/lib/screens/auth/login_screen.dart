import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/custom_ui.dart';
import 'register_screen.dart';
import '../home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  void _fillPatientDemo() {
    setState(() {
      _email.text = 'mbuzb0001@gmail.com';
      _password.text = '123456';
      _obscure = false;
    });
  }

  Future<void> _submit() async {
    final state = context.read<AppState>();
    await state.login(_email.text.trim(), _password.text);
    if (!mounted) return;
    if (state.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.error!),
          backgroundColor: AppColors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
    }
  }

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
                const SizedBox(height: 40),
                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(color: AppColors.accent.withOpacity(0.5), blurRadius: 24),
                      ],
                    ),
                    child: const Icon(Icons.favorite, color: Colors.white, size: 32),
                  ),
                ),
                const SizedBox(height: 20),
                const NeonText('CareLink', size: 30, align: TextAlign.center),
                const SizedBox(height: 6),
                const Text(
                  'Tizimga kirish',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 40),
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      GlassInput(
                        label: 'EMAIL',
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        hint: 'doctor@carelink.uz',
                      ),
                      const SizedBox(height: 20),
                      GlassInput(
                        label: 'PAROL',
                        controller: _password,
                        obscure: _obscure,
                        hint: '••••••••',
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () => setState(() => _obscure = !_obscure),
                          child: Text(
                            _obscure ? 'Ko\'rsatish' : 'Yashirish',
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SlantButton(
                        label: 'KIRISH',
                        loading: state.loading,
                        icon: Icons.login,
                        onPressed: _submit,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: const Color(0xFFEFF8F5), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.emerald.withOpacity(0.22))),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('BEMOR MOBILE DEMO', style: TextStyle(color: AppColors.emerald, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
                      const SizedBox(height: 6),
                      const Text('mbuzb0001@gmail.com · 123456', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 9),
                      OutlinedButton.icon(
                        onPressed: _fillPatientDemo,
                        icon: const Icon(Icons.auto_fix_high, size: 17),
                        label: const Text('Demo ma’lumotlarini to‘ldirish'),
                        style: OutlinedButton.styleFrom(foregroundColor: AppColors.primary, side: const BorderSide(color: AppColors.primary), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const RegisterScreen()),
                    ),
                    child: const Text(
                      'Hisobingiz yo\'qmi? Ro\'yxatdan o\'ting',
                      style: TextStyle(color: AppColors.cyan),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

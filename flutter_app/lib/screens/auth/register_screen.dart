import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/custom_ui.dart';
import '../onboarding/health_setup_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();

  Future<void> _submit() async {
    final state = context.read<AppState>();
    await state.register(
      email: _email.text.trim(),
      password: _password.text,
      fullName: _fullName.text.trim(),
      phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
    );
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
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HealthSetupScreen()),
      );
    }
  }

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
                const SizedBox(height: 24),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: AppColors.textSecondary),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 4),
                    const NeonText('Ro\'yxatdan o\'tish', size: 22),
                  ],
                ),
                const SizedBox(height: 24),
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      GlassInput(label: 'TO\'LIQ ISM', controller: _fullName, hint: 'Alisher Karimov'),
                      const SizedBox(height: 18),
                      GlassInput(label: 'EMAIL', controller: _email, keyboardType: TextInputType.emailAddress, hint: 'siz@mail.uz'),
                      const SizedBox(height: 18),
                      GlassInput(label: 'PAROL (kamida 6 belgi)', controller: _password, obscure: true, hint: '••••••••'),
                      const SizedBox(height: 18),
                      GlassInput(label: 'TELEFON (SMS uchun, ixtiyoriy)', controller: _phone, keyboardType: TextInputType.phone, hint: '+998 90 000 00 00'),
                      const SizedBox(height: 24),
                      SlantButton(
                        label: 'DAVOM ETISH',
                        icon: Icons.arrow_forward,
                        loading: state.loading,
                        onPressed: _submit,
                      ),
                    ],
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

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

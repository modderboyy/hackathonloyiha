import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../state/app_state.dart';
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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.error!)));
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
      appBar: AppBar(title: const Text("Ro'yxatdan o'tish")),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _fullName,
                decoration: const InputDecoration(labelText: 'To\'liq ism *', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email *', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _password,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Parol (kamida 6 ta belgi) *', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Telefon (SMS xabar uchun, ixtiyoriy)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: state.loading ? null : _submit,
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: state.loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text("Davom etish"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

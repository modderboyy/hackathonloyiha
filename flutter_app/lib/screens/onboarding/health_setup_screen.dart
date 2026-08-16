import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models.dart';
import '../../state/app_state.dart';
import '../subscription_screen.dart';

/// Ro'yxatdan o'tgach: sog'liq ma'lumotlarini kiritish (kasallik + o'rtacha ko'rsatkichlar ixtiyoriy)
class HealthSetupScreen extends StatefulWidget {
  const HealthSetupScreen({super.key});

  @override
  State<HealthSetupScreen> createState() => _HealthSetupScreenState();
}

class _HealthSetupScreenState extends State<HealthSetupScreen> {
  final _condition = TextEditingController();
  final _notes = TextEditingController();
  final _allergies = TextEditingController();
  final _medications = TextEditingController();
  final _emergency = TextEditingController();
  final _bpSys = TextEditingController();
  final _bpDia = TextEditingController();
  final _hr = TextEditingController();
  final _temp = TextEditingController();
  final _spo2 = TextEditingController();
  final _weight = TextEditingController();

  Future<void> _save() async {
    final state = context.read<AppState>();
    final data = HealthData(
      currentCondition: _condition.text.trim().isEmpty ? null : _condition.text.trim(),
      medicalNotes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      allergies: _allergies.text.trim().isEmpty ? null : _allergies.text.trim(),
      medications: _medications.text.trim().isEmpty ? null : _medications.text.trim(),
      emergencyContact: _emergency.text.trim().isEmpty ? null : _emergency.text.trim(),
      avgBpSys: int.tryParse(_bpSys.text),
      avgBpDia: int.tryParse(_bpDia.text),
      avgHeartRate: int.tryParse(_hr.text),
      avgTemperature: double.tryParse(_temp.text),
      avgSpo2: int.tryParse(_spo2.text),
      avgWeight: double.tryParse(_weight.text),
    );
    await state.saveHealth(data);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const SubscriptionScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Sog\'liq ma\'lumotlari')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Sizning holatingiz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('AI yordamchingiz har soat sizni shu ma\'lumotlar asosida tekshirib turadi.', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 20),
              TextField(
                controller: _condition,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Hozirgi kasalligingiz (agar bor bo\'lsa)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              const Text('O\'rtacha hayotiy ko\'rsatkichlar (ixtiyoriy)', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _num(_bpSys, 'AB sist.')),
                  const SizedBox(width: 12),
                  Expanded(child: _num(_bpDia, 'AB diast.')),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _num(_hr, 'Puls')),
                  const SizedBox(width: 12),
                  Expanded(child: _num(_temp, 'Harorat °C')),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _num(_spo2, 'SpO₂ %')),
                  const SizedBox(width: 12),
                  Expanded(child: _num(_weight, 'Vazn kg')),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _allergies,
                decoration: const InputDecoration(labelText: 'Allergiyalar (ixtiyoriy)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _medications,
                decoration: const InputDecoration(labelText: 'Dori-darmonlar (ixtiyoriy)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _emergency,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Favqulodda aloqa raqami (SMS uchun)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: state.loading ? null : _save,
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: const Text('Davom etish'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _num(TextEditingController c, String label) {
    return TextField(
      controller: c,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
    );
  }
}

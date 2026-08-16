import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../state/app_state.dart';

/// Profil va sog'liq ma'lumotlarini ko'rish/tahrirlash.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _condition = TextEditingController();
  final _allergies = TextEditingController();
  final _medications = TextEditingController();
  final _emergency = TextEditingController();
  final _bpSys = TextEditingController();
  final _bpDia = TextEditingController();
  final _hr = TextEditingController();
  final _temp = TextEditingController();
  final _spo2 = TextEditingController();
  final _weight = TextEditingController();
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  void _load() {
    final h = context.read<AppState>().health;
    if (h == null || _loaded) return;
    _condition.text = h.currentCondition ?? '';
    _allergies.text = h.allergies ?? '';
    _medications.text = h.medications ?? '';
    _emergency.text = h.emergencyContact ?? '';
    _bpSys.text = h.avgBpSys?.toString() ?? '';
    _bpDia.text = h.avgBpDia?.toString() ?? '';
    _hr.text = h.avgHeartRate?.toString() ?? '';
    _temp.text = h.avgTemperature?.toString() ?? '';
    _spo2.text = h.avgSpo2?.toString() ?? '';
    _weight.text = h.avgWeight?.toString() ?? '';
    _loaded = true;
  }

  Future<void> _save() async {
    final state = context.read<AppState>();
    await state.saveHealth(HealthData(
      currentCondition: _condition.text.trim().isEmpty ? null : _condition.text.trim(),
      medicalNotes: state.health?.medicalNotes,
      allergies: _allergies.text.trim().isEmpty ? null : _allergies.text.trim(),
      medications: _medications.text.trim().isEmpty ? null : _medications.text.trim(),
      emergencyContact: _emergency.text.trim().isEmpty ? null : _emergency.text.trim(),
      avgBpSys: int.tryParse(_bpSys.text),
      avgBpDia: int.tryParse(_bpDia.text),
      avgHeartRate: int.tryParse(_hr.text),
      avgTemperature: double.tryParse(_temp.text),
      avgSpo2: int.tryParse(_spo2.text),
      avgWeight: double.tryParse(_weight.text),
    ));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saqlandi ✓')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Profil va sog\'liq')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                child: ListTile(
                  leading: const CircleAvatar(backgroundColor: Color(0xFF1E3A8A), child: Icon(Icons.person, color: Colors.white)),
                  title: Text(state.profile?.fullName ?? ''),
                  subtitle: Text(state.isPremium ? 'Premium obuna faol ✓' : 'Obuna faol emas'),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Sog\'liq ma\'lumotlari', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextField(
                controller: _condition,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Hozirgi kasallik', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              const Text('O\'rtacha hayotiy ko\'rsatkichlar (ixtiyoriy)', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: _num(_bpSys, 'AB sist.')),
                const SizedBox(width: 12),
                Expanded(child: _num(_bpDia, 'AB diast.')),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: _num(_hr, 'Puls')),
                const SizedBox(width: 12),
                Expanded(child: _num(_temp, 'Harorat °C')),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: _num(_spo2, 'SpO₂ %')),
                const SizedBox(width: 12),
                Expanded(child: _num(_weight, 'Vazn kg')),
              ]),
              const SizedBox(height: 16),
              TextField(controller: _allergies, decoration: const InputDecoration(labelText: 'Allergiyalar', border: OutlineInputBorder())),
              const SizedBox(height: 12),
              TextField(controller: _medications, decoration: const InputDecoration(labelText: 'Dori-darmonlar', border: OutlineInputBorder())),
              const SizedBox(height: 12),
              TextField(controller: _emergency, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Favqulodda aloqa raqami', border: OutlineInputBorder())),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: state.loading ? null : _save,
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: const Text('Saqlash'),
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

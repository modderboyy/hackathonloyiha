import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';

/// Profil va sog'liq ma'lumotlarini ko'rish/tahrirlash.
class ProfileScreen extends StatefulWidget {
  final bool embedded;
  const ProfileScreen({super.key, this.embedded = false});

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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Saqlandi ✓'),
          backgroundColor: AppColors.emerald,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    final body = Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primaryDarker, AppColors.bg, AppColors.primaryDark],
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Profil kartasi
              GlassCard(
                cut: 14,
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: const Icon(Icons.person, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(state.profile?.fullName ?? '', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 3),
                          Row(
                            children: [
                              StatusDot(color: state.hasSubscription ? AppColors.emerald : AppColors.red, pulse: true),
                              const SizedBox(width: 6),
                              Text(state.hasSubscription ? 'Obuna faol ✓' : 'Obuna faol emas', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              const NeonText('SOG\'LIQ MA\'LUMOTLARI', size: 16),
              const SizedBox(height: 12),
              GlassInput(label: 'HOZIRGI KASALLIK', controller: _condition, maxLines: 3, hint: 'Agar mavjud bo\'lsa...'),
              const SizedBox(height: 16),

              const NeonText('O\'RTACHA KO\'RSATKICHLAR', size: 14),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: _num(_bpSys, 'AB SIST.')),
                const SizedBox(width: 10),
                Expanded(child: _num(_bpDia, 'AB DIAST.')),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: _num(_hr, 'PULS')),
                const SizedBox(width: 10),
                Expanded(child: _num(_temp, 'HARORAT °C')),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: _num(_spo2, 'SpO₂ %')),
                const SizedBox(width: 10),
                Expanded(child: _num(_weight, 'VAZN KG')),
              ]),
              const SizedBox(height: 16),
              GlassInput(label: 'ALLERGIYALAR', controller: _allergies),
              const SizedBox(height: 12),
              GlassInput(label: 'DORI-DARMONLAR', controller: _medications),
              const SizedBox(height: 12),
              GlassInput(label: 'FAVQULODDA ALOQA', controller: _emergency, keyboardType: TextInputType.phone),
              const SizedBox(height: 24),
              SlantButton(
                label: 'SAQLASH',
                icon: Icons.save,
                loading: state.loading,
                onPressed: _save,
              ),
            ],
          ),
        ),
      ),
    );

    if (widget.embedded) return body;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.primaryDarker,
        title: const Text('Profil va sog\'liq', style: TextStyle(color: AppColors.textPrimary)),
      ),
      body: body,
    );
  }

  Widget _num(TextEditingController c, String label) {
    return GlassInput(
      label: label,
      controller: c,
      keyboardType: TextInputType.number,
    );
  }
}

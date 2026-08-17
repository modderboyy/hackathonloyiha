import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';

/// Bemor profili, faol obuna va shaxsiy health ma'lumotlari.
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

  @override
  void dispose() {
    _condition.dispose();
    _allergies.dispose();
    _medications.dispose();
    _emergency.dispose();
    _bpSys.dispose();
    _bpDia.dispose();
    _hr.dispose();
    _temp.dispose();
    _spo2.dispose();
    _weight.dispose();
    super.dispose();
  }

  void _load() {
    final health = context.read<AppState>().health;
    if (health == null || _loaded) return;
    _condition.text = health.currentCondition ?? '';
    _allergies.text = health.allergies ?? '';
    _medications.text = health.medications ?? '';
    _emergency.text = health.emergencyContact ?? '';
    _bpSys.text = health.avgBpSys?.toString() ?? '';
    _bpDia.text = health.avgBpDia?.toString() ?? '';
    _hr.text = health.avgHeartRate?.toString() ?? '';
    _temp.text = health.avgTemperature?.toString() ?? '';
    _spo2.text = health.avgSpo2?.toString() ?? '';
    _weight.text = health.avgWeight?.toString() ?? '';
    _loaded = true;
  }

  Future<void> _save() async {
    final state = context.read<AppState>();
    final previous = state.health;
    await state.saveHealth(HealthData(
      currentCondition: _value(_condition),
      medicalNotes: previous?.medicalNotes,
      allergies: _value(_allergies),
      medications: _value(_medications),
      emergencyContact: _value(_emergency),
      avgBpSys: int.tryParse(_bpSys.text),
      avgBpDia: int.tryParse(_bpDia.text),
      avgHeartRate: int.tryParse(_hr.text),
      avgTemperature: double.tryParse(_temp.text),
      avgSpo2: int.tryParse(_spo2.text),
      avgWeight: double.tryParse(_weight.text),
      hospitalDiagnosis: previous?.hospitalDiagnosis,
      treatmentSummary: previous?.treatmentSummary,
      dischargeRecommendations: previous?.dischargeRecommendations,
      clinicalUpdatedAt: previous?.clinicalUpdatedAt,
    ));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profil ma’lumotlari saqlandi'), behavior: SnackBarBehavior.floating));
  }

  String? _value(TextEditingController controller) => controller.text.trim().isEmpty ? null : controller.text.trim();

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    if (!_loaded && state.health != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    }
    final profile = state.profile;
    final subscription = state.subscription;
    final initials = _initials(profile?.fullName ?? 'Bemor');

    final content = Container(
      decoration: const BoxDecoration(gradient: AppColors.bgGradient),
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, widget.embedded ? 8 : 20, 20, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.22), blurRadius: 22, offset: const Offset(0, 9))],
              ),
              child: Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.20), shape: BoxShape.circle, border: Border.all(color: Colors.white.withOpacity(0.35))),
                    child: Text(initials, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(profile?.fullName ?? 'CareLink bemori', style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        Text(profile?.phone ?? 'Telefon kiritilmagan', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [const Icon(Icons.verified_rounded, color: Colors.white, size: 14), const SizedBox(width: 5), Text(state.hasSubscription ? 'CareLink faol' : 'Obuna kutilmoqda', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700))]),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _SubscriptionCard(subscription: subscription),
            if (state.health?.hospitalDiagnosis != null || state.health?.treatmentSummary != null || state.health?.dischargeRecommendations != null) ...[
              const SizedBox(height: 18),
              const _SectionHeader(title: 'Klinik care ma’lumotlari', icon: Icons.medical_information_outlined),
              const SizedBox(height: 10),
              GlassCard(
                cut: 16,
                child: Column(
                  children: [
                    if (state.health?.hospitalDiagnosis != null) _ClinicalLine(label: 'Tashxis', value: state.health!.hospitalDiagnosis!, icon: Icons.favorite_outline),
                    if (state.health?.treatmentSummary != null) _ClinicalLine(label: 'Davolash yakuni', value: state.health!.treatmentSummary!, icon: Icons.description_outlined),
                    if (state.health?.dischargeRecommendations != null) _ClinicalLine(label: 'Tavsiyalar', value: state.health!.dischargeRecommendations!, icon: Icons.lightbulb_outline),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 18),
            const _SectionHeader(title: 'Sog‘liq profili', icon: Icons.tune_rounded),
            const SizedBox(height: 10),
            GlassCard(
              cut: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  GlassInput(label: 'HOZIRGI KASALLIK', controller: _condition, maxLines: 3, hint: 'Agar mavjud bo‘lsa…'),
                  const SizedBox(height: 16),
                  const Text('HAYOTIY KO‘RSATKICHLAR', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 0.4)),
                  const SizedBox(height: 10),
                  Row(children: [Expanded(child: _num(_bpSys, 'AB SIST.')), const SizedBox(width: 10), Expanded(child: _num(_bpDia, 'AB DIAST.'))]),
                  const SizedBox(height: 10),
                  Row(children: [Expanded(child: _num(_hr, 'PULS')), const SizedBox(width: 10), Expanded(child: _num(_temp, 'HARORAT °C'))]),
                  const SizedBox(height: 10),
                  Row(children: [Expanded(child: _num(_spo2, 'SpO₂ %')), const SizedBox(width: 10), Expanded(child: _num(_weight, 'VAZN KG'))]),
                  const SizedBox(height: 16),
                  GlassInput(label: 'ALLERGIYALAR', controller: _allergies, hint: 'Masalan: penitsillin'),
                  const SizedBox(height: 12),
                  GlassInput(label: 'FAVQULODDA ALOQA', controller: _emergency, keyboardType: TextInputType.phone, hint: '+998 90 000 00 00'),
                ],
              ),
            ),
            const SizedBox(height: 18),
            SlantButton(label: 'O‘ZGARISHLARNI SAQLASH', icon: Icons.check_rounded, loading: state.loading, onPressed: _save),
          ],
        ),
      ),
    );

    if (widget.embedded) return content;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 8),
              child: Row(children: [GestureDetector(onTap: () => Navigator.of(context).pop(), child: Container(width: 42, height: 42, decoration: BoxDecoration(color: AppColors.bgCard, shape: BoxShape.circle, border: Border.all(color: AppColors.border)), child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18))), const Expanded(child: Text('Profil', textAlign: TextAlign.center, style: TextStyle(fontFamily: 'serif', fontSize: 25, fontWeight: FontWeight.w600, color: AppColors.textPrimary))), const SizedBox(width: 42)]),
            ),
            Expanded(child: content),
          ],
        ),
      ),
    );
  }

  String _initials(String name) {
    final words = name.trim().split(RegExp(r'\s+')).where((item) => item.isNotEmpty).toList();
    return words.isEmpty ? 'B' : words.take(2).map((item) => item[0]).join().toUpperCase();
  }

  Widget _num(TextEditingController controller, String label) => GlassInput(label: label, controller: controller, keyboardType: TextInputType.number);
}

class _SubscriptionCard extends StatelessWidget {
  final Subscription? subscription;
  const _SubscriptionCard({required this.subscription});

  @override
  Widget build(BuildContext context) {
    final active = subscription?.isActive ?? false;
    final type = subscription?.isClinic == true ? 'Klinik obuna' : 'Individual obuna';
    final expiry = subscription?.expiresAt;
    return GlassCard(
      cut: 16,
      tint: active ? const Color(0xFFECFDF3) : const Color(0xFFFEF3F2),
      child: Row(
        children: [
          Container(width: 44, height: 44, decoration: BoxDecoration(color: (active ? AppColors.emerald : AppColors.red).withOpacity(0.12), borderRadius: BorderRadius.circular(14)), child: Icon(active ? Icons.workspace_premium_outlined : Icons.lock_outline, color: active ? AppColors.emerald : AppColors.red)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(active ? type : 'Obuna faol emas', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800)), const SizedBox(height: 3), Text(active ? (expiry == null ? 'Faol muddat: cheklanmagan' : 'Faol: ${expiry.day.toString().padLeft(2, '0')}.${expiry.month.toString().padLeft(2, '0')}.${expiry.year}') : 'Faol obuna bo‘lmaganda tanlash sahifasi ochiladi.', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12))])),
          if (active) const Icon(Icons.lock_rounded, color: AppColors.emerald, size: 18),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;
  const _SectionHeader({required this.title, required this.icon});
  @override
  Widget build(BuildContext context) => Row(children: [Icon(icon, color: AppColors.primary, size: 19), const SizedBox(width: 8), Text(title, style: const TextStyle(color: AppColors.textPrimary, fontFamily: 'serif', fontSize: 20, fontWeight: FontWeight.w600))]);
}

class _ClinicalLine extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _ClinicalLine({required this.label, required this.value, required this.icon});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Container(width: 34, height: 34, decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.10), borderRadius: BorderRadius.circular(10)), child: Icon(icon, color: AppColors.primary, size: 18)), const SizedBox(width: 10), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800)), const SizedBox(height: 2), Text(value, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, height: 1.35))]))]),
  );
}

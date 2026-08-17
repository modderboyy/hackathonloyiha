import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../services/health_analyzer.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';

/// Bemor uchun dori va AI/health tahlil natijalarini qidirish sahifasi.
class CareSearchScreen extends StatefulWidget {
  const CareSearchScreen({super.key});

  @override
  State<CareSearchScreen> createState() => _CareSearchScreenState();
}

class _CareSearchScreenState extends State<CareSearchScreen> {
  final _query = TextEditingController();

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final text = _query.text.trim().toLowerCase();
    final medications = state.medications.where((medicine) {
      final haystack = '${medicine.name} ${medicine.dosage ?? ''} ${medicine.notes ?? ''} ${medicine.scheduleLabel}'.toLowerCase();
      return text.isEmpty || haystack.contains(text);
    }).toList();
    final findings = HealthAnalyzer.analyze(state.health).where((finding) {
      final haystack = '${finding.title} ${finding.description}'.toLowerCase();
      return text.isEmpty || haystack.contains(text);
    }).toList();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.bgGradient),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(width: 42, height: 42, decoration: BoxDecoration(color: AppColors.bgCard, shape: BoxShape.circle, border: Border.all(color: AppColors.border)), child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18)),
                    ),
                    const Expanded(child: Text('Qidiruv', textAlign: TextAlign.center, style: TextStyle(fontFamily: 'serif', fontSize: 25, fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
                    const SizedBox(width: 42),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: Container(
                  decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                  child: TextField(
                    controller: _query,
                    autofocus: true,
                    onChanged: (_) => setState(() {}),
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      hintText: 'Dori yoki tahlil natijasini qidiring…',
                      hintStyle: const TextStyle(color: AppColors.textMuted),
                      prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted),
                      suffixIcon: text.isEmpty ? null : IconButton(icon: const Icon(Icons.close_rounded, color: AppColors.textMuted), onPressed: () { _query.clear(); setState(() {}); }),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                  children: [
                    if (text.isEmpty) const _SearchHint(),
                    if (medications.isNotEmpty) ...[
                      _SectionTitle(title: text.isEmpty ? 'Dori-darmonlar' : 'Topilgan dorilar · ${medications.length}'),
                      const SizedBox(height: 10),
                      ...medications.map((medicine) => _MedicationResult(medicine: medicine)),
                      const SizedBox(height: 18),
                    ],
                    if (findings.isNotEmpty) ...[
                      _SectionTitle(title: text.isEmpty ? 'Tahlil natijalari' : 'Topilgan tahlillar · ${findings.length}'),
                      const SizedBox(height: 10),
                      ...findings.map((finding) => _FindingResult(finding: finding)),
                    ],
                    if (text.isNotEmpty && medications.isEmpty && findings.isEmpty) const _NoSearchResult(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});
  @override
  Widget build(BuildContext context) => Text(title, style: const TextStyle(color: AppColors.textPrimary, fontFamily: 'serif', fontSize: 21, fontWeight: FontWeight.w600));
}

class _MedicationResult extends StatelessWidget {
  final Medication medicine;
  const _MedicationResult({required this.medicine});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        cut: 14,
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(width: 42, height: 42, decoration: BoxDecoration(color: const Color(0xFFF4EBFF), borderRadius: BorderRadius.circular(13)), child: const Icon(Icons.medication_outlined, color: Color(0xFF7A5AF8))),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(medicine.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 3),
                  Text('${medicine.dosage ?? 'Doza ko‘rsatilmagan'} · ${medicine.scheduleLabel}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  if (medicine.notes != null && medicine.notes!.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(medicine.notes!, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FindingResult extends StatelessWidget {
  final HealthProblem finding;
  const _FindingResult({required this.finding});
  @override
  Widget build(BuildContext context) {
    final color = switch (finding.severity) {
      Severity.high => AppColors.red,
      Severity.medium => AppColors.amber,
      Severity.low => AppColors.primary,
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        cut: 14,
        padding: const EdgeInsets.all(14),
        tint: color.withOpacity(0.045),
        child: Row(
          children: [
            Container(width: 42, height: 42, decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(13)), child: Icon(Icons.monitor_heart_outlined, color: color)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(finding.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800)), const SizedBox(height: 3), Text(finding.description, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.35))])),
          ],
        ),
      ),
    );
  }
}

class _SearchHint extends StatelessWidget {
  const _SearchHint();
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 28, bottom: 20),
    child: Text('Dori nomi, doza, qabul vaqti yoki sog‘liq tahlilidagi belgi bo‘yicha qidiring.', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5)),
  );
}

class _NoSearchResult extends StatelessWidget {
  const _NoSearchResult();
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 72),
    child: Column(children: [Container(width: 64, height: 64, decoration: const BoxDecoration(color: Color(0xFFEFF4FF), shape: BoxShape.circle), child: const Icon(Icons.search_off_rounded, color: AppColors.primary, size: 30)), const SizedBox(height: 14), const Text('Natija topilmadi', style: TextStyle(color: AppColors.textPrimary, fontFamily: 'serif', fontSize: 22, fontWeight: FontWeight.w600)), const SizedBox(height: 5), const Text('Boshqa so‘z bilan qidirib ko‘ring.', style: TextStyle(color: AppColors.textSecondary))]),
  );
}

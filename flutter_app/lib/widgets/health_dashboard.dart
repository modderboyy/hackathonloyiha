import 'package:flutter/material.dart';
import '../models.dart';
import '../services/health_analyzer.dart';
import 'typewriter.dart';

/// Sog'liq holatining vizual paneli — muammolarni rangli ko'rsatadi.
class HealthDashboard extends StatefulWidget {
  final HealthData? health;

  const HealthDashboard({super.key, this.health});

  @override
  State<HealthDashboard> createState() => _HealthDashboardState();
}

class _HealthDashboardState extends State<HealthDashboard> {
  final _problems = <HealthProblem>[];
  bool _showSummary = false;

  @override
  void initState() {
    super.initState();
    _problems.addAll(HealthAnalyzer.analyze(widget.health));
  }

  Color _sevColor(Severity s) {
    switch (s) {
      case Severity.high: return const Color(0xFFEF4444);
      case Severity.medium: return const Color(0xFFF59E0B);
      case Severity.low: return const Color(0xFF3B82F6);
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = HealthAnalyzer.overallStatus(_problems);
    final statusColor = _problems.any((p) => p.severity == Severity.high)
        ? const Color(0xFFEF4444)
        : _problems.any((p) => p.severity == Severity.medium)
            ? const Color(0xFFF59E0B)
            : const Color(0xFF10B981);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Holat banneri
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [statusColor.withOpacity(0.15), Colors.white]),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: statusColor.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: statusColor.withOpacity(0.15), shape: BoxShape.circle),
                child: Icon(
                  _problems.isEmpty ? Icons.favorite : Icons.monitor_heart,
                  color: statusColor,
                  size: 28,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(status, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: statusColor)),
                    const SizedBox(height: 2),
                    Text(
                      _problems.isEmpty
                          ? 'Barcha ko\'rsatkichlar me\'yorida'
                          : '${_problems.length} ta e\'tibor talab qiladigan holat topildi',
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Vaziyat xulosasi (typewriter)
        if (_showSummary)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12)),
            child: Typewriter(
              text: _summaryText(),
              speed: const Duration(milliseconds: 25),
              style: const TextStyle(fontSize: 14, height: 1.5),
            ),
          ),

        const SizedBox(height: 16),

        // Muammolar ro'yxati (vizual)
        if (_problems.isEmpty)
          const Card(
            child: ListTile(
              leading: Icon(Icons.check_circle, color: Colors.green, size: 32),
              title: Text('Hammasi joyida'),
              subtitle: Text('Sog\'liq ko\'rsatkichlaringiz me\'yorida'),
            ),
          )
        else
          ..._problems.map((p) => _ProblemCard(problem: p, color: _sevColor(p.severity))),

        // Vitallar paneli
        const SizedBox(height: 16),
        const Text('Hayotiy ko\'rsatkichlar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        _VitalsGrid(health: widget.health),
      ],
    );
  }

  String _summaryText() {
    if (_problems.isEmpty) return 'Barcha ko\'rsatkichlaringiz me\'yorida. Shunday davom eting!';
    final high = _problems.where((p) => p.severity == Severity.high).length;
    final med = _problems.where((p) => p.severity == Severity.medium).length;
    var text = 'Tahlil natijasi: ';
    if (high > 0) text += '$high ta jiddiy, ';
    if (med > 0) text += '$med ta o\'rta, ';
    text += '${_problems.length} ta holat aniqlandi. Eng muhimi: ${_problems.first.title.toLowerCase()}. ';
    text += 'Iltimos tavsiyalarga amal qiling va zarur bo\'lsa shifokoringizga murojaat qiling.';
    return text;
  }
}

class _ProblemCard extends StatelessWidget {
  final HealthProblem problem;
  final Color color;

  const _ProblemCard({required this.problem, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 4,
              height: 44,
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(width: 12),
            Text(problem.icon, style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(problem.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text(problem.description, style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VitalsGrid extends StatelessWidget {
  final HealthData? health;

  const _VitalsGrid({required this.health});

  @override
  Widget build(BuildContext context) {
    final h = health;
    if (h == null) return const Card(child: ListTile(title: Text('Ko\'rsatkichlar kiritilmagan')));
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 1.7,
      children: [
        _vitalCard('Qon bosimi', h.avgBpSys != null ? '${h.avgBpSys}/${h.avgBpDia}' : '—', _bpColor(h)),
        _vitalCard('Puls', h.avgHeartRate?.toString() ?? '—', _hrColor(h)),
        _vitalCard('Harorat', h.avgTemperature != null ? '${h.avgTemperature}°C' : '—', _tempColor(h)),
        _vitalCard('SpO₂', h.avgSpo2 != null ? '${h.avgSpo2}%' : '—', _spo2Color(h)),
      ],
    );
  }

  Widget _vitalCard(String label, String value, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Color _bpColor(HealthData h) {
    final s = h.avgBpSys;
    if (s == null) return Colors.grey;
    if (s >= 180) return const Color(0xFFEF4444);
    if (s >= 140) return const Color(0xFFF59E0B);
    return const Color(0xFF10B981);
  }

  Color _hrColor(HealthData h) {
    final v = h.avgHeartRate;
    if (v == null) return Colors.grey;
    if (v > 120 || v < 55) return const Color(0xFFEF4444);
    if (v > 100) return const Color(0xFFF59E0B);
    return const Color(0xFF10B981);
  }

  Color _tempColor(HealthData h) {
    final v = h.avgTemperature;
    if (v == null) return Colors.grey;
    if (v >= 39) return const Color(0xFFEF4444);
    if (v >= 37.5) return const Color(0xFFF59E0B);
    return const Color(0xFF10B981);
  }

  Color _spo2Color(HealthData h) {
    final v = h.avgSpo2;
    if (v == null) return Colors.grey;
    if (v < 90) return const Color(0xFFEF4444);
    if (v < 95) return const Color(0xFFF59E0B);
    return const Color(0xFF10B981);
  }
}

import 'package:flutter/material.dart';
import '../models.dart';
import '../services/health_analyzer.dart';
import '../theme/app_theme.dart';
import 'custom_ui.dart';
import 'typewriter.dart';

/// Sog'liq holatining vizual paneli — muammolarni rangli ko'rsatadi (dark).
class HealthDashboard extends StatefulWidget {
  final HealthData? health;

  const HealthDashboard({super.key, this.health});

  @override
  State<HealthDashboard> createState() => _HealthDashboardState();
}

class _HealthDashboardState extends State<HealthDashboard> {
  late List<HealthProblem> _problems;
  bool _showSummary = false;

  @override
  void initState() {
    super.initState();
    _problems = HealthAnalyzer.analyze(widget.health);
    if (_problems.isNotEmpty) {
      Future.delayed(const Duration(milliseconds: 400), () {
        if (mounted) setState(() => _showSummary = true);
      });
    }
  }

  Color _sevColor(Severity s) {
    switch (s) {
      case Severity.high: return AppColors.red;
      case Severity.medium: return AppColors.amber;
      case Severity.low: return AppColors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = HealthAnalyzer.overallStatus(_problems);
    final statusColor = _problems.any((p) => p.severity == Severity.high)
        ? AppColors.red
        : _problems.any((p) => p.severity == Severity.medium)
            ? AppColors.amber
            : AppColors.emerald;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Holat banneri
        GlassCard(
          cut: 14,
          tint: statusColor.withOpacity(0.12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: statusColor.withOpacity(0.5), blurRadius: 12),
                  ],
                ),
                child: Icon(
                  _problems.isEmpty ? Icons.favorite : Icons.monitor_heart,
                  color: statusColor,
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      status.toUpperCase(),
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: statusColor, letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _problems.isEmpty
                          ? 'Barcha ko\'rsatkichlar me\'yorida'
                          : '${_problems.length} ta holat topildi',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Vaziyat xulosasi (typewriter)
        if (_showSummary)
          GlassCard(
            cut: 10,
            padding: const EdgeInsets.all(14),
            child: Typewriter(
              text: _summaryText(),
              speed: const Duration(milliseconds: 22),
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
            ),
          ),

        // Muammolar
        if (_problems.isNotEmpty) ...[
          const SizedBox(height: 14),
          ..._problems.map((p) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _ProblemCard(problem: p, color: _sevColor(p.severity)),
              )),
        ],

        // Vitallar paneli
        const SizedBox(height: 12),
        const NeonText('HAYOTIY KO\'RSATKICHLAR', size: 14),
        const SizedBox(height: 10),
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
    text += 'Tavsiyalarga amal qiling va zarur bo\'lsa shifokoringizga murojaat qiling.';
    return text;
  }
}

class _ProblemCard extends StatelessWidget {
  final HealthProblem problem;
  final Color color;

  const _ProblemCard({required this.problem, required this.color});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      cut: 10,
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 4,
            height: 44,
            decoration: BoxDecoration(
              color: color,
              boxShadow: [BoxShadow(color: color.withOpacity(0.6), blurRadius: 8)],
            ),
          ),
          const SizedBox(width: 12),
          Text(problem.icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(problem.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(problem.description, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
        ],
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
    if (h == null) {
      return const GlassCard(
        cut: 10,
        child: Text('Ko\'rsatkichlar kiritilmagan', style: TextStyle(color: AppColors.textMuted)),
      );
    }
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 1.9,
      children: [
        _vitalCard('QON BOSIMI', h.avgBpSys != null ? '${h.avgBpSys}/${h.avgBpDia}' : '—', _bpColor(h)),
        _vitalCard('PULS', h.avgHeartRate?.toString() ?? '—', _hrColor(h)),
        _vitalCard('HARORAT', h.avgTemperature != null ? '${h.avgTemperature}°C' : '—', _tempColor(h)),
        _vitalCard('SpO₂', h.avgSpo2 != null ? '${h.avgSpo2}%' : '—', _spo2Color(h)),
      ],
    );
  }

  Widget _vitalCard(String label, String value, Color color) {
    return GlassCard(
      cut: 8,
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted, letterSpacing: 0.8)),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
              shadows: [Shadow(color: color.withOpacity(0.5), blurRadius: 8)],
            ),
          ),
        ],
      ),
    );
  }

  Color _bpColor(HealthData h) {
    final s = h.avgBpSys;
    if (s == null) return AppColors.textMuted;
    if (s >= 180) return AppColors.red;
    if (s >= 140) return AppColors.amber;
    return AppColors.emerald;
  }

  Color _hrColor(HealthData h) {
    final v = h.avgHeartRate;
    if (v == null) return AppColors.textMuted;
    if (v > 120 || v < 55) return AppColors.red;
    if (v > 100) return AppColors.amber;
    return AppColors.emerald;
  }

  Color _tempColor(HealthData h) {
    final v = h.avgTemperature;
    if (v == null) return AppColors.textMuted;
    if (v >= 39) return AppColors.red;
    if (v >= 37.5) return AppColors.amber;
    return AppColors.emerald;
  }

  Color _spo2Color(HealthData h) {
    final v = h.avgSpo2;
    if (v == null) return AppColors.textMuted;
    if (v < 90) return AppColors.red;
    if (v < 95) return AppColors.amber;
    return AppColors.emerald;
  }
}

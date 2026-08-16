import '../models.dart';

/// Sog'liq ma'lumotlarini tahlil qilib, vizual muammolar (xavflar) ro'yxatini chiqaradi.
class HealthAnalyzer {
  static List<HealthProblem> analyze(HealthData? health) {
    if (health == null) return [];
    final problems = <HealthProblem>[];

    // Qon bosimi
    final sys = health.avgBpSys;
    final dia = health.avgBpDia;
    if (sys != null) {
      if (sys >= 180) {
        problems.add(HealthProblem(title: 'Gipertonik kriz', description: 'Sistolik bosim juda yuqori: $sys. Darhol shifokorga murojaat qiling.', severity: Severity.high, icon: '🚨'));
      } else if (sys >= 140 || (dia != null && dia >= 90)) {
        problems.add(HealthProblem(title: 'Yuqori qon bosimi', description: 'AB $sys/${dia ?? "—"} — me\'yordan yuqori. Tuzni kamaytiring, dorilarni nazorat qiling.', severity: Severity.medium, icon: '💓'));
      } else if (sys < 90) {
        problems.add(HealthProblem(title: 'Past qon bosimi', description: 'Sistolik bosim $sys — me\'yordan past. Bosh aylanishi mumkin.', severity: Severity.medium, icon: '⚠️'));
      }
    }

    // Puls
    final hr = health.avgHeartRate;
    if (hr != null) {
      if (hr > 120) {
        problems.add(HealthProblem(title: 'Taxikardiya', description: 'Puls juda tez: $hr. Yurak tekshiruvi tavsiya etiladi.', severity: Severity.high, icon: '💗'));
      } else if (hr > 100) {
        problems.add(HealthProblem(title: 'Tez puls', description: 'Puls $hr — me\'yordan tez.', severity: Severity.medium, icon: '💗'));
      } else if (hr < 55) {
        problems.add(HealthProblem(title: 'Sekin puls', description: 'Puls $hr — bradikardiya belgisi bo\'lishi mumkin.', severity: Severity.low, icon: '💙'));
      }
    }

    // SpO2
    final spo2 = health.avgSpo2;
    if (spo2 != null) {
      if (spo2 < 90) {
        problems.add(HealthProblem(title: 'Kislorod yetishmovchiligi', description: 'SpO₂ $spo2% — juda past! Tez tibbiy yordam kerak.', severity: Severity.high, icon: '🫁'));
      } else if (spo2 < 95) {
        problems.add(HealthProblem(title: 'Past kislorod', description: 'SpO₂ $spo2% — me\'yordan past. Nafas olishni kuzating.', severity: Severity.medium, icon: '🫁'));
      }
    }

    // Harorat
    final temp = health.avgTemperature;
    if (temp != null) {
      if (temp >= 39) {
        problems.add(HealthProblem(title: 'Yuqori isitma', description: 'Harorat $temp°C — juda yuqori. Shifokorga murojaat qiling.', severity: Severity.high, icon: '🌡️'));
      } else if (temp >= 37.5) {
        problems.add(HealthProblem(title: 'Isitma', description: 'Harorat $temp°C — ko\'tarilgan. Suyuqlik ko\'proq iching.', severity: Severity.medium, icon: '🌡️'));
      } else if (temp < 35.5) {
        problems.add(HealthProblem(title: 'Past harorat', description: 'Harorat $temp°C — me\'yordan past.', severity: Severity.low, icon: '🥶'));
      }
    }

    // Kasallik borligi
    if (health.currentCondition != null && health.currentCondition!.isNotEmpty) {
      problems.add(HealthProblem(title: 'Faol kasallik', description: health.currentCondition!, severity: Severity.medium, icon: '📋'));
    }

    // Severity bo'yicha saralash: high → medium → low
    problems.sort((a, b) => _sev(b.severity) - _sev(a.severity));
    return problems;
  }

  static int _sev(Severity s) => s == Severity.high ? 3 : s == Severity.medium ? 2 : 1;

  /// Umumiy holat bahosi
  static String overallStatus(List<HealthProblem> problems) {
    if (problems.any((p) => p.severity == Severity.high)) return 'Xavfli holat';
    if (problems.any((p) => p.severity == Severity.medium)) return 'E\'tibor kerak';
    if (problems.isEmpty) return 'Barqaror holat';
    return 'Yaxshi holat';
  }
}

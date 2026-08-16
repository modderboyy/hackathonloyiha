/// CareLink — ma'lumot modellari

class UserProfile {
  final String id;
  final String fullName;
  final String role;
  final String? phone;
  final String? regionId;
  final String? districtId;
  final String? neighborhoodId;

  UserProfile({
    required this.id,
    required this.fullName,
    required this.role,
    this.phone,
    this.regionId,
    this.districtId,
    this.neighborhoodId,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        id: json['id'],
        fullName: json['full_name'] ?? '',
        role: json['role'] ?? 'client',
        phone: json['phone'],
        regionId: json['region_id'],
        districtId: json['district_id'],
        neighborhoodId: json['neighborhood_id'],
      );
}

class Subscription {
  final String id;
  final String plan;
  final double priceUsd;
  final String status;
  final String type; // 'individual' | 'clinic'
  final String? clinicId;
  final String? hospitalizationId;
  final String? clinicCode;
  final DateTime? startedAt;
  final DateTime? expiresAt;

  Subscription({
    required this.id,
    required this.plan,
    required this.priceUsd,
    required this.status,
    this.type = 'individual',
    this.clinicId,
    this.hospitalizationId,
    this.clinicCode,
    this.startedAt,
    this.expiresAt,
  });

  bool get isActive => status == 'active' && (expiresAt == null || expiresAt!.isAfter(DateTime.now()));
  bool get isClinic => type == 'clinic';
  bool get isIndividual => type == 'individual';

  factory Subscription.fromJson(Map<String, dynamic> json) => Subscription(
        id: json['id'],
        plan: json['plan'] ?? 'premium',
        priceUsd: (json['price_usd'] as num?)?.toDouble() ?? 5.0,
        status: json['status'] ?? 'active',
        type: json['type'] ?? 'individual',
        clinicId: json['clinic_id'],
        hospitalizationId: json['hospitalization_id'],
        clinicCode: json['clinic_code'],
        startedAt: json['started_at'] != null ? DateTime.parse(json['started_at']) : null,
        expiresAt: json['expires_at'] != null ? DateTime.parse(json['expires_at']) : null,
      );
}

// --- Dori-darmon ---
class Medication {
  final String id;
  final String name;
  final String? dosage;
  final String? frequency;
  final String? notes;

  Medication({
    required this.id,
    required this.name,
    this.dosage,
    this.frequency,
    this.notes,
  });

  factory Medication.fromJson(Map<String, dynamic> json) => Medication(
        id: json['id'],
        name: json['name'] ?? '',
        dosage: json['dosage'],
        frequency: json['frequency'],
        notes: json['notes'],
      );
}

// --- Klinika ---
class Clinic {
  final String id;
  final String name;
  final String type;

  Clinic({required this.id, required this.name, required this.type});

  factory Clinic.fromJson(Map<String, dynamic> json) => Clinic(
        id: json['id'],
        name: json['name'] ?? '',
        type: json['type'] ?? 'other',
      );
}

class HealthData {
  final String? currentCondition;
  final String? medicalNotes;
  final String? allergies;
  final String? medications;
  final int? avgBpSys;
  final int? avgBpDia;
  final int? avgHeartRate;
  final double? avgTemperature;
  final int? avgSpo2;
  final double? avgWeight;
  final String? emergencyContact;

  HealthData({
    this.currentCondition,
    this.medicalNotes,
    this.allergies,
    this.medications,
    this.avgBpSys,
    this.avgBpDia,
    this.avgHeartRate,
    this.avgTemperature,
    this.avgSpo2,
    this.avgWeight,
    this.emergencyContact,
  });

  Map<String, dynamic> toJson() => {
        'current_condition': currentCondition,
        'medical_notes': medicalNotes,
        'allergies': allergies,
        'medications': medications,
        'avg_bp_sys': avgBpSys,
        'avg_bp_dia': avgBpDia,
        'avg_heart_rate': avgHeartRate,
        'avg_temperature': avgTemperature,
        'avg_spo2': avgSpo2,
        'avg_weight': avgWeight,
        'emergency_contact': emergencyContact,
      };

  factory HealthData.fromJson(Map<String, dynamic> json) => HealthData(
        currentCondition: json['current_condition'],
        medicalNotes: json['medical_notes'],
        allergies: json['allergies'],
        medications: json['medications'],
        avgBpSys: json['avg_bp_sys'],
        avgBpDia: json['avg_bp_dia'],
        avgHeartRate: json['avg_heart_rate'],
        avgTemperature: (json['avg_temperature'] as num?)?.toDouble(),
        avgSpo2: json['avg_spo2'],
        avgWeight: (json['avg_weight'] as num?)?.toDouble(),
        emergencyContact: json['emergency_contact'],
      );
}

class Checkin {
  final String id;
  final String aiMessage;
  final String status;
  final int escalation;
  final DateTime createdAt;

  Checkin({
    required this.id,
    required this.aiMessage,
    required this.status,
    required this.escalation,
    required this.createdAt,
  });

  factory Checkin.fromJson(Map<String, dynamic> json) => Checkin(
        id: json['id'],
        aiMessage: json['ai_message'] ?? '',
        status: json['status'] ?? 'sent',
        escalation: json['escalation'] ?? 0,
        createdAt: DateTime.parse(json['created_at']),
      );
}

class ChatMessage {
  final String role; // 'user' yoki 'assistant'
  final String content;

  ChatMessage({required this.role, required this.content});
}

// --- Eslatmalar ---
enum ReminderType { medication, appointment, measurement, other }

class Reminder {
  final String id;
  final ReminderType type;
  final String title;
  final String? notes;
  final String? timeOfDay; // '08:00'
  final int? intervalMinutes; // har N daqiqada
  final DateTime? remindOnceAt;
  final bool active;
  final DateTime? lastSentAt;

  Reminder({
    required this.id,
    required this.type,
    required this.title,
    this.notes,
    this.timeOfDay,
    this.intervalMinutes,
    this.remindOnceAt,
    this.active = true,
    this.lastSentAt,
  });

  factory Reminder.fromJson(Map<String, dynamic> json) => Reminder(
        id: json['id'],
        type: ReminderType.values.firstWhere(
          (t) => t.name == json['type'],
          orElse: () => ReminderType.other,
        ),
        title: json['title'] ?? '',
        notes: json['notes'],
        timeOfDay: json['time_of_day'],
        intervalMinutes: json['interval_minutes'],
        remindOnceAt: json['remind_once_at'] != null ? DateTime.parse(json['remind_once_at']) : null,
        active: json['active'] ?? true,
        lastSentAt: json['last_sent_at'] != null ? DateTime.parse(json['last_sent_at']) : null,
      );

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'title': title,
        'notes': notes,
        'time_of_day': timeOfDay,
        'interval_minutes': intervalMinutes,
        'remind_once_at': remindOnceAt?.toIso8601String(),
        'active': active,
      };

  String get typeLabel {
    switch (type) {
      case ReminderType.medication: return 'Dori-darmon';
      case ReminderType.appointment: return 'Qabul';
      case ReminderType.measurement: return 'O\'lchov';
      case ReminderType.other: return 'Boshqa';
    }
  }

  String get scheduleLabel {
    if (intervalMinutes != null) return 'Har $intervalMinutes daqiqada';
    if (timeOfDay != null) return 'Har kuni $timeOfDay';
    if (remindOnceAt != null) return 'Bir marta: ${remindOnceAt.toString().substring(0, 16)}';
    return 'Belgilanmagan';
  }
}

// --- Sog'liq muammolari (vizual tahlil) ---
enum Severity { low, medium, high }

class HealthProblem {
  final String title;
  final String description;
  final Severity severity;
  final String icon;

  HealthProblem({
    required this.title,
    required this.description,
    required this.severity,
    required this.icon,
  });
}

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
        role: json['role'] ?? 'patient',
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
  final String frequencyType; // daily | hourly | as_needed
  final int? timesPerDay;
  final int? intervalHours;
  final int? durationDays;
  final DateTime? startDate;
  final List<String> times;

  Medication({
    required this.id,
    required this.name,
    this.dosage,
    this.frequency,
    this.notes,
    this.frequencyType = 'daily',
    this.timesPerDay,
    this.intervalHours,
    this.durationDays,
    this.startDate,
    this.times = const [],
  });

  factory Medication.fromJson(Map<String, dynamic> json) => Medication(
        id: json['id'],
        name: json['name'] ?? '',
        dosage: json['dosage'],
        frequency: json['frequency'],
        notes: json['notes'],
        frequencyType: json['frequency_type'] ?? 'daily',
        timesPerDay: json['times_per_day'],
        intervalHours: json['interval_hours'],
        durationDays: json['duration_days'],
        startDate: json['start_date'] != null ? DateTime.tryParse(json['start_date']) : null,
        times: (json['times'] as List?)?.map((item) => item.toString()).toList() ?? const [],
      );

  String get scheduleLabel {
    if (frequencyType == 'hourly') return 'Har ${intervalHours ?? 1} soatda · ${durationDays ?? '—'} kun';
    if (frequencyType == 'as_needed') return 'Zaruratga ko\'ra';
    final schedule = times.isNotEmpty ? times.join(' · ') : 'Kuniga ${timesPerDay ?? 1} mahal';
    return '$schedule · ${durationDays ?? '—'} kun';
  }
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
  // Klinikadan discharge vaqtida sinxronlanadigan AI konteksti.
  final String? hospitalDiagnosis;
  final String? treatmentSummary;
  final String? dischargeRecommendations;
  final DateTime? clinicalUpdatedAt;

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
    this.hospitalDiagnosis,
    this.treatmentSummary,
    this.dischargeRecommendations,
    this.clinicalUpdatedAt,
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
        // Klinik kontekstini bemor profilidan saqlashda tasodifan null qilib yubormaymiz.
        if (hospitalDiagnosis != null) 'hospital_diagnosis': hospitalDiagnosis,
        if (treatmentSummary != null) 'treatment_summary': treatmentSummary,
        if (dischargeRecommendations != null) 'discharge_recommendations': dischargeRecommendations,
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
        hospitalDiagnosis: json['hospital_diagnosis'],
        treatmentSummary: json['treatment_summary'],
        dischargeRecommendations: json['discharge_recommendations'],
        clinicalUpdatedAt: json['clinical_updated_at'] != null ? DateTime.tryParse(json['clinical_updated_at']) : null,
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
  final String? id;
  final String role; // 'user' yoki 'assistant'
  final String content;
  final DateTime createdAt;

  ChatMessage({
    this.id,
    required this.role,
    required this.content,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'],
        role: json['role'] ?? 'user',
        content: json['content'] ?? '',
        createdAt: json['created_at'] != null
            ? DateTime.parse(json['created_at'])
            : DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'role': role,
        'content': content,
        'created_at': createdAt.toIso8601String(),
      };
}

// --- Oila a'zosi ---
class FamilyMember {
  final String id;
  final String name;
  final String phone;
  final String? relationship;
  final int priority;
  final bool isActive;

  FamilyMember({
    required this.id,
    required this.name,
    required this.phone,
    this.relationship,
    this.priority = 1,
    this.isActive = true,
  });

  factory FamilyMember.fromJson(Map<String, dynamic> json) => FamilyMember(
        id: json['id'],
        name: json['name'] ?? '',
        phone: json['phone'] ?? '',
        relationship: json['relationship'],
        priority: json['priority'] ?? 1,
        isActive: json['is_active'] ?? true,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'relationship': relationship,
        'priority': priority,
        'is_active': isActive,
      };
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
  final String? medicationId;
  final String source; // manual | medication
  final DateTime? endsAt;

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
    this.medicationId,
    this.source = 'manual',
    this.endsAt,
  });

  bool get isMedicationSync => source == 'medication' || medicationId != null;

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
        medicationId: json['medication_id'],
        source: json['source'] ?? 'manual',
        endsAt: json['ends_at'] != null ? DateTime.tryParse(json['ends_at']) : null,
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
    final ending = endsAt != null ? ' · ${endsAt!.toString().substring(0, 10)} gacha' : '';
    if (intervalMinutes != null) return 'Har $intervalMinutes daqiqada$ending';
    if (timeOfDay != null) return 'Har kuni $timeOfDay$ending';
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

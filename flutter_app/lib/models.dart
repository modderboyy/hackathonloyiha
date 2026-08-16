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
  final DateTime? startedAt;
  final DateTime? expiresAt;

  Subscription({
    required this.id,
    required this.plan,
    required this.priceUsd,
    required this.status,
    this.startedAt,
    this.expiresAt,
  });

  bool get isActive => status == 'active' && (expiresAt == null || expiresAt!.isAfter(DateTime.now()));

  factory Subscription.fromJson(Map<String, dynamic> json) => Subscription(
        id: json['id'],
        plan: json['plan'] ?? 'premium',
        priceUsd: (json['price_usd'] as num?)?.toDouble() ?? 5.0,
        status: json['status'] ?? 'active',
        startedAt: json['started_at'] != null ? DateTime.parse(json['started_at']) : null,
        expiresAt: json['expires_at'] != null ? DateTime.parse(json['expires_at']) : null,
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

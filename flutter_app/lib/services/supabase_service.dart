import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models.dart';

/// Supabase bilan bog'langan yagona xizmat qatlami.
class SupabaseService {
  final SupabaseClient client = Supabase.instance.client;

  // ---------- Auth ----------
  Future<AuthResponse> register({
    required String email,
    required String password,
    required String fullName,
    String? phone,
    String? regionId,
    String? districtId,
    String? neighborhoodId,
  }) async {
    return client.auth.signUp(
      email: email,
      password: password,
      data: {
        'full_name': fullName,
        'phone': phone,
        'region_id': regionId,
        'district_id': districtId,
        'neighborhood_id': neighborhoodId,
        'role': 'patient',
      },
    );
  }

  Future<AuthResponse> login(String email, String password) async {
    return client.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> logout() => client.auth.signOut();

  String? get userId => client.auth.currentUser?.id;

  /// Bemor mobil ilovasi uchun rolni tekshirish.
  /// Asosiy rol auth trigger orqali yoziladi; bu metod eski loyihalardagi profilni moslaydi.
  Future<void> ensureClientRole() async {
    final id = userId;
    if (id == null) return;
    await client.from('profiles').upsert({'id': id, 'role': 'patient'});
  }

  // ---------- Profil ----------
  Future<UserProfile?> getProfile() async {
    final id = userId;
    if (id == null) return null;
    final res = await client.from('profiles').select().eq('id', id).single();
    return UserProfile.fromJson(res);
  }

  // ---------- Sog'liq ----------
  Future<HealthData?> getHealth() async {
    final id = userId;
    if (id == null) return null;
    final res = await client.from('client_health').select().eq('client_id', id).maybeSingle();
    if (res == null) return null;
    return HealthData.fromJson(res);
  }

  Future<void> saveHealth(HealthData data) async {
    final id = userId;
    if (id == null) return;
    await client.from('client_health').upsert({
      'client_id': id,
      ...data.toJson(),
    });
  }

  // ---------- Obuna ----------
  /// Faqat status=active va muddati tugamagan obuna qaytadi.
  /// Shuning uchun eski/expired yozuvlar SubscriptionScreen'ni ochmaydi.
  Future<Subscription?> getSubscription() async {
    final id = userId;
    if (id == null) return null;
    final rows = await client
        .from('subscriptions')
        .select()
        .eq('client_id', id)
        .eq('status', 'active')
        .order('created_at', ascending: false);
    for (final row in rows as List) {
      final subscription = Subscription.fromJson(row as Map<String, dynamic>);
      if (subscription.isActive) return subscription;
    }
    return null;
  }

  /// Premium obuna faqat demo checkout RPC orqali faollashadi.
  /// Backend faol obuna mavjud bo'lsa yangi row yaratishni rad etadi.
  Future<void> subscribeIndividual() async {
    final result = await client.rpc('activate_individual_demo_subscription');
    final data = (result as Map?) ?? {};
    if (data['ok'] != true) {
      throw Exception(data['error']?.toString() ?? 'Obunani faollashtirib bo\'lmadi');
    }
  }

  // ---------- Klinik (B2B) ----------
  Future<List<Clinic>> getClinics() async {
    final res = await client
        .from('facilities')
        .select()
        .eq('type', 'hospital')
        .order('name');
    return (res as List).map((e) => Clinic.fromJson(e)).toList();
  }

  /// Klinik kodni faollashtirish (kod = statsionar kodi)
  Future<String?> activateClinicCode(String code) async {
    try {
      final res = await client.rpc('activate_clinic_code', params: {'p_code': code});
      final data = (res as Map?) ?? {};
      if (data['ok'] == true) return null;
      return data['error']?.toString() ?? 'Kodni faollashtirishda xatolik';
    } catch (e) {
      return 'Xatolik: ${e.toString()}';
    }
  }

  // ---------- Dori-darmon (bemordan sinxron) ----------
  Future<List<Medication>> getMedications() async {
    final id = userId;
    if (id == null) return [];
    // avval mijozning bemor yozuvini olish
    final prof = await client.from('profiles').select('patient_id').eq('id', id).maybeSingle();
    final patientId = prof?['patient_id'];
    if (patientId == null) return [];
    final res = await client.from('medications').select().eq('patient_id', patientId).order('created_at');
    return (res as List).map((e) => Medication.fromJson(e)).toList();
  }

  /// Mijoz bemor yozuviga bog'langanmi (klinik sinxron uchun)
  Future<String?> getLinkedPatientId() async {
    final id = userId;
    if (id == null) return null;
    final prof = await client.from('profiles').select('patient_id').eq('id', id).maybeSingle();
    return prof?['patient_id']?.toString();
  }

  // ---------- Tekshiruvlar (check-ins) ----------
  Future<List<Checkin>> getCheckins() async {
    final id = userId;
    if (id == null) return [];
    final res = await client
        .from('checkins')
        .select()
        .eq('client_id', id)
        .order('created_at', ascending: false)
        .limit(20);
    return (res as List).map((e) => Checkin.fromJson(e)).toList();
  }

  Future<Checkin?> getLatestLockedCheckin() async {
    final id = userId;
    if (id == null) return null;
    final res = await client
        .from('checkins')
        .select()
        .eq('client_id', id)
        .eq('status', 'locked')
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle();
    if (res == null) return null;
    return Checkin.fromJson(res);
  }

  /// Mijoz javob berdi (yaxshiman / yomonman)
  Future<void> answerCheckin(String checkinId, String response, bool isBad) async {
    await client.from('checkins').update({
      'status': isBad ? 'answered_bad' : 'answered_fine',
      'response': response,
      'responded_at': DateTime.now().toIso8601String(),
      'escalation': 0,
    }).eq('id', checkinId);
  }

  // ---------- Beta AI monitoring sozlamalari ----------
  Future<MonitoringSettings> getMonitoringSettings() async {
    final id = userId;
    if (id == null) return const MonitoringSettings();
    try {
      final row = await client
          .from('patient_monitoring_settings')
          .select()
          .eq('client_id', id)
          .maybeSingle();
      return row == null ? const MonitoringSettings() : MonitoringSettings.fromJson(row);
    } catch (_) {
      // Migration hali ishga tushmagan eski ilova loginini buzmasin.
      return const MonitoringSettings();
    }
  }

  Future<void> saveMonitoringSettings({required bool enabled, required int intervalMinutes}) async {
    final id = userId;
    if (id == null) return;
    await client.from('patient_monitoring_settings').upsert({
      'client_id': id,
      'enabled': enabled,
      'interval_minutes': intervalMinutes.clamp(1, 1440).toInt(),
      'updated_at': DateTime.now().toIso8601String(),
    });
  }

  Future<String?> sendTestPush() async {
    try {
      // Supabase Function URL hozir hourly_check (underscore) nomida deploy qilingan.
      final response = await client.functions.invoke('hourly_check', body: {'action': 'test_push'});
      final data = (response.data as Map?) ?? {};
      if (data['ok'] == true) return null;
      return data['error']?.toString() ?? 'Test push yuborilmadi';
    } catch (e) {
      // FunctionsHttpException details ichidagi Edge Function JSON xatosini
      // foydalanuvchiga aniq ko'rsatamiz.
      final dynamic exception = e;
      final details = exception.details;
      Map? payload;
      if (details is Map) {
        payload = details;
      } else if (details is String) {
        try { payload = jsonDecode(details) as Map; } catch (_) {}
      }
      final error = payload?['error']?.toString();
      final detail = payload?['detail']?.toString();
      if (error != null) return detail == null || detail.isEmpty ? error : '$error: $detail';
      return 'Test push xatosi: ${e.toString()}';
    }
  }

  // ---------- Push notification tarixi ----------
  Future<List<CareNotification>> getNotifications() async {
    final id = userId;
    if (id == null) return [];
    final rows = await client
        .from('notifications')
        .select()
        .eq('recipient_id', id)
        .order('created_at', ascending: false)
        .limit(100);
    return (rows as List)
        .map((row) => CareNotification.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  Future<void> markNotificationRead(String notificationId) async {
    await client
        .from('notifications')
        .update({'is_read': true})
        .eq('id', notificationId);
  }

  Stream<List<Map<String, dynamic>>> watchNotifications() {
    final id = userId;
    if (id == null) return const Stream<List<Map<String, dynamic>>>.empty();
    return client
        .from('notifications')
        .stream(primaryKey: ['id'])
        .eq('recipient_id', id)
        .map((rows) => rows);
  }

  // ---------- Eslatmalar ----------
  Future<List<Reminder>> getReminders() async {
    final id = userId;
    if (id == null) return [];
    final res = await client
        .from('reminders')
        .select()
        .eq('client_id', id)
        .order('created_at', ascending: false);
    return (res as List).map((e) => Reminder.fromJson(e)).toList();
  }

  Future<Reminder?> addReminder(Reminder r) async {
    final id = userId;
    if (id == null) return null;
    final saved = await client
        .from('reminders')
        .insert({'client_id': id, ...r.toJson()})
        .select()
        .single();
    return Reminder.fromJson(saved);
  }

  Future<Reminder> updateReminderRecord(Reminder reminder) async {
    final saved = await client
        .from('reminders')
        .update(reminder.toJson())
        .eq('id', reminder.id)
        .select()
        .single();
    return Reminder.fromJson(saved);
  }

  Future<void> updateReminder(String reminderId, Map<String, dynamic> patch) async {
    await client.from('reminders').update(patch).eq('id', reminderId);
  }

  Future<void> deleteReminder(String reminderId) async {
    await client.from('reminders').delete().eq('id', reminderId);
  }

  // ---------- Chat (pagination + saqlash) ----------
  /// Oxirgi N ta xabarni olish (pagination: offset orqali)
  Future<List<ChatMessage>> getChatMessages({int limit = 20, int offset = 0}) async {
    final id = userId;
    if (id == null) return [];
    final res = await client
        .from('chat_messages')
        .select()
        .eq('client_id', id)
        .order('created_at', ascending: false)
        .range(offset, offset + limit - 1);
    final list = (res as List).map((e) => ChatMessage.fromJson(e)).toList();
    // Eng eski pastda bo'lishi uchun teskari tartibda qaytaramiz
    return list.reversed.toList();
  }

  /// Xabarni saqlash
  Future<ChatMessage> saveChatMessage({required String role, required String content}) async {
    final id = userId;
    if (id == null) throw Exception('Avtorizatsiya kerak');
    final res = await client
        .from('chat_messages')
        .insert({'client_id': id, 'role': role, 'content': content})
        .select()
        .single();
    return ChatMessage.fromJson(res);
  }

  // ---------- Oila a'zolari ----------
  Future<List<FamilyMember>> getFamilyMembers() async {
    final id = userId;
    if (id == null) return [];
    final res = await client
        .from('family_members')
        .select()
        .eq('client_id', id)
        .order('priority');
    return (res as List).map((e) => FamilyMember.fromJson(e)).toList();
  }

  Future<void> addFamilyMember(FamilyMember m) async {
    final id = userId;
    if (id == null) return;
    await client.from('family_members').insert({'client_id': id, ...m.toJson()});
  }

  Future<void> deleteFamilyMember(String memberId) async {
    await client.from('family_members').delete().eq('id', memberId);
  }

  // ---------- Firebase (FCM) ----------
  Future<void> saveFcmToken(String fcmToken) async {
    final id = userId;
    if (id == null) return;
    await client.from('profiles').update({'fcm_token': fcmToken}).eq('id', id);
  }

  /// Realtime: yangi check-in yoki bloklashni tinglash
  Stream<List<Map<String, dynamic>>> watchCheckins() {
    final id = userId;
    if (id == null) return const Stream<List<Map<String, dynamic>>>.empty();
    return client
        .from('checkins')
        .stream(primaryKey: ['id'])
        .eq('client_id', id)
        .map((rows) => rows);
  }

  /// Klinikadan yangi dori rejasi kelganda reminders ham realtime qayta yuklanadi.
  Stream<List<Map<String, dynamic>>> watchReminders() {
    final id = userId;
    if (id == null) return const Stream<List<Map<String, dynamic>>>.empty();
    return client
        .from('reminders')
        .stream(primaryKey: ['id'])
        .eq('client_id', id)
        .map((rows) => rows);
  }
}

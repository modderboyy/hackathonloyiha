import 'package:supabase_flutter/supabase_flutter.dart';
import '../config.dart';
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
        'role': 'client',
      },
    );
  }

  Future<AuthResponse> login(String email, String password) async {
    return client.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> logout() => client.auth.signOut();

  String? get userId => client.auth.currentUser?.id;

  /// Ro'yxatdan o'tgandan so'ng profilga 'client' rolini yozish
  Future<void> ensureClientRole() async {
    final id = userId;
    if (id == null) return;
    await client.from('profiles').upsert({'id': id, 'role': 'client'});
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
  Future<Subscription?> getSubscription() async {
    final id = userId;
    if (id == null) return null;
    final res = await client
        .from('subscriptions')
        .select()
        .eq('client_id', id)
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle();
    if (res == null) return null;
    return Subscription.fromJson(res);
  }

  /// Premium obuna sotib olish (demo — real to'lov gateway keyinroq)
  Future<void> subscribeIndividual() async {
    final id = userId;
    if (id == null) return;
    final expiresAt = DateTime.now().add(const Duration(days: 30));
    await client.from('subscriptions').insert({
      'client_id': id,
      'type': 'individual',
      'plan': 'premium',
      'price_usd': Config.premiumPriceUsd,
      'status': 'active',
      'started_at': DateTime.now().toIso8601String(),
      'expires_at': expiresAt.toIso8601String(),
    });
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
    final res = await client.rpc('activate_clinic_code', params: {'p_code': code});
    final data = res as Map<String, dynamic>;
    if (data['ok'] == true) return null;
    return data['error']?.toString() ?? 'Xatolik yuz berdi';
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

  Future<void> addReminder(Reminder r) async {
    final id = userId;
    if (id == null) return;
    await client.from('reminders').insert({'client_id': id, ...r.toJson()});
  }

  Future<void> updateReminder(String reminderId, Map<String, dynamic> patch) async {
    await client.from('reminders').update(patch).eq('id', reminderId);
  }

  Future<void> deleteReminder(String reminderId) async {
    await client.from('reminders').delete().eq('id', reminderId);
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
}

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
        .order('created_at', descending: true)
        .limit(1)
        .maybeSingle();
    if (res == null) return null;
    return Subscription.fromJson(res);
  }

  /// Premium obuna sotib olish (demo — real to'lov gateway keyinroq)
  Future<void> subscribePremium() async {
    final id = userId;
    if (id == null) return;
    final expiresAt = DateTime.now().add(const Duration(days: 30));
    await client.from('subscriptions').insert({
      'client_id': id,
      'plan': 'premium',
      'price_usd': Config.premiumPriceUsd,
      'status': 'active',
      'started_at': DateTime.now().toIso8601String(),
      'expires_at': expiresAt.toIso8601String(),
    });
  }

  // ---------- Tekshiruvlar (check-ins) ----------
  Future<List<Checkin>> getCheckins() async {
    final id = userId;
    if (id == null) return [];
    final res = await client
        .from('checkins')
        .select()
        .eq('client_id', id)
        .order('created_at', descending: true)
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
        .order('created_at', descending: true)
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

  /// Realtime: yangi check-in yoki bloklashni tinglash
  Stream<Map<String, dynamic>> watchCheckins() {
    final id = userId;
    if (id == null) return const Stream.empty();
    return client
        .from('checkins')
        .stream(primaryKey: ['id'])
        .eq('client_id', id);
  }
}

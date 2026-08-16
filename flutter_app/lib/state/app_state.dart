import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models.dart';
import '../services/supabase_service.dart';
import '../services/openai_service.dart';
import '../services/notification_service.dart';
import '../services/reminder_service.dart';
import '../services/onesignal_service.dart';

/// Ilova holati — auth, sog'liq, obuna, tekshiruv va bloklash.
class AppState extends ChangeNotifier {
  final SupabaseService db = SupabaseService();
  final OpenAIService ai = OpenAIService();
  final NotificationService notifications = NotificationService();
  final ReminderService reminders = ReminderService();
  final OneSignalService oneSignal = OneSignalService();

  UserProfile? profile;
  HealthData? health;
  Subscription? subscription;
  List<Checkin> checkins = [];
  List<Reminder> reminderList = [];
  List<Medication> medications = [];
  List<FamilyMember> familyMembers = [];
  bool locked = false;
  bool loading = true;
  String? error;

  bool get isLoggedIn => db.userId != null;
  bool get isPremium => subscription?.isActive ?? false;
  bool get hasSubscription => subscription?.isActive ?? false;

  Future<void> init() async {
    try {
      await notifications.init();
      await oneSignal.init();
      if (isLoggedIn) {
        await _linkOneSignal();
        await loadAll();
      }
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _linkOneSignal() async {
    final uid = db.userId;
    if (uid == null) return;
    await oneSignal.linkUser(uid);
    final playerId = await oneSignal.getPlayerId();
    if (playerId != null) {
      await db.saveOnesignalId(playerId);
    }
  }

  Future<void> loadAll() async {
    profile = await db.getProfile();
    health = await db.getHealth();
    subscription = await db.getSubscription();
    checkins = await db.getCheckins();
    reminderList = await db.getReminders();
    medications = await db.getMedications();
    familyMembers = await db.getFamilyMembers();
    await checkLocked();
  }

  Future<void> checkLocked() async {
    final lockedCheckin = await db.getLatestLockedCheckin();
    locked = lockedCheckin != null;
    notifyListeners();
  }

  // ---------- Auth ----------
  Future<void> register({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) async {
    error = null;
    loading = true;
    notifyListeners();
    try {
      final res = await db.register(email: email, password: password, fullName: fullName, phone: phone);
      if (res.session == null) {
        error = 'Ro\'yxatdan o\'tishda xato. Email tasdiqlanishi kerak bo\'lishi mumkin.';
      } else {
        await db.ensureClientRole();
        await loadAll();
      }
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    error = null;
    loading = true;
    notifyListeners();
    try {
      await db.login(email, password);
      await loadAll();
    } catch (e) {
      error = 'Email yoki parol noto\'g\'ri.';
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await oneSignal.logout();
    await db.logout();
    profile = null;
    health = null;
    subscription = null;
    locked = false;
    notifyListeners();
  }

  // ---------- Oila a'zolari ----------
  Future<void> addFamily(FamilyMember m) async {
    await db.addFamilyMember(m);
    familyMembers = await db.getFamilyMembers();
    notifyListeners();
  }

  Future<void> removeFamily(String id) async {
    await db.deleteFamilyMember(id);
    familyMembers = familyMembers.where((f) => f.id != id).toList();
    notifyListeners();
  }

  // ---------- Sog'liq ----------
  Future<void> saveHealth(HealthData data) async {
    await db.saveHealth(data);
    health = data;
    notifyListeners();
  }

  // ---------- Obuna ----------
  Future<void> buyIndividual() async {
    await db.subscribeIndividual();
    subscription = await db.getSubscription();
    notifyListeners();
  }

  /// Klinik kod bilan faollashtirish (B2B — tekin, klinika to'laydi)
  Future<String?> activateClinic(String code) async {
    final error = await db.activateClinicCode(code);
    if (error == null) {
      await loadAll(); // bemor ma'lumotlari + dori-darmon sinxronlanadi
    }
    return error;
  }

  // ---------- Tekshiruv ----------
  Future<void> answerCheckin(String checkinId, String response, {required bool isBad}) async {
    await db.answerCheckin(checkinId, response, isBad);
    await loadAll();
    if (isBad) {
      // Yomonman → bloklash ekranini ko'rsatish (tez yordam kerak)
      locked = true;
      notifyListeners();
    }
  }

  Future<void> unlock() async {
    locked = false;
    notifyListeners();
  }

  // ---------- Eslatmalar ----------
  Future<void> addReminder(Reminder r) async {
    await db.addReminder(r);
    await reminders.schedule(r);
    reminderList = await db.getReminders();
    notifyListeners();
  }

  Future<void> toggleReminder(String id, bool active) async {
    await db.updateReminder(id, {'active': active});
    reminderList = reminderList.map((r) => r.id == id ? _copyActive(r, active) : r).toList();
    notifyListeners();
  }

  Future<void> deleteReminder(String id) async {
    await db.deleteReminder(id);
    await reminders.cancel(id.hashCode);
    reminderList = reminderList.where((r) => r.id != id).toList();
    notifyListeners();
  }

  Reminder _copyActive(Reminder r, bool active) => Reminder(
        id: r.id, type: r.type, title: r.title, notes: r.notes,
        timeOfDay: r.timeOfDay, intervalMinutes: r.intervalMinutes,
        remindOnceAt: r.remindOnceAt, active: active, lastSentAt: r.lastSentAt,
      );

  // ---------- AI chatbot ----------
  Future<String> askAI(String message) => ai.chat(message, health: health);

  // ---------- Realtime ----------
  void watchCheckins() {
    db.watchCheckins().listen((rows) async {
      final prev = checkins;
      await loadAll();
      // Yangi tekshiruv keldi → mahalliy bildirishnoma
      for (final row in rows) {
        final id = row['id'];
        final already = prev.any((c) => c.id == id);
        if (!already && row['status'] == 'sent') {
          notifications.showCheckin('CareLink tekshiruvi', row['ai_message'] ?? 'O\'zingizni qanday his qilyapsiz?');
        }
        if (row['status'] == 'locked') {
          locked = true;
        }
      }
      notifyListeners();
    });
  }
}

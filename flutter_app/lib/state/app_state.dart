import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models.dart';
import '../services/supabase_service.dart';
import '../services/openai_service.dart';
import '../services/notification_service.dart';
import '../services/reminder_service.dart';

/// Ilova holati — auth, sog'liq, obuna, tekshiruv va bloklash.
class AppState extends ChangeNotifier {
  final SupabaseService db = SupabaseService();
  final OpenAIService ai = OpenAIService();
  final NotificationService notifications = NotificationService();
  final ReminderService reminders = ReminderService();

  UserProfile? profile;
  HealthData? health;
  Subscription? subscription;
  List<Checkin> checkins = [];
  List<Reminder> reminderList = [];
  bool locked = false;
  bool loading = true;
  String? error;

  bool get isLoggedIn => db.userId != null;
  bool get isPremium => subscription?.isActive ?? false;

  Future<void> init() async {
    try {
      await notifications.init();
      if (isLoggedIn) {
        await loadAll();
      }
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> loadAll() async {
    profile = await db.getProfile();
    health = await db.getHealth();
    subscription = await db.getSubscription();
    checkins = await db.getCheckins();
    reminderList = await db.getReminders();
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
    await db.logout();
    profile = null;
    health = null;
    subscription = null;
    locked = false;
    notifyListeners();
  }

  // ---------- Sog'liq ----------
  Future<void> saveHealth(HealthData data) async {
    await db.saveHealth(data);
    health = data;
    notifyListeners();
  }

  // ---------- Obuna ----------
  Future<void> buyPremium() async {
    await db.subscribePremium();
    subscription = await db.getSubscription();
    notifyListeners();
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

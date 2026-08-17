import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models.dart';
import '../services/supabase_service.dart';
import '../services/openai_service.dart';
import '../services/notification_service.dart';
import '../services/reminder_service.dart';
import '../services/fcm_service.dart';

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
  List<Medication> medications = [];
  List<FamilyMember> familyMembers = [];
  List<CareNotification> notificationHistory = [];
  MonitoringSettings monitoringSettings = const MonitoringSettings();

  int get unreadNotificationCount => notificationHistory.where((item) => !item.isRead).length;
  bool locked = false;
  bool loading = true;
  String? error;
  bool _realtimeStarted = false;

  bool get isLoggedIn => db.userId != null;
  bool get isPremium => subscription?.isActive ?? false;
  bool get hasSubscription => subscription?.isActive ?? false;

  Future<void> init() async {
    try {
      await notifications.init();
      await _initFcm();
      if (isLoggedIn) {
        await loadAll();
        _startRealtime();
      }
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _initFcm() async {
    // FCM token Supabase'ga saqlanadi (login'da ham chaqiriladi)
    FirebaseMessagingService.setTokenCallback((token) async {
      if (db.userId != null) {
        await db.saveFcmToken(token);
        profile = await db.getProfile();
        notifyListeners();
      }
    });
    FirebaseMessagingService.setMessageCallback((message) async {
      final title = message.notification?.title ?? message.data['title'] ?? 'CareLink xabari';
      final body = message.notification?.body ?? message.data['body'] ?? 'Yangi bildirishnoma keldi.';
      await notifications.showCheckin(title, body);
      if (db.userId != null) {
        notificationHistory = await db.getNotifications();
        notifyListeners();
      }
    });
    try {
      await FirebaseMessagingService.init();
      // FCM init login'dan oldin bo'lgan bo'lsa ham, login'dan keyin token
      // profile.fcm_token ga albatta yoziladi. Test push shu qiymatdan foydalanadi.
      final token = await FirebaseMessagingService.currentToken();
      if (token != null && db.userId != null) {
        await db.saveFcmToken(token);
        profile = await db.getProfile();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('FCM init xato: $e');
    }
  }

  Future<void> loadAll() async {
    profile = await db.getProfile();
    health = await db.getHealth();
    subscription = await db.getSubscription();
    checkins = await db.getCheckins();
    reminderList = await db.getReminders();
    notificationHistory = await db.getNotifications();
    monitoringSettings = await db.getMonitoringSettings();
    // Klinikadan kelgan dori rejasi shu yerda telefonning local notifications'iga yoziladi.
    await reminders.syncAll(reminderList);
    medications = await db.getMedications();
    familyMembers = await db.getFamilyMembers();
    await checkLocked();
  }

  Future<void> checkLocked() async {
    final lockedCheckin = await db.getLatestLockedCheckin();
    locked = lockedCheckin != null;
    notifyListeners();
  }

  void _startRealtime() {
    if (_realtimeStarted) return;
    _realtimeStarted = true;
    watchCheckins();
    watchReminders();
    watchNotifications();
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
        error = 'Hisob yaratildi. Emailingizga yuborilgan tasdiqlash havolasini bosing, keyin tizimga kiring.';
      } else {
        await db.ensureClientRole();
        await _initFcm();
        await loadAll();
        _startRealtime();
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
      await _initFcm();
      await loadAll();
      _startRealtime();
    } on AuthException catch (e) {
      // Avval barcha xatoni “parol noto‘g‘ri” deb ko‘rsatardik. Bu email
      // tasdiqlanmagan yoki internet/server muammosini yashirib qo‘yardi.
      final message = e.message.toLowerCase();
      if (message.contains('email not confirmed') || message.contains('email_not_confirmed')) {
        error = 'Email hali tasdiqlanmagan. Pochtangizdagi tasdiqlash havolasini bosing, so‘ng qayta kiring.';
      } else if (message.contains('invalid login') || message.contains('invalid credentials')) {
        error = 'Email yoki parol noto‘g‘ri. Parol katta-kichik harflarga sezgir.';
      } else if (message.contains('rate limit')) {
        error = 'Juda ko‘p urinish bo‘ldi. Bir necha daqiqadan keyin qayta urinib ko‘ring.';
      } else {
        error = 'Kirishda xatolik: ${e.message}';
      }
    } catch (_) {
      error = 'Serverga ulanib bo‘lmadi. Internetni tekshiring va ilovani qayta oching.';
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
    notificationHistory = [];
    monitoringSettings = const MonitoringSettings();
    locked = false;
    _realtimeStarted = false;
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

  // ---------- Beta AI monitoring sozlamalari ----------
  Future<String?> updateMonitoringSettings({required bool enabled, required int intervalMinutes}) async {
    try {
      await db.saveMonitoringSettings(enabled: enabled, intervalMinutes: intervalMinutes);
      monitoringSettings = MonitoringSettings(enabled: enabled, intervalMinutes: intervalMinutes);
      notifyListeners();
      return null;
    } catch (e) {
      return 'Sozlamalarni saqlab bo‘lmadi: ${e.toString()}';
    }
  }

  Future<String?> sendTestPush() async {
    // Testdan oldin tokenni qayta saqlaymiz, shunda yangi qurilmada ham push ishlaydi.
    await _initFcm();
    return db.sendTestPush();
  }

  // ---------- Obuna ----------
  Future<void> buyIndividual() async {
    await db.subscribeIndividual();
    await loadAll(); // to'liq sync (obuna + barcha ma'lumotlar)
  }

  /// Klinik kod bilan faollashtirish (B2B — tekin, klinika to'laydi)
  Future<String?> activateClinic(String code) async {
    final error = await db.activateClinicCode(code);
    if (error == null) {
      // Obuna darhol aktiv — loadAll xatosi bo'lsa ham oqimni to'xtatmaymiz
      try {
        await loadAll();
      } catch (_) {}
      notifyListeners();
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
    final saved = await db.addReminder(r);
    if (saved != null) await reminders.schedule(saved);
    reminderList = await db.getReminders();
    notifyListeners();
  }

  Future<void> toggleReminder(String id, bool active) async {
    Reminder? reminder;
    for (final item in reminderList) {
      if (item.id == id) { reminder = item; break; }
    }
    await db.updateReminder(id, {'active': active});
    if (reminder != null) {
      final updated = _copyActive(reminder, active);
      if (active) {
        await reminders.schedule(updated);
      } else {
        await reminders.cancelReminder(updated);
      }
    }
    reminderList = reminderList.map((r) => r.id == id ? _copyActive(r, active) : r).toList();
    notifyListeners();
  }

  Future<void> deleteReminder(String id) async {
    Reminder? reminder;
    for (final item in reminderList) {
      if (item.id == id) { reminder = item; break; }
    }
    await db.deleteReminder(id);
    if (reminder != null) await reminders.cancelReminder(reminder);
    reminderList = reminderList.where((r) => r.id != id).toList();
    notifyListeners();
  }

  Reminder _copyActive(Reminder r, bool active) => Reminder(
        id: r.id, type: r.type, title: r.title, notes: r.notes,
        timeOfDay: r.timeOfDay, intervalMinutes: r.intervalMinutes,
        remindOnceAt: r.remindOnceAt, active: active, lastSentAt: r.lastSentAt,
        medicationId: r.medicationId, source: r.source, endsAt: r.endsAt,
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

  void watchReminders() {
    db.watchReminders().listen((_) async {
      reminderList = await db.getReminders();
      await reminders.syncAll(reminderList);
      notifyListeners();
    });
  }

  Future<void> markNotificationRead(String id) async {
    final item = notificationHistory.where((notification) => notification.id == id).toList();
    if (item.isEmpty || item.first.isRead) return;
    await db.markNotificationRead(id);
    notificationHistory = notificationHistory
        .map((notification) => notification.id == id
            ? CareNotification(
                id: notification.id,
                type: notification.type,
                title: notification.title,
                body: notification.body,
                isRead: true,
                createdAt: notification.createdAt,
              )
            : notification)
        .toList();
    notifyListeners();
  }

  void watchNotifications() {
    db.watchNotifications().listen((rows) {
      notificationHistory = rows
          .map((row) => CareNotification.fromJson(row))
          .toList()
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      notifyListeners();
    });
  }
}

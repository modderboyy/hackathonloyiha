import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models.dart';
import '../services/supabase_service.dart';
import '../services/openai_service.dart';
import '../services/notification_service.dart';
import '../services/reminder_service.dart';
import '../services/fcm_service.dart';
import '../services/emergency_service.dart';
import 'package:url_launcher/url_launcher.dart';

enum FcmInitStatus { idle, initializing, ready, tokenPending, webPreview, error }

/// Ilova holati — auth, sog'liq, obuna, tekshiruv va bloklash.
class AppState extends ChangeNotifier {
  final SupabaseService db = SupabaseService();
  final OpenAIService ai = OpenAIService();
  final NotificationService notifications = NotificationService();
  final ReminderService reminders = ReminderService();
  final EmergencyService emergency = EmergencyService();

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

  // Profil → Beta AI sozlamalarida ko'rinadigan FCM diagnostikasi.
  FcmInitStatus fcmInitStatus = FcmInitStatus.idle;
  String? fcmStatusMessage;
  String? fcmTokenPreview;
  String? fcmPermissionStatus;

  bool get isLoggedIn => db.userId != null;
  bool get isPremium => subscription?.isActive ?? false;
  bool get hasSubscription => subscription?.isActive ?? false;

  Future<void> init() async {
    try {
      notifications.setSafetyActionCallback(_handleSafetyAction);
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
    // Web build uchun FirebaseOptions/VAPID sozlanmagan. Android push oqimi
    // web previewdan mustaqil ishlaydi, shuning uchun webda FCM init qilmaymiz.
    if (kIsWeb) {
      fcmInitStatus = FcmInitStatus.webPreview;
      fcmStatusMessage = 'Web preview: Firebase Web/VAPID sozlanmagan. Android buildda FCM ishlaydi.';
      fcmPermissionStatus = 'web disabled';
      notifyListeners();
      return;
    }

    fcmInitStatus = FcmInitStatus.initializing;
    fcmStatusMessage = 'Firebase SDK ishga tushirilmoqda…';
    notifyListeners();

    FirebaseMessagingService.setTokenCallback((token) async {
      fcmTokenPreview = _tokenPreview(token);
      if (db.userId != null) {
        await db.saveFcmToken(token);
        profile = await db.getProfile();
        fcmInitStatus = FcmInitStatus.ready;
        fcmStatusMessage = 'FCM token olindi va Supabase profiliga saqlandi.';
      } else {
        fcmInitStatus = FcmInitStatus.ready;
        fcmStatusMessage = 'FCM token olindi. Login qilingach profilga saqlanadi.';
      }
      notifyListeners();
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
      fcmPermissionStatus = await FirebaseMessagingService.permissionStatus();
      final token = await FirebaseMessagingService.currentToken();
      if (token == null || token.isEmpty) {
        fcmInitStatus = FcmInitStatus.tokenPending;
        fcmStatusMessage = 'Firebase ishga tushdi, ammo qurilma tokeni hali olinmadi.';
      } else {
        fcmTokenPreview = _tokenPreview(token);
        if (db.userId != null) {
          await db.saveFcmToken(token);
          profile = await db.getProfile();
          fcmInitStatus = FcmInitStatus.ready;
          fcmStatusMessage = 'FCM token olindi va Supabase profiliga saqlandi.';
        } else {
          fcmInitStatus = FcmInitStatus.ready;
          fcmStatusMessage = 'FCM token olindi. Login qilingach profilga saqlanadi.';
        }
      }
    } catch (e) {
      fcmInitStatus = FcmInitStatus.error;
      fcmStatusMessage = 'FCM init xato: ${e.toString()}';
      debugPrint(fcmStatusMessage);
    }
    notifyListeners();
  }

  String _tokenPreview(String token) {
    if (token.length <= 18) return token;
    return '${token.substring(0, 9)}…${token.substring(token.length - 7)}';
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
    await _syncSafetyNotification();
    await checkLocked();
  }

  Future<void> checkLocked() async {
    final lockedCheckin = await db.getLatestLockedCheckin();
    locked = lockedCheckin != null;
    notifyListeners();
  }

  Future<void> _syncSafetyNotification() async {
    if (hasSubscription) {
      await notifications.showPersistentSafetyActions();
    } else {
      await notifications.cancelPersistentSafetyActions();
    }
  }

  Future<void> _handleSafetyAction(String action) async {
    if (action == 'sos') {
      await triggerSos();
    } else if (action == 'family') {
      await notifyFamily();
    } else if (action == 'call_103') {
      await callEmergency103();
    }
  }

  Future<EmergencyResult> triggerSos() async {
    final result = await emergency.trigger(action: 'sos');
    if (result.ok) await loadAll();
    return result;
  }

  Future<EmergencyResult> notifyFamily() async {
    final result = await emergency.trigger(action: 'family');
    if (result.ok) await loadAll();
    return result;
  }

  Future<void> callEmergency103() async {
    final uri = Uri.parse('tel:103');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
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
    // Persistent notification cancel xatosi logout oqimini to'xtatmasin.
    try {
      await notifications.cancelPersistentSafetyActions();
    } catch (e) {
      debugPrint('Safety notification cancel xato: $e');
    }
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

  Future<String?> toggleReminder(String id, bool active) async {
    Reminder? reminder;
    for (final item in reminderList) {
      if (item.id == id) { reminder = item; break; }
    }
    if (reminder == null) return 'Eslatma topilmadi';
    try {
      final updated = _copyActive(reminder, active);
      await db.updateReminder(id, {'active': active});
      if (active) {
        await reminders.schedule(updated);
      } else {
        await reminders.cancelReminder(updated);
      }
      reminderList = reminderList.map((item) => item.id == id ? updated : item).toList();
      notifyListeners();
      return null;
    } catch (e) {
      return 'Eslatma holatini o‘zgartirib bo‘lmadi: ${e.toString()}';
    }
  }

  Future<String?> editReminder(Reminder updated) async {
    Reminder? old;
    for (final item in reminderList) {
      if (item.id == updated.id) { old = item; break; }
    }
    final existing = old;
    if (existing == null) return 'Eslatma topilmadi';
    try {
      await reminders.cancelReminder(existing);
      final saved = await db.updateReminderRecord(updated);
      if (saved.active) await reminders.schedule(saved);
      reminderList = reminderList.map((item) => item.id == saved.id ? saved : item).toList();
      notifyListeners();
      return null;
    } catch (e) {
      // Cancel bo'lgan eski schedule tiklanadi, shunda edit xatosi reminder'ni yo'qotmaydi.
      if (existing.active) await reminders.schedule(existing);
      return 'Eslatmani tahrirlab bo‘lmadi: ${e.toString()}';
    }
  }

  Future<String?> deleteReminder(String id) async {
    Reminder? reminder;
    for (final item in reminderList) {
      if (item.id == id) { reminder = item; break; }
    }
    final existing = reminder;
    if (existing == null) return 'Eslatma topilmadi';
    try {
      await db.deleteReminder(id);
      await reminders.cancelReminder(existing);
      reminderList = reminderList.where((item) => item.id != id).toList();
      notifyListeners();
      return null;
    } catch (e) {
      return 'Eslatmani o‘chirib bo‘lmadi: ${e.toString()}';
    }
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
    }, onError: (error) {
      debugPrint('Realtime checkins ulanmagan: $error');
    });
  }

  void watchReminders() {
    db.watchReminders().listen((_) async {
      reminderList = await db.getReminders();
      await reminders.syncAll(reminderList);
      notifyListeners();
    }, onError: (error) {
      debugPrint('Realtime reminders ulanmagan: $error');
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
    }, onError: (error) {
      debugPrint('Realtime notifications ulanmagan: $error');
    });
  }
}

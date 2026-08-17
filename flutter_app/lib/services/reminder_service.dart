import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import '../models.dart';

/// Serverdagi reminders jadvalini telefon bildirishnomalariga akslantiradi.
/// Klinika dori rejasini o'zgartirsa, realtime orqali qayta sinxronlanadi.
class ReminderService {
  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _inited = false;
  static const int _maxScheduledPerReminder = 360;

  Future<void> init() async {
    if (_inited) return;
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    const settings = InitializationSettings(android: android, iOS: ios);
    await _plugin.initialize(settings);
    _inited = true;
  }

  NotificationDetails get _details => const NotificationDetails(
        android: AndroidNotificationDetails(
          'carelink_reminders',
          'CareLink eslatmalari',
          channelDescription: 'Klinikadan sinxronlangan dori-darmon va boshqa eslatmalar',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      );

  /// Barcha remote reminders'ni qayta yozadi. Bir xil ID'lar ishlatilgani uchun
  /// qayta chaqirish duplicate notification yaratmaydi.
  Future<void> syncAll(List<Reminder> reminders) async {
    await init();
    for (final reminder in reminders) {
      await schedule(reminder);
    }
  }

  /// Eslatma rejalashtirish:
  /// - daily: klinika bergan vaqtlar uchun kunma-kun
  /// - interval: klinika bergan har N daqiqa/soat oralig'ida
  /// - manual deadline: bir marta
  /// `endsAt` bo'lsa dori kursi tugagach notification ham tugaydi.
  Future<void> schedule(Reminder reminder) async {
    await init();
    if (!reminder.active) return;

    if (reminder.remindOnceAt != null) {
      final once = tz.TZDateTime.from(reminder.remindOnceAt!, tz.local);
      if (once.isAfter(tz.TZDateTime.now(tz.local))) {
        await _scheduleAt(_id(reminder, 0), reminder, once);
      }
      return;
    }

    if (reminder.timeOfDay != null) {
      await _scheduleDaily(reminder);
      return;
    }

    if (reminder.intervalMinutes != null && reminder.intervalMinutes! > 0) {
      await _scheduleInterval(reminder);
    }
  }

  Future<void> _scheduleDaily(Reminder reminder) async {
    final parts = reminder.timeOfDay!.split(':');
    final hour = int.tryParse(parts.first) ?? 8;
    final minute = parts.length > 1 ? (int.tryParse(parts[1]) ?? 0) : 0;
    final now = tz.TZDateTime.now(tz.local);
    final end = reminder.endsAt == null
        ? null
        : tz.TZDateTime(tz.local, reminder.endsAt!.year, reminder.endsAt!.month, reminder.endsAt!.day, 23, 59);

    // Cheklanmagan manual reminder Material-style daily recurrence orqali ishlaydi.
    if (end == null) {
      var next = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, minute);
      if (!next.isAfter(now)) next = next.add(const Duration(days: 1));
      await _plugin.zonedSchedule(
        _id(reminder, 0),
        reminder.title,
        reminder.notes ?? reminder.typeLabel,
        next,
        _details,
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
        matchDateTimeComponents: DateTimeComponents.time,
      );
      return;
    }

    var date = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, minute);
    if (!date.isAfter(now)) date = date.add(const Duration(days: 1));
    var index = 0;
    while (!date.isAfter(end) && index < _maxScheduledPerReminder) {
      await _scheduleAt(_id(reminder, index), reminder, date);
      date = date.add(const Duration(days: 1));
      index += 1;
    }
  }

  Future<void> _scheduleInterval(Reminder reminder) async {
    final now = tz.TZDateTime.now(tz.local);
    final interval = Duration(minutes: reminder.intervalMinutes!);
    final end = reminder.endsAt == null
        ? now.add(const Duration(days: 30))
        : tz.TZDateTime(tz.local, reminder.endsAt!.year, reminder.endsAt!.month, reminder.endsAt!.day, 23, 59);
    var next = now.add(interval);
    var index = 0;
    while (!next.isAfter(end) && index < _maxScheduledPerReminder) {
      await _scheduleAt(_id(reminder, index), reminder, next);
      next = next.add(interval);
      index += 1;
    }
  }

  Future<void> _scheduleAt(int id, Reminder reminder, tz.TZDateTime at) async {
    await _plugin.zonedSchedule(
      id,
      reminder.title,
      reminder.notes ?? reminder.typeLabel,
      at,
      _details,
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  /// Dori o'chirilganda yoki bemor o'chirganda hosil qilingan notificationlar bekor qilinadi.
  Future<void> cancelReminder(Reminder reminder) async {
    await init();
    // Oddiy har kunlik manual reminder faqat bitta ID ishlatadi. Avvalgi
    // 360 ta serial cancel UI'ni sekinlashtirib, delete ishlamayotgandek ko'rsatardi.
    if (reminder.timeOfDay != null && reminder.endsAt == null) {
      await _plugin.cancel(_id(reminder, 0));
      return;
    }
    if (reminder.remindOnceAt != null) {
      await _plugin.cancel(_id(reminder, 0));
      return;
    }

    // Interval yoki klinik finite kurs uchun barcha oldindan schedule qilingan ID'lar.
    final ids = List<int>.generate(_maxScheduledPerReminder, (index) => _id(reminder, index));
    await Future.wait(ids.map(_plugin.cancel));
  }

  Future<void> cancel(int id) async {
    await init();
    await _plugin.cancel(id);
  }

  int _id(Reminder reminder, int offset) {
    final base = reminder.id.hashCode & 0x003FFFFF;
    return (base * 400 + offset) & 0x7FFFFFFF;
  }
}

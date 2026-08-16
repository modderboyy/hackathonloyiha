import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import '../models.dart';

/// Eslatmalar uchun mahalliy bildirishnomalar (minutlik cron uslubida).
class ReminderService {
  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _inited = false;

  Future<void> init() async {
    if (_inited) return;
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    const settings = InitializationSettings(android: android, iOS: ios);
    await _plugin.initialize(settings);
    _inited = true;
  }

  /// Eslatmani rejalashtirish:
  /// - intervalMinutes berilgan bo'lsa → har N daqiqada (periodic)
  /// - timeOfDay berilgan bo'lsa → har kuni shu vaqtda
  /// - remindOnceAt berilgan bo'lsa → bir marta
  Future<void> schedule(Reminder r) async {
    await init();
    if (!r.active) return;

    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'carelink_reminders',
        'CareLink eslatmalari',
        channelDescription: 'Dori-darmon va boshqa eslatmalar',
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );

    final id = r.id.hashCode;

    if (r.intervalMinutes != null) {
      // Har N daqiqada (minutlik cron)
      await _plugin.periodicallyShow(
        id,
        r.title,
        r.notes ?? r.typeLabel,
        RepeatInterval.everyMinute,
        details,
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      );
      return;
    }

    if (r.timeOfDay != null) {
      // Har kuni HH:MM da
      final parts = r.timeOfDay!.split(':');
      final hour = int.tryParse(parts[0]) ?? 8;
      final minute = parts.length > 1 ? (int.tryParse(parts[1]) ?? 0) : 0;
      var scheduled = _nextInstance(hour, minute);
      await _plugin.zonedSchedule(
        id,
        r.title,
        r.notes ?? r.typeLabel,
        scheduled,
        details,
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        matchDateTimeComponents: DateTimeComponents.time,
      );
      return;
    }

    if (r.remindOnceAt != null) {
      await _plugin.zonedSchedule(
        id,
        r.title,
        r.notes ?? r.typeLabel,
        tz.TZDateTime.from(r.remindOnceAt!, tz.local),
        details,
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
    }
  }

  Future<void> cancel(int id) async {
    await init();
    await _plugin.cancel(id);
  }

  tz.TZDateTime _nextInstance(int hour, int minute) {
    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, minute);
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }
}

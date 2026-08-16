import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Mahalliy bildirishnomalar — AI tekshiruv xabarlarini ko'rsatish uchun.
class NotificationService {
  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    const settings = InitializationSettings(android: android, iOS: ios);
    await _plugin.initialize(settings);
  }

  Future<void> showCheckin(String title, String body) async {
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'carelink_checkin',
        'CareLink tekshiruvlari',
        channelDescription: 'Soatlik AI tekshiruv bildirishnomalari',
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );
    await _plugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
    );
  }
}

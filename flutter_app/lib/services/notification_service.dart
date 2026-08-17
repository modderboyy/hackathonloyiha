import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Ilova ochiq turgandagi FCM va AI check-in xabarlarini local banner sifatida ko'rsatadi.
class NotificationService {
  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _inited = false;

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'carelink_checkin',
    'CareLink bildirishnomalari',
    description: 'AI monitoring, test push va klinik xabarlar',
    importance: Importance.high,
  );

  Future<void> init() async {
    if (_inited) return;
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    const settings = InitializationSettings(android: android, iOS: ios);
    await _plugin.initialize(settings);

    final androidPlugin = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(_channel);
    await androidPlugin?.requestNotificationsPermission();
    _inited = true;
  }

  Future<void> showCheckin(String title, String body) async {
    await init();
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'carelink_checkin',
        'CareLink bildirishnomalari',
        channelDescription: 'AI monitoring, test push va klinik xabarlar',
        importance: Importance.high,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
      ),
      iOS: DarwinNotificationDetails(presentAlert: true, presentBadge: true, presentSound: true),
    );
    await _plugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
    );
  }
}

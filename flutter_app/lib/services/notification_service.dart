import 'dart:async';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Ilova ochiq turgandagi FCM, AI check-in va doimiy SOS paneli.
class NotificationService {
  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _inited = false;
  FutureOr<void> Function(String actionId)? _onSafetyAction;

  static const int _persistentSafetyId = 103001;
  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'carelink_checkin',
    'CareLink bildirishnomalari',
    description: 'AI monitoring, test push va klinik xabarlar',
    importance: Importance.high,
  );

  void setSafetyActionCallback(FutureOr<void> Function(String actionId) callback) {
    _onSafetyAction = callback;
  }

  Future<void> init() async {
    if (_inited) return;
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    const settings = InitializationSettings(android: android, iOS: ios);
    await _plugin.initialize(
      settings,
      onDidReceiveNotificationResponse: (response) async {
        final action = response.actionId;
        if (action != null && {'sos', 'call_103', 'family'}.contains(action)) {
          await _onSafetyAction?.call(action);
        }
      },
    );

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
    await _plugin.show(DateTime.now().millisecondsSinceEpoch ~/ 1000, title, body, details);
  }

  /// Obuna faol bo'lganda Android notification tray'da doim turadigan emergency panel.
  Future<void> showPersistentSafetyActions() async {
    await init();
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'carelink_safety',
        'CareLink xavfsizlik paneli',
        channelDescription: 'Faol obuna uchun SOS va tez yordam tugmalari',
        importance: Importance.low,
        priority: Priority.low,
        ongoing: true,
        autoCancel: false,
        onlyAlertOnce: true,
        actions: [
          AndroidNotificationAction('sos', 'SOS', showsUserInterface: true, cancelNotification: false),
          AndroidNotificationAction('call_103', '103', showsUserInterface: true, cancelNotification: false),
          AndroidNotificationAction('family', 'Yaqinlarga', showsUserInterface: true, cancelNotification: false),
        ],
      ),
      iOS: DarwinNotificationDetails(presentAlert: false, presentBadge: false, presentSound: false),
    );
    await _plugin.show(
      _persistentSafetyId,
      'CareLink himoya rejimi faol',
      'SOS, 103 yoki yaqin odamlarga xabar yuborish',
      details,
    );
  }

  Future<void> cancelPersistentSafetyActions() async {
    await init();
    await _plugin.cancel(_persistentSafetyId);
  }
}

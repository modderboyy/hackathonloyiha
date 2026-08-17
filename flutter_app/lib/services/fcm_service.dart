import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

/// Android background isolate uchun. Notification payload bo'lsa Android
/// ilova fonida bo'lganda uni system notification sifatida ham ko'rsatadi.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

/// Firebase Cloud Messaging — token, foreground va background push oqimi.
class FirebaseMessagingService {
  static bool _inited = false;

  static Future<void> init() async {
    if (_inited) return;
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    final messaging = FirebaseMessaging.instance;
    // Android 13+, iOS va webda foydalanuvchidan push ruxsatini so'raydi.
    await messaging.requestPermission(alert: true, badge: true, sound: true);

    final token = await messaging.getToken();
    if (token != null) _onTokenReceived?.call(token);

    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      _onTokenReceived?.call(newToken);
    });

    // Ilova ochiq bo'lsa FCM system banner chiqarmaydi; AppState bu callback
    // orqali local notification va Supabase tarixini yangilaydi.
    FirebaseMessaging.onMessage.listen((message) async {
      await _onMessage?.call(message);
    });
    FirebaseMessaging.onMessageOpenedApp.listen((message) async {
      await _onMessageOpened?.call(message);
    });

    _inited = true;
  }

  static FutureOr<void> Function(String token)? _onTokenReceived;
  static FutureOr<void> Function(RemoteMessage message)? _onMessage;
  static FutureOr<void> Function(RemoteMessage message)? _onMessageOpened;

  /// Login bo'lgandan keyin ham joriy tokenni olish uchun.
  /// App birinchi marta login sahifasida ochilganda token saqlanmay qolmasin.
  static Future<String?> currentToken() async {
    await init();
    return FirebaseMessaging.instance.getToken();
  }

  static void setTokenCallback(FutureOr<void> Function(String token) callback) => _onTokenReceived = callback;
  static void setMessageCallback(FutureOr<void> Function(RemoteMessage) callback) => _onMessage = callback;
  static void setMessageOpenedCallback(FutureOr<void> Function(RemoteMessage) callback) => _onMessageOpened = callback;
}

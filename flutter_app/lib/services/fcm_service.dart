import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

/// Firebase Cloud Messaging (FCM) — tekin push notification.
///
/// Android'da ishlashi uchun:
/// 1. Firebase Console'da loyiha yarating (https://console.firebase.google.com)
/// 2. Android ilovani qo'shing (package name: uz.carelink.carelink_patient)
/// 3. `google-services.json` faylini `android/app/` papkasiga joylang
/// 4. `main.dart` da `FirebaseMessagingService.init()` chaqirilgan bo'lishi kerak
class FirebaseMessagingService {
  static bool _inited = false;

  /// Ilova ishga tushganda chaqiriladi (firebase_core init bilan birga)
  static Future<void> init() async {
    if (_inited) return;

    // Firebase ni ishga tushirish
    await Firebase.initializeApp();

    // Push ruxsat so'rash (Android 13+ uchun POST_NOTIFICATIONS)
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // FCM token olish (server push yuborish uchun)
    final token = await messaging.getToken();
    if (token != null) {
      // token'ni Supabase profiles.fcm_token ga saqlash kerak
      _onTokenReceived?.call(token);
    }

    // Token yangilanganda
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      _onTokenReceived?.call(newToken);
    });

    // Ilova oldinda bo'lganda xabar kelishi
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _onMessage?.call(message);
    });

    // Xabarni bosganda
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _onMessageOpened?.call(message);
    });

    _inited = true;
  }

  // Callback'lar (AppState bog'lash uchun)
  static void Function(String token)? _onTokenReceived;
  static void Function(RemoteMessage message)? _onMessage;
  static void Function(RemoteMessage message)? _onMessageOpened;

  static void setTokenCallback(void Function(String token) cb) => _onTokenReceived = cb;
  static void setMessageCallback(void Function(RemoteMessage) cb) => _onMessage = cb;
  static void setMessageOpenedCallback(void Function(RemoteMessage) cb) => _onMessageOpened = cb;
}

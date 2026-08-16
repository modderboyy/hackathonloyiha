import 'package:onesignal_flutter/onesignal_flutter.dart';
import '../config.dart';

/// OneSignal — tekin push notification xizmati.
/// Bemor holati so'ralganda va bloklanganda push yuboriladi.
class OneSignalService {
  static bool _inited = false;

  /// Ilova ishga tushganda chaqiriladi.
  /// Foydalanuvchi login bo'lgach `linkUser` chaqiriladi.
  Future<void> init() async {
    if (_inited) return;
    if (Config.oneSignalAppId.isEmpty || Config.oneSignalAppId == 'YOUR-ONESIGNAL-APP-ID') {
      return; // OneSignal sozlanmagan
    }
    OneSignal.Debug.setLogLevel(OSLogLevel.verbose);
    OneSignal.initialize(Config.oneSignalAppId);
    OneSignal.Notifications.requestPermission(true);
    _inited = true;
  }

  /// Foydalanuvchini bog'lash (external ID = Supabase user ID)
  Future<void> linkUser(String userId) async {
    if (!_inited) return;
    try {
      await OneSignal.login(userId);
    } catch (_) {}
  }

  /// Joriy player ID (push uchun)
  Future<String?> getPlayerId() async {
    if (!_inited) return null;
    try {
      final state = OneSignal.User.pushSubscription;
      return state.id;
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    if (!_inited) return;
    try {
      await OneSignal.logout();
    } catch (_) {}
  }
}

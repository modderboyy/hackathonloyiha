import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class EmergencyResult {
  final bool ok;
  final String message;
  final String? locationLink;
  const EmergencyResult({required this.ok, required this.message, this.locationLink});
}

/// SOS va yaqin odamga xabar Edge Function orqali yuboriladi.
/// Server SMS provider ishlatgani uchun Android app SEND_SMS ruxsatiga muhtoj emas.
class EmergencyService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<EmergencyResult> trigger({required String action, String? message}) async {
    Position? position;
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission != LocationPermission.denied && permission != LocationPermission.deniedForever) {
        position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 12),
        );
      }
    } catch (_) {
      // Location olinmasa ham SOS/SMS serverga yuboriladi.
    }

    try {
      final response = await _client.functions.invoke('sos-alert', body: {
        'action': action,
        'lat': position?.latitude,
        'lng': position?.longitude,
        'message': message,
      });
      final data = (response.data as Map?) ?? {};
      if (data['ok'] == true) {
        final smsSent = data['sms_sent'] == true;
        return EmergencyResult(
          ok: true,
          message: smsSent ? 'SOS va yaqin odamga xabar yuborildi.' : 'SOS saqlandi. ${data['sms_error'] ?? 'SMS yuborilmadi.'}',
          locationLink: data['location_link']?.toString(),
        );
      }
      return EmergencyResult(ok: false, message: data['error']?.toString() ?? 'SOS yuborilmadi');
    } catch (e) {
      return EmergencyResult(ok: false, message: 'SOS xatosi: ${e.toString()}');
    }
  }
}

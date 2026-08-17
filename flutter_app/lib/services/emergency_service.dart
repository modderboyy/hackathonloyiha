import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config.dart';

class EmergencyResult {
  final bool ok;
  final String message;
  final String? alertId;
  final String? queueCode;
  final String? status;
  final DateTime? createdAt;

  const EmergencyResult({
    required this.ok,
    required this.message,
    this.alertId,
    this.queueCode,
    this.status,
    this.createdAt,
  });
}

/// SOS API: https://hackathonloyiha.vercel.app/api/admin/sos
/// Location talab qilinadi, keyin server sos_alerts va klinika notificationlarini yaratadi.
class EmergencyService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<EmergencyResult> trigger({required String action, String? message}) async {
    Position? position;
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return const EmergencyResult(ok: false, message: 'Joylashuvni aniqlay olmadik. Iltimos, location ruxsatini yoqing.');
      }
      position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 12),
      );
    } catch (_) {
      return const EmergencyResult(ok: false, message: 'Joylashuvni aniqlay olmadik. Internet va GPS yoqilganini tekshiring.');
    }

    if (action == 'family') {
      return _sendFamilyAlert(position, message);
    }
    return _createSos(position, message);
  }

  Future<EmergencyResult> _createSos(Position position, String? message) async {
    final session = _client.auth.currentSession;
    if (session == null) return const EmergencyResult(ok: false, message: 'Avtorizatsiya kerak');
    try {
      final response = await http.post(
        Uri.parse('${Config.apiBaseUrl}/api/admin/sos'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${session.accessToken}',
        },
        body: jsonEncode({
          'priority': 'critical',
          'location_lat': position.latitude,
          'location_lng': position.longitude,
          'message': message ?? 'Emergency! Patient needs immediate help',
        }),
      );
      final data = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return EmergencyResult(
          ok: true,
          message: 'SOS yuborildi. Klinika xabardor qilindi.',
          alertId: data['alert_id']?.toString(),
          queueCode: data['queue_code']?.toString(),
          status: data['status']?.toString(),
          createdAt: data['created_at'] != null ? DateTime.tryParse(data['created_at'].toString()) : null,
        );
      }
      return EmergencyResult(ok: false, message: data['error']?.toString() ?? 'Server SOS so‘rovini rad etdi');
    } catch (_) {
      return const EmergencyResult(ok: false, message: 'Internetni tekshiring va qayta urinib ko‘ring.');
    }
  }

  Future<EmergencyResult> cancelSos(String alertId) async {
    final session = _client.auth.currentSession;
    if (session == null) return const EmergencyResult(ok: false, message: 'Avtorizatsiya kerak');
    try {
      final response = await http.patch(
        Uri.parse('${Config.apiBaseUrl}/api/admin/sos'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ${session.accessToken}'},
        body: jsonEncode({'alert_id': alertId}),
      );
      final data = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return EmergencyResult(ok: true, message: 'SOS bekor qilindi.', alertId: data['alert_id']?.toString(), queueCode: data['queue_code']?.toString(), status: data['status']?.toString());
      }
      return EmergencyResult(ok: false, message: data['error']?.toString() ?? 'SOS bekor qilinmadi');
    } catch (_) {
      return const EmergencyResult(ok: false, message: 'Internetni tekshiring va qayta urinib ko‘ring.');
    }
  }

  Future<EmergencyResult> _sendFamilyAlert(Position position, String? message) async {
    try {
      final response = await _client.functions.invoke('sos-alert', body: {
        'action': 'family',
        'lat': position.latitude,
        'lng': position.longitude,
        'message': message,
      });
      final data = (response.data as Map?) ?? {};
      if (data['ok'] == true) {
        return EmergencyResult(ok: true, message: data['sms_sent'] == true ? 'Yaqin odamga location bilan SMS yuborildi.' : 'SOS saqlandi. ${data['sms_error'] ?? 'SMS yuborilmadi.'}', alertId: data['sos_id']?.toString());
      }
      return EmergencyResult(ok: false, message: data['error']?.toString() ?? 'Yaqin odamlarga xabar yuborilmadi');
    } catch (_) {
      return const EmergencyResult(ok: false, message: 'Internetni tekshiring va qayta urinib ko‘ring.');
    }
  }
}

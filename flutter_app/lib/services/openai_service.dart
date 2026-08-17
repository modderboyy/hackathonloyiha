import 'package:supabase_flutter/supabase_flutter.dart';
import '../models.dart';

/// AI chat endi OpenAI keyni APK ichida saqlamaydi.
/// So'rov authenticated Supabase Edge Function (`ai-chat`) orqali yuboriladi.
class OpenAIService {
  final List<ChatMessage> _history = [];

  Future<String> chat(String userMessage, {HealthData? health}) async {
    final clean = userMessage.trim();
    if (clean.isEmpty) return 'Xabarni yozing.';

    try {
      final response = await Supabase.instance.client.functions.invoke(
        'ai-chat',
        body: {
          'message': clean,
          'history': _history.map((message) => {'role': message.role, 'content': message.content}).toList(),
          'health': {
            'currentCondition': health?.currentCondition,
            'hospitalDiagnosis': health?.hospitalDiagnosis,
            'treatmentSummary': health?.treatmentSummary,
            'dischargeRecommendations': health?.dischargeRecommendations,
            'avgBpSys': health?.avgBpSys,
            'avgBpDia': health?.avgBpDia,
            'avgHeartRate': health?.avgHeartRate,
            'avgTemperature': health?.avgTemperature,
            'avgSpo2': health?.avgSpo2,
            'allergies': health?.allergies,
          },
        },
      );
      final data = (response.data as Map?) ?? {};
      final reply = data['reply']?.toString().trim();
      if (data['ok'] == true && reply != null && reply.isNotEmpty) {
        _history.add(ChatMessage(role: 'user', content: clean, createdAt: DateTime.now()));
        _history.add(ChatMessage(role: 'assistant', content: reply, createdAt: DateTime.now()));
        if (_history.length > 20) _history.removeRange(0, _history.length - 20);
        return reply;
      }
      return _demoReply(clean, setupHint: data['error']?.toString());
    } catch (_) {
      return _demoReply(clean);
    }
  }

  String _demoReply(String message, {String? setupHint}) {
    final lower = message.toLowerCase();
    if (lower.contains('yomon') || lower.contains('og\'ri') || lower.contains('yon')) {
      return "Tushunarli, bu muhim. Iltimos darhol 103 ga qo'ng'iroq qiling yoki shifokoringiz bilan bog'laning.";
    }
    if (lower.contains('yaxshi') || lower.contains('yaxshiman')) {
      return "Juda yaxshi. Dorilarni belgilangan vaqtda qabul qilishni davom ettiring.";
    }
    final suffix = setupHint != null ? ' AI server sozlangach batafsil javob beradi.' : ' Hozir offline yordamchi rejimi ishlayapti.';
    return "Sizni tinglayapman. Holatingizni batafsilroq yozing: og'riq, nafas, harorat yoki bosim o'zgarishi bormi?$suffix";
  }
}

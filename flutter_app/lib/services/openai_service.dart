import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models.dart';

/// OpenAI orqali AI chatbot (bemor bilan suhbat).
class OpenAIService {
  final List<ChatMessage> _history = [];

  /// Bemorning sog'liq kontekstini berib, chatbotga savol yuborish
  Future<String> chat(String userMessage, {HealthData? health}) async {
    _history.add(ChatMessage(role: 'user', content: userMessage));

    final systemPrompt = _buildSystemPrompt(health);
    final messages = [
      {'role': 'system', 'content': systemPrompt},
      ..._history.map((m) => {'role': m.role, 'content': m.content}).toList(),
    ];

    // OpenAI kaliti bo'lmasa — demo javob (offline fallback)
    if (Config.openaiApiKey == 'YOUR-OPENAI-KEY' || Config.openaiApiKey.isEmpty) {
      return _demoReply(userMessage);
    }

    final res = await http.post(
      Uri.parse('https://api.openai.com/v1/chat/completions'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${Config.openaiApiKey}',
      },
      body: jsonEncode({
        'model': 'gpt-4o-mini',
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 400,
      }),
    );

    if (res.statusCode != 200) return "Uzr, hozir javob bera olmadim. Yordam uchun 103 ga qo'ng'iroq qiling.";

    final json = jsonDecode(utf8.decode(res.bodyBytes));
    final reply = json['choices']?[0]?['message']?['content']?.toString()?.trim();
    if (reply == null || reply.isEmpty) return "Uzr, tushunmadim.";
    _history.add(ChatMessage(role: 'assistant', content: reply));
    return reply;
  }

  String _buildSystemPrompt(HealthData? health) {
    return '''
Sen CareLink tibbiy yordamchi botisan. O'zbek tilida, iliq va g'amxo'r ohangda javob berasan.
Bemor ma'lumotlari:
- Hozirgi kasallik: ${health?.currentCondition ?? "noma'lum"}
- O'rtacha qon bosimi: ${health?.avgBpSys ?? '—'}/${health?.avgBpDia ?? '—'}
- Puls: ${health?.avgHeartRate ?? '—'}
- Harorat: ${health?.avgTemperature ?? '—'}°C
- SpO2: ${health?.avgSpo2 ?? '—'}%
- Allergiya: ${health?.allergies ?? 'yo\'q'}
- Dorilar: ${health?.medications ?? 'yo\'q'}

Qoidalar:
- Tibbiy tashxis qo'yma, faqat umumiy maslahat va yo'nalish ber.
- Agar holat og'ir tuyulsa, 103 (tez tibbiy yordam) ga qo'ng'iroq qilishni tavsiya et.
- Javoblarni qisqa va tushunarli qil.
''';
  }

  String _demoReply(String msg) {
    final lower = msg.toLowerCase();
    if (lower.contains('yomon') || lower.contains('og\'ri') || lower.contains('yon')) {
      return "Tushunarli, bu muhim. Iltimos darhol 103 (tez tibbiy yordam) ga qo'ng'iroq qiling. O'zingizni qanday holatda his qilyapsiz — nafas olish, og'riq darajasi?";
    }
    if (lower.contains('yaxshi') || lower.contains('yaxshiman')) {
      return "Juda yaxshi! Shunday davom eting. Dorilarni vaqtida qabul qilishni unutmang. Yana bir narsa kerak bo'lsa yozing.";
    }
    return "Sizni tinglayapman. Iltimos batafsilroq yozing: og'riq bormi, qayerda, qachondan beri? (Demo rejim: OpenAI kaliti kiritilgach to'liq ishlaydi)";
  }
}

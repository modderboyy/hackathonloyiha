/// CareLink — konfiguratsiya
/// Ushbu qiymatlarni Supabase va OpenAI hisobingizdan oling.
class Config {
  // Supabase (Project Settings > API)
  static const String supabaseUrl = 'https://YOUR-PROJECT.supabase.co';
  static const String supabaseAnonKey = 'YOUR-ANON-KEY';

  // OpenAI (faqat AI chatbot va soatlik tekshiruv uchun)
  static const String openaiApiKey = 'YOUR-OPENAI-KEY';

  // Premium obuna narxi
  static const double premiumPriceUsd = 5.0;

  // Favqulodda raqamlar (O'zbekiston)
  static const String emergency102 = '102'; // tez yordam (politsiya/103 - tez tibbiy yordam)
  static const String emergency103 = '103'; // tez tibbiy yordam

  // SMS demo rejimi (haqiqiy provider keyinroq)
  static const bool smsDemo = true;
}

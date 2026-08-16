/// CareLink — konfiguratsiya NAMUNASI.
/// Foydalanish uchun bu faylni `config.dart` deb nusxalab, kalitlarni kiriting.
/// `config.dart` gitignore'da — maxfiy kalitlar commit bo'lmaydi.
class Config {
  static const String supabaseUrl = 'https://YOUR-PROJECT.supabase.co';
  static const String supabaseAnonKey = 'YOUR-ANON-KEY';

  // OpenAI (https://platform.openai.com/api-keys)
  static const String openaiApiKey = 'YOUR-OPENAI-KEY';

  static const double premiumPriceUsd = 5.0;

  static const String emergency102 = '102';
  static const String emergency103 = '103';

  static const bool smsDemo = true;
}

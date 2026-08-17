/// CareLink — build-time konfiguratsiya.
/// Maxfiy kalitlar repository ichiga yozilmaydi:
/// flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=... --dart-define=OPENAI_API_KEY=...
class Config {
  static const String supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const String supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const String openaiApiKey = String.fromEnvironment('OPENAI_API_KEY');

  static const double premiumPriceUsd = 5.0;
  static const String emergency102 = '102';
  static const String emergency103 = '103';
  static const bool smsDemo = true;
}

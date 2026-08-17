/// CareLink — build-time konfiguratsiya.
/// Supabase URL va anon key browser/mobile uchun public konfiguratsiya hisoblanadi.
/// Kerak bo'lsa build vaqtida quyidagilar bilan override qiling:
/// flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=... --dart-define=OPENAI_API_KEY=...
class Config {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://flpmqhditzfosvdtbqlw.supabase.co',
  );
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXAiLCJyZWYiOiJmbHBtcWhkaXR6Zm9zdmR0YnFsdzIiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4Njg0MTE5MSwiZXhwIjoyMTAyNDE3MTExfQ.WbJfQnbAkS346cmU7QIXP_kOauSS-HpK-y4sDxjDWJ8',
  );
  // OpenAI kalitini repositoryga yozmang. Kalit yo'q bo'lsa bot offline demo rejimida ishlaydi.
  static const String openaiApiKey = String.fromEnvironment('OPENAI_API_KEY');

  static const double premiumPriceUsd = 5.0;
  static const String emergency102 = '102';
  static const String emergency103 = '103';
  static const bool smsDemo = true;
}

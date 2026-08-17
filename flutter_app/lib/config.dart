/// CareLink — build-time konfiguratsiya.
/// Supabase URL va anon key browser/mobile uchun public konfiguratsiya hisoblanadi.
/// Kerak bo'lsa build vaqtida quyidagilar bilan override qiling:
/// flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
/// OpenAI kaliti Supabase Edge Function secret sifatida saqlanadi, APK ichiga qo'yilmaydi.
class Config {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://flpmqhditzfosvdtbqlw.supabase.co',
  );
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscG1xaGRpdHpmb3N2ZHRicWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NDExMTUsImV4cCI6MjEwMjQxNzExNX0.WbJfQnbAkS346cmU7QIXP_kOauSS-HpK-y4sDxjDWJ8',
  );
  static const double premiumPriceUsd = 5.0;
  static const String emergency102 = '102';
  static const String emergency103 = '103';
  static const bool smsDemo = true;
}

/// CareLink — konfiguratsiya (maxfiy repo uchun to'liq qiymatlar bilan)
class Config {
  static const String supabaseUrl = 'https://flpmqhditzfosvdtbqlw.supabase.co';
  static const String supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscG1xaGRpdHpmb3N2ZHRicWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NDExMTUsImV4cCI6MjEwMjQxNzExNX0.WbJfQnbAkS346cmU7QIXP_kOauSS-HpK-y4sDxjDWJ8';

  static const String openaiApiKey =
      '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';

  static const double premiumPriceUsd = 5.0;
  static const String emergency102 = '102';
  static const String emergency103 = '103';
  static const bool smsDemo = true;

  // OneSignal (tekin push notification) — https://onesignal.com dan oling
  static const String oneSignalAppId = 'YOUR-ONESIGNAL-APP-ID';
}

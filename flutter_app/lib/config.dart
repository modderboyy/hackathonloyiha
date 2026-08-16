/// CareLink — konfiguratsiya
/// Supabase qiymatlari to'ldirilgan. OpenAI kalitini o'zingiz kiriting.
class Config {
  // Supabase (Project Settings > API)
  static const String supabaseUrl = 'https://flpmqhditzfosvdtbqlw.supabase.com';
  static const String supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscG1xaGRpdHpmb3N2ZHRicWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NDExMTUsImV4cCI6MjEwMjQxNzExNX0.WbJfQnbAkS346cmU7QIXP_kOauSS-HpK-y4sDxjDWJ8';

  // OpenAI (faqat AI chatbot va soatlik tekshiruv uchun)
  // https://platform.openai.com/api-keys dan oling
  static const String openaiApiKey = 'YOUR-OPENAI-KEY';

  // Premium obuna narxi
  static const double premiumPriceUsd = 5.0;

  // Favqulodda raqamlar (O'zbekiston)
  static const String emergency102 = '102';
  static const String emergency103 = '103';

  // SMS demo rejimi (haqiqiy provider keyinroq)
  static const bool smsDemo = true;
}

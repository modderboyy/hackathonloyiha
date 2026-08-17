import 'package:flutter/material.dart';

/// CareLink design tokenlari — webdagi Material UI light interfeysi bilan bir xil palitra.
class AppColors {
  static const Color primary = Color(0xFF155EEF);
  static const Color primaryDark = Color(0xFF004EEB);
  static const Color primaryDarker = Color(0xFF0B1F4A);
  static const Color accent = Color(0xFF2E90FA);
  static const Color cyan = Color(0xFF0E9384);
  static const Color emerald = Color(0xFF12B76A);
  static const Color amber = Color(0xFFF79009);
  static const Color red = Color(0xFFF04438);

  static const Color bg = Color(0xFFF7F9FC);
  static const Color bgCard = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFF2F4F7);

  static const Color textPrimary = Color(0xFF101828);
  static const Color textSecondary = Color(0xFF475467);
  static const Color textMuted = Color(0xFF98A2B3);
  static const Color border = Color(0xFFEAECF0);

  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF528BFF), Color(0xFF155EEF), Color(0xFF004EEB)],
  );

  static const LinearGradient neonGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2E90FA), Color(0xFF155EEF), Color(0xFF7A5AF8)],
  );

  static const LinearGradient bgGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF8FAFC), Color(0xFFF7F9FC), Color(0xFFEFF4FF)],
  );
}

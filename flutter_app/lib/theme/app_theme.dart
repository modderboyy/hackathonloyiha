import 'package:flutter/material.dart';

/// CareLink — light dizayn tizimi
/// Deep blue primary, oq/och fon, shaffof kartalar.

class AppColors {
  // Deep blue palitra (primary saqlanadi)
  static const Color primary = Color(0xFF1E3A8A); // deep blue
  static const Color primaryDark = Color(0xFF1D4ED8);
  static const Color primaryDarker = Color(0xFF172554);
  static const Color accent = Color(0xFF2563EB); // electric blue
  static const Color cyan = Color(0xFF0891B2);
  static const Color emerald = Color(0xFF10B981);
  static const Color amber = Color(0xFFF59E0B);
  static const Color red = Color(0xFFEF4444);

  // Fon (LIGHT)
  static const Color bg = Color(0xFFF4F6FA);
  static const Color bgCard = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFEDF1F7);

  // Matn (LIGHT)
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted = Color(0xFF94A3B8);

  // Gradientlar
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF3B82F6), Color(0xFF1E3A8A), Color(0xFF172554)],
  );

  static const LinearGradient neonGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0891B2), Color(0xFF2563EB), Color(0xFF7C3AED)],
  );

  // Och fon gradienti (light mode)
  static const LinearGradient bgGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFEEF2FF), Color(0xFFF4F6FA), Color(0xFFE0E7FF)],
  );
}

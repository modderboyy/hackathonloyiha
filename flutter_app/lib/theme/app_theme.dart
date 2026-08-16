import 'package:flutter/material.dart';

/// CareLink — digital/cyber dizayn tizimi
/// Deep blue primary, sharp/slant qirralar, glassmorphism (blur).

class AppColors {
  // Deep blue palitra
  static const Color primary = Color(0xFF1E3A8A); // deep blue
  static const Color primaryDark = Color(0xFF172554);
  static const Color primaryDarker = Color(0xFF0F172A);
  static const Color accent = Color(0xFF3B82F6); // electric blue
  static const Color cyan = Color(0xFF06B6D4); // neon accent
  static const Color emerald = Color(0xFF10B981);
  static const Color amber = Color(0xFFF59E0B);
  static const Color red = Color(0xFFEF4444);

  // Fon
  static const Color bg = Color(0xFF070D1A); // juda quyuq ko'k
  static const Color bgCard = Color(0xFF0B1526);
  static const Color surface = Color(0xFF101E38);

  // Matn
  static const Color textPrimary = Color(0xFFE2E8F0);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  // Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF3B82F6), Color(0xFF1E3A8A), Color(0xFF172554)],
  );

  static const LinearGradient neonGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF06B6D4), Color(0xFF3B82F6), Color(0xFF8B5CF6)],
  );
}

import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// ============================================================
/// CareLink Custom UI — digital/cyber uslub
/// Sharp (slant) qirralar, glassmorphism (blur), neon aksentlar
/// ============================================================

/// Qirralarni qiya (slant) kesuvchi klip
class SlantClipper extends CustomClipper<Path> {
  final double cut; // kesiladigan burchak o'lchami
  const SlantClipper({this.cut = 14});

  @override
  Path getClip(Size size) {
    final path = Path();
    path.moveTo(cut, 0); // yuqori-chap qiya
    path.lineTo(size.width, 0);
    path.lineTo(size.width, size.height - cut); // o'ng-past qiya
    path.lineTo(size.width - cut, size.height);
    path.lineTo(0, size.height);
    path.lineTo(0, cut);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(SlantClipper oldClipper) => oldClipper.cut != cut;
}

/// Glass (blur) kontener — glassmorphism
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;
  final double cut;
  final bool border;
  final Color? tint;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.cut = 14,
    this.border = true,
    this.tint,
  });

  @override
  Widget build(BuildContext context) {
    return ClipPath(
      clipper: SlantClipper(cut: cut),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                (tint ?? AppColors.surface).withOpacity(0.55),
                (tint ?? AppColors.bgCard).withOpacity(0.35),
              ],
            ),
            border: border
                ? Border.all(
                    color: AppColors.accent.withOpacity(0.25),
                    width: 1,
                  )
                : null,
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Neon qiya tugma (primary)
class SlantButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool outline;
  final IconData? icon;
  final bool loading;

  const SlantButton({
    super.key,
    required this.label,
    this.onPressed,
    this.outline = false,
    this.icon,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;
    return GestureDetector(
      onTap: enabled ? onPressed : null,
      child: Opacity(
        opacity: enabled ? 1 : 0.5,
        child: ClipPath(
          clipper: const SlantClipper(cut: 12),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            decoration: BoxDecoration(
              gradient: outline ? null : AppColors.primaryGradient,
              color: outline ? Colors.transparent : null,
              border: outline
                  ? Border.all(color: AppColors.accent.withOpacity(0.6), width: 1.5)
                  : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (loading)
                  const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                else ...[
                  if (icon != null) ...[
                    Icon(icon, color: Colors.white, size: 18),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Neon glow yozuv (sarlavha)
class NeonText extends StatelessWidget {
  final String text;
  final double size;
  final Color color;
  final FontWeight weight;
  final TextAlign align;

  const NeonText(
    this.text, {
    super.key,
    this.size = 24,
    this.color = AppColors.textPrimary,
    this.weight = FontWeight.bold,
    this.align = TextAlign.start,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      textAlign: align,
      style: TextStyle(
        fontSize: size,
        fontWeight: weight,
        color: color,
        letterSpacing: 0.3,
        shadows: [
          Shadow(
            color: AppColors.accent.withOpacity(0.5),
            blurRadius: 18,
          ),
        ],
      ),
    );
  }
}

/// Neon aksent chiziq (dekorativ)
class AccentLine extends StatelessWidget {
  final double width;
  const AccentLine({super.key, this.width = 40});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: 3,
      decoration: BoxDecoration(
        gradient: AppColors.neonGradient,
        boxShadow: [
          BoxShadow(color: AppColors.cyan.withOpacity(0.6), blurRadius: 8),
        ],
      ),
    );
  }
}

/// Input maydoni (glass, qiya)
class GlassInput extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final bool obscure;
  final TextInputType? keyboardType;
  final String? hint;
  final TextCapitalization textCapitalization;
  final ValueChanged<String>? onChanged;
  final int? maxLength;
  final int? maxLines;

  const GlassInput({
    super.key,
    required this.label,
    this.controller,
    this.obscure = false,
    this.keyboardType,
    this.hint,
    this.textCapitalization = TextCapitalization.none,
    this.onChanged,
    this.maxLength,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 8),
        ClipPath(
          clipper: const SlantClipper(cut: 10),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface.withOpacity(0.6),
              border: Border.all(color: AppColors.accent.withOpacity(0.2)),
            ),
            child: TextField(
              controller: controller,
              obscureText: obscure,
              keyboardType: keyboardType,
              maxLength: maxLength,
              maxLines: maxLines,
              textCapitalization: textCapitalization,
              onChanged: onChanged,
              style: const TextStyle(color: AppColors.textPrimary),
              cursorColor: AppColors.accent,
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(color: AppColors.textMuted),
                counterText: '',
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: InputBorder.none,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Statistika katagi (katta raqam + label)
class StatTile extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;

  const StatTile({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
    this.color = AppColors.accent,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      cut: 12,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 26,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

/// To'ldirilgan ball (holat indikatori)
class StatusDot extends StatelessWidget {
  final Color color;
  final bool pulse;

  const StatusDot({super.key, required this.color, this.pulse = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: [
          if (pulse) BoxShadow(color: color.withOpacity(0.7), blurRadius: 8, spreadRadius: 2),
          if (!pulse) BoxShadow(color: color.withOpacity(0.4), blurRadius: 4),
        ],
      ),
    );
  }
}

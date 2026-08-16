import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_ui.dart';
import 'home_screen.dart';

/// Klinik (B2B) obuna — klinikani tanlash yoki kod kiritish.
class ClinicCodeScreen extends StatefulWidget {
  const ClinicCodeScreen({super.key});

  @override
  State<ClinicCodeScreen> createState() => _ClinicCodeScreenState();
}

class _ClinicCodeScreenState extends State<ClinicCodeScreen> {
  final _code = TextEditingController();
  List<Clinic> _clinics = [];
  String? _selectedClinic;
  String? _error;
  bool _busy = false;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _loadClinics();
  }

  Future<void> _loadClinics() async {
    final clinics = await context.read<AppState>().db.getClinics();
    if (mounted) {
      setState(() {
        _clinics = clinics;
        _loaded = true;
      });
    }
  }

  Future<void> _activate() async {
    final code = _code.text.trim();
    if (code.isEmpty) {
      setState(() => _error = 'Kodni kiriting');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final error = await context.read<AppState>().activateClinic(code);
    if (!mounted) return;
    setState(() => _busy = false);
    if (error != null) {
      setState(() => _error = error);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Klinik obuna faollashtirildi! Ma\u2019lumotlar sinxronlandi.'),
          backgroundColor: AppColors.emerald,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.primaryDarker, AppColors.bg, AppColors.primaryDark],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 12),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: AppColors.textSecondary),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 4),
                    const NeonText('KLINIK OBUNA', size: 20),
                  ],
                ),
                const SizedBox(height: 16),
                GlassCard(
                  cut: 14,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const NeonText('KLINIKANI TANLANG', size: 14),
                      const SizedBox(height: 6),
                      const Text(
                        'Ixtiyoriy — kodni to\u2019g\u2019ridan kiritsangiz ham bo\u2019ladi',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                      const SizedBox(height: 14),
                      _loaded
                          ? ClipPath(
                              clipper: const SlantClipper(cut: 10),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: AppColors.surface.withOpacity(0.6),
                                  border: Border.all(color: AppColors.accent.withOpacity(0.2)),
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<String>(
                                    isExpanded: true,
                                    value: _selectedClinic,
                                    dropdownColor: AppColors.bgCard,
                                    iconEnabledColor: AppColors.cyan,
                                    style: const TextStyle(color: AppColors.textPrimary),
                                    hint: const Text('Klinikani tanlang (ixtiyoriy)', style: TextStyle(color: AppColors.textMuted)),
                                    items: _clinics
                                        .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name, overflow: TextOverflow.ellipsis)))
                                        .toList(),
                                    onChanged: (v) => setState(() => _selectedClinic = v),
                                  ),
                                ),
                              ),
                            )
                          : const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16),
                                child: CircularProgressIndicator(color: AppColors.cyan),
                              ),
                            ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                GlassCard(
                  cut: 14,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const NeonText('STATSIONAR KODI', size: 14),
                      const SizedBox(height: 6),
                      const Text(
                        'Bu kodni klinikangizdagi shifokor beradi',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                      const SizedBox(height: 14),
                      GlassInput(
                        label: 'KOD',
                        controller: _code,
                        hint: 'Masalan: A1B2C3D4',
                        textCapitalization: TextCapitalization.characters,
                        onChanged: (_) => setState(() => _error = null),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 10),
                        Text(_error!, style: const TextStyle(color: AppColors.red)),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                SlantButton(
                  label: _busy ? 'FAOLLASHTIRILMOQDA...' : 'FAOLLASHTIRISH',
                  icon: Icons.key,
                  loading: _busy,
                  onPressed: _activate,
                ),
                const SizedBox(height: 18),
                const Text(
                  'Kodni qayerdan olasiz? Statsionarga yotqizilganingizda shifokor sizga bemor kodingizni beradi. Bu kod davolash muddati davomida klinik obunani faollashtiradi va barcha tibbiy ma\u2019lumotlaringizni (dori-darmon, tavsiyalar) avtomatik sinxronlaydi.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

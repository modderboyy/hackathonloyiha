import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../state/app_state.dart';
import 'home_screen.dart';

/// Klinik (B2B) obuna — klinikani tanlash yoki kod kiritish.
/// Kod = klinikadagi bemorning statsionar (hospitalization) kodi.
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
        const SnackBar(content: Text('Klinik obuna faollashtirildi! Ma\u2019lumotlar sinxronlandi.')),
      );
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Klinik obuna'), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ShadCard(
              title: const Text('Klinikangizni tanlang', style: TextStyle(fontWeight: FontWeight.bold)),
              description: const Text('Ixtiyoriy — kodni to\u2019g\u2019ridan-to\u2019g\u2019ri kiritsangiz ham bo\u2019ladi'),
              child: _loaded
                  ? ShadSelect<String>(
                      placeholder: const Text('Klinikani tanlang (ixtiyoriy)'),
                      options: _clinics
                          .map((c) => ShadOption(value: c.id, child: Text(c.name)))
                          .toList(),
                      selectedOptionBuilder: (context, v) {
                        Clinic? c;
                        for (final x in _clinics) {
                          if (x.id == v) { c = x; break; }
                        }
                        return Text(c?.name ?? 'Klinikani tanlang');
                      },
                      onChanged: (v) => setState(() => _selectedClinic = v),
                    )
                  : const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator())),
            ),
            const SizedBox(height: 16),
            ShadCard(
              title: const Text('Statsionar kodi', style: TextStyle(fontWeight: FontWeight.bold)),
              description: const Text('Bu kodni klinikangizdagi shifokor beradi'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ShadInput(
                    controller: _code,
                    textCapitalization: TextCapitalization.characters,
                    placeholder: const Text('Masalan: A1B2C3D4'),
                    onChanged: (_) => setState(() => _error = null),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(_error!, style: const TextStyle(color: Colors.red)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),
            ShadButton(
              onPressed: _busy ? null : _activate,
              child: Text(_busy ? 'Faollashtirilmoqda...' : 'Faollashtirish'),
            ),
            const SizedBox(height: 16),
            const Text(
              'Kodni qayerdan olasiz? Statsionarga yotqizilganingizda shifokor sizga bemor kodingizni beradi. Bu kod davolash muddati davomida klinik obunani faollashtiradi va barcha tibbiy ma\u2019lumotlaringizni (dori-darmon, tavsiyalar) avtomatik sinxronlaydi.',
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:forui/forui.dart';
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
      // Muvaffaqiyatli — bemor ma'lumotlari va dori-darmonlar sinxronlandi
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Klinik obuna faollashtirildi! Ma\u2019lumotlar sinxronlandi.')),
      );
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return FScaffold(
      header: const FHeader(title: Text('Klinik obuna')),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FCard(
              title: const Text('Klinikangizni tanlang', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Ixtiyoriy — kodni to\u2019g\u2019ridan-to\u2019g\u2019ri kiritsangiz ham bo\u2019ladi'),
              child: _loaded
                  ? DropdownButtonFormField<String>(
                      initialValue: _selectedClinic,
                      decoration: const InputDecoration(
                        labelText: 'Klinika',
                        hintText: 'Klinikani tanlang (ixtiyoriy)',
                        border: OutlineInputBorder(),
                      ),
                      items: _clinics
                          .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                          .toList(),
                      onChanged: (v) => setState(() => _selectedClinic = v),
                    )
                  : const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator())),
            ),
            const SizedBox(height: 16),
            FCard(
              title: const Text('Statsionar kodi', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Bu kodni klinikangizdagi shifokor beradi'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _code,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(
                      labelText: 'Kod',
                      hintText: 'Masalan: A1B2C3D4',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(_error!, style: const TextStyle(color: Colors.red)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),
            FButton(
              onPress: _busy ? null : _activate,
              child: _busy ? const Text('Faollashtirilmoqda...') : const Text('Faollashtirish'),
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

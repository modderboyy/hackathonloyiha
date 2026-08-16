import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'config.dart';
import 'state/app_state.dart';
import 'screens/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Vaqt mintaqasini sozlash (eslatmalar uchun)
  tz.initializeTimeZones();
  tz.setLocalLocation(tz.getLocation('Asia/Tashkent'));

  await Supabase.initialize(
    url: Config.supabaseUrl,
    anonKey: Config.supabaseAnonKey,
  );

  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState()..init(),
      child: const CareLinkApp(),
    ),
  );
}

class CareLinkApp extends StatelessWidget {
  const CareLinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ShadApp(
      title: 'CareLink — Bemor ilovasi',
      debugShowCheckedModeBanner: false,
      home: const SplashScreen(),
    );
  }
}

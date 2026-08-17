// Generated-style Firebase configuration for CareLink Android.
// These values are public Firebase app identifiers, not server credentials.
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      default:
        throw UnsupportedError('Firebase options bu platform uchun sozlanmagan. Android builddan foydalaning.');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCs_XdRFWQOHWY62oJGqicUhK8Nv-ZzXWo',
    appId: '1:605061295469:android:56666de6e30f85ce75be64',
    messagingSenderId: '605061295469',
    projectId: 'carelink-ca427',
    storageBucket: 'carelink-ca427.firebasestorage.app',
  );
}

# Firebase + Android/Web support — to'liq yo'riqnoma

## 1. Android va Web support qo'shish (cmd)

Loyiha ildizida (`flutter_app` papkasida) shu buyruqni bajarasiz:

```bash
cd flutter_app

# Android + Web support qo'shish (package name google-services.json bilan mos)
flutter create . --org com.modder --project-name carelink --platforms=android,web
```

> **Muhim:** `--org com.modder` + `--project-name carelink` = package name `com.modder.carelink`,
> bu sizning `google-services.json` dagi package name bilan bir xil. ✓

Bu buyruq `android/` va `web/` papkalarini yaratadi (mavjud `lib/`, `pubspec.yaml` saqlanadi).

## 2. Android build.gradle sozlash

### 2a. `android/settings.gradle` — google-services plugin

```groovy
pluginManagement {
    def flutterSdkPath = {
        def properties = new Properties()
        file("local.properties").withInputStream { properties.load(it) }
        def flutterSdkPath = properties.getProperty("flutter.sdk")
        assert flutterSdkPath != null, "flutter.sdk not set in local.properties"
        return flutterSdkPath
    }()

    includeBuild("$flutterSdkPath/packages/flutter_tools/gradle")

    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id "dev.flutter.flutter-plugin-loader" version "1.0.0"
    id "com.android.application" version "8.3.0" apply false
    id "org.jetbrains.kotlin.android" version "1.9.22" apply false
    id "com.google.gms.google-services" version "4.4.1" apply false  // ← qo'shish
}

include ":app"
```

### 2b. `android/app/build.gradle` — plugin + dependency

Faylning **oxiriga** (yoki plugins blokiga):

```groovy
plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
    id "com.google.gms.google-services"  // ← qo'shish
}
```

va `dependencies` blokiga:

```groovy
dependencies {
    implementation platform('com.google.firebase:firebase-bom:33.1.0')  // ← qo'shish
    implementation 'com.google.firebase:firebase-messaging'             // ← qo'shish
}
```

### 2c. `android/app/src/main/AndroidManifest.xml` — ruxsatlar

`<manifest>` ichiga:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

## 3. google-services.json

Fayl allaqachon joylashtirildi:
```
flutter_app/android/app/google-services.json
```

## 4. Firebase V1 API — service account (edge function uchun)

Sizda Legacy API disabled, **V1 API enabled**. V1 API service account orqali ishlaydi.

1. Firebase Console → Project settings → **Service accounts** tab
2. **"Generate new private key"** bosing → JSON fayl yuklanadi
3. Shu JSON'dan 3 ta qiymatni menga yuboring (yoki Supabase'ga qo'ying):
   - `project_id` → `FIREBASE_PROJECT_ID` (sizda: `carelink-ca427`)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

## 5. Supabase Edge Function env

```bash
supabase secrets set \
  FIREBASE_PROJECT_ID=carelink-ca427 \
  FIREBASE_CLIENT_EMAIL=...@...gserviceaccount.com \
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

## 6. Web (PWA) push uchun

Web'da push uchun Firebase Web configuration kerak:
- Firebase Console → Project settings → General → Web app qo'shing
- Olingan `firebaseConfig` (apiKey, projectId, messagingSenderId...) ni menga bering
- Keyin `web/index.html` va `firebase-messaging-sw.js` (service worker) qo'shaman

## Xulosa — menga kerakli narsalar

| Narsa | Holat |
|---|---|
| `google-services.json` | ✅ Qabul qilindi va joylashtirildi |
| Firebase **Service Account JSON** (V1 API uchun) | ❌ Kerak — yuklab yuboring |
| Web `firebaseConfig` | ❌ Keyinroq (web push uchun) |

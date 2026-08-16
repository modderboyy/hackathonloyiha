# Firebase Push Notification — Android sozlash (bosqichma-bosqich)

Push notification Android'da ishlashi uchun quyidagilarni bajarasiz.
Men kerakli qiymatlarni olganingizdan keyin kodga joylab beraman.

## 1. Firebase loyihasini yaratish

1. [console.firebase.google.com](https://console.firebase.google.com) ga kiring
2. **"Add project"** → loyihaga nom bering (masalan: `carelink`)
3. Google Analytics ixtiyoriy (yoqish shart emas) → **Create project**

## 2. Android ilovani qo'shish

1. Firebase Console → loyihangizni oching → **⚙️ Project settings**
2. **"Add app"** → **Android** belgisini bosing
3. **Android package name** ni kiriting:
   ```
   uz.carelink.carelink_patient
   ```
   > Muhim: bu `android/app/build.gradle` dagi `applicationId` bilan bir xil bo'lishi kerak.
   > Agar boshqacha bo'lsa, ilova package nomini `flutter create` paytida
   > `--org uz.carelink` deb yaratganingizni tekshiring.

4. **Register app** bosing
5. **`google-services.json`** faylini yuklab oling
6. Bu faylni shu joyga joylang:
   ```
   flutter_app/android/app/google-services.json
   ```

## 3. FCM Server Key (edge function uchun)

1. Firebase Console → **Project settings → Cloud Messaging**
2. **"Cloud Messaging API (Legacy)"** bo'limida **Server key** ni nusxalang
   (agar ko'rinmasa, "Cloud Messaging API" ni yoqing)
3. Bu kalitni menga yuboring — men `hourly-check` edge function'ga joylab beraman.

## 4. Menga beradigan narsalar (xulosa)

| Narsa | Qayerdan |
|---|---|
| `google-services.json` | Firebase → Project settings → Android app |
| **FCM Server Key** | Firebase → Cloud Messaging → Server key |

Shu ikkitasini bersangiz, men:
- `google-services.json` ni to'g'ri joyga qo'yaman
- `android/app/build.gradle` ni sozlayman
- Edge function'ga FCM server key'ni joylayman

## Eslatma

- Hozirgi kod `firebase_core` + `firebase_messaging` bilan tayyor.
- `main.dart` da `FirebaseMessagingService.init()` chaqiriladi (app_state orqali).
- Token avtomatik `profiles.fcm_token` ga saqlanadi.
- Edge function har soatda shu tokenlarga push yuboradi.

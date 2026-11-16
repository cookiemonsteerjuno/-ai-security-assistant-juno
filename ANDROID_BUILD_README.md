# Build Sentinel AI for Android (without Android Studio)

This project is packaged with Capacitor so GitHub Actions can build a debug APK remotely.

## GitHub setup
1. Upload the contents of this ZIP into the root of your repository (keep `.github/workflows/build-android-apk.yml`).
2. Commit the changes to `main` (or `master`).
3. Open the repository's **Actions** tab.
4. Choose **Build Sentinel AI Android APK** and select **Run workflow** if it did not start automatically.
5. Open the completed run and download the `sentinel-ai-debug-apk` artifact. Extract it; the APK is `app-debug.apk`.
6. On the Motorola, open the APK and allow installation from that source if Android asks.

## Gemini API key
The APK build works without a key, but Gemini-powered chat/voice requests will not work until a key is configured. If you set a GitHub Actions secret named `GEMINI_API_KEY`, it is embedded in the client bundle and can be extracted from the APK. For a real production release, use a server-side proxy rather than shipping a private API key in the app.

## Scope of this APK
This packages the existing React/Vite interface inside an Android app. It does not automatically grant Android system privileges or implement privileged functions such as packet interception, changing SIM settings, firewall control, or monitoring other apps. Those require separate native Android implementation and user-granted permissions, and some are restricted by Android.

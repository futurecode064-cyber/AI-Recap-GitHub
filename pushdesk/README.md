# Future Code PushDesk

Central notification infrastructure for Future Code AI Studio.

## Apps
- Admin: `com.futurecode.pushdesk`
- Test receiver: `com.futurecode.pushdesk.receiver`

## Backend
- Send endpoint: `https://mxwervqihaqlxybghdak.supabase.co/functions/v1/fc-pushdesk-send`
- Signing endpoint: `https://mxwervqihaqlxybghdak.supabase.co/functions/v1/fc-pushdesk-signing`

The Admin API token is not committed to GitHub or embedded in the APK. The Android admin app stores the owner-entered token encrypted with Android Keystore.

The Firebase service-account credential is also never embedded in an APK. The send backend expects the server-side secret `FIREBASE_SERVICE_ACCOUNT_JSON`. Until that secret is configured, the backend status endpoint works but live FCM sending returns `firebase-not-configured`.

## Receiver build configuration
The receiver is buildable without Firebase values. For live FCM registration the GitHub build environment must provide:
- `FC_FIREBASE_API_KEY`
- `FC_FIREBASE_APP_ID`
- `FC_FIREBASE_PROJECT_ID`
- `FC_FIREBASE_SENDER_ID`

The Firebase Android app registration must match the receiver applicationId before live token registration is considered verified.

# Future Code RentTrack v1.0.0

Professional Android offline-first property and rent management, based on the prior Future Code RentTrack source prototype.

**Application ID:** studio.futurecode.renttrack, **min Android:** 9.0 (API 28).

Implemented: rooms / tenants and contract dates, monthly rent invoices, utility meter readings and rates, water charges, deposits, due dates, idempotent monthly invoice generation with atomic IndexedDB transactions, payment history, invoice/receipt printing via native Android PrintManager (Save as PDF), encrypted AES-256-GCM + PBKDF2 backup, validated restore through Storage Access Framework, offline monthly reports, CSV export, native launcher branding.

No network permission; single-device use only. No cloud sync, Android background reminders, automated bank transfers, or multi-user administration.

### QA/production gates
- GitHub Actions builds debug APK and unsigned release.
- Signed stable public release only when permanent signing credentials available; debug builds are for device QA only.
- Test encrypted export/restore, bill immutability and partial payments on a physical Android phone before reliance on actual financial records.
- Preserve package ID and signing keystore for future upgrades.

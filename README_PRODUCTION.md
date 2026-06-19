Production checklist and deployment notes

1) Environment
- Create a `.env` (not committed) with VITE_FIREBASE_* variables. See `.env.example`.

2) Firebase
- Create a Firebase project and enable Firestore.
- Use a production Firestore rules configuration. Example for authenticated users only:

```
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read to any authenticated user
    match /checklists/{doc} {
      allow read: if request.auth != null;
      // Allow write for authenticated users with a `role` claim equal to "motorista" or "administrador"
      allow write: if request.auth != null && (request.auth.token.role == 'motorista' || request.auth.token.role == 'administrador');
    }
  }
}
```

- For testing only you can use permissive rules, but do NOT use them in production.

3) Vercel
- Connect this repo to Vercel.
- Set Environment Variables in Project Settings (Production and Preview): use the same VITE_FIREBASE_* values.
- Build Command: `npm run build` and Output Directory: `dist`.

4) Network / Access
- For local testing across devices, run `npm run dev` and access `http://<your-pc-ip>:3000` from the phone (same Wi-Fi).
- Alternatively use `ngrok` for remote tunneling during tests.

5) Security and Auth
- For production, implement Firebase Authentication and issue custom claims (`role`) for drivers/admins. This prevents unauthorized writes.
- If you want, I can add Firebase Auth UI and server-side tools to issue claims.

6) Observability
- Consider adding Analytics and basic logging for production issues.

7) Next steps I can do for you
- Add Firebase Auth (email or phone) for drivers + admin panel.
- Harden Firestore rules and test with authenticated flows.
- Configure Vercel deployment and set environment variables automatically (requires access).

If you want I can implement Firebase Auth and integrate role-based writes next (recommended).
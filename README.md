# Famora - Family Organization App

Eine moderne Familien-Organisations-App gebaut mit Expo und Supabase.

## Setup

### 1. Dependencies installieren
```bash
npm install
```

### 2. Supabase Setup
1. Erstellen Sie ein neues Projekt auf [Supabase](https://supabase.com)
2. Kopieren Sie `.env.example` zu `.env`
3. Fügen Sie Ihre Supabase Credentials ein:
   - `EXPO_PUBLIC_SUPABASE_URL`: Ihre Supabase Projekt URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Ihr Supabase Anon Key
4. Führen Sie ALLE Migrations aus (in Supabase Dashboard > SQL Editor):
   - Kopieren Sie den Inhalt jeder Datei aus `supabase/migrations/` 
   - Führen Sie sie in der korrekten Reihenfolge aus:
     1. `create_missing_tables.sql` - Erstellt alle erforderlichen Tabellen
   - **WICHTIG**: Ohne diese Migrations funktioniert die App nicht!

### 3. Expo Go
```bash
npx expo start
```

Scannen Sie den QR-Code mit der Expo Go App auf Ihrem Handy.

### 4. Development Build (Empfohlen für volle Funktionalität)
```bash
# Für iOS
eas build --platform ios --profile development

# Für Android  
eas build --platform android --profile development
```

## Features

- 👨‍👩‍👧‍👦 **Familien-Management**: Erstellen und verwalten Sie Ihre Familie
- ✅ **Aufgaben**: Teilen und verfolgen Sie Familienaufgaben
- 🛒 **Einkaufslisten**: Gemeinsame Einkaufslisten für die ganze Familie
- 📅 **Kalender**: Familienkalender für Termine und Events
- 👤 **Profile**: Individuelle Familienprofile mit Avataren
- 🔐 **Sichere Authentifizierung**: E-Mail/Passwort Login mit Supabase

## Expo Go Einschränkungen

Einige Features sind in Expo Go eingeschränkt:
- Kamera-Funktionen (Profilbilder)
- Bildauswahl aus der Galerie
- Push-Notifications

Für die volle Funktionalität verwenden Sie bitte einen Development Build.

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router
- **Backend**: Supabase (Auth, Database, Storage)
- **Styling**: Custom StyleSheet mit Reanimated
- **Icons**: Lucide React Native
- **Fonts**: Inter & Montserrat (Google Fonts)

## Projektstruktur

```
app/
├── (auth)/           # Authentication screens
├── (onboarding)/     # Onboarding flow
├── (tabs)/          # Main app tabs
├── _layout.tsx      # Root layout
└── index.tsx        # Entry point

components/          # Reusable components
contexts/           # React contexts (Auth, Family, etc.)
lib/               # Utilities and configurations
utils/             # Helper functions
```

## Development

### Supabase Migrations
Die Datenbank-Migrations befinden sich in `supabase/migrations/`. Diese müssen in Ihrem Supabase Projekt ausgeführt werden.

### Environment Variables
Alle Environment Variables müssen mit `EXPO_PUBLIC_` prefixed sein, um in der App verfügbar zu sein.

## Deployment

### Expo Application Services (EAS)
```bash
# Build für Production
eas build --platform all --profile production

# Deploy Update
eas update --branch production
```

## Troubleshooting

### Supabase Verbindungsprobleme
1. Überprüfen Sie Ihre `.env` Datei
2. Stellen Sie sicher, dass die Supabase URL und Keys korrekt sind
3. Prüfen Sie die Netzwerkverbindung
4. Schauen Sie in die Expo Dev Tools für weitere Fehlermeldungen

### Expo Go Issues
- Starten Sie Expo mit `npx expo start --clear`
- Löschen Sie den Expo Go Cache
- Verwenden Sie einen Development Build für native Features

## Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue in diesem Repository.
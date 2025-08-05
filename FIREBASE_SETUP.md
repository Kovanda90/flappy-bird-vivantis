# 🔥 Firebase Setup Guide

## Krok 1: Vytvoření Firebase projektu

1. **Jděte na [Firebase Console](https://console.firebase.google.com/)**
2. **Klikněte na "Create a project" nebo "Add project"**
3. **Zadejte název projektu** (např. "flappy-bird-vivantis")
4. **Povolte Google Analytics** (volitelné)
5. **Klikněte na "Create project"**

## Krok 2: Nastavení Firestore Database

1. **V levém menu klikněte na "Firestore Database"**
2. **Klikněte na "Create database"**
3. **Vyberte "Start in test mode"** (pro jednoduchost)
4. **Vyberte lokaci** (např. "europe-west1")
5. **Klikněte na "Done"**

## Krok 3: Získání konfigurace

1. **V levém menu klikněte na "Project settings"** (ozubené kolo)
2. **Scrollujte dolů na "Your apps"**
3. **Klikněte na ikonu webu (</>)**
4. **Zadejte název aplikace** (např. "Flappy Bird Web")
5. **Klikněte na "Register app"**
6. **Zkopírujte konfiguraci**

## Krok 4: Aktualizace firebase-config.js

Nahraďte hodnoty v `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC...", // Váš API klíč
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

## Krok 5: Nastavení pravidel Firestore

1. **V Firestore Database klikněte na "Rules"**
2. **Nahraďte pravidla tímto kódem:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{document} {
      allow read, write: if true;
    }
  }
}
```

3. **Klikněte na "Publish"**

## Krok 6: Testování

1. **Otevřete hru v prohlížeči**
2. **Hrajte a dosáhněte skóre**
3. **Zadejte své jméno**
4. **Zkontrolujte Firebase Console** - měli byste vidět nový záznam

## 🔧 Troubleshooting

### Problém: "Firebase není dostupné"
- Zkontrolujte, že jste správně nakonfigurovali `firebase-config.js`
- Otevřete Developer Tools (F12) a zkontrolujte konzoli

### Problém: "Permission denied"
- Zkontrolujte Firestore pravidla
- Ujistěte se, že máte povolené čtení a zápis

### Problém: "Network error"
- Zkontrolujte internetové připojení
- Zkuste obnovit stránku

## 📱 Pro mobilní zařízení

Hra bude fungovat na všech zařízeních, která mají přístup k internetu. Všichni hráči uvidí stejný žebříček v reálném čase!

## 🚀 Nasazení

Po nastavení Firebase můžete hru nasadit na:
- GitHub Pages
- Firebase Hosting
- Vercel
- Netlify

Všechny tyto platformy jsou zdarma pro malé projekty. 
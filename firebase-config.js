// Firebase konfigurace
// Nahraďte tyto hodnoty skutečnými údaji z vašeho Firebase projektu
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id-here"
};

// Inicializace Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Export pro použití v game.js
window.db = db; 
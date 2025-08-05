// Firebase konfigurace
const firebaseConfig = {
    apiKey: "AIzaSyB0DG5wwG9bFz1kObQY1hjAYuROAFccAq8",
    authDomain: "flappy-bird---viva.firebaseapp.com",
    projectId: "flappy-bird---viva",
    storageBucket: "flappy-bird---viva.firebasestorage.app",
    messagingSenderId: "143121183377",
    appId: "1:143121183377:web:ba6cf81e210294f20a8530"
};

// Inicializace Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Export pro použití v game.js
window.db = db; 
// ---- FIREBASE SETUP ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDgrmRTjBur3HKn9S9B5bGpJlEy5q3Ttuo",
    authDomain: "taskquest-285f5.firebaseapp.com",
    projectId: "taskquest-285f5",
    storageBucket: "taskquest-285f5.firebasestorage.app",
    messagingSenderId: "146866223553",
    appId: "1:146866223553:web:030ded56d1c1168b37d740",
    measurementId: "G-36EZXRBY70"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ---- DOM ELEMENTS ----
const welcomeScreen = document.getElementById('welcome-screen');
const appContainer = document.getElementById('app-container');

// Auth Inputs & Buttons
const usernameInput = document.getElementById('username-input');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const emailLoginBtn = document.getElementById('email-login-btn');
const emailSignupBtn = document.getElementById('email-signup-btn');
const googleSigninBtn = document.getElementById('google-signin-btn');
const classSelection = document.getElementById('class-selection');

// Game UI Elements
const playerUsername = document.getElementById('player-username');
const playerClassIcon = document.getElementById('player-class-icon');
const levelDisplay = document.getElementById('level-display');
const xpDisplay = document.getElementById('xp-display');
const xpNeededDisplay = document.getElementById('xp-needed-display');
const xpBar = document.getElementById('xp-bar');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const difficultySelect = document.getElementById('difficulty-select');
const taskList = document.getElementById('task-list');
const achievementsList = document.getElementById('achievements-list');

// Modals
const levelUpModal = document.getElementById('level-up-modal');
const newLevelDisplay = document.getElementById('new-level-display');
const closeModalBtn = document.getElementById('close-modal-btn');
const playerTitle = document.getElementById('player-title');
const titleUnlockModal = document.getElementById('title-unlock-modal');
const newTitleDisplay = document.getElementById('new-title-display');
const closeTitleModalBtn = document.getElementById('close-title-modal-btn');

// ---- GAME STATE ----
let state = {
    uid: '', 
    username: 'Player',
    playerClass: 'Paladin',
    level: 1,
    xp: 0,
    tasks: [],
    achievements: [],
};

const classIcons = { Paladin: '🛡️', Knight: '⚔️', Necromancer: '🔮', Assassin: '🗡️', Healer: '💖', Mage: '🧘' };
const xpForDifficulty = { low: 10, medium: 20, high: 30 };
const xpForNextLevel = (level) => Math.round(100 * Math.pow(level, 1.5));

const levelTitles = [
    { level: 350, title: "King Of Code" }, { level: 325, title: "Monarch of Shadows Invincible" },
    { level: 300, title: "Monarch of Shadows Unbeatable" }, { level: 275, title: "Monarch of Shadows Supreme" },
    { level: 260, title: "Monarch of Shadows Legendary" }, { level: 250, title: "Archmage of the Realm" },
    { level: 150, title: "Grandmaster of Shadows" }, { level: 100, title: "Champion of the Realm" },
    { level: 75, title: "King of Yellow and Black" }, { level: 65, title: "Monarch of Shadows Master of Abyss" },
    { level: 55, title: "Monarch of Shadows Rebel leader" }, { level: 35, title: "Monarch of Shadows" },
    { level: 25, title: "Necromancer" }, { level: 15, title: "Night Lord" },
    { level: 2, title: "Assassin" }, { level: 1, title: "Wolf Slayer" }
];

// ---- CLOUD SAVE LOGIC ----
function saveState() {
    if (state.uid) {
        const docRef = doc(db, "users", state.uid);
        setDoc(docRef, state).catch(error => console.error("Error saving to cloud:", error));
    }
}

async function loadOrInitializeUser(user) {
    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            state = docSnap.data();
        } else {
            const oldLocalSave = localStorage.getItem('taskQuestState');
            if (oldLocalSave) {
                state = JSON.parse(oldLocalSave);
                state.uid = user.uid;
                await setDoc(docRef, state);
                localStorage.removeItem('taskQuestState');
                alert("Progress synced to the cloud!");
            } else {
                state.uid = user.uid;
                state.username = usernameInput.value.trim() || 'Hero';
                state.playerClass = selectedClass;
                await setDoc(docRef, state);
            }
        }
        initializeAppUI();
    } catch (error) {
        console.error("Error loading user:", error);
    }
}

// ---- ONBOARDING & LOGIN ----
let selectedClass = 'Paladin'; 
classSelection.addEventListener('click', (e) => {
    const card = e.target.closest('.class-card');
    if (!card) return;
    document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedClass = card.dataset.class;
});

emailSignupBtn.addEventListener('click', async () => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
        await loadOrInitializeUser(userCredential.user);
    } catch (e) { alert(e.message); }
});

emailLoginBtn.addEventListener('click', async () => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
        await loadOrInitializeUser(userCredential.user);
    } catch (e) { alert(e.message); }
});

googleSigninBtn.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await loadOrInitializeUser(result.user);
    } catch (e) { console.error(e); }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadOrInitializeUser(user);
    } else {
        welcomeScreen.classList.add('active');
        document.body.style.display = 'block'; // Reveal page
    }
});

function initializeAppUI() {
    welcomeScreen.classList.remove('active');
    appContainer.classList.add('active');
    updateUI();
    document.body.style.display = 'block'; // Reveal page
}

// ---- CORE FUNCTIONS, XP, UI RENDERING (Keep your existing functions below here) ----
// ... (The rest of your functions: addTask, completeTask, deleteTask, addXp, levelUp, checkAchievements, updateUI, updatePlayerStats, renderTasks, renderAchievements, showLevelUpModal)

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

const classIcons = {
    Paladin: '🛡️', Knight: '⚔️', Necromancer: '🔮',
    Assassin: '🗡️', Healer: '💖', Mage: '🧘'
};

const xpForDifficulty = { low: 10, medium: 20, high: 30 };
const xpForNextLevel = (level) => Math.round(100 * Math.pow(level, 1.5));

const levelTitles = [
    { level: 350, title: "King Of Code" },
    { level: 325, title: "Monarch of Shadows Invincible" },
    { level: 300, title: "Monarch of Shadows Unbeatable" },
    { level: 275, title: "Monarch of Shadows Supreme" },
    { level: 260, title: "Monarch of Shadows Legendary" },
    { level: 250, title: "Archmage of the Realm" },
    { level: 150, title: "Grandmaster of Shadows" },
    { level: 100, title: "Champion of the Realm" },
    { level: 75, title: "King of Yellow and Black" },
    { level: 65, title: "Monarch of Shadows Master of Abyss" },
    { level: 55, title: "Monarch of Shadows Rebel leader" },
    { level: 35, title: "Monarch of Shadows" },
    { level: 25, title: "Necromancer" },
    { level: 15, title: "Night Lord" },
    { level: 2, title: "Assassin" },
    { level: 1, title: "Wolf Slayer" }
];

// ---- CLOUD SAVE LOGIC ----
function saveState() {
    if (state.uid) {
        const docRef = doc(db, "users", state.uid);
        setDoc(docRef, state).catch(error => console.error("Error saving to cloud:", error));
    }
}

async function loadOrInitializeUser(user, isSignUp = false) {
    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Existing cloud user - load their save file
            state = docSnap.data();
        } else {
            // NEW USER: Check if they have an old local save file first!
            const oldLocalSave = localStorage.getItem('taskQuestState');
            
            if (oldLocalSave) {
                // MIGRATION: Convert their old local save to a cloud save
                state = JSON.parse(oldLocalSave);
                state.uid = user.uid; // Attach their new secure Google/Email ID to their old stats
                
                await setDoc(docRef, state); // Push old stats to Firestore
                
                // Clear the old local storage so they don't migrate it again
                localStorage.removeItem('taskQuestState');
                
                alert("Welcome back! Your offline progress has been successfully synced to the cloud.");
            } else {
                // Brand new user with no history - initialize default Level 1 data
                const username = usernameInput.value.trim() || 'Hero';
                state.uid = user.uid;
                state.username = username;
                state.playerClass = selectedClass;
                await setDoc(docRef, state);
            }
        }
        initializeAppUI();
    } catch (error) {
        console.error("Error fetching user data from Firestore:", error);
        alert("Failed to load your character data.");
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

// 1. Email Sign Up
emailSignupBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const username = usernameInput.value.trim();

    if (!email || !password || !username) {
        alert("Please enter a hero name, email, and password to sign up.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await loadOrInitializeUser(userCredential.user, true);
    } catch (error) {
        alert(error.message); // Firebase provides helpful error messages
    }
});

// 2. Email Log In
emailLoginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert("Please enter your email and password to log in.");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await loadOrInitializeUser(userCredential.user, false);
    } catch (error) {
        alert("Login failed: " + error.message);
    }
});

// 3. Google Sign-In
googleSigninBtn.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await loadOrInitializeUser(result.user);
    } catch (error) {
        console.error("Google Auth Error:", error);
    }
});

// Auto-Login Check on Page Refresh
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadOrInitializeUser(user);
    } else {
        welcomeScreen.classList.add('active');
    }
});

// ---- INITIALIZATION ----
function initializeAppUI() {
    welcomeScreen.classList.remove('active');
    appContainer.classList.add('active');
    updateUI();
}

// ---- CORE FUNCTIONS ----
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    const difficulty = difficultySelect.value;
    if (taskText) {
        addTask(taskText, difficulty);
        taskInput.value = '';
    }
});

taskList.addEventListener('click', (e) => {
    const target = e.target;
    const taskId = target.closest('.task-item').dataset.id;
    if (target.classList.contains('complete-btn')) {
        completeTask(taskId);
    } else if (target.classList.contains('delete-btn')) {
        deleteTask(taskId);
    }
});

function addTask(text, difficulty) {
    const task = {
        id: Date.now().toString(),
        text,
        difficulty,
        completed: false
    };
    state.tasks.push(task);
    saveState();
    renderTasks();
}

function completeTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task && !task.completed) {
        task.completed = true;
        addXp(xpForDifficulty[task.difficulty]);
        checkAchievements();
        saveState();
        renderTasks();
    }
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    renderTasks();
}

// ---- XP & LEVELING ----
function addXp(amount) {
    state.xp += amount;
    if (state.xp >= xpForNextLevel(state.level)) {
        levelUp();
    }
    updatePlayerStats();
    saveState();
}

function levelUp() {
    const xpNeeded = xpForNextLevel(state.level);
    state.xp -= xpNeeded;
    state.level++;
    showLevelUpModal();

    if (state.xp >= xpForNextLevel(state.level)) {
         levelUp();
    }
}

// ---- ACHIEVEMENTS ----
const allAchievements = {
    'BEGINNER_ADVENTURER': {
        id: 'BEGINNER_ADVENTURER',
        icon: '🏆',
        title: 'Beginner Adventurer',
        description: 'Complete 5 quests.'
    }
};

function checkAchievements() {
    const completedTasks = state.tasks.filter(t => t.completed).length;

    if (completedTasks >= 5 && !state.achievements.includes('BEGINNER_ADVENTURER')) {
        state.achievements.push('BEGINNER_ADVENTURER');
        alert('Achievement Unlocked: Beginner Adventurer!');
    }
    renderAchievements();
}

// ---- UI RENDERING ----
function updateUI() {
    updatePlayerStats();
    renderTasks();
    renderAchievements();
}

function updatePlayerStats() {
    playerUsername.textContent = state.username;
    playerClassIcon.textContent = classIcons[state.playerClass] || '🛡️';
    levelDisplay.textContent = state.level;

    const currentTitleObj = levelTitles.find(t => state.level >= t.level);
    if (currentTitleObj) {
        playerTitle.textContent = currentTitleObj.title;
    }
    const needed = xpForNextLevel(state.level);
    xpDisplay.textContent = state.xp;
    xpNeededDisplay.textContent = needed;
    xpBar.style.width = `${(state.xp / needed) * 100}%`;
}

function renderTasks() {
    taskList.innerHTML = '';
    state.tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.difficulty} ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;
        li.innerHTML = `
            <span>${task.text}</span>
            <div class="task-buttons">
                <button class="complete-btn">✔️</button>
                <button class="delete-btn">❌</button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

function renderAchievements() {
    achievementsList.innerHTML = '';
    for (const key in allAchievements) {
        const achievement = allAchievements[key];
        const div = document.createElement('div');
        div.className = 'achievement';
        div.innerHTML = achievement.icon;
        div.title = `${achievement.title}\n${achievement.description}`;
        if (state.achievements.includes(key)) {
            div.classList.add('unlocked');
        }
        achievementsList.appendChild(div);
    }
}

function showLevelUpModal() {
    newLevelDisplay.textContent = state.level;
    levelUpModal.classList.remove('modal-hidden');
}

// --- MODAL BUTTON LISTENERS ---
closeModalBtn.addEventListener('click', () => {
    levelUpModal.classList.add('modal-hidden');
    const unlockedTitle = levelTitles.find(t => t.level === state.level);
    
    if (unlockedTitle) {
        newTitleDisplay.textContent = unlockedTitle.title;
        titleUnlockModal.classList.remove('modal-hidden');
    }
});

closeTitleModalBtn.addEventListener('click', () => {
    titleUnlockModal.classList.add('modal-hidden');
});

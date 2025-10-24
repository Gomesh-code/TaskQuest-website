document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const welcomeScreen = document.getElementById('welcome-screen');
    const appContainer = document.getElementById('app-container');
    const usernameInput = document.getElementById('username-input');
    const classSelection = document.getElementById('class-selection');
    const startQuestBtn = document.getElementById('start-quest-btn');
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
    const levelUpModal = document.getElementById('level-up-modal');
    const newLevelDisplay = document.getElementById('new-level-display');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Game State
    let state = {
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

    // ---- ONBOARDING ----
    let selectedClass = 'Paladin'; // Default
    classSelection.addEventListener('click', (e) => {
        const card = e.target.closest('.class-card');
        if (!card) return;
        
        document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedClass = card.dataset.class;
    });

    startQuestBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        if (username) {
            state.username = username;
            state.playerClass = selectedClass;
            saveState();
            initializeApp();
        } else {
            alert('Please enter your hero\'s name!');
        }
    });

    // ---- INITIALIZATION ----
    function initializeApp() {
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
             levelUp(); // Handle multiple level ups
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

    closeModalBtn.addEventListener('click', () => {
        levelUpModal.classList.add('modal-hidden');
    });

    // ---- LOCAL STORAGE ----
    function saveState() {
        localStorage.setItem('taskQuestState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('taskQuestState');
        if (savedState) {
            state = JSON.parse(savedState);
            initializeApp();
        } else {
            welcomeScreen.classList.add('active');
        }
    }

    // Initial Load
    loadState();
});
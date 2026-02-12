document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const currentDateEl = document.getElementById('currentDate');
    const moodBtns = document.querySelectorAll('.mood-btn');
    const moodNoteInput = document.getElementById('moodNote');
    const saveMoodBtn = document.getElementById('saveMoodBtn');
    const historyListEl = document.getElementById('historyList');
    const streakCountEl = document.getElementById('streakCount');
    const totalLogsEl = document.getElementById('totalLogs');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // State
    let selectedMood = null;
    let moodLogs = JSON.parse(localStorage.getItem('moodLogs')) || [];

    // Init
    init();

    function init() {
        displayDate();
        renderHistory();
        updateStats();
        setupEventListeners();
    }

    function displayDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    function setupEventListeners() {
        // Mood Selection
        moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Deselect others
                moodBtns.forEach(b => b.classList.remove('selected'));
                // Select clicked
                btn.classList.add('selected');
                selectedMood = {
                    mood: btn.dataset.mood,
                    emoji: btn.dataset.emoji,
                    color: btn.dataset.color,
                    label: btn.querySelector('.label').textContent
                };
            });
        });

        // Save Mood
        saveMoodBtn.addEventListener('click', saveMood);

        // Clear History
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your mood history?')) {
                moodLogs = [];
                saveToLocalStorage();
                renderHistory();
                updateStats();
            }
        });
    }

    function saveMood() {
        if (!selectedMood) {
            alert('Please select a mood first!');
            return;
        }

        const newLog = {
            id: Date.now(),
            mood: selectedMood.mood,
            emoji: selectedMood.emoji,
            color: selectedMood.color,
            label: selectedMood.label,
            note: moodNoteInput.value.trim(),
            timestamp: new Date().toISOString()
        };

        // Add to beginning of array
        moodLogs.unshift(newLog);

        // Persist
        saveToLocalStorage();

        // Update UI
        renderHistory();
        updateStats();
        resetForm();

        // Optional: Simple feedback
        const originalText = saveMoodBtn.textContent;
        saveMoodBtn.textContent = 'Saved! 🎉';
        setTimeout(() => {
            saveMoodBtn.textContent = originalText;
        }, 2000);
    }

    function resetForm() {
        selectedMood = null;
        moodBtns.forEach(b => b.classList.remove('selected'));
        moodNoteInput.value = '';
    }

    function saveToLocalStorage() {
        localStorage.setItem('moodLogs', JSON.stringify(moodLogs));
    }

    function renderHistory() {
        historyListEl.innerHTML = '';

        if (moodLogs.length === 0) {
            historyListEl.innerHTML = '<div class="empty-state">No mood logs yet. Start tracking!</div>';
            return;
        }

        moodLogs.forEach(log => {
            const date = new Date(log.timestamp);
            const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.style.borderLeftColor = log.color || '#fff';

            historyItem.innerHTML = `
                <div class="history-left">
                    <span class="history-emoji">${log.emoji}</span>
                    <div class="history-details">
                        <span class="history-date">${dateString} at ${timeString}</span>
                        <div class="history-note">${log.note ? log.note : log.label}</div>
                    </div>
                </div>
                <button class="delete-log-btn" data-id="${log.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            // Delete functionality
            const deleteBtn = historyItem.querySelector('.delete-log-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteLog(log.id);
            });

            historyListEl.appendChild(historyItem);
        });
    }

    function deleteLog(id) {
        moodLogs = moodLogs.filter(log => log.id !== id);
        saveToLocalStorage();
        renderHistory();
        updateStats();
    }

    function updateStats() {
        totalLogsEl.textContent = moodLogs.length;

        // Calculate Streak (Consecutive days with at least one log)
        const streak = calculateStreak();
        streakCountEl.textContent = `${streak} Day${streak !== 1 ? 's' : ''}`;
    }

    function calculateStreak() {
        if (moodLogs.length === 0) return 0;

        // 1. Get unique dates sorted descending (newest first)
        const uniqueDates = Array.from(new Set(moodLogs.map(log => {
            const d = new Date(log.timestamp);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        }))).sort((a, b) => b - a);

        if (uniqueDates.length === 0) return 0;

        // 2. Check if the most recent log is today or yesterday
        // If the user hasn't logged today OR yesterday, the streak is broken (0).
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const lastLogDate = new Date(uniqueDates[0]);

        // If last log was before yesterday, streak is broken
        if (lastLogDate.getTime() < yesterday.getTime()) {
            return 0;
        }

        // 3. Count consecutive days
        let streak = 1;
        let currentDate = lastLogDate;

        for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i]);

            // Calculate difference in days
            const diffTime = Math.abs(currentDate - prevDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak++;
                currentDate = prevDate;
            } else {
                break; // Gap found, stop counting
            }
        }

        return streak;
    }
});

 // Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Animate cards on scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.feature-card, .tip-card, .date-card').forEach(card => {
    card.style.opacity = 0;
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s, transform 0.5s';
    observer.observe(card);
});



// ===== Mini Week Calendar =====
let currentWeek = 0; // 0 means current week, -1 means previous week, 1 means next week, etc.
let selectedDate = null;
let draggedChallenge = null;

// Sample challenges data
const challengesData = {
    "2025-06-09": [
        { id: 1, title: "Meatless Monday", icon: "fas fa-carrot", points: 15, completed: false }
    ],
    "2025-06-10": [
        { id: 3, title: "Bike to work", icon: "fas fa-bicycle", points: 20, completed: false },
        { id: 4, title: "Use reusable coffee cup", icon: "fas fa-coffee", points: 10, completed: true }
    ],
    "2025-06-11": [
        { id: 5, title: "Zero plastic day", icon: "fas fa-ban", points: 25, completed: false }
    ],
    "2025-06-12": [
        { id: 7, title: "Energy saving mode", icon: "fas fa-bolt", points: 15, completed: true }
    ],
    "2025-06-13": [
        { id: 9, title: "Digital detox evening", icon: "fas fa-mobile-alt", points: 10, completed: false }
    ],
    "2025-06-14": [
        { id: 11, title: "Beach cleanup", icon: "fas fa-trash", points: 30, completed: false }
    ],
    "2025-06-15": [
        { id: 13, title: "Planetary diet", icon: "fas fa-leaf", points: 20, completed: false }
    ]
};

// Available challenge cards
const availableChallenges = [
    { id: 101, title: "5-min shower", icon: "fas fa-shower", points: 15, description: "Limit your shower to 5 minutes to save water" },
    { id: 102, title: "Public transport", icon: "fas fa-bus", points: 20, description: "Use public transport instead of driving" },
    { id: 103, title: "Local produce", icon: "fas fa-shopping-basket", points: 15, description: "Buy only locally produced food" },
    { id: 104, title: "Repair something", icon: "fas fa-tools", points: 10, description: "Repair an item instead of replacing it" },
    { id: 105, title: "Plant a tree", icon: "fas fa-tree", points: 30, description: "Plant a tree in your community" },
    { id: 106, title: "Compost food", icon: "fas fa-recycle", points: 15, description: "Compost your food waste" },
    { id: 107, title: "Carpool", icon: "fas fa-car", points: 15, description: "Share a ride with others" },
    { id: 108, title: "Meat-free day", icon: "fas fa-carrot", points: 20, description: "Have a day without meat products" }
];

// Initialize the calendar
function initCalendar() {
    updateCalendar();
    populateChallengeCards();
    
    // Add event listeners for navigation
    document.getElementById('prev-week').addEventListener('click', () => {
        currentWeek--;
        updateCalendar();
    });
    
    document.getElementById('next-week').addEventListener('click', () => {
        currentWeek++;
        updateCalendar();
    });
    
    // Set up drag and drop
    setupDragAndDrop();
}

// Update the calendar display
function updateCalendar() {
    const today = new Date();
    const startOfWeek = new Date(today);
    
    // Calculate the start of the current week (Monday)
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    // Adjust for the current week offset
    startOfWeek.setDate(startOfWeek.getDate() + (currentWeek * 7));
    
    // Update the calendar title
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    document.getElementById('calendar-title').textContent = 
        `Week of ${startOfWeek.toLocaleDateString('en-US', options)}`;
    
    // Generate the week dates
    const weekDatesContainer = document.getElementById('week-dates');
    weekDatesContainer.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        
        const dateString = formatDate(currentDate);
        const isToday = isSameDay(currentDate, new Date());
        
        const dateCard = document.createElement('div');
        dateCard.className = `date-card ${isToday ? 'active' : ''}`;
        dateCard.dataset.date = dateString;
        
        dateCard.innerHTML = `
            <div class="date-number">${currentDate.getDate()}</div>
            ${generateChallengeItems(dateString)}
            <div class="drop-zone">Drop challenge here</div>
        `;
        
        dateCard.addEventListener('click', () => {
            selectedDate = dateString;
            showChallengeDetails(dateString);
        });
        
        // Set up drop zone
        dateCard.addEventListener('dragover', (e) => {
            e.preventDefault();
            dateCard.classList.add('drag-over');
        });
        
        dateCard.addEventListener('dragleave', () => {
            dateCard.classList.remove('drag-over');
        });
        
        dateCard.addEventListener('drop', (e) => {
            e.preventDefault();
            dateCard.classList.remove('drag-over');
            
            if (draggedChallenge) {
                addChallengeToDate(dateString, draggedChallenge);
                draggedChallenge = null;
            }
        });
        
        weekDatesContainer.appendChild(dateCard);
    }
    
    // Show today's challenges by default
    if (!selectedDate) {
        selectedDate = formatDate(today);
    }
    showChallengeDetails(selectedDate);
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Check if two dates are the same day
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
}

// Generate challenge items for a date
function generateChallengeItems(dateString) {
    const challenges = challengesData[dateString] || [];
    let html = '';
    
    challenges.forEach(challenge => {
        html += `
            <div class="challenge-item ${challenge.completed ? 'completed' : ''}">
                <i class="${challenge.icon}"></i>
                <span>${challenge.title}</span>
            </div>
        `;
    });
    
    return html;
}

// Show challenge details for a specific date
function showChallengeDetails(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    const challenges = challengesData[dateString] || [];
    const completedCount = challenges.filter(c => c.completed).length;
    const totalCount = challenges.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    let challengesHTML = '';
    if (challenges.length > 0) {
        challenges.forEach(challenge => {
            challengesHTML += `
                <div class="challenge-item ${challenge.completed ? 'completed' : ''}">
                    <i class="${challenge.icon}"></i>
                    <span>${challenge.title}</span>
                    <span style="margin-left: auto; font-size: 0.7rem; color: var(--color3);">${challenge.points} pts</span>
                    <button class="btn" style="margin-left: 0.5rem; padding: 0.3rem 0.8rem; font-size: 0.8rem;" 
                            onclick="toggleChallenge('${dateString}', ${challenge.id})">
                        ${challenge.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button class="btn" style="margin-left: 0.5rem; padding: 0.3rem 0.8rem; font-size: 0.8rem; background-color: #d9534f;" 
                            onclick="removeChallenge('${dateString}', ${challenge.id})">
                        Remove
                    </button>
                </div>
            `;
        });
    } else {
        challengesHTML = '<p>No challenges scheduled for this day. Add some from the challenge cards below!</p>';
    }
    
    const detailsContainer = document.getElementById('challenge-details');
    detailsContainer.innerHTML = `
        <h3>Challenges for ${formattedDate}</h3>
        <p>Complete these sustainability challenges to earn eco-points and make a positive impact!</p>
        <div class="progress-bar">
            <div class="progress" style="width: ${progressPercentage}%"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <span>Progress: ${completedCount}/${totalCount} challenges completed</span>
            <span>${Math.round(progressPercentage)}%</span>
        </div>
        ${challengesHTML}
    `;
    
    // Update active date card
    document.querySelectorAll('.date-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`.date-card[data-date="${dateString}"]`).classList.add('active');
}

// Populate challenge cards bar
function populateChallengeCards() {
    const container = document.getElementById('challenge-cards-container');
    container.innerHTML = '';
    
    availableChallenges.forEach(challenge => {
        const card = document.createElement('div');
        card.className = 'challenge-card';
        card.draggable = true;
        card.dataset.challengeId = challenge.id;
        
        card.innerHTML = `
            <div class="challenge-card-icon">
                <i class="${challenge.icon}"></i>
            </div>
            <div class="challenge-card-title">${challenge.title}</div>
            <div class="challenge-card-desc">${challenge.description}</div>
            <div class="challenge-card-points">${challenge.points} points</div>
            <button class="add-challenge-btn" data-challenge-id="${challenge.id}">Add to Day</button>
        `;
        
        // Set up drag events
        card.addEventListener('dragstart', (e) => {
            draggedChallenge = challenge;
            card.classList.add('dragging');
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
        
        // Set up click to add
        const addButton = card.querySelector('.add-challenge-btn');
        addButton.addEventListener('click', () => {
            if (selectedDate) {
                addChallengeToDate(selectedDate, challenge);
            } else {
                showInfoAlert(
                    "Select a Day First",
                    "Please click on a day in the calendar to select it before adding challenges."
                );
            }
        });
        
        container.appendChild(card);
    });
}

// Set up drag and drop functionality
function setupDragAndDrop() {
    const dropZones = document.querySelectorAll('.date-card');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            
            if (draggedChallenge) {
                const dateString = zone.dataset.date;
                addChallengeToDate(dateString, draggedChallenge);
                draggedChallenge = null;
            }
        });
    });
}

// Add challenge to a specific date
function addChallengeToDate(dateString, challenge) {
    if (!challengesData[dateString]) {
        challengesData[dateString] = [];
    }
    
    // Check if challenge already exists for this date
    const existingChallenge = challengesData[dateString].find(c => c.id === challenge.id);
    if (existingChallenge) {
        showInfoAlert(
            "Challenge Already Added",
            `"${challenge.title}" is already scheduled for this day.`
        );
        return;
    }
    
    // Add the challenge
    challengesData[dateString].push({
        ...challenge,
        completed: false
    });
    
    // Update the UI
    updateCalendar();
    showChallengeDetails(dateString);
    
    showSuccessAlert(
        "Challenge Added!",
        `"${challenge.title}" has been added to your challenges for ${new Date(dateString).toLocaleDateString()}.`
    );
}

// Toggle challenge completion status
function toggleChallenge(dateString, challengeId) {
    const challenges = challengesData[dateString];
    if (challenges) {
        const challenge = challenges.find(c => c.id === challengeId);
        if (challenge) {
            challenge.completed = !challenge.completed;
            
            // Update the UI
            showChallengeDetails(dateString);
            updateCalendar();
            
            // Show success message
            if (challenge.completed) {
                showSuccessAlert(
                    "Challenge Completed!",
                    `Great job completing "${challenge.title}"! You've earned ${challenge.points} eco-points.`
                );
            }
        }
    }
}

// Remove challenge from a date
function removeChallenge(dateString, challengeId) {
    const challenges = challengesData[dateString];
    if (challenges) {
        const challengeIndex = challenges.findIndex(c => c.id === challengeId);
        if (challengeIndex !== -1) {
            const removedChallenge = challenges[challengeIndex];
            challenges.splice(challengeIndex, 1);
            
            // Update the UI
            showChallengeDetails(dateString);
            updateCalendar();
            
            showInfoAlert(
                "Challenge Removed",
                `"${removedChallenge.title}" has been removed from your challenges for ${new Date(dateString).toLocaleDateString()}.`
            );
        }
    }
}


// ===== Custom Alert System =====
const customAlertOverlay = document.getElementById('customAlertOverlay');
const customAlert = document.getElementById('customAlert');
const alertIcon = document.getElementById('alertIcon');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const alertFooter = document.getElementById('alertFooter');

let currentResolve = null;

function showCustomAlert(type, title, message, options = {}) {
    return new Promise((resolve) => {
        customAlert.className = `custom-alert alert-${type}`;

        let iconClass = {
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle',
            info: 'fas fa-info-circle'
        }[type] || 'fas fa-check-circle';

        alertIcon.innerHTML = `<i class="${iconClass}"></i>`;
        alertTitle.textContent = title;
        alertMessage.innerHTML = message;
        alertFooter.innerHTML = '';

        if (options.confirm) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'alert-btn alert-btn-secondary';
            cancelBtn.textContent = options.cancelText || 'Cancel';
            cancelBtn.onclick = () => {
                hideAlert();
                if (currentResolve) currentResolve(false);
            };

            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'alert-btn alert-btn-primary';
            confirmBtn.textContent = options.confirmText || 'OK';
            confirmBtn.onclick = () => {
                hideAlert();
                if (currentResolve) currentResolve(true);
            };

            alertFooter.append(cancelBtn, confirmBtn);
        } else {
            const okBtn = document.createElement('button');
            okBtn.className = 'alert-btn alert-btn-primary';
            okBtn.textContent = options.okText || 'OK';
            okBtn.onclick = () => {
                hideAlert();
                if (currentResolve) currentResolve(true);
            };
            alertFooter.appendChild(okBtn);
        }

        currentResolve = resolve;
        customAlertOverlay.classList.add('active');

        if (options.timeout) {
            setTimeout(() => {
                hideAlert();
                if (currentResolve) currentResolve(true);
            }, options.timeout);
        }
    });
}

function hideAlert() {
    customAlertOverlay.classList.remove('active');
    currentResolve = null;
}

// ===== Shortcut Alert Types =====
function showSuccessAlert(title = 'Success!', message = '', options = {}) {
    return showCustomAlert('success', title, message, options);
}
function showWarningAlert(title = 'Warning!', message = '', options = {}) {
    return showCustomAlert('warning', title, message, options);
}
function showErrorAlert(title = 'Error!', message = '', options = {}) {
    return showCustomAlert('error', title, message, options);
}
function showInfoAlert(title = 'Info', message = '', options = {}) {
    return showCustomAlert('info', title, message, options);
}
function showConfirmAlert(title = 'Confirm', message = '', options = {}) {
    options.confirm = true;
    return showCustomAlert('warning', title, message, options);
}

customAlertOverlay.addEventListener('click', (e) => {
    if (e.target === customAlertOverlay) {
        hideAlert();
        if (currentResolve) currentResolve(false);
    }
});

// Initialize the calendar when the page loads
document.addEventListener('DOMContentLoaded', initCalendar);
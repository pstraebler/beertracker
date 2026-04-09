const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
const i18n = window.BeerTrackerI18n;

function t(key, vars = null) {
    if (i18n && typeof i18n.t === 'function') {
        return i18n.t(key, vars);
    }
    return key;
}

function currentLocale() {
    if (i18n && typeof i18n.getCurrentLanguage === 'function') {
        return i18n.getCurrentLanguage() === 'fr' ? 'fr-FR' : 'en-US';
    }
    return 'en-US';
}

let currentBeer = {
    pints: 0,
    half_pints: 0,
    liters_33: 0
};

let monthlyChart = null;
let totalChart = null;
let savingInProgress = false;
let nightModeEnabled = false;
let lastClickTime = 0;
let weeklyChart = null;

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    
    const todayInput = document.getElementById('today-date');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (todayInput) {
        todayInput.value = today;
        todayInput.addEventListener('change', function() {
            loadTodayConsumption();
        });
    }
    
    if (startDateInput && endDateInput) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDateInput.value = startDate.toISOString().split('T')[0];
        endDateInput.value = today;
    }
    
    if (typeof Chart !== 'undefined') {
        loadStats();
    } else {
        console.error('Chart.js n\'est pas chargé');
        setTimeout(loadStats, 1000);
    }
    
    loadTodayConsumption();
    loadNightModeStatus();

    document.addEventListener('languageChanged', function() {
        updateNightModeUI();
        loadStats();
    });
});

function loadNightModeStatus() {
    fetch('/api/night-mode')
        .then(response => response.json())
        .then(data => {
            nightModeEnabled = data.night_mode_enabled;
            updateNightModeUI();
        })
        .catch(error => console.error('Error:', error));
}

function toggleNightMode() {
    if (!nightModeEnabled) {
        // Demander confirmation pour activer
        const confirmDiv = document.createElement('div');
        confirmDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        confirmDiv.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 400px;">
                <h2 style="margin-bottom: 1rem; color: #2c3e50;">${t('night_mode_modal_title')}</h2>
                <p style="margin-bottom: 1rem; color: #475569;">
                    ${t('night_mode_modal_intro')}
                </p>
                <ul style="margin-bottom: 1.5rem; margin-left: 1.5rem; color: #475569;">
                    <li>${t('night_mode_modal_item_1')}</li>
                    <li>${t('night_mode_modal_item_2')}</li>
                </ul>
                <p style="margin-bottom: 1.5rem; color: #f39c12; font-weight: bold;">
                    ${t('night_mode_modal_warning')}
                </p>
                <div style="display: flex; gap: 1rem;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="flex: 1; padding: 0.75rem; background-color: #bdc3c7; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        ${t('cancel')}
                    </button>
                    <button onclick="activateNightMode()" style="flex: 1; padding: 0.75rem; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        ${t('activate')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmDiv);
    }
}

function activateNightMode() {
    fetch('/api/night-mode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ enabled: true })
    })
    .then(response => response.json())
    .then(data => {
        nightModeEnabled = true;
        updateNightModeUI();
        document.querySelector('div[style*="rgba(0, 0, 0, 0.7)"]')?.remove();
        showNightModeNotification();
    })
    .catch(error => {
        console.error('Error:', error);
        alert(t('error_night_mode_activation'));
    });
}

function updateNightModeUI() {
    const nightModeBtn = document.getElementById('night-mode-btn');
    const dateInput = document.getElementById('today-date');
    
    if (nightModeBtn) {
        if (nightModeEnabled) {
            nightModeBtn.textContent = t('night_mode_active');
            nightModeBtn.style.backgroundColor = '#e74c3c';
            nightModeBtn.style.color = 'white';
            nightModeBtn.disabled = true;
        } else {
            nightModeBtn.textContent = t('night_mode_activate');
            nightModeBtn.style.backgroundColor = '#3498db';
            nightModeBtn.style.color = 'white';
            nightModeBtn.disabled = false;
        }
    }
    
    if (dateInput) {
        dateInput.disabled = nightModeEnabled;
    }
}

function showNightModeNotification() {
    const notificationDiv = document.createElement('div');
    notificationDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #e74c3c;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        font-weight: bold;
        animation: slideIn 0.3s ease-out;
    `;
    
    notificationDiv.innerHTML = t('night_mode_notification');
    
    document.body.appendChild(notificationDiv);
    
    setTimeout(() => {
        notificationDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notificationDiv.remove(), 300);
    }, 3000);
}

// Modifie la fonction changeBeer pour empêcher la décrémentation en mode soirée :
function changeBeer(type, value) {
  const now = Date.now();
  if (now - lastClickTime < 3000) {
    return; // Ignore le clic si moins de 3 secondes
  }
  lastClickTime = now;

  // Empêcher la décrémentation en mode soirée
  if (nightModeEnabled && value < 0) {
    showNightModeDecrementNotification();
  return;
  }


  // Vérifier si on est déjà à 0 avant de décrémenter
  if (value < 0 && currentBeer[type] === 0) {
    // Ne rien faire si on essaie de décrémenter une quantité déjà à 0
    return;
  }

  currentBeer[type] = Math.max(0, currentBeer[type] + value);
  document.getElementById(type + '-count').innerText = currentBeer[type];
  saveBeerAutomatic(type, value);
}

function showNightModeDecrementNotification() {
  const notificationDiv = document.createElement('div');
  notificationDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #e74c3c;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    z-index: 9999;
    font-weight: bold;
    animation: slideIn 0.3s ease-out;
  `;
  notificationDiv.innerText = t('night_mode_block_decrement');
  document.body.appendChild(notificationDiv);
  
  setTimeout(() => {
    notificationDiv.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notificationDiv.remove(), 300);
  }, 5000);
}


// Charger la consommation du jour entier (tous créneaux)
function loadTodayConsumption() {
    const selectedDate = document.getElementById('today-date').value;
    
    console.log('Chargement de la consommation pour:', selectedDate);
    
    fetch(`/api/consumption?start_date=${selectedDate}&end_date=${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            currentBeer = {
                pints: 0,
                half_pints: 0,
                liters_33: 0
            };
            
            // Agréger TOUS les enregistrements du jour (tous les créneaux)
            if (data.records && data.records.length > 0) {
                data.records.forEach(record => {
                    currentBeer.pints += record.pints || 0;
                    currentBeer.half_pints += record.half_pints || 0;
                    currentBeer.liters_33 += record.liters_33 || 0;
                });
                console.log('Consommation totale du jour:', currentBeer);
            }
            
            document.getElementById('pints-count').innerText = currentBeer.pints;
            document.getElementById('half_pints-count').innerText = currentBeer.half_pints;
            document.getElementById('liters_33-count').innerText = currentBeer.liters_33;
        })
        .catch(error => {
            console.error('Error while loading:', error);
        });
}

// Enregistrer automatiquement avec heure actuelle
function saveBeerAutomatic(type, value) {
    if (savingInProgress) return;
    
    savingInProgress = true;
    
    const date = document.getElementById('today-date').value;
    const now = new Date();
    const time = now.toTimeString().slice(0, 8); // HH:MM:SS
    
    const payload = {
        date: date,
        time: time,
        pints: type === 'pints' ? value : 0,
        half_pints: type === 'half_pints' ? value : 0,
        liters_33: type === 'liters_33' ? value : 0
    };
    
    fetch('/api/consumption', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        showSaveNotification(type, value);
        loadStats();
        savingInProgress = false;
    })
    .catch(error => {
        console.error('Error:', error);
        savingInProgress = false;
        currentBeer[type] = Math.max(0, currentBeer[type] - value);
        document.getElementById(`${type}-count`).innerText = currentBeer[type];
        alert(t('error_save_connection'));
    });
}

function showSaveNotification(type, value) {
    const beerLabels = {
        'pints': t('pints'),
        'half_pints': t('halves'),
        'liters_33': '33cl'
    };
    
    const notificationDiv = document.createElement('div');
    notificationDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #27ae60;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 9999;
        font-weight: bold;
        animation: slideIn 0.3s ease-out;
    `;
    
    const symbol = value > 0 ? '✅' : '❌';
    notificationDiv.innerText = `${symbol} ${beerLabels[type]} ${value > 0 ? '+' : ''}${value}`;
    
    document.body.appendChild(notificationDiv);
    
    setTimeout(() => {
        notificationDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notificationDiv.remove(), 300);
    }, 2000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

function loadStats() {
    const startDate = document.getElementById('start-date')?.value || '';
    const endDate = document.getElementById('end-date')?.value || '';
    
    const url = `/api/consumption?start_date=${startDate}&end_date=${endDate}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            updateStatsDisplay(data);
            updateCharts(data);
        })
        .catch(error => console.error('Error:', error));
}

// Fonction pour formater l'heure en format court (14h56)
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    return `${hours}h${minutes}`;
}

function updateStatsDisplay(data) {
    const totalPintsEl = document.getElementById('total-pints');
    const totalHalfEl = document.getElementById('total-half');
    const total33El = document.getElementById('total-33');
    const totalLitersEl = document.getElementById('total-liters');
    const totalCostEl = document.getElementById('total-cost');
    
    if (totalPintsEl) totalPintsEl.innerText = data.total_pints;
    if (totalHalfEl) totalHalfEl.innerText = data.total_half_pints;
    if (total33El) total33El.innerText = data.total_33cl;
    if (totalLitersEl) totalLitersEl.innerText = data.total_liters;
    
    if (totalCostEl) {
        const costPerLiter = 12;
        const totalCost = (data.total_liters * costPerLiter).toFixed(2);
        totalCostEl.innerText = totalCost;
    }
    
    const warningsContainer = document.getElementById('warnings-container');
    const warningsList = document.getElementById('warnings-list');
    
    if (warningsContainer && warningsList) {
        const now = new Date();
        
        // Séparer les avertissements hebdomadaires et les 3h
        const weeklyWarnings = data.warnings.filter(w => w.type === 'weekly');
        const threeHourWarnings = data.warnings.filter(w => w.type !== 'weekly');
        
        // Filtrer les avertissements 3h expirés
        const activeThreeHourWarnings = threeHourWarnings.filter(warning => {
            const endDateTime = new Date(warning.end_date + 'T' + warning.end_time);
            return now <= endDateTime;
        });
        
        // Combiner tous les avertissements actifs
        const allWarnings = [...weeklyWarnings, ...activeThreeHourWarnings];
        
        if (allWarnings.length > 0) {
            warningsContainer.style.display = 'block';
            warningsList.innerHTML = '';
            
            allWarnings.forEach(warning => {
                const warningDiv = document.createElement('div');
                warningDiv.style.cssText = `
                    background-color: white;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    border-left: 4px solid #f39c12;
                    border-radius: 4px;
                `;
                
                if (warning.type === 'weekly') {
                    // Avertissement 3ème jour
                    const dayIndexes = warning.day_indexes || [];
                    const localizedDays = dayIndexes.map(dayIndex => t(`day_${dayIndex}`));
                    const weeklyMessage = (localizedDays.length > 0 || warning.num_days)
                        ? t('days_of_drinking', {
                            count: warning.num_days || localizedDays.length,
                            days: localizedDays.join(', ')
                        })
                        : (warning.message || '');
                    warningDiv.innerHTML = `<strong style="font-size: 1.1rem;">${weeklyMessage}</strong>`;
                } else {
                    // Avertissement 3h (existant)
                    const items = warning.items.map(item => 
                        `<li style="margin-left: 2rem">${item.time}: ${item.liters}L</li>`
                    ).join('');
                    
                    warningDiv.innerHTML = `
                        <strong>${t('alert_three_hour_title', { time: formatTime(warning.start_time) })}</strong><br>
                        ${t('alert_total')}: <strong>${warning.total_liters}L</strong><br>
                        <ul style="margin-top: 0.5rem; margin-bottom: 0;">
                            ${items}
                        </ul>
                    `;
                }
                
                warningsList.appendChild(warningDiv);
            });
        } else {
            warningsContainer.style.display = 'none';
        }
    }
}

function updateCharts(data) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not available');
        return;
    }
    updateMonthlyChart(data.monthly_stats);
    updateTotalChart(data.records);
    updateWeeklyChart(data.weekly_stats); 
}

function updateMonthlyChart(monthlyStats) {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) {
        console.warn('Element monthlyChart non trouvé');
        return;
    }
    
    const months = Object.keys(monthlyStats).sort();
    const pintData = months.map(m => monthlyStats[m].pints || 0);
    const halfData = months.map(m => monthlyStats[m].half_pints || 0);
    const thirtyThreeData = months.map(m => monthlyStats[m]['33cl'] || 0);
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months.map(m => {
                const date = new Date(m + '-01');
                return date.toLocaleDateString(currentLocale(), { month: 'long', year: 'numeric' });
            }),
            datasets: [
                {
                    label: t('pints'),
                    data: pintData,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
                },
                {
                    label: t('halves'),
                    data: halfData,
                    backgroundColor: '#e74c3c',
                    borderColor: '#c0392b',
                    borderWidth: 1
                },
                {
                    label: '33cl',
                    data: thirtyThreeData,
                    backgroundColor: '#f39c12',
                    borderColor: '#e67e22',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateTotalChart(records) {
    const ctx = document.getElementById('totalChart');
    if (!ctx) {
        console.warn('Element totalChart not found');
        return;
    }

    // Agréger les litres par jour (un point = un jour)
    const dailyLitersMap = {};
    records.forEach(r => {
        const key = r.date;
        const liters = (r.pints * 0.5) + (r.half_pints * 0.25) + (r.liters_33 * 0.33);
        if (!dailyLitersMap[key]) {
            dailyLitersMap[key] = 0;
        }
        dailyLitersMap[key] += liters;
    });

    const dates = Object.keys(dailyLitersMap).sort((a, b) => new Date(a) - new Date(b));

    let cumulativeLiters = 0;
    const labels = dates.map(d => new Date(d).toLocaleDateString(currentLocale()));
    const data = dates.map(d => {
        cumulativeLiters += dailyLitersMap[d];
        return parseFloat(cumulativeLiters.toFixed(2));
    });
    
    if (totalChart) {
        totalChart.destroy();
    }
    
    totalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: t('chart_cumulative_label'),
                    data: data,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateWeeklyChart(weeklyStats) {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) {
        console.warn('Element weeklyChart not found');
        return;
    }
    
    const labels = weeklyStats.map(w => {
        if (!w.week_start) return '';
        const date = new Date(w.week_start);
        const formatted = date.toLocaleDateString(currentLocale(), { day: '2-digit', month: '2-digit' });
        return `${t('week_of')} ${formatted}`;
    });
    const litersData = weeklyStats.map(w => w.total_liters);
    
    if (weeklyChart) {
        weeklyChart.destroy();
    }
    
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: t('chart_weekly_dataset'),
                data: litersData,
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: t('chart_weekly_title'),
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' ' + t('chart_unit_liters');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' ' + t('chart_unit_liters');
                        }
                    }
                }
            }
        }
    });
}

function updateStats() {
    loadStats();
}

function exportData() {
    window.location.href = '/api/export';
}

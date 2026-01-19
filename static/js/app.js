let currentBeer = {
    pints: 0,
    half_pints: 0,
    liters_33: 0
};

let monthlyChart = null;
let totalChart = null;
let savingInProgress = false;

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5); // HH:MM
    
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
});

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
            console.error('Erreur lors du chargement:', error);
        });
}

function changeBeer(type, value) {
    currentBeer[type] = Math.max(0, currentBeer[type] + value);
    document.getElementById(`${type}-count`).innerText = currentBeer[type];
    
    saveBeerAutomatic(type, value);
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
        console.error('Erreur:', error);
        savingInProgress = false;
        currentBeer[type] = Math.max(0, currentBeer[type] - value);
        document.getElementById(`${type}-count`).innerText = currentBeer[type];
        alert('Erreur lors de l\'enregistrement. Vérifiez votre connexion.');
    });
}

function showSaveNotification(type, value) {
    const beerLabels = {
        'pints': 'Pinte',
        'half_pints': 'Demi',
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

function saveBeer() {
    alert('Les bières sont maintenant enregistrées automatiquement ! 🍺');
}

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
        .catch(error => console.error('Erreur:', error));
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
    
    if (totalPintsEl) totalPintsEl.innerText = data.total_pints;
    if (totalHalfEl) totalHalfEl.innerText = data.total_half_pints;
    if (total33El) total33El.innerText = data.total_33cl;
    if (totalLitersEl) totalLitersEl.innerText = data.total_liters;
    
    const warningsContainer = document.getElementById('warnings-container');
    const warningsList = document.getElementById('warnings-list');
    
    if (warningsContainer && warningsList) {
        // Filtrer les avertissements : garder seulement ceux dont la fenêtre de 3h n'est pas expirée
        const now = new Date();
        const activeWarnings = data.warnings.filter(warning => {
            // Construire la date/heure de fin en format correct
            const endDateTime = new Date(warning.end_date + 'T' + warning.end_time);
            return now < endDateTime;
        });
        
        if (activeWarnings && activeWarnings.length > 0) {
            warningsContainer.style.display = 'block';
            warningsList.innerHTML = '';
            
            activeWarnings.forEach(warning => {
                const warningDiv = document.createElement('div');
                warningDiv.style.cssText = `
                    background-color: white;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    border-left: 4px solid #f39c12;
                    border-radius: 4px;
                `;
                
                const items = warning.items.map(item => 
                    `<li style="margin-left: 2rem;">${item.time}: ${item.liters}L</li>`
                ).join('');
                
                warningDiv.innerHTML = `
                    <strong>🚨 De ${formatTime(warning.start_time)} à ${formatTime(warning.end_time)}</strong><br>
                    Total: <strong>${warning.total_liters}L</strong> (> 1.5L) ⚠️<br>
                    <ul style="margin-top: 0.5rem; margin-bottom: 0;">
                        ${items}
                    </ul>
                `;
                
                warningsList.appendChild(warningDiv);
            });
        } else {
            warningsContainer.style.display = 'none';
        }
    }
}

function updateCharts(data) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js n\'est pas disponible');
        return;
    }
    updateMonthlyChart(data.monthly_stats);
    updateTotalChart(data.records);
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
                return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            }),
            datasets: [
                {
                    label: 'Pintes',
                    data: pintData,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
                },
                {
                    label: 'Demis',
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
        console.warn('Element totalChart non trouvé');
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
    const labels = dates.map(d => new Date(d).toLocaleDateString('fr-FR'));
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
                    label: 'Total cumulé (L)',
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

function updateStats() {
    loadStats();
}

function exportData() {
    window.location.href = '/api/export';
}
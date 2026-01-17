let currentBeer = {
    pints: 0,
    half_pints: 0,
    liters_33: 0
};

let monthlyChart = null;
let totalChart = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const todayInput = document.getElementById('today-date');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (todayInput) {
        todayInput.value = today;
    }
    
    if (startDateInput && endDateInput) {
        // Dernier mois par défaut
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDateInput.value = startDate.toISOString().split('T')[0];
        endDateInput.value = today;
    }
    
    // Vérifier que Chart.js est chargé
    if (typeof Chart !== 'undefined') {
        loadStats();
    } else {
        console.error('Chart.js n\'est pas chargé');
        setTimeout(loadStats, 1000); // Réessayer après 1 seconde
    }
});

function changeBeer(type, value) {
    currentBeer[type] = Math.max(0, currentBeer[type] + value);
    document.getElementById(`${type}-count`).innerText = currentBeer[type];
}

function saveBeer() {
    const date = document.getElementById('today-date').value;
    const total = currentBeer.pints + currentBeer.half_pints + currentBeer.liters_33;
    
    if (total === 0) {
        alert('Veuillez sélectionner au moins une bière');
        return;
    }
    
    fetch('/api/consumption', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            date: date,
            pints: currentBeer.pints,
            half_pints: currentBeer.half_pints,
            liters_33: currentBeer.liters_33
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Consommation enregistrée !');
        currentBeer = {pints: 0, half_pints: 0, liters_33: 0};
        document.getElementById('pints-count').innerText = '0';
        document.getElementById('half_pints-count').innerText = '0';
        document.getElementById('liters_33-count').innerText = '0';
        loadStats();
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'enregistrement');
    });
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

function updateStatsDisplay(data) {
    const totalPintsEl = document.getElementById('total-pints');
    const totalHalfEl = document.getElementById('total-half');
    const total33El = document.getElementById('total-33');
    const totalLitersEl = document.getElementById('total-liters');
    
    if (totalPintsEl) totalPintsEl.innerText = data.total_pints;
    if (totalHalfEl) totalHalfEl.innerText = data.total_half_pints;
    if (total33El) total33El.innerText = data.total_33cl;
    if (totalLitersEl) totalLitersEl.innerText = data.total_liters;
    
    // Afficher les avertissements
    const warningsContainer = document.getElementById('warnings-container');
    const warningsList = document.getElementById('warnings-list');
    
    if (warningsContainer && warningsList) {
        if (data.warnings && data.warnings.length > 0) {
            warningsContainer.style.display = 'block';
            warningsList.innerHTML = '';
            data.warnings.forEach(warning => {
                const li = document.createElement('li');
                li.innerText = `🚨 Vous avez bu au moins 1.5L de bière aujourd'hui ! 🚨`; 
                warningsList.appendChild(li);
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
    
    // Trier par date
    const sorted = records.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let cumulativeLiters = 0;
    const labels = sorted.map(r => new Date(r.date).toLocaleDateString('fr-FR'));
    const data = sorted.map(r => {
        const liters = (r.pints * 0.5) + (r.half_pints * 0.25) + (r.liters_33 * 0.33);
        cumulativeLiters += liters;
        return parseFloat(cumulativeLiters.toFixed(2));
    });
    
    if (totalChart) {
        totalChart.destroy();
    }
    
    totalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total cumulé (L)',
                data: data,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
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

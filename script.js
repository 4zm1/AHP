let criteriaWeights = [];

// Update reciprocal values when matrix inputs change
function updateReciprocalValues() {
    const inputs = ['12', '13', '14', '23', '24', '34'];
    
    inputs.forEach(id => {
        const inputElement = document.getElementById('c' + id);
        if (inputElement) {
            inputElement.addEventListener('input', function() {
                const value = parseFloat(this.value) || 1;
                const reciprocal = 1 / value;
                
                // Update reciprocal values
                const reverseId = id.split('').reverse().join('');
                const reciprocalElement = document.getElementById('c' + reverseId);
                if (reciprocalElement) {
                    reciprocalElement.textContent = reciprocal.toFixed(2);
                }
            });
        }
    });
}

// Initialize reciprocal value updates
updateReciprocalValues();

function getComparisonMatrix() {
    const matrix = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];

    // Fill upper triangle
    matrix[0][1] = parseFloat(document.getElementById('c12').value) || 3;
    matrix[0][2] = parseFloat(document.getElementById('c13').value) || 5;
    matrix[0][3] = parseFloat(document.getElementById('c14').value) || 4;
    matrix[1][2] = parseFloat(document.getElementById('c23').value) || 3;
    matrix[1][3] = parseFloat(document.getElementById('c24').value) || 2;
    matrix[2][3] = parseFloat(document.getElementById('c34').value) || 0.5;

    // Fill lower triangle with reciprocals
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (i > j) {
                matrix[i][j] = 1 / matrix[j][i];
            }
        }
    }

    return matrix;
}

function calculateEigenVector(matrix) {
    const n = matrix.length;
    let weights = new Array(n).fill(0);
    
    // Geometric mean method
    for (let i = 0; i < n; i++) {
        let product = 1;
        for (let j = 0; j < n; j++) {
            product *= matrix[i][j];
        }
        weights[i] = Math.pow(product, 1 / n);
    }
    
    // Normalize
    const sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sum);
    
    return weights;
}

function calculateConsistencyRatio(matrix, weights) {
    const n = matrix.length;
    let lambdaMax = 0;
    
    // Calculate lambda max
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
            sum += matrix[i][j] * weights[j];
        }
        lambdaMax += sum / weights[i];
    }
    lambdaMax /= n;
    
    const CI = (lambdaMax - n) / (n - 1);
    const RI = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49][n]; // Random Index
    const CR = CI / RI;
    
    return { CI, CR, lambdaMax };
}

function calculateWeights() {
    try {
        const matrix = getComparisonMatrix();
        criteriaWeights = calculateEigenVector(matrix);
        const consistency = calculateConsistencyRatio(matrix, criteriaWeights);
        
        // Display weights
        const weightsDiv = document.getElementById('weightsResult');
        const criteriaNames = ['Kualitas Produk', 'Harga', 'Ketepatan Pengiriman', 'Layanan Purna Jual'];
        
        let html = '<h4>Bobot Prioritas Kriteria:</h4>';
        criteriaWeights.forEach((weight, index) => {
            const percentage = (weight * 100).toFixed(1);
            html += `
                <div class="priority-weight">
                    <span><strong>K${index + 1}:</strong> ${criteriaNames[index]}</span>
                    <span><strong>${weight.toFixed(3)} (${percentage}%)</strong></span>
                </div>
                <div style="background: #f0f0f0; border-radius: 10px; overflow: hidden; margin-bottom: 10px;">
                    <div class="weight-bar" style="width: ${percentage}%"></div>
                </div>
            `;
        });
        
        weightsDiv.innerHTML = html;
        
        // Display consistency check
        const consistencyDiv = document.getElementById('consistencyResult');
        const isConsistent = consistency.CR < 0.1;
        
        consistencyDiv.innerHTML = `
            <div class="consistency-check ${isConsistent ? '' : 'consistency-fail'}">
                <h4>Analisis Konsistensi:</h4>
                <p><strong>Lambda Max:</strong> ${consistency.lambdaMax.toFixed(4)}</p>
                <p><strong>Consistency Index (CI):</strong> ${consistency.CI.toFixed(4)}</p>
                <p><strong>Consistency Ratio (CR):</strong> ${consistency.CR.toFixed(4)}</p>
                <p class="${isConsistent ? 'success' : 'error'}">
                    <strong>${isConsistent ? '✓' : '✗'} 
                    ${isConsistent ? 'Matriks KONSISTEN (CR < 0.1)' : 'Matriks TIDAK KONSISTEN (CR ≥ 0.1)'}</strong>
                </p>
                ${!isConsistent ? '<p style="color: #dc3545; margin-top: 10px;"><em>Silakan perbaiki nilai perbandingan untuk mendapatkan hasil yang konsisten.</em></p>' : ''}
            </div>
        `;
        
    } catch (error) {
        document.getElementById('weightsResult').innerHTML = `
            <div class="error">Error dalam perhitungan: ${error.message}</div>
        `;
    }
}

function calculateFinalScores() {
    if (criteriaWeights.length === 0) {
        document.getElementById('finalResults').innerHTML = `
            <div class="error">Silakan hitung bobot prioritas kriteria terlebih dahulu!</div>
        `;
        return;
    }

    try {
        // Get supplier values
        const suppliers = ['A', 'B', 'C'];
        const supplierScores = [];
        
        suppliers.forEach((supplier, index) => {
            const values = [];
            for (let i = 1; i <= 4; i++) {
                const value = parseFloat(document.getElementById(supplier.toLowerCase() + i).value) || 0;
                values.push(value);
            }
            
            // Calculate weighted score
            let finalScore = 0;
            for (let i = 0; i < 4; i++) {
                finalScore += criteriaWeights[i] * values[i];
            }
            
            supplierScores.push({
                name: `Pemasok ${supplier}`,
                values: values,
                score: finalScore
            });
        });
        
        // Sort by score (descending)
        supplierScores.sort((a, b) => b.score - a.score);
        
        // Display results
        const resultsDiv = document.getElementById('finalResults');
        let html = '<h4>Perhitungan Skor Akhir:</h4>';
        
        // Detailed calculation table
        html += `
            <div class="matrix-container">
                <table>
                    <thead>
                        <tr>
                            <th>Pemasok</th>
                            <th>K1 × ${criteriaWeights[0].toFixed(3)}</th>
                            <th>K2 × ${criteriaWeights[1].toFixed(3)}</th>
                            <th>K3 × ${criteriaWeights[2].toFixed(3)}</th>
                            <th>K4 × ${criteriaWeights[3].toFixed(3)}</th>
                            <th>Skor Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        ['A', 'B', 'C'].forEach((supplier, index) => {
            const values = [];
            for (let i = 1; i <= 4; i++) {
                values.push(parseFloat(document.getElementById(supplier.toLowerCase() + i).value) || 0);
            }
            
            let finalScore = 0;
            for (let i = 0; i < 4; i++) {
                finalScore += criteriaWeights[i] * values[i];
            }
            
            html += `
                <tr>
                    <th>Pemasok ${supplier}</th>
                    <td>${values[0]} × ${criteriaWeights[0].toFixed(3)} = ${(values[0] * criteriaWeights[0]).toFixed(3)}</td>
                    <td>${values[1]} × ${criteriaWeights[1].toFixed(3)} = ${(values[1] * criteriaWeights[1]).toFixed(3)}</td>
                    <td>${values[2]} × ${criteriaWeights[2].toFixed(3)} = ${(values[2] * criteriaWeights[2]).toFixed(3)}</td>
                    <td>${values[3]} × ${criteriaWeights[3].toFixed(3)} = ${(values[3] * criteriaWeights[3]).toFixed(3)}</td>
                    <td><strong>${finalScore.toFixed(2)}</strong></td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        
        // Ranking
        html += '<h4 style="margin-top: 25px;">Ranking Pemasok:</h4>';
        supplierScores.forEach((supplier, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            html += `
                <div class="priority-weight" style="margin: 10px 0; ${index === 0 ? 'background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); font-weight: bold;' : ''}">
                    <span>${medal} ${index + 1}. ${supplier.name}</span>
                    <span style="font-size: 1.2em;"><strong>${supplier.score.toFixed(2)}</strong></span>
                </div>
            `;
        });
        
        // Winner announcement
        html += `
            <div class="winner">
                <h3>🏆 PEMENANG: ${supplierScores[0].name}</h3>
                <p>Dengan skor tertinggi: <strong>${supplierScores[0].score.toFixed(2)}</strong></p>
                <p style="margin-top: 10px; font-size: 0.9em; opacity: 0.9;">
                    Pilihan terbaik berdasarkan analisis AHP dengan 4 kriteria yang telah ditentukan
                </p>
            </div>
        `;
        
        resultsDiv.innerHTML = html;
        
    } catch (error) {
        document.getElementById('finalResults').innerHTML = `
            <div class="error">Error dalam perhitungan: ${error.message}</div>
        `;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Auto-calculate weights with initial values
    calculateWeights();
    
    // Update reciprocal values when inputs change
    const matrixInputs = document.querySelectorAll('.matrix-input');
    matrixInputs.forEach(input => {
        input.addEventListener('input', function() {
            updateReciprocalValues();
        });
    });
});

// Update reciprocal values in the display
function updateReciprocalValues() {
    const c12 = parseFloat(document.getElementById('c12').value) || 3;
    const c13 = parseFloat(document.getElementById('c13').value) || 5;
    const c14 = parseFloat(document.getElementById('c14').value) || 4;
    const c23 = parseFloat(document.getElementById('c23').value) || 3;
    const c24 = parseFloat(document.getElementById('c24').value) || 2;
    const c34 = parseFloat(document.getElementById('c34').value) || 0.5;
    
    document.getElementById('c21').textContent = (1/c12).toFixed(2);
    document.getElementById('c31').textContent = (1/c13).toFixed(2);
    document.getElementById('c41').textContent = (1/c14).toFixed(2);
    document.getElementById('c32').textContent = (1/c23).toFixed(2);
    document.getElementById('c42').textContent = (1/c24).toFixed(2);
    document.getElementById('c43').textContent = (1/c34).toFixed(2);
}
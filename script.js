// --- FUNCIÓN AUXILIAR: FDA Normal Estándar (Probit) ---
function normalCDF(x) {
    function erf(x) {
        var sign = (x >= 0) ? 1 : -1;
        x = Math.abs(x);
        var a1 =  0.254829592, a2 = -0.284496736, a3 =  1.421413741;
        var a4 = -1.453152027, a5 =  1.061405429, p  =  0.3275911;
        var t = 1.0 / (1.0 + p * x);
        var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

// --- NUEVA FUNCIÓN AUXILIAR: FDA Logística (Logit) ---
function logisticCDF(x) {
    return 1 / (1 + Math.exp(-x));
}


// --- CONFIGURACIÓN ---

var currentModel = 'probit'; // Estado inicial del modelo

// Definir la malla (grid) para X1 y X2
var x_grid = [];
var y_grid = [];
var step = 0.5;
for (var i = -5; i <= 5; i += step) {
    x_grid.push(i);
    y_grid.push(i);
}

// Obtener elementos del DOM
var beta0Slider = document.getElementById('beta0');
var beta1Slider = document.getElementById('beta1');
var beta2Slider = document.getElementById('beta2');
var beta0Val = document.getElementById('beta0_val');
var beta1Val = document.getElementById('beta1_val');
var beta2Val = document.getElementById('beta2_val');

// Elementos del toggle
var toggleProbitBtn = document.getElementById('toggleProbit');
var toggleLogitBtn = document.getElementById('toggleLogit');

var modelDesc = document.getElementById('model_desc');
var interceptDesc = document.getElementById('intercept_desc');
var slope1Desc = document.getElementById('slope1_desc');
var slope2Desc = document.getElementById('slope2_desc');

var chartDiv = document.getElementById('probitChart3D');

// --- FUNCIÓN PARA GENERAR DATOS Z (Probabilidad) ---
function generateZData(b0, b1, b2, modelType) {
    var z_data = [];
    var cdfFunction = (modelType === 'probit') ? normalCDF : logisticCDF;

    for (var i = 0; i < y_grid.length; i++) {
        var z_row = [];
        for (var j = 0; j < x_grid.length; j++) {
            var x1 = x_grid[j];
            var x2 = y_grid[i];
            
            var z_score = b0 + b1 * x1 + b2 * x2;
            var prob = cdfFunction(z_score); // Usa la función Probit o Logit
            z_row.push(prob);
        }
        z_data.push(z_row);
    }
    return z_data;
}

// --- FUNCIÓN DE ACTUALIZACIÓN ---
function updateChart() {
    var b0 = parseFloat(beta0Slider.value);
    var b1 = parseFloat(beta1Slider.value);
    var b2 = parseFloat(beta2Slider.value);

    // Actualizar etiquetas
    beta0Val.innerText = b0.toFixed(1);
    beta1Val.innerText = b1.toFixed(1);
    beta2Val.innerText = b2.toFixed(1);

    // Generar nuevos datos Z con el modelo seleccionado
    var new_z_data = generateZData(b0, b1, b2, currentModel);
    
    // Actualizar el gráfico
    Plotly.restyle(chartDiv, { z: [new_z_data] });

    // --- Actualizar Explicaciones ---
    modelDesc.innerHTML = `Estás visualizando el **Modelo ${currentModel.charAt(0).toUpperCase() + currentModel.slice(1)}**. Observa la sutil diferencia en las "colas" de la superficie respecto al otro modelo.`;
    interceptDesc.innerHTML = `<strong>$\beta_0$ (${b0.toFixed(1)}):</strong> Un valor ${b0 > 0 ? "positivo" : "negativo"} de $\beta_0$ ${b0 > 0 ? "desplaza la superficie hacia arriba" : "hacia abajo"}, cambiando la probabilidad base.`;
    
    let b1_effect = b1 == 0 ? "no tiene efecto" : (b1 > 0 ? "aumenta la probabilidad" : "disminuye la probabilidad");
    slope1Desc.innerHTML = `<strong>$\beta_1$ (${b1.toFixed(1)}):</strong> ${b1 > 0 ? "Una pendiente positiva" : (b1 < 0 ? "Una pendiente negativa" : "Una pendiente nula")} indica que a medida que $X_1$ aumenta, la probabilidad ${b1_effect}.`;

    let b2_effect = b2 == 0 ? "no tiene efecto" : (b2 > 0 ? "aumenta la probabilidad" : "disminuye la probabilidad");
    slope2Desc.innerHTML = `<strong>$\beta_2$ (${b2.toFixed(1)}):</strong> ${b2 > 0 ? "Una pendiente positiva" : (b2 < 0 ? "Una pendiente negativa" : "Una pendiente nula")} indica que a medida que $X_2$ aumenta, la probabilidad ${b2_effect}.`;
}

// --- INICIALIZACIÓN DEL GRÁFICO ---
function initPlot() {
    // Generar datos iniciales
    var b0_init = parseFloat(beta0Slider.value);
    var b1_init = parseFloat(beta1Slider.value);
    var b2_init = parseFloat(beta2Slider.value);
    var z_init = generateZData(b0_init, b1_init, b2_init, currentModel);

    // Definir la traza del gráfico
    var data = [{
        type: 'surface',
        x: x_grid,
        y: y_grid,
        z: z_init,
        colorscale: 'Viridis',
        colorbar: {
            title: 'Probabilidad',
            len: 0.75
        }
    }];

    // Definir el layout
    var layout = {
        title: 'Superficie de Probabilidad Probit/Logit',
        scene: {
            xaxis: { title: 'Variable X1' },
            yaxis: { title: 'Variable X2' },
            zaxis: { 
                title: 'P(Y=1)',
                range: [0, 1]
            },
            camera: {
              eye: {x: -1.5, y: -1.5, z: 1}
            }
        },
        margin: { l: 0, r: 0, b: 20, t: 40 }
    };

    // Dibujar el gráfico
    Plotly.newPlot(chartDiv, data, layout, {responsive: true});

    // Sincronizar los sliders y explicaciones
    updateChart();
}

// --- EVENT LISTENERS ---
beta0Slider.addEventListener('input', updateChart);
beta1Slider.addEventListener('input', updateChart);
beta2Slider.addEventListener('input', updateChart);

toggleProbitBtn.addEventListener('click', function() {
    currentModel = 'probit';
    toggleProbitBtn.classList.add('active');
    toggleLogitBtn.classList.remove('active');
    updateChart();
});

toggleLogitBtn.addEventListener('click', function() {
    currentModel = 'logit';
    toggleLogitBtn.classList.add('active');
    toggleProbitBtn.classList.remove('active');
    updateChart();
});


// Iniciar todo
initPlot();
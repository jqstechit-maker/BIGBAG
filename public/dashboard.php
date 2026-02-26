<?php
require_once __DIR__ . '/../layout/header.php';
require_once __DIR__ . '/../layout/sidebar.php';

// Proteção da página: exige que o usuário esteja logado
if (!Session::exists('user_id')) {
    header('Location: login.php');
    exit();
}
?>

<main class="flex-1 p-6 bg-gray-100">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Dashboard</h1>
    </div>

    <!-- Cards de Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
        <div class="bg-white p-5 rounded-lg shadow-md flex flex-col items-center justify-center">
            <i class="fas fa-box-open text-3xl text-erp-blue-500 mb-2"></i>
            <h3 class="text-lg font-semibold text-gray-600">Total de Produtos</h3>
            <p class="text-2xl font-bold text-gray-800">1,250</p>
        </div>
        <div class="bg-white p-5 rounded-lg shadow-md flex flex-col items-center justify-center">
            <i class="fas fa-truck-loading text-3xl text-green-500 mb-2"></i>
            <h3 class="text-lg font-semibold text-gray-600">Total de Entradas</h3>
            <p class="text-2xl font-bold text-gray-800">5,320</p>
        </div>
        <div class="bg-white p-5 rounded-lg shadow-md flex flex-col items-center justify-center">
            <i class="fas fa-dolly text-3xl text-red-500 mb-2"></i>
            <h3 class="text-lg font-semibold text-gray-600">Total de Saídas</h3>
            <p class="text-2xl font-bold text-gray-800">4,890</p>
        </div>
        <div class="bg-white p-5 rounded-lg shadow-md flex flex-col items-center justify-center">
            <i class="fas fa-dollar-sign text-3xl text-yellow-500 mb-2"></i>
            <h3 class="text-lg font-semibold text-gray-600">Valor em Estoque</h3>
            <p class="text-2xl font-bold text-gray-800">R$ 1.2M</p>
        </div>
        <div class="bg-white p-5 rounded-lg shadow-md flex flex-col items-center justify-center">
            <i class="fas fa-weight-hanging text-3xl text-gray-500 mb-2"></i>
            <h3 class="text-lg font-semibold text-gray-600">Peso em Estoque</h3>
            <p class="text-2xl font-bold text-gray-800">15.2 T</p>
        </div>
        <div class="bg-white p-5 rounded-lg shadow-md flex flex-col items-center justify-center">
            <i class="fas fa-industry text-3xl text-purple-500 mb-2"></i>
            <h3 class="text-lg font-semibold text-gray-600">Fornecedores</h3>
            <p class="text-2xl font-bold text-gray-800">42</p>
        </div>
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-lg shadow-md">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Entradas vs Saídas (Mensal)</h3>
            <canvas id="movimentacoesChart"></canvas>
        </div>
        <div class="bg-white p-5 rounded-lg shadow-md">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Estoque por Tipo de Produto</h3>
            <canvas id="tiposProdutoChart"></canvas>
        </div>
    </div>

</main>

<script>
    // Gráfico de Movimentações
    const ctxMovimentacoes = document.getElementById('movimentacoesChart').getContext('2d');
    new Chart(ctxMovimentacoes, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [
                {
                    label: 'Entradas',
                    data: [120, 190, 300, 500, 200, 300],
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Saídas',
                    data: [80, 150, 250, 400, 180, 280],
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Gráfico de Tipos de Produto
    const ctxTipos = document.getElementById('tiposProdutoChart').getContext('2d');
    new Chart(ctxTipos, {
        type: 'doughnut',
        data: {
            labels: ['VL-LINNER', 'VT-TECIDO', 'VA-ALCAS', 'VE-ETIQUETAS', 'VD-DIVERSOS'],
            datasets: [{
                label: 'Estoque por Tipo',
                data: [300, 50, 100, 80, 120],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(234, 179, 8, 0.7)',
                    'rgba(168, 85, 247, 0.7)',
                    'rgba(107, 114, 128, 0.7)'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
        }
    });
</script>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>

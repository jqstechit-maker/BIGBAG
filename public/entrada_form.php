<?php
require_once __DIR__ . '/../layout/header.php';
require_once __DIR__ . '/../layout/sidebar.php';
require_once __DIR__ . '/../core/db.php';

if (!Session::exists('user_id')) {
    header('Location: login.php');
    exit();
}

$db = DB::getInstance();
$empresa_id = Session::get('empresa_id');

// Buscar produtos, fornecedores e galpões
$db->query("SELECT id, descricao, peso_unitario, fornecedor_id, galpao_id FROM produtos WHERE empresa_id = ? ORDER BY descricao ASC", [$empresa_id]);
$produtos = $db->results();

$db->query("SELECT id, nome_empresa FROM fornecedores WHERE empresa_id = ? ORDER BY nome_empresa ASC", [$empresa_id]);
$fornecedores = $db->results();

?>

<main class="flex-1 p-6 bg-gray-100">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Registrar Entrada de Produto</h1>

    <div class="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
        <form action="../modules/movimentacoes/entradas_action.php" method="POST">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="produto_id" class="block text-sm font-medium text-gray-700">Produto</label>
                    <select name="produto_id" id="produto_id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                        <option value="">Selecione um produto</option>
                        <?php foreach ($produtos as $produto): ?>
                            <option value="<?php echo $produto->id; ?>" data-peso="<?php echo $produto->peso_unitario; ?>" data-fornecedor="<?php echo $produto->fornecedor_id; ?>">
                                <?php echo htmlspecialchars($produto->descricao); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label for="fornecedor_id" class="block text-sm font-medium text-gray-700">Fornecedor</label>
                    <select name="fornecedor_id" id="fornecedor_id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm bg-gray-100" readonly>
                         <option value="">Selecione um fornecedor</option>
                        <?php foreach ($fornecedores as $fornecedor): ?>
                            <option value="<?php echo $fornecedor->id; ?>"><?php echo htmlspecialchars($fornecedor->nome_empresa); ?></option>
                        <?php endforeach; ?>
                    </select>
                     <p class="mt-1 text-xs text-gray-500">O fornecedor é preenchido automaticamente com base no produto.</p>
                </div>

                <div>
                    <label for="quantidade" class="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input type="number" name="quantidade" id="quantidade" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>

                <div>
                    <label for="peso" class="block text-sm font-medium text-gray-700">Peso Total</label>
                    <input type="text" name="peso" id="peso" readonly class="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm">
                </div>

                <div>
                    <label for="valor_unitario" class="block text-sm font-medium text-gray-700">Valor Unitário (R$)</label>
                    <input type="number" step="0.01" name="valor_unitario" id="valor_unitario" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>

                <div>
                    <label for="nota_fiscal" class="block text-sm font-medium text-gray-700">Nota Fiscal</label>
                    <input type="text" name="nota_fiscal" id="nota_fiscal" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
            </div>

            <div class="mt-8 flex justify-end space-x-4">
                <a href="entradas.php" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Cancelar</a>
                <button type="submit" class="bg-erp-blue-600 hover:bg-erp-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
                    Registrar Entrada
                </button>
            </div>
        </form>
    </div>
</main>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const produtoSelect = document.getElementById('produto_id');
    const quantidadeInput = document.getElementById('quantidade');
    const pesoInput = document.getElementById('peso');
    const fornecedorSelect = document.getElementById('fornecedor_id');

    function calcularPeso() {
        const selectedOption = produtoSelect.options[produtoSelect.selectedIndex];
        const pesoUnitario = parseFloat(selectedOption.getAttribute('data-peso')) || 0;
        const quantidade = parseInt(quantidadeInput.value) || 0;
        const pesoTotal = (pesoUnitario * quantidade).toFixed(3);
        pesoInput.value = pesoTotal;
    }

    function atualizarFornecedor() {
        const selectedOption = produtoSelect.options[produtoSelect.selectedIndex];
        const fornecedorId = selectedOption.getAttribute('data-fornecedor');
        if (fornecedorId) {
            fornecedorSelect.value = fornecedorId;
        } else {
            fornecedorSelect.value = '';
        }
    }

    produtoSelect.addEventListener('change', function() {
        calcularPeso();
        atualizarFornecedor();
    });
    quantidadeInput.addEventListener('input', calcularPeso);
});
</script>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>

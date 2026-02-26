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

// Buscar produtos que têm estoque
$db->query("SELECT p.id, p.descricao, p.peso_unitario, e.quantidade as estoque_disponivel, p.galpao_id FROM produtos p JOIN estoque e ON p.id = e.produto_id WHERE p.empresa_id = ? AND e.quantidade > 0 ORDER BY p.descricao ASC", [$empresa_id]);
$produtos = $db->results();

$db->query("SELECT id, nome FROM galpoes WHERE empresa_id = ? ORDER BY nome ASC", [$empresa_id]);
$galpoes = $db->results();

$tipos_saida = ['venda', 'producao', 'transferencia'];

?>

<main class="flex-1 p-6 bg-gray-100">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Registrar Saída de Produto</h1>

    <div class="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
        <form action="../modules/movimentacoes/saidas_action.php" method="POST">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="produto_id" class="block text-sm font-medium text-gray-700">Produto</label>
                    <select name="produto_id" id="produto_id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                        <option value="">Selecione um produto</option>
                        <?php foreach ($produtos as $produto): ?>
                            <option value="<?php echo $produto->id; ?>" data-peso="<?php echo $produto->peso_unitario; ?>" data-max="<?php echo $produto->estoque_disponivel; ?>" data-galpao-origem="<?php echo $produto->galpao_id; ?>">
                                <?php echo htmlspecialchars($produto->descricao) . ' (Estoque: ' . $produto->estoque_disponivel . ')'; ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label for="tipo_saida" class="block text-sm font-medium text-gray-700">Tipo de Saída</label>
                    <select name="tipo_saida" id="tipo_saida" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                        <?php foreach ($tipos_saida as $tipo): ?>
                            <option value="<?php echo $tipo; ?>"><?php echo ucfirst($tipo); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label for="quantidade" class="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input type="number" name="quantidade" id="quantidade" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                    <p id="max-qty-msg" class="mt-1 text-xs text-red-500 hidden">A quantidade não pode ser maior que o estoque disponível.</p>
                </div>

                <div>
                    <label for="peso" class="block text-sm font-medium text-gray-700">Peso Total</label>
                    <input type="text" name="peso" id="peso" readonly class="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm">
                </div>

                <div>
                    <label for="galpao_origem_id" class="block text-sm font-medium text-gray-700">Galpão de Origem</label>
                    <select name="galpao_origem_id" id="galpao_origem_id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm" readonly>
                        <?php foreach ($galpoes as $galpao): ?>
                            <option value="<?php echo $galpao->id; ?>"><?php echo htmlspecialchars($galpao->nome); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div id="galpao_destino_container" class="hidden">
                    <label for="galpao_destino_id" class="block text-sm font-medium text-gray-700">Galpão de Destino</label>
                    <select name="galpao_destino_id" id="galpao_destino_id" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                        <option value="">Selecione um destino</option>
                        <?php foreach ($galpoes as $galpao): ?>
                            <option value="<?php echo $galpao->id; ?>"><?php echo htmlspecialchars($galpao->nome); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div class="mt-8 flex justify-end space-x-4">
                <a href="saidas.php" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Cancelar</a>
                <button type="submit" class="bg-erp-blue-600 hover:bg-erp-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
                    Registrar Saída
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
    const tipoSaidaSelect = document.getElementById('tipo_saida');
    const galpaoDestinoContainer = document.getElementById('galpao_destino_container');
    const galpaoOrigemSelect = document.getElementById('galpao_origem_id');
    const maxQtyMsg = document.getElementById('max-qty-msg');

    function updateForm() {
        const selectedOption = produtoSelect.options[produtoSelect.selectedIndex];
        const pesoUnitario = parseFloat(selectedOption.getAttribute('data-peso')) || 0;
        const quantidade = parseInt(quantidadeInput.value) || 0;
        const maxQty = parseInt(selectedOption.getAttribute('data-max')) || 0;
        const galpaoOrigemId = selectedOption.getAttribute('data-galpao-origem');

        // Calcula e exibe peso
        pesoInput.value = (pesoUnitario * quantidade).toFixed(3);

        // Valida quantidade
        if (quantidade > maxQty) {
            maxQtyMsg.classList.remove('hidden');
            quantidadeInput.classList.add('border-red-500');
        } else {
            maxQtyMsg.classList.add('hidden');
            quantidadeInput.classList.remove('border-red-500');
        }

        // Atualiza galpão de origem
        if(galpaoOrigemId) galpaoOrigemSelect.value = galpaoOrigemId;

        // Mostra/esconde galpão de destino
        if (tipoSaidaSelect.value === 'transferencia') {
            galpaoDestinoContainer.classList.remove('hidden');
        } else {
            galpaoDestinoContainer.classList.add('hidden');
        }
    }

    produtoSelect.addEventListener('change', updateForm);
    quantidadeInput.addEventListener('input', updateForm);
    tipoSaidaSelect.addEventListener('change', updateForm);
});
</script>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>

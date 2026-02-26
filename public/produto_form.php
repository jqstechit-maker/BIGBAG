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

$produto = null;
$page_title = 'Adicionar Produto';
$action = 'add';

if (isset($_GET['id'])) {
    $produto_id = $_GET['id'];
    $db->query("SELECT * FROM produtos WHERE id = ? AND empresa_id = ?", [$produto_id, $empresa_id]);
    if ($db->count() > 0) {
        $produto = $db->first();
        $page_title = 'Editar Produto';
        $action = 'edit';
    } else {
        // Redireciona se o produto não for encontrado ou não pertencer à empresa
        header('Location: produtos.php');
        exit();
    }
}

// Buscar fornecedores e galpões da empresa
$db->query("SELECT id, nome_empresa FROM fornecedores WHERE empresa_id = ? ORDER BY nome_empresa ASC", [$empresa_id]);
$fornecedores = $db->results();

$db->query("SELECT id, nome FROM galpoes WHERE empresa_id = ? ORDER BY nome ASC", [$empresa_id]);
$galpoes = $db->results();

$tipos_produto = ['VL-LINNER', 'VT-TECIDO', 'VA-ALCAS', 'VE-ETIQUETAS', 'VD-DIVERSOS'];

?>

<main class="flex-1 p-6 bg-gray-100">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800"><?php echo $page_title; ?></h1>
    </div>

    <div class="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
        <form action="../modules/produtos/produtos_action.php" method="POST">
            <input type="hidden" name="action" value="<?php echo $action; ?>">
            <?php if ($action === 'edit'): ?>
                <input type="hidden" name="id" value="<?php echo $produto->id; ?>">
            <?php endif; ?>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="codigo" class="block text-sm font-medium text-gray-700">Código do Produto</label>
                    <input type="text" name="codigo" id="codigo" value="<?php echo htmlspecialchars($produto->codigo ?? ''); ?>" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
                <div>
                    <label for="descricao" class="block text-sm font-medium text-gray-700">Descrição</label>
                    <input type="text" name="descricao" id="descricao" value="<?php echo htmlspecialchars($produto->descricao ?? ''); ?>" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
                <div>
                    <label for="tipo_produto" class="block text-sm font-medium text-gray-700">Tipo de Produto</label>
                    <select name="tipo_produto" id="tipo_produto" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                        <?php foreach ($tipos_produto as $tipo): ?>
                            <option value="<?php echo $tipo; ?>" <?php echo (isset($produto) && $produto->tipo_produto === $tipo) ? 'selected' : ''; ?>><?php echo $tipo; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label for="fornecedor_id" class="block text-sm font-medium text-gray-700">Fornecedor</label>
                    <select name="fornecedor_id" id="fornecedor_id" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                        <option value="">Nenhum</option>
                        <?php foreach ($fornecedores as $fornecedor): ?>
                            <option value="<?php echo $fornecedor->id; ?>" <?php echo (isset($produto) && $produto->fornecedor_id == $fornecedor->id) ? 'selected' : ''; ?>><?php echo htmlspecialchars($fornecedor->nome_empresa); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                 <div>
                    <label for="galpao_id" class="block text-sm font-medium text-gray-700">Local de Armazenamento (Galpão)</label>
                    <select name="galpao_id" id="galpao_id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                        <?php foreach ($galpoes as $galpao): ?>
                            <option value="<?php echo $galpao->id; ?>" <?php echo (isset($produto) && $produto->galpao_id == $galpao->id) ? 'selected' : ''; ?>><?php echo htmlspecialchars($galpao->nome); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label for="peso_unitario" class="block text-sm font-medium text-gray-700">Peso Unitário</label>
                    <input type="number" step="0.001" name="peso_unitario" id="peso_unitario" value="<?php echo htmlspecialchars($produto->peso_unitario ?? '0.000'); ?>" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
                <div>
                    <label for="unidade" class="block text-sm font-medium text-gray-700">Unidade (Ex: kg, m, un)</label>
                    <input type="text" name="unidade" id="unidade" value="<?php echo htmlspecialchars($produto->unidade ?? ''); ?>" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
                <div>
                    <label for="estoque_minimo" class="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                    <input type="number" name="estoque_minimo" id="estoque_minimo" value="<?php echo htmlspecialchars($produto->estoque_minimo ?? '0'); ?>" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
            </div>

            <div class="mt-8 flex justify-end space-x-4">
                <a href="produtos.php" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Cancelar</a>
                <button type="submit" class="bg-erp-blue-600 hover:bg-erp-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
                    Salvar Produto
                </button>
            </div>
        </form>
    </div>
</main>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>

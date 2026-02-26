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

$fornecedor = null;
$page_title = 'Adicionar Fornecedor';
$action = 'add';

if (isset($_GET['id'])) {
    $fornecedor_id = $_GET['id'];
    $db->query("SELECT * FROM fornecedores WHERE id = ? AND empresa_id = ?", [$fornecedor_id, $empresa_id]);
    if ($db->count() > 0) {
        $fornecedor = $db->first();
        $page_title = 'Editar Fornecedor';
        $action = 'edit';
    }
}
?>

<main class="flex-1 p-6 bg-gray-100">
    <h1 class="text-3xl font-bold text-gray-800 mb-6"><?php echo $page_title; ?></h1>

    <div class="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <form action="../modules/fornecedores/fornecedores_action.php" method="POST">
            <input type="hidden" name="action" value="<?php echo $action; ?>">
            <?php if ($action === 'edit'): ?>
                <input type="hidden" name="id" value="<?php echo $fornecedor->id; ?>">
            <?php endif; ?>

            <div class="space-y-4">
                <div>
                    <label for="nome_empresa" class="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                    <input type="text" name="nome_empresa" id="nome_empresa" value="<?php echo htmlspecialchars($fornecedor->nome_empresa ?? ''); ?>" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
                <div>
                    <label for="telefone" class="block text-sm font-medium text-gray-700">Telefone</label>
                    <input type="text" name="telefone" id="telefone" value="<?php echo htmlspecialchars($fornecedor->telefone ?? ''); ?>" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" id="email" value="<?php echo htmlspecialchars($fornecedor->email ?? ''); ?>" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
                <div>
                    <label for="endereco" class="block text-sm font-medium text-gray-700">Endereço</label>
                    <textarea name="endereco" id="endereco" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm"><?php echo htmlspecialchars($fornecedor->endereco ?? ''); ?></textarea>
                </div>
            </div>

            <div class="mt-6 flex justify-end space-x-4">
                <a href="fornecedores.php" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Cancelar</a>
                <button type="submit" class="bg-erp-blue-600 hover:bg-erp-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
                    Salvar Fornecedor
                </button>
            </div>
        </form>
    </div>
</main>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>

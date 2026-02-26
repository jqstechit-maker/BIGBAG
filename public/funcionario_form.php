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

$funcionario = null;
$page_title = 'Adicionar Funcionário';
$action = 'add';

if (isset($_GET['id'])) {
    $func_id = $_GET['id'];
    $db->query("SELECT * FROM usuarios WHERE id = ? AND empresa_id = ?", [$func_id, $empresa_id]);
    if ($db->count() > 0) {
        $funcionario = $db->first();
        $page_title = 'Editar Funcionário';
        $action = 'edit';
    }
}
?>

<main class="flex-1 p-6 bg-gray-100">
    <h1 class="text-3xl font-bold text-gray-800 mb-6"><?php echo $page_title; ?></h1>

    <div class="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <form action="../modules/funcionarios/funcionarios_action.php" method="POST">
            <input type="hidden" name="action" value="<?php echo $action; ?>">
            <?php if ($action === 'edit'): ?>
                <input type="hidden" name="id" value="<?php echo $funcionario->id; ?>">
            <?php endif; ?>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="nome" class="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input type="text" name="nome" id="nome" value="<?php echo htmlspecialchars($funcionario->nome ?? ''); ?>" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" id="email" value="<?php echo htmlspecialchars($funcionario->email ?? ''); ?>" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
                <div>
                    <label for="numero_registro" class="block text-sm font-medium text-gray-700">Número de Registro</label>
                    <input type="text" name="numero_registro" id="numero_registro" value="<?php echo htmlspecialchars($funcionario->numero_registro ?? ''); ?>" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
                <div>
                    <label for="funcao" class="block text-sm font-medium text-gray-700">Função</label>
                    <input type="text" name="funcao" id="funcao" value="<?php echo htmlspecialchars($funcionario->funcao ?? ''); ?>" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                </div>
                <div>
                    <label for="nivel_acesso" class="block text-sm font-medium text-gray-700">Nível de Acesso</label>
                    <select name="nivel_acesso" id="nivel_acesso" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm">
                        <option value="funcionario" <?php echo (isset($funcionario) && $funcionario->nivel_acesso === 'funcionario') ? 'selected' : ''; ?>>Funcionário</option>
                        <option value="admin" <?php echo (isset($funcionario) && $funcionario->nivel_acesso === 'admin') ? 'selected' : ''; ?>>Admin da Empresa</option>
                    </select>
                </div>
                <div>
                    <label for="senha" class="block text-sm font-medium text-gray-700">Senha</label>
                    <input type="password" name="senha" id="senha" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-erp-blue-500 focus:ring-erp-blue-500 sm:text-sm" <?php echo ($action === 'add') ? 'required' : ''; ?>>
                    <?php if ($action === 'edit'): ?>
                        <p class="mt-1 text-xs text-gray-500">Deixe em branco para não alterar a senha.</p>
                    <?php endif; ?>
                </div>
            </div>

            <div class="mt-6 flex justify-end space-x-4">
                <a href="funcionarios.php" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Cancelar</a>
                <button type="submit" class="bg-erp-blue-600 hover:bg-erp-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
                    Salvar Funcionário
                </button>
            </div>
        </form>
    </div>
</main>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>

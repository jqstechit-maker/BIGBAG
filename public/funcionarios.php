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

// Apenas admin e super_admin podem ver funcionários
$user_level = Session::get('user_nivel');
if ($user_level == 'funcionario') {
    // Redireciona ou mostra mensagem de erro
    echo "<script>alert('Acesso negado!'); window.location.href = 'dashboard.php';</script>";
    exit();
}

$db->query("SELECT * FROM usuarios WHERE empresa_id = ? AND nivel_acesso != 'super_admin' ORDER BY nome ASC", [$empresa_id]);
$funcionarios = $db->results();

$success_message = Session::flash('success_message');
?>

<main class="flex-1 p-6 bg-gray-100">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Cadastro de Funcionários</h1>
        <a href="funcionario_form.php" class="bg-erp-blue-600 hover:bg-erp-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
            <i class="fas fa-plus mr-2"></i> Adicionar Funcionário
        </a>
    </div>

    <?php if ($success_message): ?>
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline"><?php echo $success_message; ?></span>
        </div>
    <?php endif; ?>

    <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white">
                <thead class="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <tr>
                        <th class="py-3 px-6 text-left">Nome</th>
                        <th class="py-3 px-6 text-left">Email</th>
                        <th class="py-3 px-6 text-left">Nº Registro</th>
                        <th class="py-3 px-6 text-left">Função</th>
                        <th class="py-3 px-6 text-left">Nível de Acesso</th>
                        <th class="py-3 px-6 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody class="text-gray-600 text-sm font-light">
                    <?php if (count($funcionarios) > 0): ?>
                        <?php foreach ($funcionarios as $func): ?>
                            <tr class="border-b border-gray-200 hover:bg-gray-100">
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($func->nome); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($func->email); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($func->numero_registro); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($func->funcao); ?></td>
                                <td class="py-3 px-6 text-left capitalize"><?php echo htmlspecialchars(str_replace('_', ' ', $func->nivel_acesso)); ?></td>
                                <td class="py-3 px-6 text-center">
                                    <div class="flex item-center justify-center">
                                        <a href="funcionario_form.php?id=<?php echo $func->id; ?>" class="w-8 h-8 flex items-center justify-center rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300 mr-2 transform hover:scale-110 transition-transform">
                                            <i class="fas fa-pencil-alt"></i>
                                        </a>
                                        <a href="../modules/funcionarios/funcionarios_action.php?action=delete&id=<?php echo $func->id; ?>" onclick="return confirm('Tem certeza que deseja excluir este funcionário?');" class="w-8 h-8 flex items-center justify-center rounded-full bg-red-200 text-red-600 hover:bg-red-300 transform hover:scale-110 transition-transform">
                                            <i class="fas fa-trash-alt"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="6" class="text-center py-4">Nenhum funcionário cadastrado.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>

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

$db->query("SELECT * FROM galpoes WHERE empresa_id = ? ORDER BY nome ASC", [$empresa_id]);
$galpoes = $db->results();

$success_message = Session::flash('success_message');
?>

<main class="flex-1 p-6 bg-gray-100">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Cadastro de Galpões</h1>
        <a href="galpao_form.php" class="bg-erp-blue-600 hover:bg-erp-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
            <i class="fas fa-plus mr-2"></i> Adicionar Galpão
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
                        <th class="py-3 px-6 text-left">Descrição</th>
                        <th class="py-3 px-6 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody class="text-gray-600 text-sm font-light">
                    <?php if (count($galpoes) > 0): ?>
                        <?php foreach ($galpoes as $galpao): ?>
                            <tr class="border-b border-gray-200 hover:bg-gray-100">
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($galpao->nome); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($galpao->descricao); ?></td>
                                <td class="py-3 px-6 text-center">
                                    <div class="flex item-center justify-center">
                                        <a href="galpao_form.php?id=<?php echo $galpao->id; ?>" class="w-8 h-8 flex items-center justify-center rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300 mr-2 transform hover:scale-110 transition-transform">
                                            <i class="fas fa-pencil-alt"></i>
                                        </a>
                                        <a href="../modules/galpoes/galpoes_action.php?action=delete&id=<?php echo $galpao->id; ?>" onclick="return confirm('Tem certeza que deseja excluir este galpão?');" class="w-8 h-8 flex items-center justify-center rounded-full bg-red-200 text-red-600 hover:bg-red-300 transform hover:scale-110 transition-transform">
                                            <i class="fas fa-trash-alt"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="3" class="text-center py-4">Nenhum galpão cadastrado.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>

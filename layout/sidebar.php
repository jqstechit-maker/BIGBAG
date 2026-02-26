<aside class="w-64 bg-erp-blue-900 text-white flex flex-col">
    <div class="p-6 text-center border-b border-erp-blue-800">
        <h2 class="text-2xl font-bold"><?php echo SITE_NAME; ?></h2>
    </div>
    <nav class="flex-1 p-4 space-y-2">
        <a href="dashboard.php" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-erp-blue-700 transition-colors">
            <i class="fas fa-tachometer-alt w-6 text-center mr-3"></i>
            Dashboard
        </a>

        <p class="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase">Cadastros</p>
        <a href="produtos.php" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-erp-blue-700 transition-colors">
            <i class="fas fa-box w-6 text-center mr-3"></i>
            Produtos
        </a>
        <a href="fornecedores.php" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-erp-blue-700 transition-colors">
            <i class="fas fa-industry w-6 text-center mr-3"></i>
            Fornecedores
        </a>
        <a href="funcionarios.php" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-erp-blue-700 transition-colors">
            <i class="fas fa-users w-6 text-center mr-3"></i>
            Funcionários
        </a>
        <a href="galpoes.php" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-erp-blue-700 transition-colors">
            <i class="fas fa-warehouse w-6 text-center mr-3"></i>
            Galpões
        </a>

        <p class="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase">Movimentações</p>
        <a href="entradas.php" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-erp-blue-700 transition-colors">
            <i class="fas fa-arrow-circle-down w-6 text-center mr-3"></i>
            Entrada de Produtos
        </a>
        <a href="saidas.php" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-erp-blue-700 transition-colors">
            <i class="fas fa-arrow-circle-up w-6 text-center mr-3"></i>
            Saída de Produtos
        </a>

        <p class="px-4 pt-4 pb-2 text-xs text-gray-400 uppercase">Controle</p>
        <a href="estoque.php" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-md hover:bg-erp-blue-700 transition-colors">
            <i class="fas fa-clipboard-list w-6 text-center mr-3"></i>
            Estoque
        </a>
    </nav>
    <div class="p-4 border-t border-erp-blue-800">
        <div class="flex items-center">
            <div class="flex-1">
                <p class="text-sm font-semibold"><?php echo htmlspecialchars(Session::get('user_nome')); ?></p>
                <p class="text-xs text-gray-400 capitalize"><?php echo str_replace('_', ' ', htmlspecialchars(Session::get('user_nivel'))); ?></p>
            </div>
            <a href="logout.php" title="Sair" class="text-gray-300 hover:text-white">
                <i class="fas fa-sign-out-alt text-lg"></i>
            </a>
        </div>
    </div>
</aside>

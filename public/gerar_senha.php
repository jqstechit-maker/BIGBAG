<?php
$senha_hash = '';
$senha_original = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['senha'])) {
    $senha_original = $_POST['senha'];
    // Gera o hash da senha usando o algoritmo padrão e mais seguro
    $senha_hash = password_hash($senha_original, PASSWORD_DEFAULT);
}

?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerador de Hash de Senha</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen">

    <div class="w-full max-w-xl p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-800">Gerador de Senha Segura (Hash)</h1>
            <p class="text-gray-500">Use esta ferramenta para criar uma nova senha criptografada para um usuário.</p>
        </div>

        <form class="space-y-4" action="" method="POST">
            <div>
                <label for="senha" class="text-sm font-medium text-gray-700">Digite a Nova Senha</label>
                <input type="text" name="senha" id="senha" required
                       class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>

            <div>
                <button type="submit"
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Gerar Hash
                </button>
            </div>
        </form>

        <?php if ($senha_hash): ?>
            <div class="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h2 class="text-lg font-semibold text-gray-800">Resultado:</h2>
                <p class="text-sm text-gray-600 mt-2">Para a senha: <strong class="font-mono"><?php echo htmlspecialchars($senha_original); ?></strong></p>
                <p class="text-sm text-gray-600 mt-2">O hash gerado é:</p>
                <div class="mt-2 p-3 bg-gray-200 rounded font-mono text-sm break-all" id="hash-result">
                    <?php echo htmlspecialchars($senha_hash); ?>
                </div>
                <button onclick="copiarHash()" class="mt-3 text-sm text-blue-600 hover:underline">Copiar Hash</button>
                <p class="mt-4 text-sm text-red-600 font-semibold">Instruções:</p>
                <ol class="list-decimal list-inside text-sm text-gray-700 space-y-1 mt-2">
                    <li>Copie o hash gerado acima.</li>
                    <li>Acesse o phpMyAdmin e abra a tabela <strong>usuarios</strong>.</li>
                    <li>Edite o registro do usuário (ex: superadmin@erp.com).</li>
                    <li>Cole o novo hash no campo <strong>senha</strong> e salve.</li>
                    <li>Tente fazer login novamente com a senha que você digitou.</li>
                </ol>
            </div>
        <?php endif; ?>
    </div>

    <script>
        function copiarHash() {
            const hashText = document.getElementById('hash-result').innerText;
            navigator.clipboard.writeText(hashText).then(function() {
                alert('Hash copiado para a área de transferência!');
            }, function(err) {
                alert('Erro ao copiar o hash.');
            });
        }
    </script>

</body>
</html>

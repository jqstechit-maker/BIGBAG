<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../core/session.php';
require_once __DIR__ . '/../core/db.php';

echo "<h1>Diagnóstico do Sistema ERP</h1>";

// 1. Teste de Conexão com Banco
echo "<h2>1. Banco de Dados</h2>";
try {
    $db = DB::getInstance();
    echo "<p style='color:green'>✅ Conexão com o banco de dados estabelecida com sucesso!</p>";
    
    $db->query("SELECT COUNT(*) as total FROM usuarios");
    $res = $db->first();
    echo "<p>Total de usuários no banco: <strong>" . $res->total . "</strong></p>";
    
    $db->query("SELECT email, nivel_acesso FROM usuarios");
    $users = $db->results();
    echo "<ul>";
    foreach($users as $u) {
        echo "<li>" . $u->email . " (" . $u->nivel_acesso . ")</li>";
    }
    echo "</ul>";

} catch (Exception $e) {
    echo "<p style='color:red'>❌ Erro no banco de dados: " . $e->getMessage() . "</p>";
}

// 2. Teste de Sessão
echo "<h2>2. Sessão PHP</h2>";
Session::set('teste_sessao', 'Funcionando!');
if (Session::get('teste_sessao') === 'Funcionando!') {
    echo "<p style='color:green'>✅ Sessão PHP está funcionando corretamente!</p>";
} else {
    echo "<p style='color:red'>❌ Erro: Sessão PHP não está persistindo dados.</p>";
}

// 3. Teste de Caminhos
echo "<h2>3. Configurações de Caminho</h2>";
echo "<p>BASE_URL: <strong>" . BASE_URL . "</strong></p>";
echo "<p>Caminho do Servidor: <strong>" . __DIR__ . "</strong></p>";

echo "<hr>";
echo "<p><a href='login.php'>Ir para a página de login</a></p>";
?>

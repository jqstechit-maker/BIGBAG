<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../core/db.php';

$db = DB::getInstance();

// 1. Resetar o Super Admin padrão
$email1 = 'superadmin@erp.com';
$senha1 = 'superadmin123';
$hash1 = password_hash($senha1, PASSWORD_DEFAULT);
$db->query("UPDATE usuarios SET senha = ? WHERE email = ?", [$hash1, $email1]);

// 2. Resetar o Admin secundário
$email2 = 'admin@admin.com';
$senha2 = 'admin';
$hash2 = password_hash($senha2, PASSWORD_DEFAULT);
$db->query("UPDATE usuarios SET senha = ? WHERE email = ?", [$hash2, $email2]);

echo "<h1>Senhas Resetadas com Sucesso!</h1>";
echo "<p>O usuário <strong>$email1</strong> agora usa a senha: <strong>$senha1</strong></p>";
echo "<p>O usuário <strong>$email2</strong> agora usa a senha: <strong>$senha2</strong></p>";
echo "<br><a href='login.php'>Ir para o Login</a>";
?>

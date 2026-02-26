<?php
require_once __DIR__ . '/../core/session.php';

// Simples roteamento para começar
// Futuramente, isso pode ser um sistema de roteamento mais robusto

if (Session::exists('user_id')) {
    // Se o usuário está logado, redireciona para o dashboard
    header('Location: dashboard.php');
    exit();
} else {
    // Se não, redireciona para a página de login
    header('Location: login.php');
    exit();
}

?>

<?php
require_once __DIR__ . '/../core/session.php';

// Destrói todos os dados da sessão
Session::destroy();

// Redireciona para a página de login
header('Location: login.php');
exit();
?>

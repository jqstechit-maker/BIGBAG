<?php

// Configurações do Banco de Dados
define('DB_HOST', 'localhost'); // Geralmente 'localhost' em hospedagem compartilhada
define('DB_USER', 'u609303672_virt');
define('DB_PASS', 'Virt@2026');
define('DB_NAME', 'u609303672_virt');

// Configurações Gerais
define('SITE_NAME', 'VIRTUDE BIGBAG\'S');
define('BASE_URL', 'https://virtude.jqstechit.com.br/public');

// Configurações de Sessão
define('SESSION_NAME', 'erp_session');

// Configuração de Fuso Horário
date_default_timezone_set('America/Sao_Paulo');

// Habilitar exibição de erros (para desenvolvimento)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

?>

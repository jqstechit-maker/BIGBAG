<?php

class Session {

    public static function start() {
        if (session_status() == PHP_SESSION_NONE) {
            session_name(SESSION_NAME);
            session_start();
        }
    }

    public static function set($key, $value) {
        $_SESSION[$key] = $value;
    }

    public static function get($key) {
        return isset($_SESSION[$key]) ? $_SESSION[$key] : null;
    }

    public static function exists($key) {
        return isset($_SESSION[$key]);
    }

    public static function delete($key) {
        if (self::exists($key)) {
            unset($_SESSION[$key]);
        }
    }

    public static function destroy() {
        session_destroy();
    }

    public static function flash($name, $string = '') {
        if (self::exists($name)) {
            $session = self::get($name);
            self::delete($name);
            return $session;
        } else {
            self::set($name, $string);
        }
        return '';
    }
}

// Inicia a sessão em todas as páginas que incluírem este arquivo
require_once __DIR__ . '/../config/config.php';
Session::start();

?>

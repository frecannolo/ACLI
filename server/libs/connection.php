<?php
$USER = 'cano';
$PASSWORD = 'cano';
$DATABASE = 'ACLI';

$conn = mysqli_connect('localhost', $USER, $PASSWORD, $DATABASE);
mysqli_set_charset($conn, 'utf8');

if(!$conn) {
    echo 'Error: Unable to connect to MySQL.'.PHP_EOL;
    echo 'Debugging errno: '.mysqli_connect_errno().PHP_EOL;
    echo 'Debugging error: '.mysqli_connect_error().PHP_EOL;
    exit;
} else
    $GLOBALS['conn'] = $conn;

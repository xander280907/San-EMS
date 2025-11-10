<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return [
        'name' => 'EMS API',
        'version' => '1.0.0',
        'status' => 'running',
        'timezone' => config('app.timezone'),
    ];
});

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\PositionSeeder;

class SeedPositions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'positions:seed';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed positions for all departments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Seeding positions for all departments...');
        
        $seeder = new PositionSeeder();
        $seeder->setCommand($this);
        $seeder->run();
        
        $this->info('✓ Positions seeded successfully!');
        return 0;
    }
}

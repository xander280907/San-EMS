<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeductionType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'rate',
        'fixed_amount',
        'is_mandatory',
        'description',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'fixed_amount' => 'decimal:2',
        'is_mandatory' => 'boolean',
    ];

    public function payrollItems()
    {
        return $this->hasMany(PayrollItem::class);
    }
}

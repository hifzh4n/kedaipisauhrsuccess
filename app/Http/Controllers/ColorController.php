<?php

namespace App\Http\Controllers;

use App\Models\Color;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ColorController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'brand_id' => 'required|exists:brands,id',
            'model_id' => 'required|exists:models,id',
        ]);

        // Check if color already exists for this brand/model combination
        $color = Color::firstOrCreate([
            'name' => $request->name,
            'brand_id' => $request->brand_id,
            'model_id' => $request->model_id,
        ]);

        // Load relationships
        $color->load(['brand', 'model']);

        // Return redirect response for Inertia
        return redirect()->back()->with([
            'success' => 'Color created successfully',
            'color' => $color
        ]);
    }
}

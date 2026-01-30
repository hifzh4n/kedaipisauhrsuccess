<?php

namespace App\Http\Controllers;

use App\Models\ItemModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemModelController extends Controller
{
    public function index()
    {
        $models = ItemModel::with('brand')->orderBy('name')->get();
        
        return response()->json([
            'success' => true,
            'models' => $models
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'brand_id' => 'required|exists:brands,id'
        ]);

        $model = ItemModel::create($request->only('name', 'brand_id'));
        $model->load('brand');

        // Return redirect response for Inertia
        return redirect()->back()->with([
            'success' => 'Model created successfully',
            'model' => $model
        ]);
    }
}

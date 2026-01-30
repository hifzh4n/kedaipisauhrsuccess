<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BrandController extends Controller
{
    public function index()
    {
        $brands = Brand::orderBy('name')->get();
        
        return response()->json([
            'success' => true,
            'brands' => $brands
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:brands,name'
        ]);

        $brand = Brand::create($request->only('name'));

        // Return redirect response for Inertia
        return redirect()->back()->with([
            'success' => 'Brand created successfully',
            'brand' => $brand
        ]);
    }
}

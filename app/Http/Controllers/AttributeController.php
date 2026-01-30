<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\ItemModel;
use App\Models\Color;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttributeController extends Controller
{
    /**
     * Display the attribute management page
     */
    public function index(Request $request)
    {
        $perPage = 10; // Number of items per page
        $activeTab = $request->get('tab', 'brands');
        
        // Get all brands for dropdowns (not paginated)
        $allBrands = Brand::with(['models.colors'])->orderBy('name')->get();
        $allModels = ItemModel::with(['brand', 'colors'])->orderBy('name')->get();
        
        // Get paginated data for display based on active tab
        $brands = Brand::with(['models.colors'])
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
            
        $models = ItemModel::with(['brand', 'colors'])
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
            
        $colors = Color::with(['brand', 'model'])
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('AttributeManagement/Index', [
            'brands' => $brands,
            'models' => $models,
            'colors' => $colors,
            'allBrands' => $allBrands,
            'allModels' => $allModels,
            'activeTab' => $activeTab,
        ]);
    }

    /**
     * Store a new brand
     */
    public function storeBrand(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:brands,name',
        ]);

        $brand = Brand::create([
            'name' => $request->name,
        ]);

        return back()->with('success', "Brand '{$brand->name}' created successfully.");
    }

    /**
     * Store a new model
     */
    public function storeModel(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'brand_id' => 'required|exists:brands,id',
        ]);

        // Check if model already exists for this brand
        $existingModel = ItemModel::where('name', $request->name)
            ->where('brand_id', $request->brand_id)
            ->first();

        if ($existingModel) {
            return back()->withErrors(['name' => 'This model already exists for the selected brand.']);
        }

        $model = ItemModel::create([
            'name' => $request->name,
            'brand_id' => $request->brand_id,
        ]);

        $brand = Brand::find($request->brand_id);

        return back()->with('success', "Model '{$model->name}' created successfully for brand '{$brand->name}'.");
    }

    /**
     * Store a new color
     */
    public function storeColor(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'brand_id' => 'required|exists:brands,id',
            'model_id' => 'required|exists:models,id',
        ]);

        // Verify that the model belongs to the brand
        $model = ItemModel::where('id', $request->model_id)
            ->where('brand_id', $request->brand_id)
            ->first();

        if (!$model) {
            return back()->withErrors(['model_id' => 'The selected model does not belong to the selected brand.']);
        }

        // Check if color already exists for this brand/model combination
        $existingColor = Color::where('name', $request->name)
            ->where('brand_id', $request->brand_id)
            ->where('model_id', $request->model_id)
            ->first();

        if ($existingColor) {
            return back()->withErrors(['name' => 'This color already exists for the selected brand and model.']);
        }

        $color = Color::create([
            'name' => $request->name,
            'brand_id' => $request->brand_id,
            'model_id' => $request->model_id,
        ]);

        $brand = Brand::find($request->brand_id);

        return back()->with('success', "Color '{$color->name}' created successfully for '{$brand->name} {$model->name}'.");
    }

    /**
     * Update a brand
     */
    public function updateBrand(Request $request, Brand $brand)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:brands,name,' . $brand->id,
        ]);

        $oldName = $brand->name;
        $brand->update([
            'name' => $request->name,
        ]);

        return back()->with('success', "Brand '{$oldName}' updated to '{$brand->name}' successfully.");
    }

    /**
     * Update a model
     */
    public function updateModel(Request $request, ItemModel $model)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'brand_id' => 'required|exists:brands,id',
        ]);

        // Check if model already exists for this brand (excluding current model)
        $existingModel = ItemModel::where('name', $request->name)
            ->where('brand_id', $request->brand_id)
            ->where('id', '!=', $model->id)
            ->first();

        if ($existingModel) {
            return back()->withErrors(['name' => 'This model already exists for the selected brand.']);
        }

        $oldName = $model->name;
        $oldBrand = $model->brand->name;
        
        $model->update([
            'name' => $request->name,
            'brand_id' => $request->brand_id,
        ]);

        $newBrand = Brand::find($request->brand_id);

        return back()->with('success', "Model '{$oldName}' updated successfully.");
    }

    /**
     * Update a color
     */
    public function updateColor(Request $request, Color $color)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'brand_id' => 'required|exists:brands,id',
            'model_id' => 'required|exists:models,id',
        ]);

        // Verify that the model belongs to the brand
        $model = ItemModel::where('id', $request->model_id)
            ->where('brand_id', $request->brand_id)
            ->first();

        if (!$model) {
            return back()->withErrors(['model_id' => 'The selected model does not belong to the selected brand.']);
        }

        // Check if color already exists for this brand/model combination (excluding current color)
        $existingColor = Color::where('name', $request->name)
            ->where('brand_id', $request->brand_id)
            ->where('model_id', $request->model_id)
            ->where('id', '!=', $color->id)
            ->first();

        if ($existingColor) {
            return back()->withErrors(['name' => 'This color already exists for the selected brand and model.']);
        }

        $oldName = $color->name;
        
        $color->update([
            'name' => $request->name,
            'brand_id' => $request->brand_id,
            'model_id' => $request->model_id,
        ]);

        return back()->with('success', "Color '{$oldName}' updated successfully.");
    }

    /**
     * Delete a brand
     */
    public function destroyBrand(Brand $brand)
    {
        $name = $brand->name;
        $modelCount = $brand->models()->count();
        
        if ($modelCount > 0) {
            return back()->withErrors(['delete' => "Cannot delete brand '{$name}' because it has {$modelCount} associated models."]);
        }

        $brand->delete();

        return back()->with('success', "Brand '{$name}' deleted successfully.");
    }

    /**
     * Delete a model
     */
    public function destroyModel(ItemModel $model)
    {
        $name = $model->name;
        $brandName = $model->brand->name;
        $colorCount = $model->colors()->count();
        
        if ($colorCount > 0) {
            return back()->withErrors(['delete' => "Cannot delete model '{$name}' because it has {$colorCount} associated colors."]);
        }

        $model->delete();

        return back()->with('success', "Model '{$name}' from brand '{$brandName}' deleted successfully.");
    }

    /**
     * Delete a color
     */
    public function destroyColor(Color $color)
    {
        $name = $color->name;
        $brandName = $color->brand->name;
        $modelName = $color->model->name;
        
        $color->delete();

        return back()->with('success', "Color '{$name}' from '{$brandName} {$modelName}' deleted successfully.");
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with(['client', 'user', 'items.product']);

        if ($request->date_from) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->payment_method) {
            $query->where('payment_method', $request->payment_method);
        }

        $sales = $query->latest()->paginate($request->get('per_page', 15));
        return response()->json($sales);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'payment_method' => 'required|in:cash,card,mobile,transfer',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $sale = DB::transaction(function () use ($validated, $request) {
            $total = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $product = \App\Models\Product::findOrFail($item['product_id']);

                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Stock insuffisant pour {$product->name}. Stock disponible: {$product->stock}");
                }

                $subtotal = $product->price * $item['quantity'];
                $total += $subtotal;

                $itemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'subtotal' => $subtotal,
                ];

                $product->decrement('stock', $item['quantity']);
            }

            $sale = Sale::create([
                'client_id' => $validated['client_id'] ?? null,
                'user_id' => $request->user()->id,
                'total' => $total,
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($itemsData as $itemData) {
                $itemData['sale_id'] = $sale->id;
                SaleItem::create($itemData);
            }

            return $sale;
        });

        $sale->load(['client', 'user', 'items.product']);
        return response()->json($sale, 201);
    }

    public function show(Sale $sale)
    {
        $sale->load(['client', 'user', 'items.product']);
        return response()->json($sale);
    }

    public function destroy(Sale $sale)
    {
        DB::transaction(function () use ($sale) {
            foreach ($sale->items as $item) {
                $item->product->increment('stock', $item->quantity);
            }
            $sale->delete();
        });

        return response()->json(['message' => 'Vente supprimée.']);
    }
}

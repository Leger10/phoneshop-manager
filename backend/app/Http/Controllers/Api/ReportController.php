<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function dashboard()
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();

        $todaySales = Sale::whereDate('created_at', $today)->sum('total');
        $monthSales = Sale::where('created_at', '>=', $thisMonth)->sum('total');
        $totalProducts = Product::count();
        $lowStockProducts = Product::whereColumn('stock', '<=', 5)->count();
        $totalClients = \App\Models\Client::count();
        $totalEmployees = \App\Models\Employee::where('status', 'active')->count();
        $todayTransactions = Sale::whereDate('created_at', $today)->count();

        $recentSales = Sale::with(['client', 'user'])
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'today_sales' => $todaySales,
            'month_sales' => $monthSales,
            'total_products' => $totalProducts,
            'low_stock_products' => $lowStockProducts,
            'total_clients' => $totalClients,
            'total_employees' => $totalEmployees,
            'today_transactions' => $todayTransactions,
            'recent_sales' => $recentSales,
        ]);
    }

    public function sales(Request $request)
    {
        $period = $request->get('period', 'month');
        $startDate = match ($period) {
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfMonth(),
        };

        $salesData = Sale::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('SUM(total) as total'),
            DB::raw('COUNT(*) as count')
        )
        ->where('created_at', '>=', $startDate)
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        $paymentMethods = Sale::select('payment_method', DB::raw('SUM(total) as total'), DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', $startDate)
            ->groupBy('payment_method')
            ->get();

        return response()->json([
            'period' => $period,
            'sales_by_date' => $salesData,
            'sales_by_payment' => $paymentMethods,
        ]);
    }

    public function products(Request $request)
    {
        $topProducts = Product::select('products.*', DB::raw('SUM(sale_items.quantity) as total_sold'))
            ->join('sale_items', 'products.id', '=', 'sale_items.product_id')
            ->groupBy('products.id')
            ->orderByDesc('total_sold')
            ->take(10)
            ->get();

        $lowStock = Product::with('category')
            ->whereColumn('stock', '<=', 5)
            ->orderBy('stock')
            ->get();

        return response()->json([
            'top_products' => $topProducts,
            'low_stock_products' => $lowStock,
        ]);
    }
}

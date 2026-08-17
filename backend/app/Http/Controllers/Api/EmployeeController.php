<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with('user');

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $employees = $query->latest()->paginate($request->get('per_page', 15));
        return response()->json($employees);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'boutique_name' => 'required|string|max:255',
            'salary' => 'nullable|numeric|min:0',
            'hire_date' => 'required|date',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => 'employe',
        ]);

        $employee = Employee::create([
            'user_id' => $user->id,
            'boutique_name' => $validated['boutique_name'],
            'phone' => $validated['phone'] ?? null,
            'salary' => $validated['salary'] ?? null,
            'hire_date' => $validated['hire_date'],
        ]);

        $employee->load('user');
        return response()->json($employee, 201);
    }

    public function show(Employee $employee)
    {
        $employee->load('user');
        return response()->json($employee);
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'boutique_name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'salary' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $employee->update($validated);

        if ($request->has('name') || $request->has('email')) {
            $employee->user->update($request->only(['name', 'email']));
        }

        $employee->load('user');
        return response()->json($employee);
    }

    public function destroy(Employee $employee)
    {
        $employee->user->update(['is_active' => false]);
        $employee->update(['status' => 'inactive']);
        return response()->json(['message' => 'Employé désactivé.']);
    }
}

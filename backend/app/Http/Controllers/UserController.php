<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        if (!in_array($request->user()->role, ['ADMIN', 'DOKTER'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json(User::all());
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:ADMIN,DOKTER,PESERTA,TIM_KESEHATAN,PENANGGUNG_JAWAB_TIM,PETUGAS_KESEHATAN,TEMAN_PENDAMPING',
            'tanggal_lahir' => 'nullable|date',
            'participant_id' => 'nullable|string|max:255',
        ]);

        $roleModel = Role::where('name', $request->role)->first();

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'role_id' => $roleModel ? $roleModel->id : null,
            'tanggal_lahir' => $request->tanggal_lahir,
            'participant_id' => $request->participant_id,
        ]);
        return response()->json($user, 201);
    }

    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'role' => 'required|string|in:ADMIN,DOKTER,PESERTA,TIM_KESEHATAN,PENANGGUNG_JAWAB_TIM,PETUGAS_KESEHATAN,TEMAN_PENDAMPING',
            'tanggal_lahir' => 'nullable|date',
            'participant_id' => 'nullable|string|max:255',
        ]);

        $roleModel = Role::where('name', $request->role)->first();

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'role_id' => $roleModel ? $roleModel->id : $user->role_id,
            'tanggal_lahir' => $request->tanggal_lahir,
            'participant_id' => $request->participant_id,
        ];

        if ($request->password) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json($user);
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        User::destroy($id);
        return response()->json(['message' => 'User deleted successfully']);
    }
}

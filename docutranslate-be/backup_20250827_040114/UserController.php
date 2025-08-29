<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Translation;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get all users (admin only)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::with(['roles', 'translations'])
                ->orderBy('created_at', 'desc');

            // Apply filters
            if ($request->has('role')) {
                $query->whereHas('roles', function ($q) use ($request) {
                    $q->where('name', $request->role);
                });
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $users = $query->paginate($request->get('per_page', 15));

            // Transform data for frontend
            $users->getCollection()->transform(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->roles->first()?->name ?? 'user',
                    'status' => $user->status,
                    'translations' => $user->translations->count(),
                    'last_login' => $user->sessions()->latest('last_activity')->first()?->last_activity ?? $user->created_at,
                    'created_at' => $user->created_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching users'
            ], 500);
        }
    }

    /**
     * Get user statistics (admin only)
     */
    public function getUserStats(): JsonResponse
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::where('status', 'active')->count(),
                'inactive_users' => User::where('status', 'inactive')->count(),
                'suspended_users' => User::where('status', 'suspended')->count(),
                'admins' => User::whereHas('roles', function ($q) {
                    $q->where('name', 'admin');
                })->count(),
                'translators' => User::whereHas('roles', function ($q) {
                    $q->where('name', 'translator');
                })->count(),
                'regular_users' => User::whereHas('roles', function ($q) {
                    $q->where('name', 'user');
                })->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching user statistics'
            ], 500);
        }
    }

    /**
     * Store a new user (admin only)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8',
                'role' => 'required|string|exists:roles,name',
                'status' => 'sometimes|string|in:active,inactive,suspended'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'status' => $request->status ?? 'active'
            ]);

            // Assign role
            $role = Role::where('name', $request->role)->first();
            $user->roles()->attach($role->id);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user->load('roles')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating user'
            ], 500);
        }
    }

    /**
     * Show user details
     */
    public function show(User $user): JsonResponse
    {
        try {
            $userData = $user->load(['roles', 'translations' => function ($query) {
                $query->latest()->limit(10);
            }]);

            $stats = [
                'total_translations' => $user->translations()->count(),
                'completed_translations' => $user->translations()->where('status', 'completed')->count(),
                'failed_translations' => $user->translations()->where('status', 'failed')->count(),
                'last_activity' => $user->sessions()->latest('last_activity')->first()?->last_activity
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $userData,
                    'stats' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user details: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching user details'
            ], 500);
        }
    }

    /**
     * Update user (admin only)
     */
    public function update(Request $request, User $user): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => [
                    'sometimes',
                    'string',
                    'email',
                    'max:255',
                    Rule::unique('users')->ignore($user->id)
                ],
                'status' => 'sometimes|string|in:active,inactive,suspended',
                'role' => 'sometimes|string|exists:roles,name'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user->update($request->only(['name', 'email', 'status']));

            // Update role if provided
            if ($request->has('role')) {
                $user->roles()->detach();
                $role = Role::where('name', $request->role)->first();
                $user->roles()->attach($role->id);
            }

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user->load('roles')
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating user'
            ], 500);
        }
    }

    /**
     * Update user status (admin only)
     */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|string|in:active,inactive,suspended'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user->update(['status' => $request->status]);

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating user status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating user status'
            ], 500);
        }
    }

    /**
     * Delete user (admin only)
     */
    public function destroy(User $user): JsonResponse
    {
        try {
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting user'
            ], 500);
        }
    }

    /**
     * Get user profile (authenticated user)
     */
    public function profile(Request $request): JsonResponse
    {
        try {
            $user = $request->user()->load(['roles', 'translations' => function ($query) {
                $query->latest()->limit(20);
            }]);

            $stats = [
                'total_translations' => $user->translations()->count(),
                'completed_translations' => $user->translations()->where('status', 'completed')->count(),
                'failed_translations' => $user->translations()->where('status', 'failed')->count(),
                'last_activity' => $user->sessions()->latest('last_activity')->first()?->last_activity
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user,
                    'stats' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching user profile'
            ], 500);
        }
    }

    /**
     * Update user profile (authenticated user)
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => [
                    'sometimes',
                    'string',
                    'email',
                    'max:255',
                    Rule::unique('users')->ignore($user->id)
                ],
                'current_password' => 'required_with:new_password|string',
                'new_password' => 'sometimes|string|min:8|confirmed'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify current password if changing password
            if ($request->has('new_password')) {
                if (!Hash::check($request->current_password, $user->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Current password is incorrect'
                    ], 422);
                }

                $user->password = Hash::make($request->new_password);
            }

            $user->update($request->only(['name', 'email']));
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating user profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating profile'
            ], 500);
        }
    }
} 
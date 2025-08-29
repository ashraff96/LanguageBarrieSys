<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * User login
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $credentials = $request->only('email', 'password');

            if (Auth::attempt($credentials)) {
                $user = Auth::user();
                
                // Check if user is active
                if ($user->status !== 'active') {
                    Auth::logout();
                    return response()->json([
                        'success' => false,
                        'message' => 'Account is ' . $user->status
                    ], 403);
                }

                // Create session record
                UserSession::create([
                    'user_id' => $user->id,
                    'session_id' => session()->getId(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'last_activity' => now(),
                    'is_active' => true
                ]);

                // Generate token (if using Sanctum)
                $token = $user->createToken('auth-token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'message' => 'Login successful',
                    'data' => [
                        'user' => $user->load('roles'),
                        'token' => $token
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);

        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Login failed'
            ], 500);
        }
    }

    /**
     * User logout
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if ($user) {
                // Deactivate current session
                UserSession::where('user_id', $user->id)
                    ->where('session_id', session()->getId())
                    ->update(['is_active' => false]);

                // Revoke token (if using Sanctum)
                $user->tokens()->delete();
            }

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful'
            ]);

        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Logout failed'
            ], 500);
        }
    }

    /**
     * Get current user info
     */
    public function me(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not authenticated'
                ], 401);
            }

            return response()->json([
                'success' => true,
                'data' => $user->load('roles')
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching user info: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching user information'
            ], 500);
        }
    }

    /**
     * Refresh user session
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not authenticated'
                ], 401);
            }

            // Update session activity
            UserSession::where('user_id', $user->id)
                ->where('session_id', session()->getId())
                ->update(['last_activity' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'Session refreshed',
                'data' => $user->load('roles')
            ]);

        } catch (\Exception $e) {
            Log::error('Error refreshing session: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error refreshing session'
            ], 500);
        }
    }
} 
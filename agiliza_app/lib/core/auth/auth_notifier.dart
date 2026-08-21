import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/auth_service.dart';
import 'auth_state.dart';
import 'auth_user.dart';

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(ref.read(authServiceProvider)),
);

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AuthState.initial()) {
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final isAuthenticated = await _authService.checkAuthentication();

    if (!isAuthenticated) {
      state = const AuthState.unauthenticated();
      return;
    }

    final storedUser = await _authService.getStoredUser();
    if (storedUser != null) {
      state = AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: storedUser,
        errorMessage: null,
      );
      return;
    }

    final profileResult = await _authService.getProfile();
    if (profileResult['success'] == true) {
      final userMap = profileResult['user'] as Map<String, dynamic>?;
      final authUser = userMap != null ? AuthUser.fromJson(userMap) : null;
      state = AuthState(
        isLoading: false,
        isAuthenticated: authUser != null,
        user: authUser,
        errorMessage: authUser == null ? 'Unable to parse authenticated user' : null,
      );
      return;
    }

    state = const AuthState.unauthenticated();
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    final result = await _authService.login(
      email: email,
      password: password,
    );

    if (result['success'] == true) {
      final userMap = result['user'] as Map<String, dynamic>?;
      final authUser = userMap != null ? AuthUser.fromJson(userMap) : null;
      state = AuthState(
        isLoading: false,
        isAuthenticated: authUser != null,
        user: authUser,
        errorMessage: authUser == null ? 'Unable to parse user role' : null,
      );
    } else {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        errorMessage: result['message']?.toString() ?? 'Login failed',
      );
    }

    return result;
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirm,
    required String phone,
    required String userRole,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    final result = await _authService.register(
      name: name,
      email: email,
      password: password,
      passwordConfirm: passwordConfirm,
      phone: phone,
      userRole: userRole,
    );

    if (result['success'] == true) {
      final userMap = result['user'] as Map<String, dynamic>?;
      final authUser = userMap != null ? AuthUser.fromJson(userMap) : null;
      state = AuthState(
        isLoading: false,
        isAuthenticated: authUser != null,
        user: authUser,
        errorMessage: authUser == null ? 'Unable to parse user role' : null,
      );
    } else {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        errorMessage: result['message']?.toString() ?? 'Registration failed',
      );
    }

    return result;
  }

  Future<bool> logout() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    final success = await _authService.logout();
    state = const AuthState.unauthenticated();
    return success;
  }
}

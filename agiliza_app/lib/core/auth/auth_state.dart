import 'package:flutter/foundation.dart';

import 'auth_role.dart';
import 'auth_user.dart';

@immutable
class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final AuthUser? user;
  final String? errorMessage;

  const AuthState({
    required this.isLoading,
    required this.isAuthenticated,
    required this.user,
    required this.errorMessage,
  });

  const AuthState.initial()
      : isLoading = true,
        isAuthenticated = false,
        user = null,
        errorMessage = null;

  const AuthState.unauthenticated()
      : isLoading = false,
        isAuthenticated = false,
        user = null,
        errorMessage = null;

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    AuthUser? user,
    String? errorMessage,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }

  UserRole get role => user?.role ?? UserRole.unknown;
}

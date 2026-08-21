import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../auth/auth_user.dart';
import '../network/api_client.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(
    apiClient: ref.read(apiClientProvider),
  );
});

class AuthService {
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userKey = 'user_data';

  final ApiClient _apiClient;

  final FlutterSecureStorage _secureStorage;

  AuthService({
    required ApiClient apiClient,
    FlutterSecureStorage? secureStorage,
  }) : _apiClient = apiClient,
       _secureStorage =
           secureStorage ??
           const FlutterSecureStorage();

  /// REGISTER
  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirm,
    required String phone,
    required String userRole,
  }) async {
    try {

      final response =
          await _apiClient.post<Map<String, dynamic>>(
            '/auth/register/',
            data: {
              'full_name': name,
              'email': email,
              'password': password,
              'password_confirm': passwordConfirm,
              'phone': phone,
              'role': userRole.toUpperCase(),
            },
          );

      if (response.statusCode == 201 ||
          response.statusCode == 200) {

        final data =
            response.data as Map<String, dynamic>;

        final tokens =
            data['tokens']
                as Map<String, dynamic>;

        final user =
            data['user']
                as Map<String, dynamic>;

        await _saveTokens(
          accessToken:
              tokens['access'] as String,
          refreshToken:
              tokens['refresh'] as String,
        );

        await _saveUserData(user);

        return {
          'success': true,
          'message':
              'Registration successful',
          'user': user,
        };
      }

      return {
        'success': false,
        'message': _extractServerMessage(
              response.data,
            ) ??
            'Registration failed',
      };

    } on DioException catch (e) {

      return {
        'success': false,
        'message': _getAuthErrorMessage(
          e,
          fallback: 'Registration failed',
        ),
      };

    } catch (e) {

      return {
        'success': false,
        'message':
            'Unexpected error: $e',
      };
    }
  }

  /// LOGIN
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {

      final response =
          await _apiClient.post<Map<String, dynamic>>(
            '/auth/login/',
            data: {
              'email': email,
              'password': password,
            },
          );

      if (response.statusCode == 200) {

        final data =
            response.data as Map<String, dynamic>;

        final tokens =
            data['tokens']
                as Map<String, dynamic>;

        final user =
            data['user']
                as Map<String, dynamic>;

        await _saveTokens(
          accessToken:
              tokens['access'] as String,
          refreshToken:
              tokens['refresh'] as String,
        );

        await _saveUserData(user);

        return {
          'success': true,
          'message': 'Login successful',
          'user': user,
        };
      }

      return {
        'success': false,
        'message': _extractServerMessage(
              response.data,
            ) ??
            'Login failed',
      };

    } on DioException catch (e) {

      return {
        'success': false,
        'message': _getAuthErrorMessage(
          e,
          fallback:
              'Invalid email or password',
        ),
      };

    } catch (e) {

      return {
        'success': false,
        'message':
            'Unexpected error: $e',
      };
    }
  }

  /// PROFILE
  Future<Map<String, dynamic>> getProfile() async {
    try {

      final response =
          await _apiClient.get<Map<String, dynamic>>(
            '/auth/profile/',
          );

      if (response.statusCode == 200) {

        final data =
            response.data as Map<String, dynamic>;

        final userData =
            data['user'] ?? data;

        await _saveUserData(
          userData as Map<String, dynamic>,
        );

        return {
          'success': true,
          'user': userData,
        };
      }

      return {
        'success': false,
        'message':
            'Failed to fetch profile',
      };

    } on DioException catch (e) {

      return {
        'success': false,
        'message':
            e.message ??
            'Failed to fetch profile',
      };

    } catch (e) {

      return {
        'success': false,
        'message':
            'Unexpected error: $e',
      };
    }
  }

  /// PROFESSIONAL PROFILE
  Future<Map<String, dynamic>> getProfessionalProfile() async {
    try {

      final response =
          await _apiClient.get<Map<String, dynamic>>(
            '/auth/professionals/me/',
          );

      if (response.statusCode == 200) {

        final data =
            response.data as Map<String, dynamic>;

        return {
          'success': true,
          'data': data,
        };
      }

      return {
        'success': false,
        'message':
            'Failed to fetch professional profile',
      };

    } on DioException catch (e) {

      return {
        'success': false,
        'message':
            e.message ??
            'Failed to fetch professional profile',
      };

    } catch (e) {

      return {
        'success': false,
        'message':
            'Unexpected error: $e',
      };
    }
  }
  /// LOGOUT
  Future<bool> logout() async {

    try {

      final refreshToken =
          await getRefreshToken();

      if (refreshToken != null) {

        await _apiClient.post(
          '/auth/logout/',
          data: {
            'refresh': refreshToken,
          },
        );
      }

    } catch (_) {}

    await _clearTokens();

    return true;
  }

  /// SAVE TOKENS
  Future<void> _saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {

    await Future.wait([

      _secureStorage.write(
        key: _accessTokenKey,
        value: accessToken,
      ),

      _secureStorage.write(
        key: _refreshTokenKey,
        value: refreshToken,
      ),
    ]);
  }

  /// SAVE USER DATA
  Future<void> _saveUserData(
    Map<String, dynamic> userData,
  ) async {

    await _secureStorage.write(
      key: _userKey,
      value: jsonEncode(userData),
    );
  }

  /// ACCESS TOKEN
  Future<String?> getAccessToken() async {

    return _secureStorage.read(
      key: _accessTokenKey,
    );
  }

  /// REFRESH TOKEN
  Future<String?> getRefreshToken() async {

    return _secureStorage.read(
      key: _refreshTokenKey,
    );
  }

  /// USER DATA
  Future<Map<String, dynamic>?> getUserData() async {

    try {

      final userData =
          await _secureStorage.read(
            key: _userKey,
          );

      if (userData == null) {
        return null;
      }

      return jsonDecode(userData)
          as Map<String, dynamic>;

    } catch (_) {

      return null;
    }
  }

  Future<AuthUser?> getStoredUser() async {
    final userData = await getUserData();
    if (userData == null) {
      return null;
    }

    try {
      return AuthUser.fromJson(userData);
    } catch (_) {
      return null;
    }
  }

  /// LOGIN CHECK
  Future<bool> isLoggedIn() async {

    final token =
        await getAccessToken();

    return token != null &&
        token.isNotEmpty;
  }

  /// APP START AUTH CHECK
  Future<bool> checkAuthentication() async {

    final token =
        await getAccessToken();

    return token != null &&
        token.isNotEmpty;
  }

  /// CLEAR STORAGE
  Future<void> _clearTokens() async {

    await Future.wait([

      _secureStorage.delete(
        key: _accessTokenKey,
      ),

      _secureStorage.delete(
        key: _refreshTokenKey,
      ),

      _secureStorage.delete(
        key: _userKey,
      ),
    ]);
  }

  String _getAuthErrorMessage(
    DioException error, {
    required String fallback,
  }) {

    final responseData =
        error.response?.data;

    final serverMessage =
        _extractServerMessage(
          responseData,
        );

    if (serverMessage != null &&
        serverMessage.isNotEmpty) {

      return serverMessage;
    }

    return fallback;
  }

  String? _extractServerMessage(
    dynamic data,
  ) {

    if (data is String) {
      return data;
    }

    if (data is Map<String, dynamic>) {

      const keys = [
        'detail',
        'message',
        'error',
        'non_field_errors',
      ];

      for (final key in keys) {

        final value = data[key];

        if (value is String) {
          return value;
        }

        if (value is List &&
            value.isNotEmpty) {

          return value.first.toString();
        }
      }
    }

    return null;
  }
}
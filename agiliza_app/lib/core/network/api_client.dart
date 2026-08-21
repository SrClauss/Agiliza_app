import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

class ApiClient {
  static String get baseUrl {
    const configuredUrl = String.fromEnvironment('API_BASE_URL');

    if (configuredUrl.isNotEmpty) {
      return configuredUrl;
    }

    try {
      final envUrl = dotenv.maybeGet('API_BASE_URL');

      if (envUrl != null && envUrl.isNotEmpty) {
        return envUrl;
      }
    } catch (_) {}

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8000/api';
    }

    return 'http://127.0.0.1:8000/api';
  }

  final FlutterSecureStorage _storage =
      const FlutterSecureStorage();

  late final Dio dio;

  bool _isRefreshing = false;

  Completer<void>? _refreshCompleter;

  ApiClient({Dio? customDio}) {
    dio =
        customDio ??
        Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 30),
            sendTimeout: const Duration(seconds: 30),
            validateStatus: (status) {
              return status != null && status < 500;
            },
          ),
        );

    dio.interceptors.add(
      InterceptorsWrapper(

        onRequest: (options, handler) async {

          final token = await _storage.read(
            key: 'access_token',
          );

          if (token != null && token.isNotEmpty) {

            options.headers['Authorization'] =
                'Bearer $token';
          }

          handler.next(options);
        },

        onError: (error, handler) async {

          if (error.response?.statusCode == 401) {

            final refreshed = await _refreshToken();

            if (refreshed) {

              final newToken = await _storage.read(
                key: 'access_token',
              );

              final requestOptions = error.requestOptions;

              requestOptions.headers['Authorization'] =
                  'Bearer $newToken';

              final response = await dio.fetch(
                requestOptions,
              );

              return handler.resolve(response);
            }
          }

          handler.next(error);
        },
      ),
    );
  }

  Future<bool> _refreshToken() async {

    if (_isRefreshing) {

      await _refreshCompleter?.future;

      return true;
    }

    _isRefreshing = true;

    _refreshCompleter = Completer<void>();

    try {

      final refreshToken = await _storage.read(
        key: 'refresh_token',
      );

      if (refreshToken == null ||
          refreshToken.isEmpty) {

        return false;
      }

      final response = await Dio().post(
        '$baseUrl/auth/token/refresh/',
        data: {
          'refresh': refreshToken,
        },
      );

      if (response.statusCode == 200) {

        final newAccessToken =
            response.data['access'];

        await _storage.write(
          key: 'access_token',
          value: newAccessToken,
        );

        return true;
      }

      return false;

    } catch (_) {

      await logout();

      return false;

    } finally {

      _isRefreshing = false;

      _refreshCompleter?.complete();
    }
  }

  Future<void> logout() async {

    await _storage.delete(
      key: 'access_token',
    );

    await _storage.delete(
      key: 'refresh_token',
    );

    await _storage.delete(
      key: 'user_data',
    );
  }

  Future<Response<T>> get<T>(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
  }) async {

    return dio.get<T>(
      endpoint,
      queryParameters: queryParameters,
    );
  }

  Future<Response<T>> post<T>(
    String endpoint, {
    Object? data,
    Map<String, dynamic>? queryParameters,
  }) async {

    return dio.post<T>(
      endpoint,
      data: data,
      queryParameters: queryParameters,
    );
  }

  Future<Response<T>> put<T>(
    String endpoint, {
    Object? data,
  }) async {

    return dio.put<T>(
      endpoint,
      data: data,
    );
  }

  Future<Response<T>> patch<T>(
    String endpoint, {
    Object? data,
    Map<String, dynamic>? queryParameters,
  }) async {

    return dio.patch<T>(
      endpoint,
      data: data,
      queryParameters: queryParameters,
    );
  }

  Future<Response<T>> delete<T>(
    String endpoint,
  ) async {

    return dio.delete<T>(endpoint);
  }
}
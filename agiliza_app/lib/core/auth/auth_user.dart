import 'package:flutter/foundation.dart';

import 'auth_role.dart';

@immutable
class AuthUser {
  final String id;
  final String fullName;
  final String email;
  final UserRole role;

  const AuthUser({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id']?.toString() ?? '',
      fullName: json['full_name']?.toString() ?? json['fullName']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: parseUserRole(json['role']?.toString()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'email': email,
      'role': role.name,
    };
  }
}

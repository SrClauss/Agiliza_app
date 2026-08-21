enum UserRole {
  unknown,
  client,
  professional,
}

extension UserRoleX on UserRole {
  bool get isClient => this == UserRole.client;
  bool get isProfessional => this == UserRole.professional;

  String get name {
    switch (this) {
      case UserRole.client:
        return 'CLIENT';
      case UserRole.professional:
        return 'PROFESSIONAL';
      case UserRole.unknown:
        return 'UNKNOWN';
    }
  }

  String get displayName {
    switch (this) {
      case UserRole.client:
        return 'Client';
      case UserRole.professional:
        return 'Professional';
      case UserRole.unknown:
        return 'Unknown';
    }
  }
}

UserRole parseUserRole(String? value) {
  if (value == null || value.isEmpty) {
    return UserRole.unknown;
  }

  final normalized = value.trim().toUpperCase();
  switch (normalized) {
    case 'CLIENT':
    case 'USER':
      return UserRole.client;
    case 'PROFESSIONAL':
    case 'PRO':
      return UserRole.professional;
    default:
      return UserRole.unknown;
  }
}

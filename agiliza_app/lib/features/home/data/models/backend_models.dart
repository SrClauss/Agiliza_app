class ServiceCategory {
  final String id;
  final String name;
  final String slug;
  final String? iconUrl;
  final String description;
  final bool isActive;

  ServiceCategory({
    required this.id,
    required this.name,
    required this.slug,
    this.iconUrl,
    required this.description,
    required this.isActive,
  });

  factory ServiceCategory.fromJson(Map<String, dynamic> json) {
    return ServiceCategory(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      iconUrl: json['icon']?.toString(),
      description: json['description']?.toString() ?? '',
      isActive: json['is_active'] == true || json['is_active']?.toString() == 'True',
    );
  }
}

class UserSummary {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final String? profileImageUrl;

  UserSummary({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.profileImageUrl,
  });

  factory UserSummary.fromJson(dynamic json) {
    if (json is String || json is int) {
      return UserSummary(
        id: json.toString(),
        fullName: '',
        email: '',
        role: '',
      );
    }

    final map = Map<String, dynamic>.from(json as Map);
    return UserSummary(
      id: map['id']?.toString() ?? '',
      fullName: map['full_name']?.toString() ?? map['fullName']?.toString() ?? '',
      email: map['email']?.toString() ?? '',
      role: map['role']?.toString() ?? '',
      profileImageUrl: map['profile_image']?.toString(),
    );
  }
}

class ProfessionalProfile {
  final String id;
  final UserSummary user;
  final String bio;
  final int yearsExperience;
  final double hourlyRate;
  final List<ServiceCategory> categories;
  final int serviceRadiusKm;
  final String address;
  final double? latitude;
  final double? longitude;
  final double averageRating;
  final int totalReviews;
  final List<PortfolioItem> portfolio;
  final List<AvailabilitySlot> availability;

  ProfessionalProfile({
    required this.id,
    required this.user,
    required this.bio,
    required this.yearsExperience,
    required this.hourlyRate,
    required this.categories,
    required this.serviceRadiusKm,
    required this.address,
    this.latitude,
    this.longitude,
    required this.averageRating,
    required this.totalReviews,
    required this.portfolio,
    required this.availability,
  });

  factory ProfessionalProfile.fromJson(Map<String, dynamic> json) {
    final user = UserSummary.fromJson(json['user']);
    final categoriesRaw = json['service_categories'];
    final categories = <ServiceCategory>[];
    if (categoriesRaw is List) {
      for (final item in categoriesRaw) {
        if (item is Map<String, dynamic>) {
          categories.add(ServiceCategory.fromJson(item));
        }
      }
    }

    // final portfolioRaw = json['portfolio_items'];
    final portfolioRaw = json['portfolio'];
    final portfolio = <PortfolioItem>[];
    if (portfolioRaw is List) {
      for (final item in portfolioRaw) {
        if (item is Map<String, dynamic>) {
          portfolio.add(PortfolioItem.fromJson(item));
        }
      }
    }

    // final availabilityRaw = json['availability_slots'];
    final availabilityRaw = json['availability'];
    final availability = <AvailabilitySlot>[];
    if (availabilityRaw is List) {
      for (final item in availabilityRaw) {
        if (item is Map<String, dynamic>) {
          availability.add(AvailabilitySlot.fromJson(item));
        }
      }
    }

    return ProfessionalProfile(
      id: json['id']?.toString() ?? '',
      user: user,
      bio: json['bio']?.toString() ?? '',
      yearsExperience: int.tryParse(json['years_experience']?.toString() ?? '') ?? 0,
      hourlyRate: double.tryParse(json['hourly_rate']?.toString() ?? '') ?? 0,
      categories: categories,
      serviceRadiusKm: int.tryParse(json['service_radius_km']?.toString() ?? '') ?? 0,
      address: json['address']?.toString() ?? '',
      latitude: _parseDouble(json['latitude']),
      longitude: _parseDouble(json['longitude']),
      averageRating: double.tryParse(json['average_rating']?.toString() ?? '') ?? 0,
      totalReviews: int.tryParse(json['total_reviews']?.toString() ?? '') ?? 0,
      portfolio: portfolio,
      availability: availability,
    );
  }

  String get fullName => user.fullName.isNotEmpty ? user.fullName : 'Professional';
  String get role => user.role.isNotEmpty ? user.role : 'Professional';
  String get avatarUrl => user.profileImageUrl ?? '';
}

class PortfolioItem {
  final String id;
  final String title;
  final String description;
  final String imageUrl;

  PortfolioItem({
    required this.id,
    required this.title,
    required this.description,
    required this.imageUrl,
  });

  factory PortfolioItem.fromJson(Map<String, dynamic> json) {
    return PortfolioItem(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      imageUrl: json['image']?.toString() ?? '',
    );
  }
}

class AvailabilitySlot {
  final String id;
  final int dayOfWeek;
  final String startTime;
  final String endTime;
  final bool isActive;

  AvailabilitySlot({
    required this.id,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.isActive,
  });

  factory AvailabilitySlot.fromJson(Map<String, dynamic> json) {
    return AvailabilitySlot(
      id: json['id']?.toString() ?? '',
      dayOfWeek: int.tryParse(json['day_of_week']?.toString() ?? '') ?? 0,
      startTime: json['start_time']?.toString() ?? '',
      endTime: json['end_time']?.toString() ?? '',
      isActive: json['is_active'] == true || json['is_active']?.toString() == 'True',
    );
  }

  String get dayName {
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return dayOfWeek >= 0 && dayOfWeek < names.length ? names[dayOfWeek] : '';
  }
}

class FavoriteItem {
  final String id;
  final String professionalProfileId;
  final ProfessionalProfile? professional;

  FavoriteItem({
    required this.id,
    required this.professionalProfileId,
    this.professional,
  });

  factory FavoriteItem.fromJson(
    Map<String, dynamic> json,
    ) {
    final professionalRaw = json['professional'];

    final professional =
        professionalRaw is Map<String, dynamic>
            ? ProfessionalProfile.fromJson(
                professionalRaw,
                )
            : null;

    return FavoriteItem(
        id: json['id']?.toString() ?? '',

        professionalProfileId:
            json['professional_profile']
                    ?.toString() ??
                '',

        professional: professional,
       );
  }
}

class ServiceRequest {
  final String id;
  final String title;
  final String description;
  final String status;
  final String address;
  final String? requestedDate;
  final String? scheduledDate;
  final double? quotedPrice;
  final String categoryName;
  final ProfessionalProfile? professional;

  ServiceRequest({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.address,
    this.requestedDate,
    this.scheduledDate,
    this.quotedPrice,
    required this.categoryName,
    this.professional,
  });

  factory ServiceRequest.fromJson(Map<String, dynamic> json) {
    final categoryRaw = json['category'];
    final categoryName = categoryRaw is Map<String, dynamic>
        ? categoryRaw['name']?.toString() ?? ''
        : categoryRaw?.toString() ?? '';

    final professionalRaw = json['professional_profile'];
    final professional = professionalRaw is Map<String, dynamic>
        ? ProfessionalProfile.fromJson(professionalRaw)
        : null;

    return ServiceRequest(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      requestedDate: json['requested_date']?.toString(),
      scheduledDate: json['scheduled_date']?.toString(),
      quotedPrice: _parseDouble(json['quoted_price']),
      categoryName: categoryName,
      professional: professional,
    );
  }
}

class QuoteResponse {
  final String id;
  final String serviceRequestId;
  final String price;
  final String duration;
  final String message;
  final ProfessionalProfile? professional;
  final ServiceRequest? serviceRequest;

  QuoteResponse({
    required this.id,
    required this.serviceRequestId,
    required this.price,
    required this.duration,
    required this.message,
    this.professional,
    this.serviceRequest,
  });

  factory QuoteResponse.fromJson(Map<String, dynamic> json) {
    final professionalRaw = json['professional_profile'];
    final professional = professionalRaw is Map<String, dynamic>
        ? ProfessionalProfile.fromJson(professionalRaw)
        : null;

    final requestRaw = json['service_request'];
    final serviceRequest = requestRaw is Map<String, dynamic>
        ? ServiceRequest.fromJson(requestRaw)
        : null;

    return QuoteResponse(
      id: json['id']?.toString() ?? '',
      serviceRequestId: serviceRequest?.id ?? json['service_request']?.toString() ?? '',
      price: json['price']?.toString() ?? '',
      duration: json['duration']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      professional: professional,
      serviceRequest: serviceRequest,
    );
  }
}

class ReviewItem {
  final String id;
  final int rating;
  final String comment;
  final ProfessionalProfile? professional;

  ReviewItem({
    required this.id,
    required this.rating,
    required this.comment,
    this.professional,
  });

  factory ReviewItem.fromJson(Map<String, dynamic> json) {
    final professionalRaw = json['professional_profile'];
    final professional = professionalRaw is Map<String, dynamic>
        ? ProfessionalProfile.fromJson(professionalRaw)
        : null;

    return ReviewItem(
      id: json['id']?.toString() ?? '',
      rating: int.tryParse(json['rating']?.toString() ?? '') ?? 0,
      comment: json['comment']?.toString() ?? '',
      professional: professional,
    );
  }
}

double? _parseDouble(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  return double.tryParse(value.toString());
}

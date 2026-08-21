import 'package:dio/dio.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/network/api_client.dart';
import 'models/backend_models.dart';

class BackendApiService {
  final ApiClient _apiClient;

  BackendApiService(this._apiClient);

  List<Map<String, dynamic>> _extractListResponse(dynamic data) {
    if (data == null) return [];
    if (data is List) {
      return data.whereType<Map<String, dynamic>>().toList();
    }
    if (data is Map<String, dynamic>) {
      final results = data['results'] ?? data['data'];
      if (results is List) {
        return results.whereType<Map<String, dynamic>>().toList();
      }
    }
    throw Exception('Unexpected list response shape: ${data.runtimeType}');
  }

  Future<List<ServiceCategory>> fetchCategories() async {
    final response = await _apiClient.get<dynamic>(AppStrings.categoriesEndpoint);
    final data = _extractListResponse(response.data);
    return data.map(ServiceCategory.fromJson).toList();
  }

  Future<List<ProfessionalProfile>> fetchProfessionals({String? categorySlug}) async {
    final queryParameters = <String, dynamic>{};
    if (categorySlug != null && categorySlug.isNotEmpty) {
      queryParameters['category'] = categorySlug;
    }
    final response = await _apiClient.get<dynamic>(AppStrings.professionalsEndpoint, queryParameters: queryParameters);
    final data = _extractListResponse(response.data);
    return data.map(ProfessionalProfile.fromJson).toList();
  }

  Future<ProfessionalProfile> fetchProfessionalDetail(String id) async {
    final response = await _apiClient.get<Map<String, dynamic>>('${AppStrings.professionalsEndpoint}$id/');
    final data = response.data;
    if (data == null) {
      throw Exception('Professional profile data missing');
    }
    return ProfessionalProfile.fromJson(data);
  }

  Future<List<AvailabilitySlot>> fetchAvailabilitySlots() async {
    final response = await _apiClient.get<dynamic>(AppStrings.availabilityEndpoint);
    final data = _extractListResponse(response.data);
    return data.map(AvailabilitySlot.fromJson).toList();
  }

  Future<AvailabilitySlot> createAvailabilitySlot({
    required int dayOfWeek,
    required String startTime,
    required String endTime,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppStrings.availabilityEndpoint,
      data: {
        'day_of_week': dayOfWeek,
        'start_time': startTime,
        'end_time': endTime,
      },
    );
    return AvailabilitySlot.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AvailabilitySlot> updateAvailabilitySlot({
    required String id,
    required int dayOfWeek,
    required String startTime,
    required String endTime,
    required bool isActive,
  }) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '${AppStrings.availabilityEndpoint}$id/',
      data: {
        'day_of_week': dayOfWeek,
        'start_time': startTime,
        'end_time': endTime,
        'is_active': isActive,
      },
    );
    return AvailabilitySlot.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteAvailabilitySlot(String id) async {
    await _apiClient.delete('${AppStrings.availabilityEndpoint}$id/');
  }

  Future<List<PortfolioItem>> fetchPortfolioItems() async {
    final response = await _apiClient.get<dynamic>(AppStrings.portfolioEndpoint);
    final data = _extractListResponse(response.data);
    return data.map(PortfolioItem.fromJson).toList();
  }

  Future<PortfolioItem> createPortfolioItem({
    required String title,
    required String description,
    required String imageUrl,
  }) async {
    final request = await _apiClient.dio.get<List<int>>(imageUrl,
      options: Options(responseType: ResponseType.bytes),
    );
    final bytes = request.data;
    if (bytes == null) {
      throw Exception('Unable to download portfolio image');
    }
    final formData = FormData.fromMap({
      'title': title,
      'description': description,
      'image': MultipartFile.fromBytes(bytes, filename: 'portfolio.jpg'),
    });
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppStrings.portfolioEndpoint,
      data: formData,
    );
    return PortfolioItem.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deletePortfolioItem(String id) async {
    await _apiClient.delete('${AppStrings.portfolioEndpoint}$id/');
  }

  Future<List<FavoriteItem>> fetchFavorites() async {
    final response = await _apiClient.get<dynamic>(AppStrings.favoritesEndpoint);
    final data = _extractListResponse(response.data);
    return data.map(FavoriteItem.fromJson).toList();
  }

  Future<FavoriteItem> createFavorite({required String professionalProfileId}) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppStrings.favoritesEndpoint,
      data: {'professional_profile': professionalProfileId},
    );
    return FavoriteItem.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteFavorite(String id) async {
    await _apiClient.delete('${AppStrings.favoritesEndpoint}$id/');
  }

  Future<List<ServiceRequest>> fetchRequests() async {
    final response = await _apiClient.get<dynamic>(AppStrings.serviceRequestsEndpoint);
    final data = _extractListResponse(response.data);
    return data.map(ServiceRequest.fromJson).toList();
  }

  Future<ServiceRequest> createRequest({
    required String title,
    required String description,
    required String address,
    required String requestedDate,
    required String scheduledDate,
    required String categoryId,
    double? latitude,
    double? longitude,
  }) async {
    final payload = <String, dynamic>{
      'title': title,
      'description': description,
      'address': address,
      'requested_date': requestedDate,
      'scheduled_date': scheduledDate,
      'category': categoryId,
    };
    if (latitude != null) payload['latitude'] = latitude;
    if (longitude != null) payload['longitude'] = longitude;
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppStrings.serviceRequestsEndpoint,
      data: payload,
    );
    return ServiceRequest.fromJson(response.data as Map<String, dynamic>);
  }

  Future<QuoteResponse> createQuote({
    required String serviceRequestId,
    required String price,
    required String duration,
    required String message,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppStrings.quoteResponsesEndpoint,
      data: {
        'service_request': serviceRequestId,
        'price': price,
        'duration': duration,
        'message': message,
      },
    );
    return QuoteResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<QuoteResponse>> fetchQuotes() async {
    final response = await _apiClient.get<dynamic>(AppStrings.quoteResponsesEndpoint);
    final data = _extractListResponse(response.data);
    return data.map(QuoteResponse.fromJson).toList();
  }

  Future<ReviewItem> createReview({
    required String professionalProfileId,
    required int rating,
    required String comment,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppStrings.reviewsEndpoint,
      data: {
        'professional_profile': professionalProfileId,
        'rating': rating,
        'comment': comment,
      },
    );
    return ReviewItem.fromJson(response.data as Map<String, dynamic>);
  }
}

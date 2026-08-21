import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/backend_api_service.dart';
import '../data/models/backend_models.dart';
import '../../../core/network/api_client.dart';

final backendApiServiceProvider = Provider<BackendApiService>((ref) {
  return BackendApiService(ref.read(apiClientProvider));
});

final categoriesProvider = AutoDisposeAsyncNotifierProvider<CategoriesNotifier, List<ServiceCategory>>(
  CategoriesNotifier.new,
);

class CategoriesNotifier extends AutoDisposeAsyncNotifier<List<ServiceCategory>> {
  @override
  Future<List<ServiceCategory>> build() async {
    return _fetchCategories();
  }

  Future<List<ServiceCategory>> _fetchCategories() async {
    return ref.read(backendApiServiceProvider).fetchCategories();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_fetchCategories);
  }
}

class ProfessionalSearchParams {
  final String? categorySlug;

  const ProfessionalSearchParams({this.categorySlug});

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is ProfessionalSearchParams &&
            other.categorySlug == categorySlug;
  }

  @override
  int get hashCode => categorySlug.hashCode;
}

final professionalsProvider = AutoDisposeAsyncNotifierProvider.family<ProfessionalsNotifier, List<ProfessionalProfile>, ProfessionalSearchParams>(
  ProfessionalsNotifier.new,
);

class ProfessionalsNotifier extends AutoDisposeFamilyAsyncNotifier<List<ProfessionalProfile>, ProfessionalSearchParams> {
  @override
  Future<List<ProfessionalProfile>> build(ProfessionalSearchParams params) async {
    return ref.read(backendApiServiceProvider).fetchProfessionals(
          categorySlug: params.categorySlug,
        );
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => build(arg));
  }
}

final professionalDetailProvider = AutoDisposeAsyncNotifierProvider.family<ProfessionalDetailNotifier, ProfessionalProfile, String>(
  ProfessionalDetailNotifier.new,
);

class ProfessionalDetailNotifier extends AutoDisposeFamilyAsyncNotifier<ProfessionalProfile, String> {
  @override
  Future<ProfessionalProfile> build(String professionalId) async {
    return ref.read(backendApiServiceProvider).fetchProfessionalDetail(professionalId);
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => build(arg));
  }
}

final favoritesProvider = AutoDisposeAsyncNotifierProvider<FavoritesNotifier, List<FavoriteItem>>(
  FavoritesNotifier.new,
);

class FavoritesNotifier extends AutoDisposeAsyncNotifier<List<FavoriteItem>> {
  @override
  Future<List<FavoriteItem>> build() async {
    return _fetchFavorites();
  }

  Future<List<FavoriteItem>> _fetchFavorites() async {
    return ref.read(backendApiServiceProvider).fetchFavorites();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_fetchFavorites);
  }

  Future<void> addFavorite(String professionalProfileId) async {
    state = const AsyncValue.loading();
    await ref.read(backendApiServiceProvider).createFavorite(
          professionalProfileId: professionalProfileId,
        );
    state = await AsyncValue.guard(_fetchFavorites);
  }

  Future<void> removeFavorite(String favoriteId) async {
    state = const AsyncValue.loading();
    await ref.read(backendApiServiceProvider).deleteFavorite(favoriteId);
    state = await AsyncValue.guard(_fetchFavorites);
  }
}

final requestHistoryProvider = AutoDisposeAsyncNotifierProvider<RequestHistoryNotifier, List<ServiceRequest>>(
  RequestHistoryNotifier.new,
);

class RequestHistoryNotifier extends AutoDisposeAsyncNotifier<List<ServiceRequest>> {
  @override
  Future<List<ServiceRequest>> build() async {
    return _fetchRequests();
  }

  Future<List<ServiceRequest>> _fetchRequests() async {
    return ref.read(backendApiServiceProvider).fetchRequests();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_fetchRequests);
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
    final created = await ref.read(backendApiServiceProvider).createRequest(
          title: title,
          description: description,
          address: address,
          requestedDate: requestedDate,
          scheduledDate: scheduledDate,
          categoryId: categoryId,
          latitude: latitude,
          longitude: longitude,
        );
    await refresh();
    return created;
  }
}

final portfolioProvider = AutoDisposeAsyncNotifierProvider<PortfolioNotifier, List<PortfolioItem>>(
  PortfolioNotifier.new,
);

class PortfolioNotifier extends AutoDisposeAsyncNotifier<List<PortfolioItem>> {
  @override
  Future<List<PortfolioItem>> build() async {
    return _fetchPortfolioItems();
  }

  Future<List<PortfolioItem>> _fetchPortfolioItems() async {
    return ref.read(backendApiServiceProvider).fetchPortfolioItems();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_fetchPortfolioItems);
  }

  Future<void> addPortfolioItem({
    required String title,
    required String description,
    required String imageUrl,
  }) async {
    state = const AsyncValue.loading();
    await ref.read(backendApiServiceProvider).createPortfolioItem(
          title: title,
          description: description,
          imageUrl: imageUrl,
        );
    state = await AsyncValue.guard(_fetchPortfolioItems);
  }

  Future<void> deletePortfolioItem(String id) async {
    state = const AsyncValue.loading();
    await ref.read(backendApiServiceProvider).deletePortfolioItem(id);
    state = await AsyncValue.guard(_fetchPortfolioItems);
  }
}

final availabilityProvider = AutoDisposeAsyncNotifierProvider<AvailabilityNotifier, List<AvailabilitySlot>>(
  AvailabilityNotifier.new,
);

class AvailabilityNotifier extends AutoDisposeAsyncNotifier<List<AvailabilitySlot>> {
  @override
  Future<List<AvailabilitySlot>> build() async {
    return _fetchAvailability();
  }

  Future<List<AvailabilitySlot>> _fetchAvailability() async {
    return ref.read(backendApiServiceProvider).fetchAvailabilitySlots();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_fetchAvailability);
  }

  Future<void> createAvailabilitySlot({
    required int dayOfWeek,
    required String startTime,
    required String endTime,
  }) async {
    state = const AsyncValue.loading();
    await ref.read(backendApiServiceProvider).createAvailabilitySlot(
          dayOfWeek: dayOfWeek,
          startTime: startTime,
          endTime: endTime,
        );
    state = await AsyncValue.guard(_fetchAvailability);
  }

  Future<void> updateAvailabilitySlot({
    required String id,
    required int dayOfWeek,
    required String startTime,
    required String endTime,
    required bool isActive,
  }) async {
    state = const AsyncValue.loading();
    await ref.read(backendApiServiceProvider).updateAvailabilitySlot(
          id: id,
          dayOfWeek: dayOfWeek,
          startTime: startTime,
          endTime: endTime,
          isActive: isActive,
        );
    state = await AsyncValue.guard(_fetchAvailability);
  }

  Future<void> deleteAvailabilitySlot(String id) async {
    state = const AsyncValue.loading();
    await ref.read(backendApiServiceProvider).deleteAvailabilitySlot(id);
    state = await AsyncValue.guard(_fetchAvailability);
  }
}

final dashboardSummaryProvider = AutoDisposeAsyncNotifierProvider<DashboardSummaryNotifier, DashboardSummary>(
  DashboardSummaryNotifier.new,
);

class DashboardSummaryNotifier extends AutoDisposeAsyncNotifier<DashboardSummary> {
  @override
  Future<DashboardSummary> build() async {
    return _fetchSummary();
  }

  Future<DashboardSummary> _fetchSummary() async {
    final requests = await ref.read(backendApiServiceProvider).fetchRequests();
    final quotes = await ref.read(backendApiServiceProvider).fetchQuotes();

    final pendingRequests = requests.where((r) => r.status == 'PENDING').length;
    final quotesSent = quotes.length;
    final upcomingAppointments = requests.where((r) => r.status == 'SCHEDULED' || r.status == 'ACCEPTED').length;
    final earnings = requests
        .where((r) => r.status == 'COMPLETED' || r.status == 'ACCEPTED')
        .map((r) => r.quotedPrice ?? 0)
        .fold<double>(0, (sum, value) => sum + value);

    return DashboardSummary(
      pendingRequests: pendingRequests,
      quotesSent: quotesSent,
      upcomingAppointments: upcomingAppointments,
      earnings: earnings,
    );
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_fetchSummary);
  }
}

class DashboardSummary {
  final int pendingRequests;
  final int quotesSent;
  final int upcomingAppointments;
  final double earnings;

  DashboardSummary({
    required this.pendingRequests,
    required this.quotesSent,
    required this.upcomingAppointments,
    required this.earnings,
  });
}

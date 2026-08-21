import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/listing_repository.dart';
import '../domain/entities/listing.dart';
import '../../../core/network/api_client.dart';

final listingRepositoryProvider = Provider<ListingRepository>((ref) {
  return ListingRepositoryImpl(ref.read(apiClientProvider));
});

final homeNotifierProvider = AsyncNotifierProvider<HomeNotifier, List<Listing>>(
  HomeNotifier.new,
);

class HomeNotifier extends AsyncNotifier<List<Listing>> {
  @override
  Future<List<Listing>> build() async {
    return _loadListings();
  }

  Future<List<Listing>> _loadListings() async {
    return ref.read(listingRepositoryProvider).fetchListings();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_loadListings);
  }
}

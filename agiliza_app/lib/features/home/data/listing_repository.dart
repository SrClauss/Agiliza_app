import '../../../core/constants/app_strings.dart';
import '../../../core/network/api_client.dart';
import '../domain/entities/listing.dart';

abstract class ListingRepository {
  Future<List<Listing>> fetchListings();
}

class ListingRepositoryImpl implements ListingRepository {
  final ApiClient apiClient;

  ListingRepositoryImpl(this.apiClient);

  static const _locations = [
    'Soho',
    'Brooklyn',
    'Chelsea',
    'Midtown',
    'Greenwich Village',
    'Williamsburg',
  ];

  static const _categories = [
    'Premium stay',
    'Boutique suite',
    'City escape',
    'Family home',
    'Luxury loft',
  ];

  @override
  Future<List<Listing>> fetchListings() async {
    final response = await apiClient.get(AppStrings.listingsEndpoint);

    if (response.statusCode != 200) {
      throw Exception('Unable to fetch listings');
    }

    final raw = response.data;
    if (raw is! List) {
      throw Exception('Invalid response');
    }

    return raw.map((item) {
      final data = Map<String, dynamic>.from(item as Map);
      final index = int.tryParse(data['id']?.toString() ?? '1') ?? 1;
      return Listing(
        id: data['id']?.toString() ?? index.toString(),
        title: data['title']?.toString().replaceAll(RegExp(r'\.$'), '') ?? 'Cozy stay',
        location: _locations[index % _locations.length],
        category: _categories[index % _categories.length],
        price: '\$${90 + index}',
        duration: '${1 + index % 3} nights',
        rating: 4.0 + (index % 5) * 0.2,
        imageUrl: data['url']?.toString() ?? '',
        description: 'A modern home in the heart of the city with curated amenities and flexible check-in.',
      );
    }).toList();
  }
}

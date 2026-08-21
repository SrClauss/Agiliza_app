import 'package:freezed_annotation/freezed_annotation.dart';

part 'listing.freezed.dart';
part 'listing.g.dart';

@freezed
class Listing with _$Listing {
  const factory Listing({
    required String id,
    required String title,
    required String location,
    required String category,
    required String price,
    required String duration,
    required double rating,
    required String imageUrl,
    required String description,
  }) = _Listing;

  factory Listing.fromJson(Map<String, dynamic> json) => _$ListingFromJson(json);
}

extension ListingX on Listing {
  static Listing empty() => const Listing(
        id: '0',
        title: 'No stay available',
        location: '',
        category: '',
        price: '',
        duration: '',
        rating: 0.0,
        imageUrl: '',
        description: '',
      );
}

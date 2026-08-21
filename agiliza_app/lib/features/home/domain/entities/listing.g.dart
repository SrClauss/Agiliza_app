// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'listing.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ListingImpl _$$ListingImplFromJson(Map<String, dynamic> json) =>
    _$ListingImpl(
      id: json['id'] as String,
      title: json['title'] as String,
      location: json['location'] as String,
      category: json['category'] as String,
      price: json['price'] as String,
      duration: json['duration'] as String,
      rating: (json['rating'] as num).toDouble(),
      imageUrl: json['imageUrl'] as String,
      description: json['description'] as String,
    );

Map<String, dynamic> _$$ListingImplToJson(_$ListingImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'location': instance.location,
      'category': instance.category,
      'price': instance.price,
      'duration': instance.duration,
      'rating': instance.rating,
      'imageUrl': instance.imageUrl,
      'description': instance.description,
    };

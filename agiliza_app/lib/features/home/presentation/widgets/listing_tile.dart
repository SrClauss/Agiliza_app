import 'package:flutter/material.dart';

import '../../domain/entities/listing.dart';
import '../../../../core/constants/app_sizes.dart';

class ListingTile extends StatelessWidget {
  final Listing listing;
  final VoidCallback onTap;

  const ListingTile({super.key, required this.listing, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            boxShadow: const [
              BoxShadow(
                color: Color(0x0D000000),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: AspectRatio(
                  aspectRatio: 4 / 3,
                  child: Image.network(
                    listing.imageUrl,
                    fit: BoxFit.cover,
                    loadingBuilder: (context, child, progress) {
                      if (progress == null) return child;
                      return const Center(child: CircularProgressIndicator());
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return Container(color: Theme.of(context).colorScheme.surface, child: const Icon(Icons.image_not_supported, size: 52));
                    },
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSizes.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(listing.title, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: AppSizes.xs),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined, size: 16, color: Theme.of(context).colorScheme.primary),
                        const SizedBox(width: AppSizes.xs),
                        Expanded(child: Text(listing.location, style: Theme.of(context).textTheme.bodyMedium)),
                      ],
                    ),
                    const SizedBox(height: AppSizes.sm),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(listing.price, style: Theme.of(context).textTheme.titleLarge),
                        Chip(
                          label: Text(listing.rating.toStringAsFixed(1)),
                          backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

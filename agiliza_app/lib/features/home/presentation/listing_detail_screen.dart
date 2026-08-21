import 'package:flutter/material.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/widgets/app_back_app_bar.dart';
import '../domain/entities/listing.dart';

class ListingDetailScreen extends StatelessWidget {
  final Listing listing;

  const ListingDetailScreen({super.key, required this.listing});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppBackAppBar(
        title: Text('Stay details'),
      ),
      body: SingleChildScrollView(
        padding: AppSizes.pagePadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(AppSizes.radius),
              child: AspectRatio(
                aspectRatio: 4 / 3,
                child: Image.network(
                  listing.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    child: const Center(child: Icon(Icons.image_not_supported, size: 52)),
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSizes.lg),
            Text(listing.title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSizes.sm),
            Row(
              children: [
                Chip(label: Text(listing.category)),
                const SizedBox(width: AppSizes.sm),
                Icon(Icons.location_on_outlined, color: Theme.of(context).colorScheme.primary, size: 18),
                const SizedBox(width: AppSizes.xs),
                Text(listing.location, style: Theme.of(context).textTheme.bodyLarge),
              ],
            ),
            const SizedBox(height: AppSizes.md),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(listing.price, style: Theme.of(context).textTheme.titleLarge),
                Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Row(
                    children: [
                      const Icon(Icons.star, size: 18),
                      const SizedBox(width: AppSizes.xs),
                      Text(listing.rating.toStringAsFixed(1)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSizes.lg),
            Text('What you’ll love', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: AppSizes.sm),
            Wrap(
              runSpacing: AppSizes.sm,
              spacing: AppSizes.sm,
              children: [
                _FeatureChip(label: 'Flexible check-in'),
                _FeatureChip(label: 'Fast wifi'),
                _FeatureChip(label: listing.duration),
                _FeatureChip(label: '3 guests'),
              ],
            ),
            const SizedBox(height: AppSizes.lg),
            Text('About', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: AppSizes.sm),
            Text(listing.description, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: AppSizes.xl),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.location_on),
              label: const Text('Book a stay'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureChip extends StatelessWidget {
  final String label;

  const _FeatureChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(label),
      backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
    );
  }
}

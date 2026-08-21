import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/widgets/app_back_app_bar.dart';
import '../../../core/widgets/error_view.dart';
import '../data/models/backend_models.dart';
import 'home_providers.dart';

class ProfessionalProfileScreen extends ConsumerWidget {
  const ProfessionalProfileScreen({
    super.key,
    required this.professionalId,
  });

  final String professionalId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(
      professionalDetailProvider(professionalId),
    );

    return Scaffold(
      appBar: const AppBackAppBar(
        title: Text('Professional Profile'),
      ),
      body: profileState.when(
        data: (profile) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 55,
                        backgroundColor:
                            Theme.of(context).colorScheme.primaryContainer,
                        backgroundImage:
                            profile.user.profileImageUrl != null &&
                                    profile.user.profileImageUrl!.isNotEmpty
                                ? NetworkImage(
                                    profile.user.profileImageUrl!,
                                  )
                                : null,
                        child:
                            profile.user.profileImageUrl == null ||
                                    profile.user.profileImageUrl!.isEmpty
                                ? Text(
                                    profile.fullName.isNotEmpty
                                        ? profile.fullName[0].toUpperCase()
                                        : 'P',
                                    style: const TextStyle(
                                      fontSize: 42,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  )
                                : null,
                      ),

                      const SizedBox(height: 18),

                      Text(
                        profile.fullName,
                        style: const TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 8),

                      Text(
                        profile.role,
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey.shade700,
                        ),
                      ),

                      const SizedBox(height: 20),

                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        alignment: WrapAlignment.center,
                        children: [
                          _StatChip(
                            icon: Icons.star,
                            label:
                                '${profile.averageRating.toStringAsFixed(1)} Rating',
                          ),
                          _StatChip(
                            icon: Icons.work_outline,
                            label:
                                '${profile.yearsExperience} Years Exp',
                          ),
                          _StatChip(
                            icon: Icons.reviews_outlined,
                            label:
                                '${profile.totalReviews} Reviews',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                _SectionTitle(title: 'About'),

                const SizedBox(height: 10),

                Text(
                  profile.bio,
                  style: const TextStyle(
                    fontSize: 16,
                    height: 1.5,
                  ),
                ),

                const SizedBox(height: 28),

                _SectionTitle(title: 'Professional Details'),

                const SizedBox(height: 14),

                _DetailCard(
                  icon: Icons.currency_rupee,
                  title: 'Hourly Rate',
                  value: '₹${profile.hourlyRate}/hour',
                ),

                const SizedBox(height: 12),

                _DetailCard(
                  icon: Icons.location_on_outlined,
                  title: 'Service Radius',
                  value: '${profile.serviceRadiusKm} KM',
                ),

                const SizedBox(height: 12),

                _DetailCard(
                  icon: Icons.home_work_outlined,
                  title: 'Address',
                  value: profile.address,
                ),

                const SizedBox(height: 28),

                _SectionTitle(title: 'Services Offered'),

                const SizedBox(height: 12),

                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: profile.categories.map((category) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .colorScheme
                            .primaryContainer,
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: Text(
                        category.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 30),

                _SectionTitle(title: 'Availability'),

                const SizedBox(height: 14),

                Column(
                  children: profile.availability.map((slot) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              slot.dayName,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),

                          Text(
                            '${slot.startTime} - ${slot.endTime}',
                            style: const TextStyle(
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 30),

                _SectionTitle(title: 'Portfolio'),

                const SizedBox(height: 14),

                profile.portfolio.isEmpty
                    ? const Text(
                        'No portfolio items available.',
                      )
                    : Column(
                        children: profile.portfolio.map((item) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                if (item.imageUrl != null &&
                                    item.imageUrl!.isNotEmpty)
                                  ClipRRect(
                                    borderRadius:
                                        BorderRadius.circular(16),
                                    child: Image.network(
                                      item.imageUrl!,
                                      height: 180,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                    ),
                                  )
                                else
                                  Container(
                                    height: 180,
                                    width: double.infinity,
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade300,
                                      borderRadius:
                                          BorderRadius.circular(16),
                                    ),
                                    child: const Icon(
                                      Icons.image,
                                      size: 60,
                                    ),
                                  ),

                                const SizedBox(height: 14),

                                Text(
                                  item.title,
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),

                                const SizedBox(height: 8),

                                Text(
                                  item.description,
                                  style: TextStyle(
                                    fontSize: 15,
                                    color: Colors.grey.shade700,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),

                const SizedBox(height: 32),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(56),
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () {
                          context.push('/quote-response');
                        },
                        child: const Text(
                          'Request Quote',
                          style: TextStyle(fontSize: 16),
                        ),
                      ),
                    ),

                    const SizedBox(width: 14),

                    Expanded(
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(56),
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () {
                          context.push('/service-request');
                        },
                        child: const Text(
                          'Book Service',
                          style: TextStyle(fontSize: 16),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 30),
              ],
            ),
          );
        },
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorView(
          message: error.toString(),
          onRetry: () => ref
              .read(
                professionalDetailProvider(professionalId).notifier,
              )
              .refresh(),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _StatChip({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const _DetailCard({
    required this.icon,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Icon(icon, size: 28),

          const SizedBox(width: 16),

          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade700,
                  ),
                ),

                const SizedBox(height: 4),

                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
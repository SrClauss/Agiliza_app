import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/widgets/app_back_app_bar.dart';
import '../../../core/widgets/error_view.dart';
import 'home_providers.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favoritesState = ref.watch(favoritesProvider);

    return Scaffold(
      appBar: const AppBackAppBar(
        title: Text('Saved Professionals'),
      ),
      body: favoritesState.when(
        data: (favorites) {
          if (favorites.isEmpty) {
            return Center(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: AppSizes.lg),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.favorite_border,
                      size: 90,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'No favorites yet',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Save professionals to quickly access them later.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey.shade600,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: favorites.length,
            separatorBuilder: (_, __) =>
                const SizedBox(height: 18),
            itemBuilder: (context, index) {
              final favorite = favorites[index];
              final professional = favorite.professional;

              if (professional == null) {
                return const SizedBox.shrink();
              }

              final initials = professional.fullName.isNotEmpty
                  ? professional.fullName[0].toUpperCase()
                  : 'P';

              return InkWell(
                borderRadius: BorderRadius.circular(24),
                onTap: () {
                  context.push(
                    '/professional-profile/${professional.id}',
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                    border: Border.all(
                      color: Colors.grey.shade200,
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment:
                        CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 36,
                        backgroundColor:
                            Theme.of(context)
                                .colorScheme
                                .primaryContainer,
                        backgroundImage:
                            professional.user.profileImageUrl != null &&
                                    professional.user.profileImageUrl!
                                        .isNotEmpty
                                ? NetworkImage(
                                    professional.user.profileImageUrl!,
                                  )
                                : null,
                        child:
                            professional.user.profileImageUrl ==
                                        null ||
                                    professional
                                        .user
                                        .profileImageUrl!
                                        .isEmpty
                                ? Text(
                                    initials,
                                    style: const TextStyle(
                                      fontSize: 28,
                                      fontWeight:
                                          FontWeight.bold,
                                    ),
                                  )
                                : null,
                      ),

                      const SizedBox(width: 18),

                      Expanded(
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [
                            Text(
                              professional.fullName,
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight:
                                    FontWeight.bold,
                              ),
                            ),

                            const SizedBox(height: 6),

                            Text(
                              professional.role,
                              style: TextStyle(
                                fontSize: 16,
                                color:
                                    Colors.grey.shade700,
                              ),
                            ),

                            const SizedBox(height: 14),

                            Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: [
                                _InfoChip(
                                  icon: Icons.star,
                                  label:
                                      '${professional.averageRating.toStringAsFixed(1)}',
                                ),

                                _InfoChip(
                                  icon: Icons.work_outline,
                                  label:
                                      '${professional.yearsExperience} yrs',
                                ),
                              ],
                            ),

                            const SizedBox(height: 14),

                            Row(
                              children: [
                                Icon(
                                  Icons.location_on_outlined,
                                  size: 18,
                                  color:
                                      Colors.grey.shade600,
                                ),

                                const SizedBox(width: 6),

                                Expanded(
                                  child: Text(
                                    professional.address,
                                    maxLines: 1,
                                    overflow:
                                        TextOverflow
                                            .ellipsis,
                                    style: TextStyle(
                                      fontSize: 15,
                                      color: Colors
                                          .grey
                                          .shade700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      Column(
                        children: [
                          IconButton(
                            onPressed: () async {
                              await ref
                                  .read(
                                    favoritesProvider
                                        .notifier,
                                  )
                                  .removeFavorite(
                                    favorite.id,
                                  );
                            },
                            icon: const Icon(
                              Icons.favorite,
                              color: Colors.red,
                              size: 30,
                            ),
                          ),

                          const SizedBox(height: 20),

                          Icon(
                            Icons.arrow_forward_ios,
                            size: 18,
                            color: Colors.grey.shade500,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(),
        ),
        error: (error, stack) => ErrorView(
          message: error.toString(),
          onRetry: () =>
              ref.read(favoritesProvider.notifier).refresh(),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 8,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context)
            .colorScheme
            .primaryContainer,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16),

          const SizedBox(width: 6),

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
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/widgets/app_back_app_bar.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/error_view.dart';
import '../../location/providers/location_provider.dart';
import '../data/models/backend_models.dart';
import 'home_providers.dart';

class ProfessionalListingScreen extends ConsumerStatefulWidget {
  const ProfessionalListingScreen({
    super.key,
    this.categorySlug,
  });

  final String? categorySlug;

  @override
  ConsumerState<ProfessionalListingScreen> createState() =>
      _ProfessionalListingScreenState();
}

class _ProfessionalListingScreenState
    extends ConsumerState<ProfessionalListingScreen> {
  final _searchController = TextEditingController();

  final _filters = [
    AppStrings.filterAll,
    AppStrings.filterTopRated,
    AppStrings.filterRemote,
    AppStrings.filterNew,
  ];

  int _selectedFilterIndex = 0;

  bool _showOnlyFavorites = false;

  double _radiusKm = 15;

  bool _nearbyOnly = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  double calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    return Geolocator.distanceBetween(
          lat1,
          lon1,
          lat2,
          lon2,
        ) /
        1000;
  }

  List<ProfessionalProfile> _applyLocalFilters(
    List<ProfessionalProfile> professionals,
    Set<String> favoriteIds,
  ) {
    final query =
        _searchController.text.toLowerCase().trim();

    final userLocation =
        ref.read(userLocationProvider);

    var filtered = professionals.where((profile) {
      final categories = profile.categories
          .map((e) => e.name.toLowerCase())
          .join(' ');

      final matchesQuery =
          query.isEmpty ||
              profile.fullName
                  .toLowerCase()
                  .contains(query) ||
              profile.bio
                  .toLowerCase()
                  .contains(query) ||
              profile.address
                  .toLowerCase()
                  .contains(query) ||
              categories.contains(query);

      final matchesFavorite =
          !_showOnlyFavorites ||
              favoriteIds.contains(profile.id);

      if (_nearbyOnly &&
          userLocation != null &&
          profile.latitude != 0 &&
          profile.longitude != 0) {
        final distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          profile.latitude ?? 0,
          profile.longitude ?? 0,
        );

        if (distance > _radiusKm) {
          return false;
        }
      }

      return matchesQuery && matchesFavorite;
    }).toList();

    switch (_selectedFilterIndex) {
      // All
      case 0:
        if (userLocation != null) {
          filtered.sort((a, b) {
            final distanceA = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              a.latitude ?? 0,
              a.longitude ?? 0,
            );

            final distanceB = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              b.latitude ?? 0,
              b.longitude ?? 0,
            );

            return distanceA.compareTo(distanceB);
          });
        } else {
          filtered.sort(
            (a, b) =>
                b.averageRating.compareTo(
                  a.averageRating,
                ),
          );
        }
        break;

      // Top Rated
      case 1:
        filtered = filtered
            .where((p) => p.averageRating >= 4.5)
            .toList();

        filtered.sort(
          (a, b) =>
              b.averageRating.compareTo(
                a.averageRating,
              ),
        );
        break;

      // Remote
      case 2:
        filtered = filtered
            .where(
              (p) =>
                  p.address
                      .toLowerCase()
                      .contains('remote') ||
                  p.serviceRadiusKm >= 50,
            )
            .toList();
        break;

      // New
      case 3:
        filtered.sort(
          (a, b) =>
              a.totalReviews.compareTo(
                b.totalReviews,
              ),
        );
        break;
    }

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    final professionalsState = ref.watch(
      professionalsProvider(
        ProfessionalSearchParams(
          categorySlug: widget.categorySlug,
        ),
      ),
    );

    final favoritesState =
        ref.watch(favoritesProvider);

    return Scaffold(
      appBar: AppBackAppBar(
        title: const Text(
          AppStrings.professionalListingTitle,
        ),
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              _showOnlyFavorites
                  ? Icons.favorite
                  : Icons.favorite_border,
            ),
            onPressed: () {
              setState(() {
                _showOnlyFavorites =
                    !_showOnlyFavorites;
              });
            },
            tooltip: 'Show favorites',
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding:
              const EdgeInsets.all(20),
          child: Column(
            children: [
              // SEARCH
              TextField(
                controller: _searchController,
                onChanged: (_) => setState(() {}),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
                decoration: InputDecoration(
                  hintText:
                      'Search plumber, painter, location...',
                  prefixIcon: const Icon(
                    Icons.search_rounded,
                  ),
                  suffixIcon:
                      _searchController
                              .text
                              .isNotEmpty
                          ? IconButton(
                              icon: const Icon(
                                Icons.close_rounded,
                              ),
                              onPressed: () {
                                _searchController
                                    .clear();

                                setState(() {});
                              },
                            )
                          : null,
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding:
                      const EdgeInsets.symmetric(
                    vertical: 18,
                    horizontal: 18,
                  ),
                  border: OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(
                      22,
                    ),
                    borderSide:
                        BorderSide.none,
                  ),
                  enabledBorder:
                      OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(
                      22,
                    ),
                    borderSide: BorderSide(
                      color:
                          Colors.grey.shade200,
                    ),
                  ),
                  focusedBorder:
                      OutlineInputBorder(
                    borderRadius:
                        BorderRadius.circular(
                      22,
                    ),
                    borderSide: BorderSide(
                      color: Theme.of(context)
                          .colorScheme
                          .primary,
                      width: 1.5,
                    ),
                  ),
                ),
              ),

              const SizedBox(
                height: AppSizes.lg,
              ),

              // LOCATION FILTER
              Container(
                padding:
                    const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius:
                      BorderRadius.circular(
                    22,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black
                          .withOpacity(0.04),
                      blurRadius: 10,
                      offset:
                          const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons
                              .location_on_rounded,
                          color: Theme.of(
                            context,
                          ).colorScheme.primary,
                        ),

                        const SizedBox(
                          width: 8,
                        ),

                        const Text(
                          'Nearby Professionals',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight:
                                FontWeight.bold,
                          ),
                        ),

                        const Spacer(),

                        Switch(
                          value: _nearbyOnly,
                          onChanged: (value) async {

                            // TURN OFF
                            if (!value) {
                              setState(() {
                                _nearbyOnly = false;
                              });
                              return;
                            }

                            // ASK LOCATION PERMISSION
                            final success = await ref
                                .read(userLocationProvider.notifier)
                                .requestLocation();

                            // IF ALLOWED
                            if (success) {
                              setState(() {
                                _nearbyOnly = true;
                              });
                            }

                            // IF DENIED
                            else {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    backgroundColor: Colors.red,
                                    content: const Text(
                                      'Location permission is required to find nearby professionals.',
                                    ),
                                    action: SnackBarAction(
                                      label: 'Settings',
                                      textColor: Colors.white,
                                      onPressed: () async {
                                        await Geolocator.openAppSettings();
                                      },
                                    ),
                                  ),
                                );
                              }
                            }
                          },
                        ),
                      ],
                    ),

                    if (_nearbyOnly) ...[
                      const SizedBox(
                        height: 16,
                      ),

                      Text(
                        'Search Radius: ${_radiusKm.toInt()} KM',
                        style:
                            const TextStyle(
                          fontWeight:
                              FontWeight.w600,
                        ),
                      ),

                      Slider(
                        value: _radiusKm,
                        min: 5,
                        max: 100,
                        divisions: 19,
                        label:
                            '${_radiusKm.toInt()} KM',
                        onChanged: (value) {
                          setState(() {
                            _radiusKm = value;
                          });
                        },
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(
                height: AppSizes.lg,
              ),

              // FILTER CHIPS
              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection:
                      Axis.horizontal,
                  itemCount:
                      _filters.length,
                  separatorBuilder:
                      (_, _) =>
                          const SizedBox(
                    width: AppSizes.sm,
                  ),
                  itemBuilder:
                      (context, index) {
                    final selected =
                        _selectedFilterIndex ==
                            index;

                    return ChoiceChip(
                      showCheckmark: false,
                      selectedColor:
                          Theme.of(context)
                              .colorScheme
                              .primaryContainer,
                      backgroundColor:
                          Colors.white,
                      labelStyle: TextStyle(
                        fontWeight:
                            FontWeight.w600,
                        color: selected
                            ? Theme.of(context)
                                .colorScheme
                                .primary
                            : Colors.black87,
                      ),
                      side: BorderSide(
                        color: selected
                            ? Theme.of(context)
                                .colorScheme
                                .primary
                            : Colors
                                .grey.shade300,
                      ),
                      label:
                          Text(_filters[index]),
                      selected:
                          selected,
                      onSelected: (_) {
                        setState(() {
                          _selectedFilterIndex =
                              index;
                        });
                      },
                    );
                  },
                ),
              ),

              const SizedBox(
                height: AppSizes.lg,
              ),

              // PROFESSIONAL LIST
              Expanded(
                child:
                    professionalsState.when(
                  data: (professionals) {
                    final favoriteIds =
                        favoritesState
                            .maybeWhen(
                      data: (items) => items
                          .map(
                            (item) => item
                                .professionalProfileId,
                          )
                          .toSet(),
                      orElse: () =>
                          <String>{},
                    );

                    final filtered =
                        _applyLocalFilters(
                      professionals,
                      favoriteIds,
                    );

                    if (filtered.isEmpty) {
                      return const EmptyView(
                        title:
                            'No professionals found',
                        subtitle:
                            'Try another keyword, category or filter.',
                      );
                    }

                    return ListView.separated(
                      itemCount:
                          filtered.length,
                      separatorBuilder:
                          (_, _) =>
                              const SizedBox(
                        height: 16,
                      ),
                      itemBuilder:
                          (context, index) {
                        final professional =
                            filtered[index];

                        final isFavorite =
                            favoriteIds.contains(
                          professional.id,
                        );

                        final userLocation =
                            ref
                                .read(
                                  userLocationProvider,
                                );

                        final distanceKm =
                            userLocation !=
                                    null
                                ? calculateDistance(
                                    userLocation
                                        .latitude,
                                    userLocation
                                        .longitude,
                                    professional.latitude ?? 0,
                                    professional
                                        .longitude ?? 0,
                                  )
                                : null;

                        return _ProfessionalCard(
                          professional:
                              professional,
                          distanceKm:
                              distanceKm,
                          isFavorite:
                              isFavorite,
                          onFavoriteToggle:
                              () async {
                            final notifier =
                                ref.read(
                              favoritesProvider
                                  .notifier,
                            );

                            if (isFavorite) {
                              final favoriteItem =
                                  favoritesState
                                      .maybeWhen(
                                data: (items) =>
                                    items.firstWhere(
                                  (item) =>
                                      item.professionalProfileId ==
                                      professional.id,
                                  orElse: () =>
                                      FavoriteItem(
                                    id: '',
                                    professionalProfileId:
                                        professional
                                            .id,
                                    professional:
                                        null,
                                  ),
                                ),
                                orElse: () =>
                                    FavoriteItem(
                                  id: '',
                                  professionalProfileId:
                                      professional
                                          .id,
                                  professional:
                                      null,
                                ),
                              );

                              if (favoriteItem
                                  .id
                                  .isNotEmpty) {
                                await notifier
                                    .removeFavorite(
                                  favoriteItem.id,
                                );
                              }
                            } else {
                              await notifier
                                  .addFavorite(
                                professional.id,
                              );
                            }

                            setState(() {});
                          },
                        );
                      },
                    );
                  },
                  loading: () =>
                      const Center(
                    child:
                        CircularProgressIndicator(),
                  ),
                  error: (error, stack) =>
                      ErrorView(
                    message:
                        error.toString(),
                    onRetry: () => ref
                        .read(
                          professionalsProvider(
                            const ProfessionalSearchParams(),
                          ).notifier,
                        )
                        .refresh(),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfessionalCard extends StatelessWidget {
  const _ProfessionalCard({
    required this.professional,
    required this.isFavorite,
    required this.onFavoriteToggle,
    this.distanceKm,
  });

  final ProfessionalProfile professional;
  final bool isFavorite;
  final VoidCallback onFavoriteToggle;
  final double? distanceKm;

  @override
  Widget build(BuildContext context) {
    final categories = professional.categories
        .map((e) => e.name)
        .take(2)
        .join(' • ');

    return InkWell(
      borderRadius:
          BorderRadius.circular(24),
      onTap: () {
        context.push(
          '/professional-profile/${professional.id}',
        );
      },
      child: Container(
        padding:
            const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius:
              BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black
                  .withOpacity(0.05),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 34,
                  backgroundColor:
                      const Color(
                    0xFFB8FFF1,
                  ),
                  child: Text(
                    professional
                            .fullName
                            .isNotEmpty
                        ? professional
                            .fullName[0]
                        : 'P',
                    style:
                        const TextStyle(
                      fontSize: 28,
                      fontWeight:
                          FontWeight.bold,
                      color:
                          Colors.black87,
                    ),
                  ),
                ),

                const SizedBox(
                  width: 16,
                ),

                Expanded(
                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment
                            .start,
                    children: [
                      Text(
                        professional.fullName,
                        style:
                            const TextStyle(
                          fontSize: 20,
                          fontWeight:
                              FontWeight.w800,
                        ),
                      ),

                      const SizedBox(
                        height: 6,
                      ),

                      Text(
                        categories,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors
                              .grey.shade700,
                          fontWeight:
                              FontWeight
                                  .w500,
                        ),
                      ),

                      const SizedBox(
                        height: 10,
                      ),

                      Row(
                        children: [
                          const Icon(
                            Icons
                                .star_rounded,
                            color:
                                Colors.amber,
                            size: 20,
                          ),

                          const SizedBox(
                            width: 4,
                          ),

                          Text(
                            professional
                                .averageRating
                                .toStringAsFixed(
                              1,
                            ),
                            style:
                                const TextStyle(
                              fontWeight:
                                  FontWeight
                                      .w700,
                              fontSize:
                                  15,
                            ),
                          ),

                          Text(
                            ' (${professional.totalReviews} reviews)',
                            style:
                                TextStyle(
                              color: Colors
                                  .grey
                                  .shade700,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                IconButton(
                  onPressed:
                      onFavoriteToggle,
                  icon: Icon(
                    isFavorite
                        ? Icons.favorite
                        : Icons
                            .favorite_border,
                    color: isFavorite
                        ? Colors.red
                        : Colors.grey,
                    size: 30,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: _InfoBox(
                    icon:
                        Icons.work_outline,
                    label: 'Experience',
                    value:
                        '${professional.yearsExperience} yrs',
                  ),
                ),

                const SizedBox(
                  width: 12,
                ),

                Expanded(
                  child: _InfoBox(
                    icon:
                        Icons.currency_rupee,
                    label: 'Rate',
                    value:
                        '₹${professional.hourlyRate}/hr',
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            Row(
              children: [
                const Icon(
                  Icons
                      .location_on_outlined,
                  size: 18,
                  color: Colors.grey,
                ),

                const SizedBox(width: 6),

                Expanded(
                  child: Text(
                    professional.address,
                    style: TextStyle(
                      color: Colors
                          .grey.shade700,
                    ),
                    overflow:
                        TextOverflow
                            .ellipsis,
                  ),
                ),

                if (distanceKm != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration:
                        BoxDecoration(
                      color: Theme.of(
                        context,
                      )
                          .colorScheme
                          .primaryContainer,
                      borderRadius:
                          BorderRadius.circular(
                        30,
                      ),
                    ),
                    child: Text(
                      '${distanceKm!.toStringAsFixed(1)} km',
                      style:
                          const TextStyle(
                        fontSize: 12,
                        fontWeight:
                            FontWeight
                                .bold,
                      ),
                    ),
                  ),
              ],
            ),

            if (professional
                .portfolio.isNotEmpty) ...[
              const SizedBox(
                height: 14,
              ),

              Align(
                alignment:
                    Alignment.centerLeft,
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: professional
                      .portfolio
                      .take(3)
                      .map(
                        (item) =>
                            Container(
                          padding:
                              const EdgeInsets.symmetric(
                            horizontal:
                                12,
                            vertical:
                                8,
                          ),
                          decoration:
                              BoxDecoration(
                            color:
                                const Color(
                              0xFFF3F4F6,
                            ),
                            borderRadius:
                                BorderRadius.circular(
                              14,
                            ),
                          ),
                          child: Text(
                            item.title,
                            style:
                                const TextStyle(
                              fontSize:
                                  13,
                              fontWeight:
                                  FontWeight
                                      .w600,
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InfoBox extends StatelessWidget {
  const _InfoBox({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding:
          const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(
          0xFFF8F9FA,
        ),
        borderRadius:
            BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20),

          const SizedBox(height: 6),

          Text(
            label,
            style: TextStyle(
              color:
                  Colors.grey.shade700,
              fontSize: 12,
            ),
          ),

          const SizedBox(height: 4),

          Text(
            value,
            style: const TextStyle(
              fontWeight:
                  FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
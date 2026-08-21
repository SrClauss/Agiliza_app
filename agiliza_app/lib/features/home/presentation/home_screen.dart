import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/error_view.dart';
import 'favorites_screen.dart';
import 'profile_screen.dart';
import 'request_history_screen.dart';
import 'home_providers.dart';
import '../data/models/backend_models.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();

  int _selectedCategoryIndex = 0;
  int _navIndex = 0;

  final PageStorageBucket _pageStorageBucket =
      PageStorageBucket();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<ProfessionalProfile> _filterProfessionals(
    List<ProfessionalProfile> professionals,
  ) {
    final query =
        _searchController.text.toLowerCase().trim();

    if (query.isEmpty) return professionals;

    return professionals.where((professional) {
      final categories = professional.categories
          .map((e) => e.name.toLowerCase())
          .join(' ');

      return professional.fullName
              .toLowerCase()
              .contains(query) ||
          professional.bio
              .toLowerCase()
              .contains(query) ||
          professional.address
              .toLowerCase()
              .contains(query) ||
          categories.contains(query);
    }).toList();
  }

  Widget _buildHomeContent(BuildContext context) {
    final categoriesState =
        ref.watch(categoriesProvider);

    final selectedCategorySlug =
        categoriesState.maybeWhen(
      data: (list) {
        if (_selectedCategoryIndex == 0 ||
            list.isEmpty) {
          return null;
        }

        return list[_selectedCategoryIndex - 1]
            .slug;
      },
      orElse: () => null,
    );

    final professionalsState = ref.watch(
      professionalsProvider(
        ProfessionalSearchParams(
          categorySlug: selectedCategorySlug,
        ),
      ),
    );

    return RefreshIndicator(
      onRefresh: () async {
        await ref
            .read(categoriesProvider.notifier)
            .refresh();

        await ref
            .read(
              professionalsProvider(
                ProfessionalSearchParams(
                  categorySlug:
                      selectedCategorySlug,
                ),
              ).notifier,
            )
            .refresh();
      },
      child: ListView(
        key: const PageStorageKey(
          'homeContent',
        ),
        padding: AppSizes.pagePadding,
        children: [
          Text(
            AppStrings.appTitle,
            style: Theme.of(context)
                .textTheme
                .displaySmall
                ?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),

          const SizedBox(height: AppSizes.sm),

          Text(
            AppStrings.homeSubtitle,
            style:
                Theme.of(context).textTheme.bodyLarge,
          ),

          const SizedBox(height: AppSizes.lg),

          // SEARCH
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius:
                  BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color:
                      Colors.black.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText:
                    'Search plumber, electrician...',
                hintStyle: TextStyle(
                  color: Colors.grey.shade500,
                ),
                prefixIcon:
                    const Icon(Icons.search_rounded),
                suffixIcon:
                    _searchController.text.isNotEmpty
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
                border: InputBorder.none,
                contentPadding:
                    const EdgeInsets.symmetric(
                  vertical: 18,
                ),
              ),
            ),
          ),

          const SizedBox(height: AppSizes.lg),

          // CATEGORY CHIPS
          SizedBox(
            height: 46,
            child: categoriesState.when(
              data: (categories) {
                final chips = [
                  const _CategoryChip(
                    label: 'All',
                    slug: '',
                  ),
                  ...categories.map(
                    (category) => _CategoryChip(
                      label: category.name,
                      slug: category.slug,
                    ),
                  ),
                ];

                return ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: chips.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(
                    width: AppSizes.sm,
                  ),
                  itemBuilder: (context, index) {
                    final selected =
                        index ==
                            _selectedCategoryIndex;

                    return ChoiceChip(
                      showCheckmark: false,
                      selectedColor:
                          Theme.of(context)
                              .colorScheme
                              .primaryContainer,
                      backgroundColor:
                          Colors.white,
                      side: BorderSide(
                        color: selected
                            ? Theme.of(context)
                                .colorScheme
                                .primary
                            : Colors
                                .grey.shade300,
                      ),
                      labelStyle: TextStyle(
                        fontWeight:
                            FontWeight.w600,
                        color: selected
                            ? Theme.of(context)
                                .colorScheme
                                .primary
                            : Colors.black87,
                      ),
                      label:
                          Text(chips[index].label),
                      selected: selected,
                      onSelected: (_) {
                        setState(() {
                          _selectedCategoryIndex =
                              index;
                        });
                      },
                    );
                  },
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(),
              ),
              error: (error, stack) =>
                  const Center(
                child: Text(
                  'Unable to load categories.',
                ),
              ),
            ),
          ),

          const SizedBox(height: AppSizes.xl),

          // FEATURED TITLE
          Row(
            mainAxisAlignment:
                MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Featured Professionals',
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(
                      fontWeight:
                          FontWeight.bold,
                    ),
              ),
              TextButton(
                onPressed: () {
                  final route =
                      selectedCategorySlug ==
                                  null ||
                              selectedCategorySlug
                                  .isEmpty
                          ? '/professionals'
                          : '/professionals?category=$selectedCategorySlug';

                  context.push(route);
                },
                child: const Text('See all'),
              ),
            ],
          ),

          const SizedBox(height: AppSizes.md),

          // FEATURED CARDS
          SizedBox(
            height: 245,
            child: professionalsState.when(
              data: (professionals) {
                final filtered =
                    _filterProfessionals(
                  professionals,
                )..sort(
                        (a, b) => b.averageRating
                            .compareTo(
                          a.averageRating,
                        ),
                      );

                if (filtered.isEmpty) {
                  return const Center(
                    child: Text(
                      'No professionals available.',
                    ),
                  );
                }

                final featured =
                    filtered.take(6).toList();

                return ListView.separated(
                  scrollDirection:
                      Axis.horizontal,
                  itemCount: featured.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(
                    width: AppSizes.md,
                  ),
                  itemBuilder: (context, index) {
                    return _ProfessionalCard(
                      professional:
                          featured[index],
                    );
                  },
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(),
              ),
              error: (error, stack) =>
                  ErrorView(
                message: error.toString(),
                onRetry: () => ref
                    .read(
                      categoriesProvider
                          .notifier,
                    )
                    .refresh(),
              ),
            ),
          ),

          const SizedBox(height: AppSizes.xl),

          // POPULAR SERVICES
          Text(
            'Popular Services',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),

          const SizedBox(height: AppSizes.md),

          categoriesState.when(
            data: (categories) {
              if (categories.isEmpty) {
                return const EmptyView(
                  title: 'No categories found',
                  subtitle:
                      'Try refreshing to load categories.',
                );
              }

              return Wrap(
                spacing: AppSizes.sm,
                runSpacing: AppSizes.sm,
                children:
                    categories.take(6).map(
                  (category) {
                    return InkWell(
                      borderRadius:
                          BorderRadius.circular(
                        30,
                      ),
                      onTap: () {
                        context.push(
                          '/professionals?category=${category.slug}',
                        );
                      },
                      child: Container(
                        padding:
                            const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 12,
                        ),
                        decoration:
                            BoxDecoration(
                          color: Theme.of(context)
                              .colorScheme
                              .primaryContainer,
                          borderRadius:
                              BorderRadius
                                  .circular(
                            30,
                          ),
                        ),
                        child: Row(
                          mainAxisSize:
                              MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons
                                  .home_repair_service,
                              size: 18,
                            ),
                            const SizedBox(
                              width: 8,
                            ),
                            Text(
                              category.name,
                              style:
                                  const TextStyle(
                                fontWeight:
                                    FontWeight
                                        .w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ).toList(),
              );
            },
            loading: () => const Center(
              child: CircularProgressIndicator(),
            ),
            error: (error, stack) =>
                const EmptyView(
              title: 'Categories unavailable',
              subtitle:
                  'Unable to load services.',
            ),
          ),

          const SizedBox(height: 30),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _buildHomeContent(context),
      const RequestHistoryScreen(),
      const FavoritesScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: SafeArea(
        child: PageStorage(
          bucket: _pageStorageBucket,
          child: IndexedStack(
            index: _navIndex,
            children: pages,
          ),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _navIndex,
        onDestinationSelected: (index) {
          setState(() {
            _navIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            label: 'Home',
          ),
          NavigationDestination(
            icon:
                Icon(Icons.description_outlined),
            label: 'Requests',
          ),
          NavigationDestination(
            icon: Icon(Icons.favorite_border),
            label: 'Favorites',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _ProfessionalCard extends StatelessWidget {
  const _ProfessionalCard({
    required this.professional,
  });

  final ProfessionalProfile professional;

  @override
  Widget build(BuildContext context) {
    final categories = professional.categories
        .map((e) => e.name)
        .take(2)
        .join(' • ');

    return GestureDetector(
      onTap: () {
        GoRouter.of(context).push(
          '/professional-profile/${professional.id}',
        );
      },
      child: Container(
        width: 185,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius:
              BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color:
                  Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 5),
            ),
          ],
          border: Border.all(
            color: Colors.grey.shade200,
          ),
        ),
        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor:
                      Theme.of(context)
                          .colorScheme
                          .primaryContainer,
                  child: Text(
                    professional
                            .fullName.isNotEmpty
                        ? professional
                            .fullName[0]
                        : 'P',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight:
                          FontWeight.bold,
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius:
                        BorderRadius.circular(
                      30,
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.star,
                        size: 14,
                        color: Colors.amber,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        professional
                            .averageRating
                            .toStringAsFixed(1),
                        style:
                            const TextStyle(
                          fontWeight:
                              FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            Text(
              professional.fullName,
              maxLines: 1,
              overflow:
                  TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 4),

            Text(
              categories,
              maxLines: 1,
              overflow:
                  TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.grey.shade700,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),

            const SizedBox(height: 12),

            Row(
              children: [
                Icon(
                  Icons.work_outline,
                  size: 15,
                  color:
                      Colors.grey.shade600,
                ),
                const SizedBox(width: 4),
                Text(
                  '${professional.yearsExperience} yrs',
                  style: TextStyle(
                    fontSize: 13,
                    color:
                        Colors.grey.shade700,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            Row(
              children: [
                Icon(
                  Icons.currency_rupee,
                  size: 15,
                  color:
                      Colors.grey.shade600,
                ),
                const SizedBox(width: 4),
                Text(
                  '${professional.hourlyRate}/hr',
                  style: TextStyle(
                    fontSize: 13,
                    color:
                        Colors.grey.shade700,
                  ),
                ),
              ],
            ),

            const Spacer(),

            Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: 15,
                  color:
                      Colors.grey.shade600,
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    professional.address,
                    maxLines: 1,
                    overflow:
                        TextOverflow
                            .ellipsis,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors
                          .grey.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryChip {
  const _CategoryChip({
    required this.label,
    required this.slug,
  });

  final String label;
  final String slug;
}
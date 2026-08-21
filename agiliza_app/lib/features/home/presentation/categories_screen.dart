import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/widgets/app_back_app_bar.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/error_view.dart';
import 'home_providers.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesState = ref.watch(categoriesProvider);

    return Scaffold(
      appBar: const AppBackAppBar(
        title: Text(AppStrings.categoriesTitle),
        elevation: 0,
      ),
      body: categoriesState.when(
        data: (categories) {
          if (categories.isEmpty) {
            return const EmptyView(
              title: 'No categories available',
              subtitle: 'Try refreshing or check back later.',
            );
          }

          return LayoutBuilder(
            builder: (context, constraints) {
              final crossAxisCount = constraints.maxWidth >= 900
                  ? 4
                  : constraints.maxWidth >= 600
                      ? 3
                      : 2;

              return Padding(
                padding: AppSizes.pagePadding,
                child: GridView.builder(
                  itemCount: categories.length,
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    crossAxisSpacing: AppSizes.md,
                    mainAxisSpacing: AppSizes.md,
                    childAspectRatio: 1.1,
                  ),
                  itemBuilder: (context, index) {
                    final category = categories[index];
                    final initials = category.name
                        .split(' ')
                        .map((part) => part.isNotEmpty ? part[0] : '')
                        .take(2)
                        .join();
                    return Card(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppSizes.radius),
                      ),
                      elevation: 3,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(AppSizes.radius),
                        onTap: () {
                          context.push('/professionals?category=${category.slug}');
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(AppSizes.md),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CircleAvatar(
                                radius: 28,
                                backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                                foregroundColor: Theme.of(context).colorScheme.onPrimaryContainer,
                                child: Text(initials, style: Theme.of(context).textTheme.titleMedium),
                              ),
                              const SizedBox(height: AppSizes.lg),
                              Text(
                                category.name,
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorView(
          message: error.toString(),
          onRetry: () => ref.read(categoriesProvider.notifier).refresh(),
        ),
      ),
    );
  }
}

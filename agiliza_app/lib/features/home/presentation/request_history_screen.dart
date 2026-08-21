import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/widgets/app_back_app_bar.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/error_view.dart';
import '../data/models/backend_models.dart';
import 'home_providers.dart';

class RequestHistoryScreen extends ConsumerWidget {
  const RequestHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsState = ref.watch(requestHistoryProvider);

    return DefaultTabController(
      length: _statuses.length,
      child: Scaffold(
        appBar: AppBackAppBar(
          title: const Text(AppStrings.requestHistoryTitle),
          bottom: TabBar(
            isScrollable: true,
            tabs: _statuses.map((status) {
              return Tab(text: status.label);
            }).toList(),
          ),
        ),
        body: requestsState.when(
          data: (requests) {
            if (requests.isEmpty) {
              return const EmptyView(
                title: 'No service requests',
                subtitle: 'Submit a request to see it here.',
              );
            }

            return TabBarView(
              children: _statuses.map((status) {
                return _RequestHistoryList(
                  status: status,
                  requests: requests,
                );
              }).toList(),
            );
          },
          loading: () =>
              const Center(child: CircularProgressIndicator()),
          error: (error, stack) => ErrorView(
            message: error.toString(),
            onRetry: () => ref
                .read(requestHistoryProvider.notifier)
                .refresh(),
          ),
        ),
      ),
    );
  }
}

class _RequestHistoryList extends StatelessWidget {
  final _RequestStatus status;
  final List<ServiceRequest> requests;

  const _RequestHistoryList({
    required this.status,
    required this.requests,
  });

  @override
  Widget build(BuildContext context) {
    final entries = requests
        .where(
          (item) =>
              item.status.toLowerCase() == status.id,
        )
        .toList();

    if (entries.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSizes.lg,
          ),
          child: Text(
            'No ${status.label.toLowerCase()} requests yet.',
            style: Theme.of(context).textTheme.bodyLarge,
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(AppSizes.md),
      itemCount: entries.length,
      separatorBuilder: (_, __) =>
          const SizedBox(height: AppSizes.md),
      itemBuilder: (context, index) {
        final item = entries[index];

        return Card(
          elevation: 2,
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSizes.md),
            child: Row(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [

                /// LEFT ICON
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: Theme.of(context)
                        .colorScheme
                        .primaryContainer,
                    borderRadius:
                        BorderRadius.circular(16),
                  ),
                  child: Icon(
                    Icons.home_repair_service,
                    color: Theme.of(context)
                        .colorScheme
                        .primary,
                  ),
                ),

                const SizedBox(width: 14),

                /// MAIN CONTENT
                Expanded(
                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment.start,
                    children: [

                      /// TITLE
                      Text(
                        item.title,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(
                              fontWeight:
                                  FontWeight.w700,
                            ),
                      ),

                      const SizedBox(height: 8),

                      /// CATEGORY / PROFESSIONAL
                      Row(
                        children: [

                          Icon(
                            Icons.category,
                            size: 16,
                            color: Colors.grey[700],
                          ),

                          const SizedBox(width: 6),

                          Expanded(
                            child: Text(
                              item.professional
                                      ?.fullName ??
                                  item.categoryName,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    fontWeight:
                                        FontWeight
                                            .w600,
                                  ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 10),

                      /// DESCRIPTION
                      Text(
                        item.description,
                        maxLines: 2,
                        overflow:
                            TextOverflow.ellipsis,
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(
                              color: Colors.grey[700],
                              height: 1.4,
                            ),
                      ),

                      const SizedBox(height: 14),

                      /// DATE + PRICE
                      Row(
                        children: [

                          Icon(
                            Icons.calendar_today,
                            size: 16,
                            color: Colors.grey[600],
                          ),

                          const SizedBox(width: 6),

                          Expanded(
                            child: Text(
                              formatDate(
                                item.scheduledDate ??
                                    item
                                        .requestedDate,
                              ),
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall,
                            ),
                          ),

                          if (item.quotedPrice !=
                              null)
                            Text(
                              '₹${item.quotedPrice}',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    fontWeight:
                                        FontWeight
                                            .w700,
                                  ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 10),

                /// STATUS BADGE
                _StatusBadge(status: status),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final _RequestStatus status;

  const _StatusBadge({
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(
      status,
      Theme.of(context).colorScheme,
    );

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 8,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        status.label,
        style: Theme.of(context)
            .textTheme
            .bodyMedium
            ?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

enum _RequestStatus {
  pending,
  quoted,
  scheduled,
  completed,
  cancelled,
}

extension _RequestStatusLabel on _RequestStatus {
  String get label {
    switch (this) {
      case _RequestStatus.pending:
        return AppStrings.historyTabPending;

      case _RequestStatus.quoted:
        return AppStrings.historyTabQuoted;

      case _RequestStatus.scheduled:
        return AppStrings.historyTabScheduled;

      case _RequestStatus.completed:
        return AppStrings.historyTabCompleted;

      case _RequestStatus.cancelled:
        return AppStrings.historyTabCancelled;
    }
  }

  String get id => toString().split('.').last;
}

const _statuses = [
  _RequestStatus.pending,
  _RequestStatus.quoted,
  _RequestStatus.scheduled,
  _RequestStatus.completed,
  _RequestStatus.cancelled,
];

Color _statusColor(
  _RequestStatus status,
  ColorScheme colors,
) {
  switch (status) {
    case _RequestStatus.pending:
      return colors.primary;

    case _RequestStatus.quoted:
      return Colors.orange;

    case _RequestStatus.scheduled:
      return Colors.blue;

    case _RequestStatus.completed:
      return Colors.green;

    case _RequestStatus.cancelled:
      return colors.error;
  }
}

String formatDate(String? value) {

  if (value == null || value.isEmpty) {
    return '';
  }

  try {

    final date = DateTime.parse(value);

    return DateFormat(
      'dd MMM yyyy • hh:mm a',
    ).format(date);

  } catch (_) {

    return value;
  }
}
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/location_provider.dart';

class LocationPermissionScreen
    extends ConsumerWidget {
  const LocationPermissionScreen({
    super.key,
  });

  @override
  Widget build(
    BuildContext context,
    WidgetRef ref,
  ) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding:
              const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment:
                MainAxisAlignment.center,
            children: [
              Icon(
                Icons.location_on_rounded,
                size: 120,
                color: Theme.of(context)
                    .colorScheme
                    .primary,
              ),

              const SizedBox(height: 32),

              Text(
                'Find Professionals Near You',
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(
                      fontWeight:
                          FontWeight.bold,
                    ),
              ),

              const SizedBox(height: 16),

              Text(
                'Enable location access to discover nearby professionals, faster services and better recommendations.',
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .bodyLarge,
              ),

              const SizedBox(height: 40),

              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () async {
                    await ref
                        .read(
                          userLocationProvider
                              .notifier,
                        )
                        .requestLocation();

                    if (context.mounted) {
                      context.go('/home');
                    }
                  },
                  child: const Padding(
                    padding:
                        EdgeInsets.symmetric(
                      vertical: 16,
                    ),
                    child: Text(
                      'Enable Location',
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              TextButton(
                onPressed: () {
                  context.go('/home');
                },
                child:
                    const Text('Maybe Later'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
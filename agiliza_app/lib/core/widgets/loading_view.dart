import 'package:flutter/material.dart';

import 'skeleton_loader.dart';

class LoadingView extends StatelessWidget {
  final String message;
  const LoadingView({super.key, this.message = 'Loading…'});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SkeletonLoader(width: 72, height: 72, borderRadius: BorderRadius.all(Radius.circular(20))),
          const SizedBox(height: 20),
          const Divider(height: 0),
          const SizedBox(height: 20),
          const SkeletonLoader(width: 180, height: 18, borderRadius: BorderRadius.all(Radius.circular(12))),
          const SizedBox(height: 12),
          const SkeletonLoader(width: 120, height: 18, borderRadius: BorderRadius.all(Radius.circular(12))),
          const SizedBox(height: 20),
          Text(message, style: Theme.of(context).textTheme.bodyLarge),
        ],
      ),
    );
  }
}

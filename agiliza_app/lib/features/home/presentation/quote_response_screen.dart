import 'package:flutter/material.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/widgets/app_back_app_bar.dart';

class QuoteResponseScreen extends StatelessWidget {
  final QuoteResponse quote;

  const QuoteResponseScreen({super.key, QuoteResponse? quote})
      : quote = quote ?? _defaultQuote;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppBackAppBar(
        title: Text('Quote response'),
      ),
      body: SingleChildScrollView(
        padding: AppSizes.pagePadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: AppSizes.sm),
            Text('Estimated price', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: AppSizes.xs),
            Text(
              quote.price,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: AppSizes.lg),
            Row(
              children: [
                _QuoteStat(label: 'Duration', value: quote.duration),
                const SizedBox(width: AppSizes.sm),
                _QuoteStat(label: 'Service type', value: quote.serviceType),
              ],
            ),
            const SizedBox(height: AppSizes.xl),
            Text('Message from professional', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: AppSizes.sm),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSizes.md),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(AppSizes.radius),
              ),
              child: Text(
                quote.message,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ),
            const SizedBox(height: AppSizes.xl),
            Text('Professional', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: AppSizes.sm),
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundImage: NetworkImage(quote.professionalAvatarUrl),
                ),
                const SizedBox(width: AppSizes.sm),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(quote.professionalName, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: AppSizes.xs),
                    Text(quote.professionalRole, style: Theme.of(context).textTheme.bodyLarge),
                  ],
                ),
              ],
            ),
            const SizedBox(height: AppSizes.xl),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.of(context).pop(false);
                    },
                    child: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: AppSizes.sm),
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      Navigator.of(context).pop(true);
                    },
                    child: const Text('Accept'),
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

class _QuoteStat extends StatelessWidget {
  final String label;
  final String value;

  const _QuoteStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSizes.sm),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(AppSizes.radius),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: AppSizes.xs),
            Text(value, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class QuoteResponse {
  final String price;
  final String duration;
  final String serviceType;
  final String message;
  final String professionalName;
  final String professionalRole;
  final String professionalAvatarUrl;

  const QuoteResponse({
    required this.price,
    required this.duration,
    required this.serviceType,
    required this.message,
    required this.professionalName,
    required this.professionalRole,
    required this.professionalAvatarUrl,
  });
}

const _defaultQuote = QuoteResponse(
  price: '480',
  duration: '3–4 days',
  serviceType: 'Full redesign',
  message: 'I can complete the project within a week with a polished finish, including material sourcing and on-site supervision. Let me know if you would like to adjust the scope or schedule.',
  professionalName: 'Clara Mendes',
  professionalRole: 'Interior Design Pro',
  professionalAvatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
);

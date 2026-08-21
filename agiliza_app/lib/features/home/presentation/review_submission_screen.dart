import 'package:flutter/material.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/widgets/app_back_app_bar.dart';

class ReviewSubmissionScreen extends StatefulWidget {
  const ReviewSubmissionScreen({super.key});

  @override
  State<ReviewSubmissionScreen> createState() => _ReviewSubmissionScreenState();
}

class _ReviewSubmissionScreenState extends State<ReviewSubmissionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _commentController = TextEditingController();
  int _rating = 5;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  void _setRating(int rating) {
    setState(() {
      _rating = rating;
    });
  }

  Future<void> _submitReview() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() {
      _isSubmitting = true;
    });
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() {
      _isSubmitting = false;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Review submitted successfully.')),
    );
    _formKey.currentState?.reset();
    setState(() {
      _rating = 5;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: const AppBackAppBar(
        title: Text(AppStrings.reviewSubmissionTitle),
      ),
      body: SingleChildScrollView(
        padding: AppSizes.pagePadding,
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(AppStrings.reviewSubmissionSubtitle, style: theme.textTheme.bodyLarge),
              const SizedBox(height: AppSizes.lg),
              Text(AppStrings.ratingLabel, style: theme.textTheme.titleMedium),
              const SizedBox(height: AppSizes.sm),
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: List.generate(5, (index) {
                  final value = index + 1;
                  return IconButton(
                    onPressed: () => _setRating(value),
                    icon: Icon(
                      value <= _rating ? Icons.star : Icons.star_border,
                      color: value <= _rating ? theme.colorScheme.primary : theme.iconTheme.color,
                    ),
                  );
                }),
              ),
              const SizedBox(height: AppSizes.lg),
              TextFormField(
                controller: _commentController,
                maxLines: 6,
                decoration: const InputDecoration(
                  labelText: AppStrings.reviewCommentLabel,
                  hintText: 'Share your experience and feedback',
                  alignLabelWithHint: true,
                ),
                validator: (value) {
                  if (value == null || value.trim().length < 10) {
                    return 'Please leave a longer comment.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSizes.xl),
              FilledButton(
                onPressed: _isSubmitting ? null : _submitReview,
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                      )
                    : const Text(AppStrings.submitReviewButton),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

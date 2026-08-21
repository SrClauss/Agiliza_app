import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/widgets/app_back_app_bar.dart';
import '../../../core/widgets/empty_view.dart';
import '../../../core/widgets/error_view.dart';
import 'home_providers.dart';

class ServiceRequestFormScreen extends ConsumerStatefulWidget {
  const ServiceRequestFormScreen({super.key});

  @override
  ConsumerState<ServiceRequestFormScreen> createState() => _ServiceRequestFormScreenState();
}

class _ServiceRequestFormScreenState extends ConsumerState<ServiceRequestFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _dateController = TextEditingController();
  final _timeController = TextEditingController();
  final _addressController = TextEditingController();
  String? _selectedCategoryId;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _dateController.dispose();
    _timeController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final selected = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (selected != null) {
      _dateController.text = '${selected.year}-${selected.month.toString().padLeft(2, '0')}-${selected.day.toString().padLeft(2, '0')}';
    }
  }

  Future<void> _pickTime() async {
    final selected = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (selected != null) {
      _timeController.text = selected.format(context);
    }
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate() || _selectedCategoryId == null) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await ref.read(requestHistoryProvider.notifier).createRequest(
            title: _titleController.text.trim(),
            description: _descriptionController.text.trim(),
            address: _addressController.text.trim(),
            requestedDate: _dateController.text.trim(),
            scheduledDate: _dateController.text.trim(),
            categoryId: _selectedCategoryId!,
          );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Service request submitted successfully.')),
      );
      context.push('/request-history');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to submit request: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final categoriesState = ref.watch(categoriesProvider);

    return Scaffold(
      appBar: const AppBackAppBar(
        title: Text(AppStrings.serviceRequestTitle),
      ),
      body: categoriesState.when(
        data: (categories) {
          if (categories.isEmpty) {
            return const EmptyView(
              title: 'No categories available',
              subtitle: 'Cannot submit a request until categories are loaded.',
            );
          }

          _selectedCategoryId ??= categories.first.id;

          return SingleChildScrollView(
            padding: AppSizes.pagePadding,
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: AppSizes.sm),
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: AppStrings.requestTitleLabel,
                      hintText: 'e.g. Kitchen renovation planning',
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter a request title.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSizes.md),
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      labelText: AppStrings.requestDescriptionLabel,
                      hintText: 'Describe the service you need, your goals and priorities.',
                    ),
                    validator: (value) {
                      if (value == null || value.trim().length < 20) {
                        return 'Please provide a more detailed description.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSizes.md),
                  DropdownButtonFormField<String>(
                    value: _selectedCategoryId,
                    decoration: const InputDecoration(labelText: AppStrings.categoryLabel),
                    items: categories
                        .map((category) => DropdownMenuItem(
                              value: category.id,
                              child: Text(category.name),
                            ))
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedCategoryId = value;
                      });
                    },
                  ),
                  const SizedBox(height: AppSizes.md),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _dateController,
                          readOnly: true,
                          onTap: _pickDate,
                          decoration: const InputDecoration(
                            labelText: AppStrings.preferredDateLabel,
                            hintText: 'Select a date',
                            suffixIcon: Icon(Icons.calendar_today),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please choose a preferred date.';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: AppSizes.sm),
                      Expanded(
                        child: TextFormField(
                          controller: _timeController,
                          readOnly: true,
                          onTap: _pickTime,
                          decoration: const InputDecoration(
                            labelText: AppStrings.preferredTimeLabel,
                            hintText: 'Select a time',
                            suffixIcon: Icon(Icons.schedule),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please choose a preferred time.';
                            }
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSizes.md),
                  TextFormField(
                    controller: _addressController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: AppStrings.addressLabel,
                      hintText: 'Street, city, and any special instructions',
                    ),
                    validator: (value) {
                      if (value == null || value.trim().length < 10) {
                        return 'Please provide a valid address.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSizes.xl),
                  FilledButton(
                    onPressed: _isSubmitting ? null : _submitRequest,
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                          )
                        : const Text(AppStrings.submitRequestButton),
                  ),
                  const SizedBox(height: AppSizes.lg),
                ],
              ),
            ),
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

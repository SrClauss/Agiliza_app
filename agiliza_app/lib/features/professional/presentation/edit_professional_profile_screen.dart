import 'package:flutter/material.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/widgets/app_back_app_bar.dart';

class EditProfessionalProfileScreen extends StatefulWidget {
  const EditProfessionalProfileScreen({super.key});

  @override
  State<EditProfessionalProfileScreen> createState() => _EditProfessionalProfileScreenState();
}

class _EditProfessionalProfileScreenState extends State<EditProfessionalProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _bioController = TextEditingController();
  final _experienceController = TextEditingController();
  final _hourlyRateController = TextEditingController();
  final _serviceRadiusController = TextEditingController();
  final _addressController = TextEditingController();
  String _selectedCategory = 'Design';

  static const _categories = [
    'Design',
    'Wellness',
    'IT',
    'Home Care',
    'Business',
  ];

  @override
  void dispose() {
    _bioController.dispose();
    _experienceController.dispose();
    _hourlyRateController.dispose();
    _serviceRadiusController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _submitProfile() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Profile changes saved successfully.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppBackAppBar(
        title: Text(AppStrings.editProfileTitle),
      ),
      body: SingleChildScrollView(
        padding: AppSizes.pagePadding,
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                AppStrings.editProfileSubtitle,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: AppSizes.lg),
              TextFormField(
                controller: _bioController,
                maxLines: 5,
                decoration: const InputDecoration(
                  labelText: AppStrings.bioLabel,
                  hintText: 'Describe your expertise, approach, and signature services.',
                  alignLabelWithHint: true,
                ),
                validator: (value) {
                  if (value == null || value.trim().length < 20) {
                    return 'Please enter a more detailed bio.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSizes.md),
              TextFormField(
                controller: _experienceController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: AppStrings.experienceLabel,
                  hintText: 'Years of experience',
                ),
                validator: (value) {
                  final parsed = int.tryParse(value ?? '');
                  if (parsed == null || parsed < 0) {
                    return 'Enter a valid experience value.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSizes.md),
              TextFormField(
                controller: _hourlyRateController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: AppStrings.hourlyRateLabel,
                  hintText: 'e.g. 65',
                  suffixText: AppStrings.hourlyRateSuffix,
                ),
                validator: (value) {
                  final parsed = double.tryParse(value ?? '');
                  if (parsed == null || parsed <= 0) {
                    return 'Enter a valid hourly rate.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSizes.md),
              TextFormField(
                controller: _serviceRadiusController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: AppStrings.serviceRadiusLabel,
                  hintText: 'e.g. 15',
                  suffixText: AppStrings.serviceRadiusSuffix,
                ),
                validator: (value) {
                  final parsed = double.tryParse(value ?? '');
                  if (parsed == null || parsed < 0) {
                    return 'Enter a valid service radius.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSizes.md),
              TextFormField(
                controller: _addressController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: AppStrings.addressLabel,
                  hintText: 'Service address or operating area',
                ),
                validator: (value) {
                  if (value == null || value.trim().length < 10) {
                    return 'Enter a valid address.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSizes.md),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: AppStrings.categoryLabel,
                ),
                items: _categories
                    .map((category) => DropdownMenuItem(
                          value: category,
                          child: Text(category),
                        ))
                    .toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _selectedCategory = value;
                    });
                  }
                },
              ),
              const SizedBox(height: AppSizes.xl),
              FilledButton(
                onPressed: _submitProfile,
                child: const Text(AppStrings.saveProfileButton),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

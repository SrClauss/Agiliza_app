import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/auth_notifier.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/widgets/app_back_app_bar.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  bool _isLoggingOut = false;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      final authService = ref.read(authServiceProvider);
      final profileResult = await authService.getProfile();
      if (profileResult['success'] == true) {
        setState(() {
          _userData = profileResult['user'] as Map<String, dynamic>?;
          _isLoading = false;
        });
        return;
      }

      final userData = await authService.getUserData();
      setState(() {
        _userData = userData;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading profile: $e')),
        );
      }
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() {
        _isLoggingOut = true;
      });

      try {
        final authNotifier = ref.read(authNotifierProvider.notifier);
        final success = await authNotifier.logout();

        if (!mounted) return;

        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Logged out successfully'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 1),
            ),
          );

          // Use a small delay to ensure snackbar is shown
          await Future.delayed(const Duration(milliseconds: 500));

          if (mounted) {
            context.go('/login');
          }
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Logout failed. Please try again.'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: ${e.toString()}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoggingOut = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: const AppBackAppBar(
          title: Text(AppStrings.profileTitle),
        ),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final fullName = _userData?['full_name'] ?? _userData?['name'] ?? 'User';
    final email = _userData?['email'] ?? 'No email';
    final phone = _userData?['phone'] ?? _userData?['phone_number'] ?? 'No phone';
    final userType = _userData?['role'] ?? _userData?['user_type'] ?? 'Client';
    final nameParts = fullName.split(' ');
    final firstName = nameParts.isNotEmpty ? nameParts.first : 'User';

    return Scaffold(
      appBar: const AppBackAppBar(
        title: Text(AppStrings.profileTitle),
        actions: [
          IconButton(
            icon: Icon(Icons.edit),
            onPressed: null,
            tooltip: 'Edit profile',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: AppSizes.pagePadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: AppSizes.sm),
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 48,
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    child: Text(
                      firstName.isNotEmpty
                          ? firstName[0].toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSizes.md),
                  Text(
                    fullName,
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: AppSizes.xs),
                  Text(
                    userType.toString().toUpperCase(),
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSizes.lg),
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppSizes.radius),
              ),
              child: Padding(
                padding: const EdgeInsets.all(AppSizes.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Personal information',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: AppSizes.sm),
                    _InfoRow(label: 'Email', value: email),
                    const Divider(),
                    _InfoRow(label: 'Phone', value: phone),
                    const Divider(),
                    _InfoRow(label: 'Account Type', value: userType),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSizes.lg),
            Text('Account management',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: AppSizes.sm),
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppSizes.radius),
              ),
              child: Column(
                children: [
                  _ProfileMenuTile(
                    icon: Icons.person_outline,
                    title: AppStrings.manageAccountOption,
                    subtitle: 'Update username, password, or profile details',
                    onTap: () {},
                  ),
                  const Divider(height: 1),
                  _ProfileMenuTile(
                    icon: Icons.payment_outlined,
                    title: AppStrings.paymentMethodsOption,
                    subtitle: 'Manage payout and billing settings',
                    onTap: () {},
                  ),
                  const Divider(height: 1),
                  _ProfileMenuTile(
                    icon: Icons.notifications_outlined,
                    title: AppStrings.notificationsOption,
                    subtitle: 'Control alerts and reminders',
                    onTap: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSizes.lg),
            Text('Settings', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: AppSizes.sm),
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppSizes.radius),
              ),
              child: Column(
                children: [
                  _ProfileMenuTile(
                    icon: Icons.language_outlined,
                    title: AppStrings.languageOption,
                    subtitle: 'Change app language',
                    onTap: () {},
                  ),
                  const Divider(height: 1),
                  _ProfileMenuTile(
                    icon: Icons.lock_outline,
                    title: AppStrings.privacyOption,
                    subtitle: 'Update privacy settings',
                    onTap: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSizes.xl),
            FilledButton.icon(
              onPressed: _isLoggingOut ? null : _logout,
              icon: _isLoggingOut
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.logout),
              label: Text(
                _isLoggingOut ? 'Logging out...' : AppStrings.logoutButton,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSizes.sm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(value, style: Theme.of(context).textTheme.bodyLarge),
        ],
      ),
    );
  }
}

class _ProfileMenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ProfileMenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}

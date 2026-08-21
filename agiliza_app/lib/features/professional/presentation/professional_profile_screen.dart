import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/auth_notifier.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/widgets/app_back_app_bar.dart';

class ProfessionalProfileScreen extends ConsumerStatefulWidget {
  const ProfessionalProfileScreen({super.key});

  @override
  ConsumerState<ProfessionalProfileScreen> createState() =>
      _ProfessionalProfileScreenState();
}

class _ProfessionalProfileScreenState
    extends ConsumerState<ProfessionalProfileScreen> {
  Map<String, dynamic>? _userData;

  bool _isLoading = true;
  bool _isLoggingOut = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final authService = ref.read(authServiceProvider);

      final result =await authService.getProfessionalProfile();

      if (result['success'] == true) {
        setState(() {
          _userData =result['data'] as Map<String, dynamic>?;

          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
          ),
        );
      }
    }
  }

  Future<void> _logout() async {
    setState(() {
      _isLoggingOut = true;
    });

    try {
      final notifier =
          ref.read(authNotifierProvider.notifier);

      final success = await notifier.logout();

      if (!mounted) return;

      if (success) {
        context.go('/login');
      }
    } catch (_) {}

    if (mounted) {
      setState(() {
        _isLoggingOut = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading) {
      return Scaffold(
        appBar: const AppBackAppBar(
          title: Text('My Profile'),
        ),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final user =_userData as Map<String, dynamic>?;

    final fullName =user?['user']?['full_name'] ??'Professional';

    final email =user?['user']?['email'] ?? '';

    final phone =user?['user']?['phone'] ?? '';

    final profileImage =user?['user']?['profile_image'];

    final bio =
        _userData?['bio'] ??
            'No bio added yet';

    final address =
        _userData?['address'] ??
            'No address added';

    final experience =
        (_userData?['years_experience'] ?? 0)
            .toString();

    final hourlyRate =
        (_userData?['hourly_rate'] ?? '0')
            .toString();

    final radius =
        (_userData?['service_radius_km'] ?? 0)
            .toString();

    final rating =
        (_userData?['average_rating'] ?? '0')
            .toString();

    final reviews =
        (_userData?['total_reviews'] ?? 0)
            .toString();

    final categories =
        (_userData?['service_categories']
                    as List<dynamic>?)
                ?.map(
                  (e) =>
                      e['name']
                          .toString(),
                )
                .toList() ??
            [];

    final portfolio =
        (_userData?['portfolio']
                    as List<dynamic>?) ??
            [];

    final availability =
        (_userData?['availability']
                    as List<dynamic>?) ??
            [];

    final initials = fullName
            .trim()
            .isNotEmpty
        ? fullName[0]
        : 'P';

    return Scaffold(
      backgroundColor:
          const Color(0xFFF5F7F6),

      appBar: AppBackAppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            onPressed: () {
              context.push('/edit-profile');
            },
            icon: const Icon(
              Icons.edit_rounded,
            ),
          ),
        ],
      ),

      body: SingleChildScrollView(
        padding: AppSizes.pagePadding,
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding:
                  const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius:
                    BorderRadius.circular(
                  28,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black
                        .withOpacity(0.04),
                    blurRadius: 10,
                    offset:
                        const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: theme
                        .colorScheme
                        .primaryContainer,
                    backgroundImage:
                        profileImage != null
                            ? NetworkImage(
                                profileImage,
                              )
                            : null,
                    child: profileImage == null
                        ? Text(
                            initials.toUpperCase(),
                            style:
                                const TextStyle(
                              fontSize: 34,
                              fontWeight:
                                  FontWeight
                                      .bold,
                            ),
                          )
                        : null,
                  ),

                  const SizedBox(height: 16),

                  Text(
                    fullName,
                    textAlign:
                        TextAlign.center,
                    style:
                        const TextStyle(
                      fontSize: 24,
                      fontWeight:
                          FontWeight.w800,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment:
                        WrapAlignment.center,
                    children: categories
                        .map(
                          (category) =>
                              Chip(
                            label: Text(
                              category,
                            ),
                          ),
                        )
                        .toList(),
                  ),

                  const SizedBox(height: 16),

                  Row(
                    mainAxisAlignment:
                        MainAxisAlignment
                            .center,
                    children: [
                      const Icon(
                        Icons.star_rounded,
                        color:
                            Colors.amber,
                        size: 20,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        rating,
                        style:
                            const TextStyle(
                          fontWeight:
                              FontWeight.bold,
                        ),
                      ),
                      Text(
                        ' ($reviews reviews)',
                        style: TextStyle(
                          color: Colors
                              .grey.shade700,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            _SectionCard(
              title:
                  'Professional Information',
              children: [
                _InfoTile(
                  icon:
                      Icons.work_outline,
                  title:
                      'Experience',
                  value:
                      '$experience Years',
                ),
                _InfoTile(
                  icon:
                      Icons.currency_rupee,
                  title:
                      'Hourly Rate',
                  value:
                      '₹$hourlyRate/hr',
                ),
                _InfoTile(
                  icon:
                      Icons.location_on_outlined,
                  title:
                      'Service Radius',
                  value:
                      '$radius KM',
                ),
                _InfoTile(
                  icon:
                      Icons.email_outlined,
                  title: 'Email',
                  value: email,
                ),
                _InfoTile(
                  icon:
                      Icons.phone_outlined,
                  title: 'Phone',
                  value: phone,
                ),
                _InfoTile(
                  icon:
                      Icons.home_outlined,
                  title:
                      'Address',
                  value: address,
                ),
              ],
            ),

            const SizedBox(height: 18),

            _SectionCard(
              title: 'About',
              children: [
                Text(
                  bio,
                  style:
                      theme.textTheme
                          .bodyLarge,
                ),
              ],
            ),

            const SizedBox(height: 18),

            _SectionCard(
              title: 'Portfolio',
              children: [
                if (portfolio.isEmpty)
                  const Text(
                    'No portfolio added yet.',
                  )
                else
                  ...portfolio.map(
                    (item) => Padding(
                      padding:
                          const EdgeInsets.only(
                        bottom: 10,
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons
                                .work_outline,
                            size: 18,
                          ),
                          const SizedBox(
                            width: 10,
                          ),
                          Expanded(
                            child: Text(
                              item['title'] ??
                                  '',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 18),

            _SectionCard(
              title: 'Availability',
              children: [
                if (availability.isEmpty)
                  const Text(
                    'No availability added.',
                  )
                else
                  ...availability.map(
                    (item) => Padding(
                      padding:
                          const EdgeInsets.only(
                        bottom: 10,
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.schedule,
                            size: 18,
                          ),
                          const SizedBox(
                            width: 10,
                          ),
                          Expanded(
                            child: Text(
                              'Day ${item['day_of_week']} • ${item['start_time']} - ${item['end_time']}',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 18),

            _SectionCard(
              title:
                  'Professional Tools',
              children: [
                _MenuTile(
                  icon:
                      Icons.edit_outlined,
                  title:
                      'Edit Profile',
                  onTap: () {
                    context.push(
                      '/edit-profile',
                    );
                  },
                ),
                _MenuTile(
                  icon: Icons
                      .photo_library_outlined,
                  title:
                      'Manage Portfolio',
                  onTap: () {
                    context.push(
                      '/portfolio',
                    );
                  },
                ),
                _MenuTile(
                  icon:
                      Icons.schedule_outlined,
                  title:
                      'Availability',
                  onTap: () {
                    context.push(
                      '/weekly-availability',
                    );
                  },
                ),
              ],
            ),

            const SizedBox(height: 28),

            SizedBox(
              width: double.infinity,
              child:
                  FilledButton.icon(
                style:
                    FilledButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(
                    vertical: 16,
                  ),
                ),
                onPressed:
                    _isLoggingOut
                        ? null
                        : _logout,
                icon:
                    _isLoggingOut
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child:
                                CircularProgressIndicator(
                              strokeWidth: 2,
                              color:
                                  Colors.white,
                            ),
                          )
                        : const Icon(
                            Icons
                                .logout_rounded,
                          ),
                label: Text(
                  _isLoggingOut
                      ? 'Logging out...'
                      : 'Logout',
                ),
              ),
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}

class _SectionCard
    extends StatelessWidget {
  final String title;

  final List<Widget> children;

  const _SectionCard({
    required this.title,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding:
          const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius:
            BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight:
                  FontWeight.w700,
            ),
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }
}

class _InfoTile
    extends StatelessWidget {
  final IconData icon;

  final String title;

  final String value;

  const _InfoTile({
    required this.icon,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
          const EdgeInsets.only(
        bottom: 16,
      ),
      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 20,
            color: Theme.of(context)
                .colorScheme
                .primary,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontWeight:
                    FontWeight.w600,
              ),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign:
                  TextAlign.end,
              style: TextStyle(
                color:
                    Colors.grey.shade700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuTile
    extends StatelessWidget {
  final IconData icon;

  final String title;

  final VoidCallback onTap;

  const _MenuTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding:
          EdgeInsets.zero,
      leading: Icon(icon),
      title: Text(title),
      trailing: const Icon(
        Icons.chevron_right,
      ),
      onTap: onTap,
    );
  }
}
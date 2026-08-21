import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_sizes.dart';
import '../../professional/data/providers.dart';

class ProfessionalDashboardScreen extends ConsumerWidget {
  const ProfessionalDashboardScreen({
    super.key,
  });

  @override
  Widget build(
    BuildContext context,
    WidgetRef ref,
  ) {
    final dashboard = ref.watch(
      professionalDashboardProvider,
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F6),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        title: const Text(
          'Dashboard',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 24,
          ),
        ),
      ),
      body: dashboard.when(
        data: (data) {
          final appointments = data.upcomingAppointments;
          final reviews = data.recentReviews;

          return SingleChildScrollView(
            padding: AppSizes.pagePadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Header(data: data),

                const SizedBox(height: 26),

                _StatsSection(data: data),

                const SizedBox(height: 30),

                const Text('Upcoming', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),

                const SizedBox(height: 12),

                if (appointments.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 6))]),
                    child: const Text('No upcoming appointments.', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                  )
                else
                  ...appointments.map((appointment) => _AppointmentCard(appointment: appointment)),

                const SizedBox(height: 30),

                const Text('Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),

                const SizedBox(height: 12),

                LayoutBuilder(builder: (context, constraints) {
                  final halfWidth = constraints.maxWidth / 2;
                  final childAspect = halfWidth / 80;
                  return GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 14,
                    mainAxisSpacing: 14,
                    childAspectRatio: childAspect,
                    children: [
                      _QuickActionCard(
                        label: 'Availability',
                        icon: Icons.schedule_rounded,
                        onTap: () => context.push('/weekly-availability'),
                      ),
                      _QuickActionCard(
                        label: 'Portfolio',
                        icon: Icons.photo_library_rounded,
                        onTap: () => context.push('/portfolio'),
                      ),
                      _QuickActionCard(
                        label: 'Requests',
                        icon: Icons.list_alt_rounded,
                        onTap: () => context.push('/professional-root'),
                      ),
                      _QuickActionCard(
                        label: 'Profile',
                        icon: Icons.person_rounded,
                        onTap: () => context.push('/edit-profile'),
                      ),
                    ],
                  );
                }),

                const SizedBox(height: 30),

                const Text('Reviews', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),

                const SizedBox(height: 12),

                if (reviews.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 6))]),
                    child: const Text('No reviews yet.', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                  )
                else
                  ...reviews.map((review) => _ReviewCard(review: review)),

                const SizedBox(height: 24),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Failed to load dashboard')),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final ProfessionalDashboard data;

  const _Header({
    required this.data,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primary.withOpacity(0.82),
          ],
        ),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 36,
            backgroundColor: Colors.white,
            child: Text(
              data.fullName.isNotEmpty ? data.fullName[0] : 'P',
              style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
            ),
          ),

          const SizedBox(width: 18),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome back 👋',
                  style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14),
                ),

                const SizedBox(height: 6),

                Text(
                  data.fullName,
                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: 12),

                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(30)),
                      child: Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(color: Colors.greenAccent, shape: BoxShape.circle),
                          ),

                          const SizedBox(width: 6),

                          Text(data.online ? 'Online' : 'Offline', style: const TextStyle(color: Colors.white)),
                        ],
                      ),
                    ),

                    const SizedBox(width: 12),

                    const Icon(Icons.star_rounded, color: Colors.amber, size: 18),

                    const SizedBox(width: 4),

                    Text(data.averageRating.toString(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsSection extends StatelessWidget {
  final ProfessionalDashboard data;

  const _StatsSection({
    required this.data,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 14,
      runSpacing: 14,
      children: [
        _StatCard(label: 'Pending', value: data.pendingRequests.toString(), icon: Icons.pending_actions_rounded),
        _StatCard(label: 'Active Jobs', value: data.activeJobs.toString(), icon: Icons.work_rounded),
        _StatCard(label: 'Completed', value: data.completedJobs.toString(), icon: Icons.task_alt_rounded),
        _StatCard(label: 'Earnings', value: '₹${data.monthlyEarnings}', icon: Icons.currency_rupee_rounded),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final width = (MediaQuery.of(context).size.width - 54) / 2;

    return Container(
      width: width,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 6)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Theme.of(context).colorScheme.primaryContainer, borderRadius: BorderRadius.circular(16)),
            child: Icon(icon, color: Theme.of(context).colorScheme.primary),
          ),

          const SizedBox(height: 18),

          Text(value, style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w800)),

          const SizedBox(height: 6),

          Text(label, style: TextStyle(color: Colors.grey.shade700, fontSize: 15, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  final ProfessionalAppointment appointment;

  const _AppointmentCard({
    required this.appointment,
  });

  String _formattedDate(String value) {
    if (value.isEmpty) return 'No date';
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    return '${parsed.day}/${parsed.month}/${parsed.year}';
  }

  @override
  Widget build(BuildContext context) {
    final dateText = _formattedDate(appointment.date);

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => context.push('/professional-root'),
        child: Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 6))],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: Theme.of(context).colorScheme.primaryContainer, borderRadius: BorderRadius.circular(14)),
                child: Center(
                  child: Text(
                    dateText,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),

              const SizedBox(width: 14),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(appointment.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Text(dateText, style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
                  ],
                ),
              ),

              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: appointment.status.toLowerCase() == 'confirmed' ? Colors.green.withOpacity(0.12) : Colors.orange.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  appointment.status,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                    color: appointment.status.toLowerCase() == 'confirmed' ? Colors.green : Colors.orange,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onTap;

  const _QuickActionCard({
    required this.label,
    required this.icon,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: Theme.of(context).colorScheme.primaryContainer, borderRadius: BorderRadius.circular(14)),
                child: Icon(icon, color: Theme.of(context).colorScheme.primary, size: 20),
              ),

              const SizedBox(width: 12),

              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final ProfessionalReview review;

  const _ReviewCard({
    required this.review,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 5))]),
      child: Row(
        children: [
          CircleAvatar(radius: 28, backgroundColor: Theme.of(context).colorScheme.primaryContainer, child: const Icon(Icons.person, color: Colors.white)),

          const SizedBox(width: 14),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Client review', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),

                const SizedBox(height: 4),

                Text(review.comment, style: TextStyle(color: Colors.grey.shade700)),
              ],
            ),
          ),

          Column(
            children: [
              Text(review.rating.toString(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),

              const SizedBox(height: 4),

              const Icon(Icons.star_rounded, color: Colors.amber),
            ],
          ),
        ],
      ),
    );
  }
}

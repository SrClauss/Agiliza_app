import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'professional_dashboard_screen.dart';
import 'professional_requests_screen.dart';
import 'weekly_availability_screen.dart';
import 'portfolio_management_screen.dart';
import 'professional_profile_screen.dart';

class ProfessionalRootScreen extends ConsumerStatefulWidget {
  const ProfessionalRootScreen({
    super.key,
  });

  @override
  ConsumerState<ProfessionalRootScreen> createState() =>
      _ProfessionalRootScreenState();
}

class _ProfessionalRootScreenState
    extends ConsumerState<ProfessionalRootScreen> {
  int _selectedIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();

    _screens = [
      ProfessionalDashboardScreen(),
      ProfessionalRequestsScreen(),
      WeeklyAvailabilityScreen(),
      PortfolioManagementScreen(),
      ProfessionalProfileScreen(),
    ];
  }

  void _onTabChanged(int index) {
    if (_selectedIndex == index) return;

    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme =
        Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor:
          const Color(0xFFF5F7F6),

      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),

      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black
                  .withOpacity(0.06),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: BottomNavigationBar(
            currentIndex: _selectedIndex,
            onTap: _onTabChanged,
            type:
                BottomNavigationBarType.fixed,
            elevation: 0,
            backgroundColor: Colors.white,
            selectedItemColor:
                colorScheme.primary,
            unselectedItemColor:
                Colors.grey.shade500,
            selectedFontSize: 12,
            unselectedFontSize: 11,
            selectedLabelStyle:
                const TextStyle(
              fontWeight:
                  FontWeight.w700,
            ),
            items: const [
              BottomNavigationBarItem(
                icon: Icon(
                  Icons.dashboard_rounded,
                ),
                activeIcon: Icon(
                  Icons.dashboard_rounded,
                ),
                label: 'Dashboard',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  Icons.list_alt_rounded,
                ),
                activeIcon: Icon(
                  Icons.list_alt_rounded,
                ),
                label: 'Requests',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  Icons.calendar_month_rounded,
                ),
                activeIcon: Icon(
                  Icons.calendar_month_rounded,
                ),
                label: 'Schedule',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  Icons.photo_library_rounded,
                ),
                activeIcon: Icon(
                  Icons.photo_library_rounded,
                ),
                label: 'Portfolio',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  Icons.person_rounded,
                ),
                activeIcon: Icon(
                  Icons.person_rounded,
                ),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
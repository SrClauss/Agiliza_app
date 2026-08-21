import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/auth_notifier.dart';
import '../../../core/auth/auth_role.dart';
import '../../../core/auth/auth_state.dart';
import '../../../core/constants/app_strings.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() =>
      _SplashScreenState();
}

class _SplashScreenState
    extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _fadeController;

  late final Animation<double> _fadeAnimation;

  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(
        milliseconds: 1400,
      ),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    );

    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  void _navigate(AuthState authState) {
    if (_hasNavigated || !mounted) return;

    _hasNavigated = true;

    final targetRoute =
        authState.isAuthenticated
            ? authState.role ==
                    UserRole.professional
                ? '/dashboard'
                : '/home'
            : '/login';

    context.go(targetRoute);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(
      authNotifierProvider,
    );

    if (!authState.isLoading &&
        !_hasNavigated) {
      WidgetsBinding.instance
          .addPostFrameCallback((_) {
        _navigate(authState);
      });
    }

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF006856),
              Color(0xFF79C8A2),
            ],
          ),
        ),
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Column(
              mainAxisSize:
                  MainAxisSize.min,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: Colors.white
                        .withOpacity(0.2),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black
                            .withOpacity(
                          0.12,
                        ),
                        blurRadius: 24,
                        offset:
                            const Offset(
                          0,
                          10,
                        ),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(
                      Icons
                          .flight_takeoff_rounded,
                      color: Colors.white,
                      size: 48,
                    ),
                  ),
                ),

                const SizedBox(
                  height: 24,
                ),

                Text(
                  AppStrings.appTitle,
                  style: Theme.of(
                    context,
                  )
                      .textTheme
                      .headlineSmall
                      ?.copyWith(
                        color: Colors.white,
                        fontWeight:
                            FontWeight.bold,
                        letterSpacing:
                            0.7,
                      ),
                ),

                const SizedBox(
                  height: 8,
                ),

                Text(
                  AppStrings
                      .splashSubtitle,
                  textAlign:
                      TextAlign.center,
                  style: Theme.of(
                    context,
                  )
                      .textTheme
                      .bodyMedium
                      ?.copyWith(
                        color:
                            Colors.white70,
                      ),
                ),

                const SizedBox(
                  height: 40,
                ),

                const SizedBox(
                  width: 28,
                  height: 28,
                  child:
                      CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
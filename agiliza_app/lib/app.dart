import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/auth/auth_notifier.dart';
import 'core/auth/auth_role.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/presentation/sign_up_screen.dart';
import 'features/home/domain/entities/listing.dart';
import 'features/home/presentation/categories_screen.dart';
import 'features/home/presentation/home_screen.dart';
import 'features/home/presentation/listing_detail_screen.dart';
import 'features/home/presentation/professional_listing_screen.dart';
import 'features/home/presentation/professional_profile_screen.dart';
import 'features/home/presentation/quote_response_screen.dart';
import 'features/home/presentation/request_history_screen.dart';
import 'features/home/presentation/service_request_form_screen.dart';
import 'features/home/presentation/favorites_screen.dart';
import 'features/home/presentation/review_submission_screen.dart';
import 'features/professional/presentation/professional_dashboard_screen.dart';
import 'features/professional/presentation/professional_root_screen.dart';
import 'features/professional/presentation/edit_professional_profile_screen.dart';
import 'features/professional/presentation/portfolio_management_screen.dart';
import 'features/home/presentation/profile_screen.dart';
import 'features/professional/presentation/weekly_availability_screen.dart';
import 'features/splash/presentation/splash_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authNotifierProvider);

  final professionalOnlyPaths = <String>{
    '/professional-root',
    '/dashboard',
    '/edit-profile',
    '/portfolio',
    '/weekly-availability',
  };

  final clientOnlyPaths = <String>{
    '/home',
    '/professionals',
    '/service-request',
    '/quote-response',
    '/request-history',
    '/favorites',
  };

  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignUpScreen(),
      ),
      GoRoute(
        path: '/categories',
        builder: (context, state) => const CategoriesScreen(),
      ),
      GoRoute(
        path: '/professionals',
        builder: (context, state) => ProfessionalListingScreen(
          categorySlug: state.queryParameters['category'],
        ),
      ),
      GoRoute(
        path: '/professional-profile/:id',
        builder: (context, state) {
          final professionalId = state.pathParameters['id'];
          return ProfessionalProfileScreen(
            professionalId: professionalId ?? '',
          );
        },
      ),
      GoRoute(
        path: '/service-request',
        builder: (context, state) => const ServiceRequestFormScreen(),
      ),
      GoRoute(
        path: '/quote-response',
        builder: (context, state) => QuoteResponseScreen(
          quote: state.extra as QuoteResponse?,
        ),
      ),
      GoRoute(
        path: '/request-history',
        builder: (context, state) => const RequestHistoryScreen(),
      ),
      GoRoute(
        path: '/favorites',
        builder: (context, state) => const FavoritesScreen(),
      ),
      GoRoute(
        path: '/review-submission',
        builder: (context, state) => const ReviewSubmissionScreen(),
      ),
      GoRoute(
        path: '/professional-root',
        builder: (context, state) => const ProfessionalRootScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const ProfessionalDashboardScreen(),
      ),
      GoRoute(
        path: '/edit-profile',
        builder: (context, state) => const EditProfessionalProfileScreen(),
      ),
      GoRoute(
        path: '/portfolio',
        builder: (context, state) => const PortfolioManagementScreen(),
      ),
      GoRoute(
        path: '/weekly-availability',
        builder: (context, state) => const WeeklyAvailabilityScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/listing',
        builder: (context, state) {
          final listing = state.extra as Listing?;
          return ListingDetailScreen(
            listing: listing ??
                Listing(
                  id: '0',
                  title: 'Stay details unavailable',
                  location: '',
                  category: '',
                  price: '',
                  duration: '',
                  rating: 0.0,
                  imageUrl: '',
                  description: 'No listing was provided for this screen.',
                ),
          );
        },
      ),
    ],
    redirect: (context, state) {
      if (authState.isLoading) {
        return null;
      }

      final isAuthenticated = authState.isAuthenticated;
      final isProfessional = authState.role == UserRole.professional;
      final isGoingToLogin = state.location == '/login' || state.location == '/signup' || state.location == '/';
      final path = state.location.split('?').first;
      final isClientOnly = clientOnlyPaths.contains(path) || path.startsWith('/professional-profile');
      final isProfessionalOnly = professionalOnlyPaths.contains(path);

      if (!isAuthenticated && !isGoingToLogin) {
        return '/login';
      }

      if (isAuthenticated) {
        final desiredHome = isProfessional ? '/professional-root' : '/home';

        if (isGoingToLogin) {
          return desiredHome;
        }

        if (isProfessional && isClientOnly) {
          return '/professional-root';
        }

        if (!isProfessional && isProfessionalOnly) {
          return '/home';
        }
      }

      return null;
    },
  );
});

class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'AgilizaPro',
      theme: AppTheme.lightTheme,
      routerConfig: router,
      builder: (context, child) {
        return child ?? const SizedBox.shrink();
      },
    );
  }
}

# Agiliza Flutter App - Production-Ready Architecture

## Overview
A modern, production-ready Flutter mobile app UI built with clean architecture principles, feature-based folder structure, and contemporary design patterns (Airbnb/Uber-inspired).

## Architecture & Structure

### Core Layers
- **Core**: Shared utilities, theme, networking, widgets, and constants
  - `theme/`: Material 3 design system with color scheme
  - `network/`: Dio-based API client with Riverpod provider
  - `constants/`: App strings, sizes, and configuration
  - `widgets/`: Reusable state management widgets (Loading, Error, Empty views)

### Feature-Based Structure
- **Features**: Domain-driven design per feature
  - `features/home/`
    - `domain/entities/`: Business models (Listing with Freezed + JSON serialization)
    - `data/`: Repository pattern for data access
    - `presentation/`: UI layer with Riverpod state management
      - `widgets/`: Reusable feature components (ListingTile)
      - `home_screen.dart`: List view with adaptive grid layout
      - `listing_detail_screen.dart`: Detail view with expandable content
      - `home_viewmodel.dart`: Riverpod AsyncNotifier for state

## Key Technologies

### State Management
- **Riverpod**: Modern, compile-safe reactive programming
- `AsyncNotifierProvider` for async data loading with built-in loading/error/data states
- `Provider` for dependency injection (ApiClient)

### Navigation
- **GoRouter**: Type-safe, nested routing with extra data passing
- Declarative routes in `lib/app.dart`

### Networking
- **Dio**: HTTP client with timeout configuration
- MockAPI integration (JSONPlaceholder) for demo data

### Models & Serialization
- **Freezed**: Immutable data classes with copyWith and equality
- **json_serializable**: Automatic JSON <-> Dart serialization
- Build runner auto-generation via `pub run build_runner build`

### Design System
- **Material 3**: Seed-based color scheme (teal primary)
- Responsive layouts with adaptive grid (single column < 760px, dual column >= 760px)
- Consistent spacing (AppSizes: xs=6, sm=12, md=16, lg=24, xl=32)
- Rounded corners (20-28px) for modern appearance

## UI/UX Features

### Responsive Design
- Single-column layout on phones
- Dual-column grid on tablets
- Adaptive AppBar and spacing based on screen size
- Material 3 ColorScheme for theming

### State Management & Loading
- **Loading State**: Centered spinner with message
- **Error State**: Icon + title + description + retry button
- **Empty State**: Icon + title + subtitle when no data
- **Success State**: RefreshIndicator-enabled list with pull-to-refresh

### Modern UI Patterns
- Search bar with prefilled search hint
- Horizontal category chips (Getaway, City, Luxury, Business)
- Featured stays grid with image cards
- Card-based layout with shadows and rounded corners
- Star ratings and price displays
- Location icons and metadata

### Detail View
- Large product image with error fallback
- Rating badge
- Feature chips (flexible check-in, wifi, duration, guest count)
- Description section
- Call-to-action button ("Book a stay")

## File Structure

```
lib/
├── main.dart                          # Entry point with ProviderScope
├── app.dart                           # App shell with GoRouter
├── core/
│   ├── theme/
│   │   └── app_theme.dart             # Material 3 theme definition
│   ├── network/
│   │   └── api_client.dart            # Dio client + Riverpod provider
│   ├── constants/
│   │   ├── app_strings.dart           # UI text constants
│   │   └── app_sizes.dart             # Spacing & dimensions
│   └── widgets/
│       ├── loading_view.dart          # Centered spinner + message
│       ├── error_view.dart            # Error with retry button
│       ├── empty_view.dart            # Empty state placeholder
│       └── primary_card.dart          # Reusable card wrapper
├── features/
│   └── home/
│       ├── domain/
│       │   └── entities/
│       │       └── listing.dart        # Freezed model with JSON serialization
│       ├── data/
│       │   └── listing_repository.dart # Repository + implementation
│       └── presentation/
│           ├── home_screen.dart       # List view with search & categories
│           ├── listing_detail_screen.dart # Detail view
│           ├── home_viewmodel.dart    # Riverpod AsyncNotifier
│           └── widgets/
│               └── listing_tile.dart  # Reusable card component
test/
└── widget_test.dart                   # App integration test
```

## Dependencies

### Runtime
- `flutter_riverpod: ^2.4.0` — State management
- `go_router: ^7.0.0` — Navigation
- `dio: ^5.3.1` — HTTP client
- `freezed_annotation: ^2.4.0` — Immutable models
- `json_annotation: ^4.9.0` — JSON serialization annotations

### Dev & Build
- `build_runner: ^2.4.0` — Code generation
- `freezed: ^2.4.0` — Freezed code generator
- `json_serializable: ^6.8.0` — JSON serializer generator

## How to Use

### Install Dependencies
```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Run the App
```bash
flutter run
```

### Generate Code After Model Changes
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### Run Tests
```bash
flutter test
```

### Static Analysis
```bash
flutter analyze
```

## Extensibility

### Adding a New Feature
1. Create `features/[feature]/` with `domain/`, `data/`, `presentation/` folders
2. Define domain entities in `domain/entities/`
3. Implement repository in `data/`
4. Create Riverpod provider in `presentation/viewmodel.dart`
5. Build UI in `presentation/screens/` and `presentation/widgets/`

### Customizing Theme
Edit `lib/core/theme/app_theme.dart` to change:
- Primary color (seed)
- Text styles and typography
- Component shapes and elevations
- Color scheme brightness

### Adding API Endpoints
Update `lib/core/constants/app_strings.dart` for API URLs, then create repository methods in feature data layer.

## Best Practices Applied

✅ **Clean Architecture**: Separation of concerns with domain, data, presentation
✅ **Responsive UI**: Adaptive layouts for all screen sizes
✅ **State Management**: Type-safe Riverpod with async handling
✅ **Error Handling**: Comprehensive loading/error/empty states
✅ **Code Generation**: Freezed + json_serializable for robust models
✅ **Reusable Components**: Shared widgets and consistent spacing
✅ **Modern Design**: Material 3 with seed-based colors
✅ **Navigation**: GoRouter for type-safe routing with data passing
✅ **Testing Ready**: Widget test template included

## Future Enhancements

- Add authentication feature (OAuth, JWT)
- Implement local caching (Hive/Drift)
- Add favorites/bookmarks feature
- Implement search and filtering
- Add booking confirmation flow
- Integrate push notifications
- Add user profile management
- Implement payment processing

---

**Project**: Agiliza Stays  
**Version**: 1.0.0  
**Dart SDK**: ^3.11.4  
**Flutter**: Latest stable

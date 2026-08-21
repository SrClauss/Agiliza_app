import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF006856),
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: colorScheme.background,
      shadowColor: colorScheme.shadow.withOpacity(0.25),
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.background,
        foregroundColor: colorScheme.onBackground,
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: colorScheme.background,
      ),
      cardTheme: CardThemeData(
        color: colorScheme.surfaceVariant,
        elevation: 3,
        shadowColor: colorScheme.shadow.withOpacity(0.15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        margin: EdgeInsets.zero,
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 72,
        backgroundColor: colorScheme.surface,
        indicatorColor: colorScheme.primaryContainer,
        labelTextStyle: MaterialStateProperty.all(
          const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: colorScheme.surface,
        elevation: 10,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          minimumSize: const Size.fromHeight(54),
          elevation: 3,
          shadowColor: colorScheme.shadow.withOpacity(0.2),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          minimumSize: const Size.fromHeight(54),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colorScheme.primary,
          side: BorderSide(color: colorScheme.outline, width: 1.2),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          minimumSize: const Size.fromHeight(52),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surfaceVariant,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: colorScheme.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: colorScheme.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: colorScheme.primary, width: 2),
        ),
        hintStyle: TextStyle(color: colorScheme.onSurfaceVariant),
      ),
      listTileTheme: ListTileThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        tileColor: colorScheme.surfaceVariant,
        iconColor: colorScheme.primary,
        textColor: colorScheme.onSurface,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: colorScheme.surfaceVariant,
        contentTextStyle: TextStyle(color: colorScheme.onSurface),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      dividerTheme: DividerThemeData(color: colorScheme.outlineVariant, thickness: 1, space: 16),
      textTheme: Typography.material2021().black.copyWith(
            displayLarge: const TextStyle(fontSize: 36, fontWeight: FontWeight.w700, height: 1.1),
            displayMedium: const TextStyle(fontSize: 32, fontWeight: FontWeight.w700, height: 1.1),
            displaySmall: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, height: 1.1),
            titleLarge: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, height: 1.2),
            titleMedium: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, height: 1.3),
            titleSmall: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, height: 1.4),
            bodyLarge: const TextStyle(fontSize: 16, height: 1.6),
            bodyMedium: const TextStyle(fontSize: 14, height: 1.6),
            bodySmall: const TextStyle(fontSize: 13, height: 1.5),
          ),
      visualDensity: VisualDensity.adaptivePlatformDensity,
      pageTransitionsTheme: const PageTransitionsTheme(builders: {
        TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      }),
    );
  }
}

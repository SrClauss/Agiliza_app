import 'package:flutter/widgets.dart';

class AppSizes {
  AppSizes._();

  static const double xs = 6;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double radius = 20;

  static EdgeInsets get pagePadding => const EdgeInsets.symmetric(horizontal: md, vertical: lg);
  static EdgeInsets get sectionPadding => const EdgeInsets.symmetric(vertical: md);
}

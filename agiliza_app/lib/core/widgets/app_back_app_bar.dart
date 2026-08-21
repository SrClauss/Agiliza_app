import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppBackAppBar extends StatelessWidget implements PreferredSizeWidget {
  const AppBackAppBar({
    super.key,
    this.title,
    this.centerTitle,
    this.actions,
    this.backgroundColor,
    this.elevation,
    this.bottom,
  });

  final Widget? title;
  final bool? centerTitle;
  final List<Widget>? actions;
  final Color? backgroundColor;
  final double? elevation;
  final PreferredSizeWidget? bottom;

  @override
  Widget build(BuildContext context) {
    final hasBack = context.canPop();
    return AppBar(
      title: title,
      centerTitle: centerTitle,
      actions: actions,
      backgroundColor: backgroundColor,
      elevation: elevation,
      bottom: bottom,
      automaticallyImplyLeading: false,
      leading: hasBack
          ? IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => context.pop(),
              tooltip: MaterialLocalizations.of(context).backButtonTooltip,
            )
          : null,
    );
  }

  @override
  Size get preferredSize {
    final height = kToolbarHeight + (bottom?.preferredSize.height ?? 0.0);
    return Size.fromHeight(height);
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppBackAppBar extends StatelessWidget
    implements PreferredSizeWidget {

  final String title;
  final List<Widget>? actions;

  const AppBackAppBar({
    super.key,
    required this.title,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      automaticallyImplyLeading: true,
      leading: context.canPop()
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new),
              onPressed: () {
                context.pop();
              },
            )
          : null,
      title: Text(title),
      centerTitle: true,
      elevation: 0,
      actions: actions,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
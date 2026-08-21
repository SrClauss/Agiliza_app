import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/network/api_client.dart';
import '../../../core/widgets/app_back_app_bar.dart';

class PortfolioManagementScreen
    extends ConsumerStatefulWidget {
  const PortfolioManagementScreen({
    super.key,
  });

  @override
  ConsumerState<PortfolioManagementScreen>
      createState() =>
          _PortfolioManagementScreenState();
}

class _PortfolioManagementScreenState
    extends ConsumerState<PortfolioManagementScreen> {
  bool _isLoading = true;

  List<dynamic> _portfolio = [];

  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPortfolio();
  }

  Future<void> _loadPortfolio() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final apiClient =
          ref.read(apiClientProvider);

      final response =
          await apiClient.get(
        '/auth/portfolio/',
      );

      final data =
          response.data
              as Map<String, dynamic>;

      setState(() {
        _portfolio =
            data['results']
                as List<dynamic>;

        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _deletePortfolio(
    int index,
  ) {
    ScaffoldMessenger.of(context)
        .showSnackBar(
      const SnackBar(
        content: Text(
          'Delete API integration remaining',
        ),
      ),
    );
  }

  void _editPortfolio(
    Map<String, dynamic> item,
  ) {
    ScaffoldMessenger.of(context)
        .showSnackBar(
      SnackBar(
        content: Text(
          'Edit "${item['title']}"',
        ),
      ),
    );
  }

  void _addPortfolio() {
    ScaffoldMessenger.of(context)
        .showSnackBar(
      const SnackBar(
        content: Text(
          'Add portfolio feature remaining',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor:
          const Color(0xFFF5F7F6),

      appBar: const AppBackAppBar(
        title: Text(
          'Portfolio Management',
        ),
      ),

      floatingActionButton:
          FloatingActionButton.extended(
        onPressed: _addPortfolio,
        icon: const Icon(
          Icons.add_rounded,
        ),
        label: const Text(
          'Add Portfolio',
        ),
      ),

      body: _isLoading
          ? const Center(
              child:
                  CircularProgressIndicator(),
            )
          : _error != null
              ? Center(
                  child: Padding(
                    padding:
                        AppSizes
                            .pagePadding,
                    child: Text(
                      _error!,
                      textAlign:
                          TextAlign.center,
                    ),
                  ),
                )
              : _portfolio.isEmpty
                  ? Center(
                      child: Padding(
                        padding:
                            AppSizes
                                .pagePadding,
                        child: Column(
                          mainAxisAlignment:
                              MainAxisAlignment
                                  .center,
                          children: [
                            Icon(
                              Icons
                                  .photo_library_outlined,
                              size: 70,
                              color: Colors
                                  .grey
                                  .shade400,
                            ),

                            const SizedBox(
                              height: 20,
                            ),

                            const Text(
                              'No portfolio added yet',
                              style:
                                  TextStyle(
                                fontSize:
                                    18,
                                fontWeight:
                                    FontWeight
                                        .bold,
                              ),
                            ),

                            const SizedBox(
                              height: 10,
                            ),

                            Text(
                              'Show your previous work to attract more clients.',
                              textAlign:
                                  TextAlign
                                      .center,
                              style:
                                  TextStyle(
                                color: Colors
                                    .grey
                                    .shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh:
                          _loadPortfolio,
                      child:
                          GridView.builder(
                        padding:
                            AppSizes
                                .pagePadding,
                        itemCount:
                            _portfolio.length,
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount:
                              2,
                          crossAxisSpacing:
                              14,
                          mainAxisSpacing:
                              14,
                          childAspectRatio:
                              0.78,
                        ),
                        itemBuilder:
                            (
                              context,
                              index,
                            ) {
                          final item =
                              _portfolio[index];

                          final title =
                              item['title'] ??
                                  '';

                          final description =
                              item['description'] ??
                                  '';

                          final image =
                              item['image'];

                          return Container(
                            decoration:
                                BoxDecoration(
                              color:
                                  Colors
                                      .white,
                              borderRadius:
                                  BorderRadius.circular(
                                24,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors
                                      .black
                                      .withOpacity(
                                    0.04,
                                  ),
                                  blurRadius:
                                      10,
                                  offset:
                                      const Offset(
                                    0,
                                    4,
                                  ),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment
                                      .start,
                              children: [
                                Expanded(
                                  child:
                                      Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius:
                                            const BorderRadius.vertical(
                                          top:
                                              Radius.circular(
                                            24,
                                          ),
                                        ),
                                        child:
                                            image !=
                                                    null
                                                ? Image.network(
                                                    image,
                                                    width:
                                                        double.infinity,
                                                    fit:
                                                        BoxFit.cover,
                                                    errorBuilder:
                                                        (
                                                          context,
                                                          error,
                                                          stackTrace,
                                                        ) {
                                                      return _PortfolioPlaceholder(
                                                        title:
                                                            title,
                                                      );
                                                    },
                                                  )
                                                : _PortfolioPlaceholder(
                                                    title:
                                                        title,
                                                  ),
                                      ),

                                      Positioned(
                                        top:
                                            10,
                                        right:
                                            10,
                                        child:
                                            Row(
                                          children: [
                                            _ActionButton(
                                              icon:
                                                  Icons.edit_rounded,
                                              onTap:
                                                  () =>
                                                      _editPortfolio(
                                                item,
                                              ),
                                            ),

                                            const SizedBox(
                                              width:
                                                  8,
                                            ),

                                            _ActionButton(
                                              icon:
                                                  Icons.delete_outline_rounded,
                                              onTap:
                                                  () =>
                                                      _deletePortfolio(
                                                index,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                Padding(
                                  padding:
                                      const EdgeInsets.all(
                                    14,
                                  ),
                                  child:
                                      Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        title,
                                        maxLines:
                                            1,
                                        overflow:
                                            TextOverflow.ellipsis,
                                        style:
                                            const TextStyle(
                                          fontWeight:
                                              FontWeight.w700,
                                          fontSize:
                                              15,
                                        ),
                                      ),

                                      const SizedBox(
                                        height:
                                            6,
                                      ),

                                      Text(
                                        description,
                                        maxLines:
                                            2,
                                        overflow:
                                            TextOverflow.ellipsis,
                                        style:
                                            theme.textTheme.bodySmall,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}

class _PortfolioPlaceholder
    extends StatelessWidget {
  final String title;

  const _PortfolioPlaceholder({
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(
        0xFFE8F5F1,
      ),
      child: Center(
        child: Padding(
          padding:
              const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment:
                MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.work_outline_rounded,
                size: 44,
                color: Color(
                  0xFF006856,
                ),
              ),

              const SizedBox(
                height: 12,
              ),

              Text(
                title,
                textAlign:
                    TextAlign.center,
                maxLines: 2,
                overflow:
                    TextOverflow.ellipsis,
                style:
                    const TextStyle(
                  fontWeight:
                      FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionButton
    extends StatelessWidget {
  final IconData icon;

  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius:
          BorderRadius.circular(
        30,
      ),
      child: Container(
        padding:
            const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color:
              Colors.black.withOpacity(
            0.5,
          ),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          size: 18,
          color: Colors.white,
        ),
      ),
    );
  }
}
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/network/api_client.dart';
import '../../../core/constants/app_strings.dart';
import '../../home/presentation/quote_response_screen.dart';
import 'create_quote_screen.dart';

class ProfessionalRequestsScreen
    extends ConsumerStatefulWidget {
  const ProfessionalRequestsScreen({
    super.key,
  });

  @override
  ConsumerState<ProfessionalRequestsScreen>
      createState() =>
          _ProfessionalRequestsScreenState();
}

class _ProfessionalRequestsScreenState
    extends ConsumerState<ProfessionalRequestsScreen> {
  int _selectedTab = 0;

  bool _isLoading = true;

  String? _error;

  List<dynamic> _requests = [];

  final Map<Object, bool> _actionLoading = {};
  final tabs = const [
    'Pending',
    'Quoted',
    'Accepted',
    'Completed',
    'Cancelled',
  ];
  static const statusValues = [
    'PENDING',
    'QUOTED',
    'ACCEPTED',
    'COMPLETED',
    'CANCELLED',
  ];

  @override
  void initState() {
    super.initState();
    _loadRequests(status: statusValues[_selectedTab]);
  }

  Future<void> _loadRequests({String? status}) async {
    try {
      setState(() {
        _isLoading = true;
      });

      final apiClient = ref.read(apiClientProvider);

      final response = await apiClient.get(
        '/services/requests/',
        queryParameters: status != null ? {'status': status} : null,
      );

      final data = response.data as Map<String, dynamic>;

      setState(() {
        _requests = data['results'] as List<dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _updateRequestStatus(Object requestId, String status) async {
    setState(() {
      _actionLoading[requestId] = true;
    });

    try {
      final apiClient = ref.read(apiClientProvider);

      // Backend exposes a status transition action at POST /services/requests/{id}/status/
      final endpoint = '${AppStrings.serviceRequestsEndpoint}$requestId/status/';

      final response = await apiClient.post(
        endpoint,
        data: {'status': status},
      );

      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300) {
        // Update local list if possible
        final idx = _requests.indexWhere((e) => e['id'] == requestId);
        if (idx != -1) {
          final updated = Map<String, dynamic>.from(_requests[idx] as Map<String, dynamic>);
          updated['status'] = status;
          _requests[idx] = updated;
        } else {
          // fallback: reload list
          await _loadRequests();
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Request ${status.toLowerCase()} successfully')),
          );
        }
      } else {
        final message = response.data != null ? response.data.toString() : 'Failed to update request';
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(message)),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _actionLoading.remove(requestId);
        });
      }
    }
  }

  List<dynamic> get _filteredRequests {
    return _requests;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor:
          const Color(0xFFF5F7F6),

      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding:
                  const EdgeInsets.fromLTRB(
                16,
                16,
                16,
                10,
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Service Requests',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight:
                            FontWeight.w800,
                      ),
                    ),
                  ),

                  IconButton(
                    onPressed: () => _loadRequests(status: statusValues[_selectedTab]),
                    icon: const Icon(
                      Icons.refresh_rounded,
                    ),
                  ),
                ],
              ),
            ),

            // TABS
            SizedBox(
              height: 42,
              child: ListView.separated(
                padding:
                    const EdgeInsets.symmetric(
                  horizontal: 16,
                ),
                scrollDirection:
                    Axis.horizontal,
                itemCount: tabs.length,
                separatorBuilder:
                    (_, __) =>
                        const SizedBox(
                  width: 10,
                ),
                itemBuilder:
                    (context, index) {
                  final selected =
                      _selectedTab ==
                          index;

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedTab = index;
                      });
                      _loadRequests(status: statusValues[index]);
                    },
                    child:
                        AnimatedContainer(
                      duration:
                          const Duration(
                        milliseconds: 200,
                      ),
                      padding:
                          const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 10,
                      ),
                      decoration:
                          BoxDecoration(
                        color: selected
                            ? Theme.of(
                                context,
                              )
                                .colorScheme
                                .primary
                            : Colors.white,
                        borderRadius:
                            BorderRadius.circular(
                          14,
                        ),
                      ),
                      child: Text(
                        tabs[index],
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight:
                              FontWeight
                                  .w700,
                          color: selected
                              ? Colors
                                  .white
                              : Colors
                                  .black87,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 12),

            Expanded(
              child: Builder(builder: (context) {
                if (_isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (_error != null) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: _loadRequests,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }

                final list = _filteredRequests;

                if (list.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('No requests found'),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: _loadRequests,
                          child: const Text('Refresh'),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: _loadRequests,
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 14),
                    itemBuilder: (context, index) {
                      final item = list[index] as Map<String, dynamic>;

                      final status = item['status'] as String? ?? '';

                      final category = (item['category'] is Map) ? (item['category']['name'] as String? ?? '') : '';

                      final title = item['title'] as String? ?? '';

                      final address = item['address'] as String? ?? '';

                      final description = item['description'] as String? ?? '';

                      final quoted = item['quoted_price'];
                      double? quotedNum;
                      if (quoted is num) {
                        quotedNum = quoted.toDouble();
                      } else if (quoted is String) {
                        quotedNum = double.tryParse(quoted);
                      }

                      final budgetStr = quotedNum != null
                          ? NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: quotedNum.truncateToDouble() == quotedNum ? 0 : 2).format(quotedNum)
                          : '₹0';

                      final requestedDateRaw = item['requested_date'] as String? ?? '';
                      String requestedDate = requestedDateRaw;
                      final dt = DateTime.tryParse(requestedDateRaw);
                      if (dt != null) {
                        requestedDate = DateFormat('d MMM, yyyy').format(dt.toLocal());
                      }

                      final clientName = item['client_name'] as String? ?? 'Client';

                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                CircleAvatar(
                                  radius: 24,
                                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                                  child: Text(
                                    clientName.isNotEmpty ? clientName[0] : 'C',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                  ),
                                ),

                                const SizedBox(width: 12),

                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        clientName,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                                      ),

                                      const SizedBox(height: 4),

                                      Text(
                                        category,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey.shade800),
                                      ),

                                      const SizedBox(height: 8),

                                      Row(
                                        children: [
                                          Icon(Icons.location_on_outlined, size: 15, color: Colors.grey.shade600),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              address,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),

                                _StatusBadge(status: status),
                              ],
                            ),

                            const SizedBox(height: 14),

                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: const Color(0xFFF7F8FA), borderRadius: BorderRadius.circular(16)),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                                  ),

                                  const SizedBox(height: 8),

                                  Text(
                                    description,
                                    maxLines: 4,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontSize: 12, height: 1.4, color: Colors.grey.shade800),
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(height: 14),

                            Row(
                              children: [
                                Expanded(child: _InfoTile(icon: Icons.schedule, value: requestedDate)),
                                const SizedBox(width: 8),
                                Expanded(child: _InfoTile(icon: Icons.currency_rupee, value: budgetStr)),
                              ],
                            ),

                            const SizedBox(height: 14),

                            if (status == 'PENDING')
                              Column(
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: OutlinedButton(
                                          onPressed: (_actionLoading[item['id']] ?? false)
                                              ? null
                                              : () async {
                                                  await _updateRequestStatus(item['id'], 'REJECTED');
                                                },
                                          child: _actionLoading[item['id']] == true
                                              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                                              : const Text('Reject'),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: FilledButton(
                                          onPressed: (_actionLoading[item['id']] ?? false)
                                              ? null
                                              : () async {
                                                  await _updateRequestStatus(item['id'], 'ACCEPTED');
                                                },
                                          child: _actionLoading[item['id']] == true
                                              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                              : const Text('Accept'),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    width: double.infinity,
                                    child: FilledButton.icon(
                                      onPressed: () async {
                                        final result = await Navigator.push<bool?>(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => CreateQuoteScreen(
                                              requestId: item['id'] as int,
                                              title: item['title'] as String? ?? '',
                                              description: item['description'] as String? ?? '',
                                              category: category,
                                              requestedDate: item['requested_date'] as String? ?? '',
                                              address: item['address'] as String? ?? '',
                                            ),
                                          ),
                                        );

                                        if (result == true) {
                                          setState(() {});
                                        }
                                      },
                                      icon: const Icon(Icons.send_rounded, size: 16),
                                      label: const Text('Send Quote'),
                                    ),
                                  ),
                                ],
                              )
                            else if (status == 'QUOTED')
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton.icon(
                                  onPressed: () async {
                                    final result = await Navigator.push<bool?>(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => CreateQuoteScreen(
                                          requestId: item['id'] as int,
                                          title: item['title'] as String? ?? '',
                                          description: item['description'] as String? ?? '',
                                          category: category,
                                          requestedDate: item['requested_date'] as String? ?? '',
                                          address: item['address'] as String? ?? '',
                                        ),
                                      ),
                                    );

                                    if (result == true) {
                                      setState(() {});
                                    }
                                  },
                                  icon: const Icon(Icons.send_rounded, size: 16),
                                  label: const Text('Send Quote'),
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;

  final String value;

  const _InfoTile({
    required this.icon,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 46,
      padding:
          const EdgeInsets.symmetric(
        horizontal: 8,
      ),
      decoration: BoxDecoration(
        color: const Color(
          0xFFF7F8FA,
        ),
        borderRadius:
            BorderRadius.circular(
          14,
        ),
      ),
      child: Row(
        mainAxisAlignment:
            MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 14,
            color: Theme.of(context)
                .colorScheme
                .primary,
          ),

          const SizedBox(width: 4),

          Expanded(
            child: Text(
              value,
              maxLines: 1,
              overflow:
                  TextOverflow.ellipsis,
              textAlign:
                  TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                fontWeight:
                    FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;

    Color textColor;

    String label;

    switch (status) {
      case 'ACCEPTED':
        bgColor =
            Colors.green.withOpacity(
          0.12,
        );

        textColor = Colors.green;

        label = 'ACCEPTED';

        break;

      case 'COMPLETED':
        bgColor =
            Colors.blue.withOpacity(
          0.12,
        );

        textColor = Colors.blue;

        label = 'COMPLETED';

        break;

      default:
        bgColor =
            Colors.orange.withOpacity(
          0.12,
        );

        textColor = Colors.orange;

        label = 'PENDING';
    }

    return Container(
      padding:
          const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius:
            BorderRadius.circular(
          30,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight:
              FontWeight.w700,
          color: textColor,
        ),
      ),
    );
  }
}
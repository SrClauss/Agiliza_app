import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_strings.dart';
import '../../../core/network/api_client.dart';

class CreateQuoteScreen extends ConsumerStatefulWidget {
  const CreateQuoteScreen({
    super.key,
    required this.requestId,
    required this.title,
    required this.description,
    required this.category,
    required this.requestedDate,
    required this.address,
  });

  final int requestId;
  final String title;
  final String description;
  final String category;
  final String requestedDate;
  final String address;

  @override
  ConsumerState<CreateQuoteScreen> createState() =>
      _CreateQuoteScreenState();
}

class _CreateQuoteScreenState extends ConsumerState<CreateQuoteScreen> {
  final _formKey = GlobalKey<FormState>();

  final _priceController =
      TextEditingController();

  final _durationController =
      TextEditingController();

  final _messageController =
      TextEditingController();

  bool _isLoading = false;

  Future<void> _submitQuote() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final rawPrice = _priceController.text.trim();
    final duration = _durationController.text.trim();
    final message = _messageController.text.trim();
    final priceValue = double.tryParse(rawPrice);

    if (priceValue == null) {
      _showSnackBar('Please enter a valid price');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final apiClient = ref.read(apiClientProvider);

      final response = await apiClient.post<Map<String, dynamic>>(
        AppStrings.quoteResponsesEndpoint,
        data: {
          'service_request': widget.requestId,
          'price': rawPrice,
          'duration': duration,
          'message': message,
        },
      );

      if (response.statusCode != 201 && response.statusCode != 200) {
        _showSnackBar(_extractErrorMessage(response.data) ?? 'Failed to send quote');
        return;
      }

      if (!mounted) return;
      _showSnackBar('Quote sent successfully');
      Navigator.pop(context, true);
      return;
    } on DioException catch (e) {
      _showSnackBar(_extractErrorMessage(e.response?.data) ?? 'Failed to send quote');
    } catch (e) {
      _showSnackBar(e.toString());
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  String? _extractErrorMessage(dynamic data) {
    if (data == null) return null;

    if (data is String) {
      return data;
    }

    if (data is Map<String, dynamic>) {
      const keys = ['detail', 'message', 'error', 'non_field_errors'];
      for (final key in keys) {
        final value = data[key];
        if (value is String && value.isNotEmpty) {
          return value;
        }
        if (value is List && value.isNotEmpty) {
          return value.first.toString();
        }
      }
    }

    return null;
  }

  @override
  void dispose() {
    _priceController.dispose();
    _durationController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Send Quote'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _RequestSummaryCard(
              title: widget.title,
              category: widget.category,
              requestedDate: widget.requestedDate,
              address: widget.address,
              description: widget.description,
            ),
            const SizedBox(height: 24),
            Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _priceController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Price',
                      prefixText: '₹ ',
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Enter price';
                      }
                      if (double.tryParse(value.trim()) == null) {
                        return 'Enter a valid number';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _durationController,
                    decoration: const InputDecoration(
                      labelText: 'Duration',
                      hintText: 'e.g. 2 days',
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Enter duration';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _messageController,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      labelText: 'Message',
                      hintText: 'Describe your service...',
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Enter message';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _isLoading ? null : _submitQuote,
                      child: _isLoading
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Send Quote'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RequestSummaryCard extends StatelessWidget {
  const _RequestSummaryCard({
    required this.title,
    required this.category,
    required this.requestedDate,
    required this.address,
    required this.description,
  });

  final String title;
  final String category;
  final String requestedDate;
  final String address;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[700],
                ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              _InfoTag(label: 'Category', value: category),
              _InfoTag(label: 'Date', value: requestedDate),
              _InfoTag(label: 'Address', value: address),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoTag extends StatelessWidget {
  const _InfoTag({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 8,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F8FA),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label: ',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          Text(
            value.isNotEmpty ? value : '-',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_sizes.dart';
import '../../../core/network/api_client.dart';
import '../../../core/widgets/app_back_app_bar.dart';

class WeeklyAvailabilityScreen
    extends ConsumerStatefulWidget {
  const WeeklyAvailabilityScreen({
    super.key,
  });

  @override
  ConsumerState<WeeklyAvailabilityScreen>
      createState() =>
          _WeeklyAvailabilityScreenState();
}

class _WeeklyAvailabilityScreenState
    extends ConsumerState<WeeklyAvailabilityScreen> {
  bool _isLoading = true;

  bool _isSaving = false;

  String? _error;

  final Set<int> _selectedDays = {};

  List<dynamic> _slots = [];

  TimeOfDay _startTime =
      const TimeOfDay(
    hour: 9,
    minute: 0,
  );

  TimeOfDay _endTime =
      const TimeOfDay(
    hour: 18,
    minute: 0,
  );

  static const _weekdays = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ];

  @override
  void initState() {
    super.initState();
    _loadAvailability();
  }

  Future<void> _loadAvailability() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final apiClient =
          ref.read(apiClientProvider);

      final response =
          await apiClient.get(
        '/auth/availability-slots/',
      );

      final data =
          response.data
              as Map<String, dynamic>;

      final results =
          data['results']
              as List<dynamic>;

      _slots = results;

      _selectedDays.clear();

      for (final slot in results) {
        _selectedDays.add(
          slot['day_of_week'],
        );
      }

      if (results.isNotEmpty) {
        final first = results.first;

        final start =
            first['start_time']
                .toString()
                .split(':');

        final end =
            first['end_time']
                .toString()
                .split(':');

        _startTime = TimeOfDay(
          hour: int.parse(start[0]),
          minute: int.parse(start[1]),
        );

        _endTime = TimeOfDay(
          hour: int.parse(end[0]),
          minute: int.parse(end[1]),
        );
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _pickStartTime() async {
    final picked =
        await showTimePicker(
      context: context,
      initialTime: _startTime,
    );

    if (picked != null) {
      setState(() {
        _startTime = picked;
      });
    }
  }

  Future<void> _pickEndTime() async {
    final picked =
        await showTimePicker(
      context: context,
      initialTime: _endTime,
    );

    if (picked != null) {
      setState(() {
        _endTime = picked;
      });
    }
  }

  void _toggleDay(int day) {
    setState(() {
      if (_selectedDays.contains(day)) {
        _selectedDays.remove(day);
      } else {
        _selectedDays.add(day);
      }
    });
  }

  String _timeToApi(
    TimeOfDay time,
  ) {
    final hour =
        time.hour
            .toString()
            .padLeft(2, '0');

    final minute =
        time.minute
            .toString()
            .padLeft(2, '0');

    return '$hour:$minute:00';
  }

  Future<void> _saveAvailability() async {
    if (_selectedDays.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(
        const SnackBar(
          content: Text(
            'Select at least one day',
          ),
        ),
      );
      return;
    }

    try {
      setState(() {
        _isSaving = true;
      });

      final apiClient =
          ref.read(apiClientProvider);

      // DELETE OLD SLOTS
      for (final slot in _slots) {
        await apiClient.delete(
          '/auth/availability-slots/${slot['id']}/',
        );
      }

      // CREATE NEW SLOTS
      for (final day
          in _selectedDays) {
        await apiClient.post(
          '/auth/availability-slots/',
          data: {
            'day_of_week': day,
            'start_time':
                _timeToApi(
              _startTime,
            ),
            'end_time':
                _timeToApi(
              _endTime,
            ),
            'is_active': true,
          },
        );
      }

      await _loadAvailability();

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          const SnackBar(
            content: Text(
              'Availability updated successfully',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          SnackBar(
            content: Text(
              e.toString(),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme =
        Theme.of(context);

    return Scaffold(
      backgroundColor:
          const Color(
        0xFFF5F7F6,
      ),

      appBar: const AppBackAppBar(
        title:
            Text('Availability'),
      ),

      body: _isLoading
          ? const Center(
              child:
                  CircularProgressIndicator(),
            )
          : _error != null
              ? Center(
                  child: Text(
                    _error!,
                  ),
                )
              : SingleChildScrollView(
                  padding:
                      AppSizes.pagePadding,
                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment
                            .stretch,
                    children: [
                      Container(
                        padding:
                            const EdgeInsets.all(
                          18,
                        ),
                        decoration:
                            BoxDecoration(
                          color:
                              Colors.white,
                          borderRadius:
                              BorderRadius.circular(
                            22,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment
                                  .start,
                          children: [
                            const Text(
                              'Weekly Schedule',
                              style:
                                  TextStyle(
                                fontSize:
                                    18,
                                fontWeight:
                                    FontWeight
                                        .w700,
                              ),
                            ),

                            const SizedBox(
                              height: 8,
                            ),

                            Text(
                              'Choose the days and timings when you are available for client bookings.',
                              style: TextStyle(
                                color: Colors
                                    .grey
                                    .shade700,
                                height:
                                    1.5,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(
                        height: 20,
                      ),

                      Container(
                        padding:
                            const EdgeInsets.all(
                          18,
                        ),
                        decoration:
                            BoxDecoration(
                          color:
                              Colors.white,
                          borderRadius:
                              BorderRadius.circular(
                            22,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment
                                  .start,
                          children: [
                            const Text(
                              'Available Days',
                              style:
                                  TextStyle(
                                fontSize:
                                    16,
                                fontWeight:
                                    FontWeight
                                        .w700,
                              ),
                            ),

                            const SizedBox(
                              height: 16,
                            ),

                            Wrap(
                              spacing:
                                  10,
                              runSpacing:
                                  10,
                              children:
                                  List.generate(
                                _weekdays
                                    .length,
                                (index) {
                                  final day =
                                      index +
                                          1;

                                  final selected =
                                      _selectedDays
                                          .contains(
                                    day,
                                  );

                                  return GestureDetector(
                                    onTap:
                                        () =>
                                            _toggleDay(
                                      day,
                                    ),
                                    child:
                                        AnimatedContainer(
                                      duration:
                                          const Duration(
                                        milliseconds:
                                            200,
                                      ),
                                      padding:
                                          const EdgeInsets.symmetric(
                                        horizontal:
                                            18,
                                        vertical:
                                            12,
                                      ),
                                      decoration:
                                          BoxDecoration(
                                        color: selected
                                            ? Theme.of(context)
                                                .colorScheme
                                                .primary
                                            : const Color(
                                                0xFFF3F5F4,
                                              ),
                                        borderRadius:
                                            BorderRadius.circular(
                                          14,
                                        ),
                                      ),
                                      child:
                                          Text(
                                        _weekdays[
                                            index],
                                        style:
                                            TextStyle(
                                          fontWeight:
                                              FontWeight.w700,
                                          color: selected
                                              ? Colors.white
                                              : Colors.black87,
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(
                        height: 20,
                      ),

                      Container(
                        padding:
                            const EdgeInsets.all(
                          18,
                        ),
                        decoration:
                            BoxDecoration(
                          color:
                              Colors.white,
                          borderRadius:
                              BorderRadius.circular(
                            22,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment
                                  .start,
                          children: [
                            const Text(
                              'Working Hours',
                              style:
                                  TextStyle(
                                fontSize:
                                    16,
                                fontWeight:
                                    FontWeight
                                        .w700,
                              ),
                            ),

                            const SizedBox(
                              height: 16,
                            ),

                            Row(
                              children: [
                                Expanded(
                                  child:
                                      _TimeCard(
                                    label:
                                        'Start',
                                    time:
                                        _startTime.format(
                                      context,
                                    ),
                                    onTap:
                                        _pickStartTime,
                                  ),
                                ),

                                const SizedBox(
                                  width:
                                      12,
                                ),

                                Expanded(
                                  child:
                                      _TimeCard(
                                    label:
                                        'End',
                                    time:
                                        _endTime.format(
                                      context,
                                    ),
                                    onTap:
                                        _pickEndTime,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(
                        height: 28,
                      ),

                      SizedBox(
                        height: 54,
                        child:
                            FilledButton(
                          onPressed:
                              _isSaving
                                  ? null
                                  : _saveAvailability,
                          child: _isSaving
                              ? const SizedBox(
                                  height:
                                      20,
                                  width:
                                      20,
                                  child:
                                      CircularProgressIndicator(
                                    strokeWidth:
                                        2,
                                    color:
                                        Colors.white,
                                  ),
                                )
                              : const Text(
                                  'Update Availability',
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}

class _TimeCard extends StatelessWidget {
  final String label;

  final String time;

  final VoidCallback onTap;

  const _TimeCard({
    required this.label,
    required this.time,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius:
          BorderRadius.circular(
        18,
      ),
      child: Container(
        padding:
            const EdgeInsets.all(
          16,
        ),
        decoration:
            BoxDecoration(
          color: const Color(
            0xFFF5F7F6,
          ),
          borderRadius:
              BorderRadius.circular(
            18,
          ),
        ),
        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment
                  .start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: Colors
                    .grey.shade700,
                fontSize: 13,
              ),
            ),

            const SizedBox(
              height: 8,
            ),

            Text(
              time,
              style:
                  const TextStyle(
                fontSize: 18,
                fontWeight:
                    FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
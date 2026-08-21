import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:location/location.dart';

final userLocationProvider =
    StateNotifierProvider<UserLocationNotifier, geo.Position?>(
  (ref) => UserLocationNotifier(),
);

class UserLocationNotifier
    extends StateNotifier<geo.Position?> {

  UserLocationNotifier() : super(null);

  final Location _location = Location();

  Future<bool> requestLocation() async {

    // CHECK GPS
    bool serviceEnabled =
        await _location.serviceEnabled();

    // SHOW GPS POPUP
    if (!serviceEnabled) {

      serviceEnabled =
          await _location.requestService();

      if (!serviceEnabled) {
        return false;
      }
    }

    // CHECK APP PERMISSION
    PermissionStatus permission =
        await _location.hasPermission();

    // SHOW PERMISSION POPUP
    if (permission ==
        PermissionStatus.denied) {

      permission =
          await _location.requestPermission();

      if (permission !=
          PermissionStatus.granted) {
        return false;
      }
    }

    // GET LOCATION
    final position =
        await geo.Geolocator.getCurrentPosition(
          desiredAccuracy:
            geo.LocationAccuracy.high,
    );

    state = position;

    return true;
  }
}
import 'package:geolocator/geolocator.dart';

import '../../features/location/models/user_location.dart';

class LocationService {
  Future<bool> hasPermission() async {
    final permission =
        await Geolocator.checkPermission();

    return permission ==
            LocationPermission.always ||
        permission ==
            LocationPermission.whileInUse;
  }

  Future<bool> requestPermission() async {
    var permission =
        await Geolocator.checkPermission();

    if (permission ==
        LocationPermission.denied) {
      permission =
          await Geolocator.requestPermission();
    }

    return permission ==
            LocationPermission.always ||
        permission ==
            LocationPermission.whileInUse;
  }

  Future<UserLocation?> getCurrentLocation() async {
    final hasAccess =
        await requestPermission();

    if (!hasAccess) {
      return null;
    }

    final position =
        await Geolocator.getCurrentPosition(
      desiredAccuracy:
          LocationAccuracy.high,
    );

    return UserLocation(
      latitude: position.latitude,
      longitude: position.longitude,
    );
  }
}
export type LocationResult = {
  latitude: number;
  longitude: number;
};

export async function getCurrentLocation(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {

    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported."));
      return;
    }

    navigator.geolocation.getCurrentPosition(

      (position) => {

        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },

      (error) => {
        reject(error);
      },

      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }

    );
  });
}
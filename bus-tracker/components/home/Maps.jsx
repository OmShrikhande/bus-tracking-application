import React, { useEffect, useState, useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import { StyleSheet, View, Image } from "react-native";
import { ref, onValue } from "firebase/database";
import { realtimeDatabase } from "../../configs/FirebaseConfigs"; // Import your Firebase Realtime Database config
import { Colors } from "../../constants/Colors";

export default function Maps() {
  const mapRef = useRef(null); // Ref for MapView
  const [markerPosition, setMarkerPosition] = useState({
    latitude: 21.116357833, // Start latitude
    longitude: 79.052105833, // Start longitude
  });

  const [endPosition] = useState({
    latitude: 21.213006148731203, // End latitude
    longitude: 78.97323421139544, // End longitude
  });

  useEffect(() => {
    const fetchLiveLocation = () => {
      const locationRef = ref(realtimeDatabase, "bus/Location");

      // Subscribe to live location updates from Firebase
      onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
          const { Latitude, longitude } = snapshot.val();
          console.log("Fetched Live Location:", { Latitude, longitude });

          // Update marker position to fetched location
          setMarkerPosition({
            latitude: Latitude,
            longitude: longitude,
          });

          // Animate the map to the new position
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: Latitude,
                longitude: longitude,
                latitudeDelta: 0.001,
                longitudeDelta: 0.001,
              },
              1000 // Animation duration
            );
          }
        } else {
          console.warn("No location data found in Realtime Database.");
        }
      });
    };

    // Fetch live location every 30 seconds
    const interval = setInterval(fetchLiveLocation, 15000000);

    // Cleanup interval and Firebase subscription on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: markerPosition.latitude,
          longitude: markerPosition.longitude,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        }}
      >
        {/* Dynamic Marker */}
        <Marker
          coordinate={markerPosition}
          title="Bus Location"
          description="This is the live location of the bus"
        >
          <Image
            source={require("../../assets/images/images.jpeg")} // Path to your bus icon
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
        </Marker>

        {/* End Location Marker */}
        <Marker
          coordinate={endPosition}
          title="Destination"
          description="End Location"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.PRIMARY,
  },
  map: {
    width: "100%",
    height: 400,
  },
});

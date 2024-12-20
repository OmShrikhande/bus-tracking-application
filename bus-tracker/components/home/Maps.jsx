import React, { useEffect, useState, useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import { StyleSheet, View, Image, Text } from "react-native";
import { ref, onValue } from "firebase/database";
import { realtimeDatabase } from "../../configs/FirebaseConfigs"; // Import your Firebase Realtime Database config
import { Colors } from "../../constants/Colors";

export default function Maps() {
  const mapRef = useRef(null); // Ref for MapView
  const [markerPosition, setMarkerPosition] = useState({
    latitude: 21.116357833, // Start latitude
    longitude: 79.052105833, // Start longitude
  });

  const [speed, setSpeed] = useState("--"); // Speed state

  const [endPosition] = useState({
    latitude: 21.213652341474052, // End latitude
    longitude: 78.97403582212675, // End longitude
  });

  useEffect(() => {
    const fetchLiveLocation = () => {
      const locationRef = ref(realtimeDatabase, "bus/Location");

      // Subscribe to live location updates from Firebase
      onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
          const { Latitude, Longitude, speed: fetchedSpeed } = snapshot.val();
          console.log("Fetched Live Location:", { Latitude, Longitude, fetchedSpeed });

          // Update marker position to fetched location
          setMarkerPosition({
            latitude: Latitude,
            longitude: Longitude,
          });

          // Update speed, fallback to "--" if speed is not available or zero
          setSpeed(fetchedSpeed && fetchedSpeed > 0 ? fetchedSpeed.toString() : "--");

          // Animate the map to the new position
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: Latitude,
                longitude: Longitude,
                latitudeDelta: 0.001,
                longitudeDelta: 0.001,
              },
              100 // Animation duration
            );
          }
        } else {
          console.warn("No location data found in Realtime Database.");
          setSpeed("--"); // Set speed to "--" if no data is found
        }
      });
    };

    // Fetch live location every 30 seconds
    const interval = setInterval(fetchLiveLocation, 5000);

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
            source={require("./../../assets/images/images.jpeg")}
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

      {/* Speed Display */}
      <View style={styles.speedContainer}>
        <Text style={styles.speedText}>{speed}</Text>
        <Text style={styles.speedLabel}>km/h</Text>
      </View>
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
    height: 420,
  },
  speedContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.SECONDARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  speedText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.WHITE,
  },
  speedLabel: {
    fontSize: 12,
    color: Colors.WHITE,
  },
});

import React from "react";
import MapView, { Marker } from "react-native-maps";
import { StyleSheet, View } from "react-native";
import { Colors } from "../../constants/Colors";

export default function Maps() {
  const initialRegion = {
    latitude: 37.78825, // Example latitude
    longitude: -122.4324, // Example longitude
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const markerPosition = {
    latitude: 37.78825, // Example marker latitude
    longitude: -122.4324, // Example marker longitude
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        <Marker
          coordinate={markerPosition}
          title="Example Location"
          description="This is a sample marker"
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
    height: 300, // Adjusted height to match correct value
  },
});

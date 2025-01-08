import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ref, onValue } from "firebase/database";
import { collection, getDocs } from "firebase/firestore";
import { realtimeDatabase, firestoreDb } from "../../configs/FirebaseConfigs";
import { Colors } from "../../constants/Colors";

const LocationChecker = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Fetching location data...");
  const [firestoreLocations, setFirestoreLocations] = useState([]);

  const normalizeKeys = (data) => {
    if (!data) return null;
    return {
      latitude: parseFloat(data.Latitude || data.latitude),
      longitude: parseFloat(data.Longitude || data.longitude),
    };
  };

  const isInRange = (rtLocation, fsLocation, range = 0.01) => {
    if (!rtLocation || !fsLocation) return false;
    const latDiff = Math.abs(rtLocation.latitude - fsLocation.latitude);
    const lngDiff = Math.abs(rtLocation.longitude - fsLocation.longitude);
    return latDiff <= range && lngDiff <= range;
  };

  const fetchFirestoreLocations = async () => {
    try {
      const locationsCollection = collection(firestoreDb, "Locations");
      const querySnapshot = await getDocs(locationsCollection);

      const locations = querySnapshot.docs.map((doc) => ({
        ...normalizeKeys(doc.data()),
        documentName: doc.id,
      }));

      setFirestoreLocations(locations);
    } catch (error) {
      console.error("Error fetching Firestore data:", error);
    }
  };

  useEffect(() => {
    fetchFirestoreLocations();

    const databaseReference = ref(realtimeDatabase, "bus/Location");

    const unsubscribe = onValue(databaseReference, (snapshot) => {
      if (snapshot.exists()) {
        const location = normalizeKeys(snapshot.val());
        setCurrentLocation(location);

        let matchedLocation = null;

        firestoreLocations.forEach((fsLocation) => {
          if (isInRange(location, fsLocation)) {
            matchedLocation = fsLocation.documentName;
          }
        });

        if (matchedLocation) {
          setStatusMessage(`\u2705 The bus has reached: ${matchedLocation} at `);
        } else {
          setStatusMessage("Realtime location does not match any known location.");
        }
      } else {
        setStatusMessage("\u26A0\uFE0F Realtime location data is not available.");
      }
    });

    return () => unsubscribe();
  }, [firestoreLocations]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{statusMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 100,
    padding: 20,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "black",
    borderStyle: "solid",
    backgroundColor: Colors.WHITE,
    margin: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.BORDER,
    textAlign: "center",
  },
});

export default LocationChecker;

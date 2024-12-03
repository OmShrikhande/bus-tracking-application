import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ref, get } from "firebase/database";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { realtimeDatabase, firestoreDb } from "../../configs/FirebaseConfigs";
import { Colors } from "../../constants/Colors";

const LocationChecker = () => {
  const [realtimeLocation, setRealtimeLocation] = useState(null);
  const [firestoreLocation, setFirestoreLocation] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Loading...");

  // Normalize keys to standard format
  const normalizeKeys = (data) => {
    if (!data) return null;
    return {
      latitude: parseFloat(data.Latitude || data.latitude),
      longitude: parseFloat(data.Longitude || data.longitude),
    };
  };

  // Fetch location from Realtime Database
  const fetchRealtimeDatabaseLocation = async () => {
    try {
      const databaseReference = ref(realtimeDatabase, "bus/Location");
      const snapshot = await get(databaseReference);

      if (snapshot.exists()) {
        setRealtimeLocation(normalizeKeys(snapshot.val()));
      } else {
        console.warn("No data found in Realtime Database at path: bus/Location");
      }
    } catch (error) {
      console.error("Error fetching Realtime Database data:", error);
    }
  };

  // Fetch location from Firestore
  const fetchFirestoreLocation = async () => {
    try {
      const locationsCollection = collection(firestoreDb, "Locations");
      const locationsQuery = query(locationsCollection);
      const querySnapshot = await getDocs(locationsQuery);

      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          setFirestoreLocation(normalizeKeys(doc.data()));
        });
      } else {
        console.warn("No recent location found in Firestore collection: Locations");
      }
    } catch (error) {
      console.error("Error fetching Firestore data:", error);
    }
  };

  // Compare locations and update status
  const compareLocations = (rtLocation, fsLocation) => {
    if (rtLocation && fsLocation) {
      const isMatch =
        rtLocation.latitude === fsLocation.latitude &&
        rtLocation.longitude === fsLocation.longitude;

      setStatusMessage(isMatch ? "✅ Locations match." : "❌ Locations mismatch.");
    } else {
      setStatusMessage("❓ Locations not available for comparison.");
    }
  };

  // Fetch data and compare periodically
  useEffect(() => {
    const fetchData = async () => {
      await fetchRealtimeDatabaseLocation();
      await fetchFirestoreLocation();
    };

    // Fetch initially
    fetchData();

    // Set up periodic refresh every 5 seconds
    const interval = setInterval(() => {
      fetchData();
      console.log("updated")
    }, 10000);

    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, []);

  // Compare when both locations are updated
  useEffect(() => {
    if (realtimeLocation && firestoreLocation) {
      compareLocations(realtimeLocation, firestoreLocation);
    }
  }, [realtimeLocation, firestoreLocation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{statusMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 280,
    padding: 20,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "black",
    borderStyle: "solid",
    backgroundColor: Colors.SECONDARY,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.BORDER,
    textAlign: "center",
  },
});

export default LocationChecker;

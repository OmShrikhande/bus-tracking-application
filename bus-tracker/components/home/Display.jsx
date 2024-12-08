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
  const [nextDoc, setNextDoc] = useState(null);

  const normalizeKeys = (data) => {
    if (!data) return null;
    return {
      latitude: parseFloat(data.Latitude || data.latitude),
      longitude: parseFloat(data.Longitude || data.longitude),
    };
  };

  const isCloseEnough = (val1, val2, threshold = 0.0001) => {
    return Math.abs(val1 - val2) <= threshold;
  };

  const fetchRealtimeDatabaseLocation = async () => {
    try {
      const databaseReference = ref(realtimeDatabase, "bus/Location");
      const snapshot = await get(databaseReference);

      if (snapshot.exists()) {
        const location = normalizeKeys(snapshot.val());
        if (
          !realtimeLocation ||
          location.latitude !== realtimeLocation.latitude ||
          location.longitude !== realtimeLocation.longitude
        ) {
          setRealtimeLocation(location); // Update only if location changes
        }
      } else {
        console.warn("No data found in Realtime Database at path: bus/Location");
      }
    } catch (error) {
      console.error("Error fetching Realtime Database data:", error);
    }
  };

  const fetchFirestoreLocation = async (afterDoc = null) => {
    try {
      const locationsCollection = collection(firestoreDb, "Locations");
      let locationsQuery = query(locationsCollection);

      if (afterDoc) {
        locationsQuery = query(locationsCollection);
      }

      const querySnapshot = await getDocs(locationsQuery);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const location = normalizeKeys(doc.data());
        setFirestoreLocation(location);

        if (afterDoc) {
          setNextDoc(doc.id); // Set the next document if this is a fetch after the initial one
        } else {
          compareLocations(doc.id); // Pass document ID to the comparison function
        }
      } else {
        console.warn("No recent location found in Firestore collection: Locations");
      }
    } catch (error) {
      console.error("Error fetching Firestore data:", error);
    }
  };

  const compareLocations = (firestoreDocId) => {
    if (realtimeLocation && firestoreLocation) {
      const isMatch =
        isCloseEnough(realtimeLocation.latitude, firestoreLocation.latitude) &&
        isCloseEnough(realtimeLocation.longitude, firestoreLocation.longitude);

      setStatusMessage(
        isMatch
          ? `Recent Stop: ${firestoreDocId}${
              nextDoc ? `, Next Stop: ${nextDoc}` : ""
            }`
          : `❌ Locations mismatch. (Firestore Doc: ${firestoreDocId})`
      );

      // Fetch the next document only if the locations match
      if (isMatch) {
        fetchFirestoreLocation(firestoreDocId);
      }
    } else {
      setStatusMessage("❓ Locations data incomplete.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchRealtimeDatabaseLocation();
      await fetchFirestoreLocation();
    };

    fetchData();

    // Set up periodic refresh every 50 seconds
    const interval = setInterval(fetchData, 5000);

    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, [realtimeLocation, firestoreLocation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{statusMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    padding: 0,
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "left",
    borderWidth: 3,
    borderColor: "black",
    borderStyle: "solid",
    backgroundColor: Colors.WHITE,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.BORDER,
    marginLeft: 20,
  },
});

export default LocationChecker;

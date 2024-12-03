import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ref, get } from "firebase/database";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { realtimeDatabase, firestoreDb } from "../../configs/FirebaseConfigs";
import { Colors } from "../../constants/Colors";

const LocationChecker = () => {
  const [realtimeLocation, setRealtimeLocation] = useState(null); // Realtime Database location
  const [firestoreLocation, setFirestoreLocation] = useState(null); // Firestore location
  const [loading, setLoading] = useState(true);

  // Fetch location from Realtime Database
  const fetchRealtimeDatabaseLocation = async () => {
    try {
      const databaseReference = ref(realtimeDatabase, "bus/Location");
      const snapshot = await get(databaseReference);

      if (snapshot.exists()) {
        console.log("Realtime Database Location:", snapshot.val());
        setRealtimeLocation(snapshot.val());
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
          console.log("Firestore Document:", doc.data());
          setFirestoreLocation(doc.data());
        });
      } else {
        console.warn("No recent location found in Firestore collection: Locations");
      }
    } catch (error) {
      console.error("Error fetching Firestore data:", error);
    }
  };

  // Compare locations for equality
  const compareLocations = () => {
    if (realtimeLocation && firestoreLocation) {
      const realtimeString = JSON.stringify(realtimeLocation); // Convert Realtime DB location to string
      const firestoreString = JSON.stringify(firestoreLocation); // Convert Firestore location to string

      // Debugging
      console.log("Realtime Location:", realtimeString);
      console.log("Firestore Location:", firestoreString);

      if (realtimeString === firestoreString) {
        return <Text style={styles.successText}>✅ Successful: Locations match!</Text>;
      } else {
        return <Text style={styles.errorText}>❌ Mismatch: Locations do not match.</Text>;
      }
    }
    return <Text style={styles.text}>Loading location data...</Text>;
  };

  // Fetch data and set up periodic refresh
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchRealtimeDatabaseLocation();
      await fetchFirestoreLocation();
      setLoading(false);
    };

    // Initial fetch
    fetchData();

    // Set up periodic refresh every 15 seconds
    const interval = setInterval(fetchData, 10000);

    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {loading ? <Text style={styles.text}>Fetching data...</Text> : compareLocations()}
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
  successText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "green",
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "red",
    textAlign: "center",
  },
});

export default LocationChecker;

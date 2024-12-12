import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { ref, get } from "firebase/database";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { realtimeDatabase, firestoreDb } from "../../configs/FirebaseConfigs";
import { Colors } from "../../constants/Colors";

const LocationChecker = () => {
  const [realtimeLocation, setRealtimeLocation] = useState(null);
  const [firestoreLocation, setFirestoreLocation] = useState(null);
  const [nextFirestoreDoc, setNextFirestoreDoc] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Loading...");
  const [previousLocation, setPreviousLocation] = useState(null); // State to store the previous location
  const [currentStopName, setCurrentStopName] = useState(null); // State to store the current stop name

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

  const getCurrentIST = () => {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 60 * 60000; // IST offset in milliseconds
    return new Date(now.getTime() + istOffset - utcOffset).toISOString();
  };

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

  const fetchFirestoreLocation = async () => {
    try {
      const locationsCollection = collection(firestoreDb, "Locations");
      const locationsQuery = query(locationsCollection, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(locationsQuery);

      if (!querySnapshot.empty) {
        const locations = [];
        querySnapshot.forEach((doc) => {
          locations.push({ id: doc.id, data: doc.data() });
          
        });

        if (locations.length > 0) {
          const currentLocation = locations[0]; // First document
          const nextLocation = locations[1] || null; // Next document if available
          const prevLocation = locations[2] || null; // The third document (previous location)
        
          setFirestoreLocation(normalizeKeys(currentLocation.data));
          setNextFirestoreDoc(nextLocation ? nextLocation.id : null);
          setPreviousLocation(prevLocation ? { id: prevLocation.id, ...normalizeKeys(prevLocation.data) } : null); // Set the previous location
        
          // Assuming the current stop's name is stored as "stopName" or "name" in the document
          setCurrentStopName(currentLocation.data.stopName || currentLocation.data.name || "Unnamed Stop"); // Set current stop name
        
          compareLocations(currentLocation.id);
        }
        
      } else {
        console.warn("No recent location found in Firestore collection: Locations");
      }
    } catch (error) {
      console.error("Error fetching Firestore data:", error);
    }
  };

  const updateTimestamp = async (docId) => {
    try {
      const docRef = doc(firestoreDb, "Locations", docId);
      await updateDoc(docRef, { timestamp: getCurrentIST() });
      console.log(`Updated timestamp for document: ${docId}`);
    } catch (error) {
      console.error(`Error updating timestamp for document ${docId}:`, error);
    }
  };

  
  const compareLocations = (firestoreDocId) => {
    if (realtimeLocation && firestoreLocation) {
      const isMatch =
        isCloseEnough(realtimeLocation.latitude, firestoreLocation.latitude) &&
        isCloseEnough(realtimeLocation.longitude, firestoreLocation.longitude);

      if (isMatch) {
        setStatusMessage(null);
        updateTimestamp(firestoreDocId); // Update timestamp for the matched document
      } else {
        if (previousLocation) {
          setStatusMessage(`${previousLocation.id}`);

        } else {
          setStatusMessage("❌ Locations mismatch, no recent stop available.");
        }
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

    // Set up periodic refresh every 15 seconds
    const interval = setInterval(fetchData, 1500);

    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, [realtimeLocation, firestoreLocation]);

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Current Stop</Text>
          {statusMessage ? (
            <Text style={styles.errorText}>{statusMessage}</Text>
          ) : (
            <Text style={styles.infoText}>{currentStopName || "No stop name available"}</Text>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Next Stop</Text>
          <Text style={styles.infoText}>{nextFirestoreDoc || "No upcoming stops"}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.BACKGROUND,
  },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: Colors.PRIMARY,
  },
  infoText: {
    fontSize: 16,
    color: Colors.TEXT,
  },
  errorText: {
    fontSize: 16,
    color: Colors.ERROR,
  },
});

export default LocationChecker;

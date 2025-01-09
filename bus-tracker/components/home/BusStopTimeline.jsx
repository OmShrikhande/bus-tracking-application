import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { ref, onValue } from "firebase/database";
import { collection, getDocs } from "firebase/firestore";
import { realtimeDatabase, firestoreDb } from "../../configs/FirebaseConfigs";
import { Colors } from "../../constants/Colors";

const VerticalStopsComponent = () => {
  const [stops, setStops] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);

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

      const fetchedStops = querySnapshot.docs.map((doc) => ({
        ...normalizeKeys(doc.data()),
        documentName: doc.id,
        reached: false,
        lastNotified: null, // Timestamp of last notification
      }));

      const sortedStops = fetchedStops.sort((a, b) => {
        const srA = parseInt(a.serialNumber, 10) || Infinity;
        const srB = parseInt(b.serialNumber, 10) || Infinity;
        if (srA !== srB) return srA - srB;
        return a.documentName.localeCompare(b.documentName);
      });

      setStops(sortedStops);
      setLoading(false);
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

        const now = Date.now();

        setStops((prevStops) =>
          prevStops.map((stop) => {
            const reached = isInRange(location, stop);
            const shouldNotify =
              reached &&
              (!stop.lastNotified || now - stop.lastNotified >= 10 * 60 * 1000);

            if (shouldNotify) {
              Alert.alert("\u2705 The bus has reached:", stop.documentName);

              return {
                ...stop,
                reached: true,
                lastNotified: now,
              };
            }

            return { ...stop, reached };
          })
        );
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading stops...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {stops.map((stop, index) => (
        <View key={stop.documentName} style={styles.stopWrapper}>
          {index > 0 && <View style={styles.line} />}
          <View
            style={[styles.stopPoint, stop.reached ? styles.reached : styles.notReached]}
          />
          <Text style={styles.stopText}>
            {stop.documentName} {stop.reached ? "(reached)" : "(not reached)"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: Colors.WHITE,
  },
  stopWrapper: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  line: {
    position: "absolute",
    width: 2,
    height: 50,
    backgroundColor: Colors.GREY,
    top: -50,
    zIndex: -1,
  },
  stopPoint: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.BORDER,
  },
  reached: {
    backgroundColor: Colors.SUCCESS,
  },
  notReached: {
    backgroundColor: Colors.PRIMARY,
  },
  stopText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.DARK,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.GREY,
    
  },
});

export default VerticalStopsComponent;

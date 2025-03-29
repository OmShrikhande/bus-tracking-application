import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, ScrollView, RefreshControl } from "react-native";
import { firestoreDb } from "../../configs/FirebaseConfigs"; // Import Firestore
import { collection, getDocs, onSnapshot } from "firebase/firestore"; // Firestore methods

export default function Stats() {
  const [locations, setLocations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLocations = useCallback(async () => {
    setRefreshing(true);
    try {
      const querySnapshot = await getDocs(collection(firestoreDb, "Locations"));
      const data = querySnapshot.docs
        .map((doc) => ({
          stopName: doc.id,
          time: doc.data().time,
          serialNumber: doc.data().serialNumber,
        }))
        .filter((item) => item.serialNumber !== undefined);
      data.sort((a, b) => a.serialNumber - b.serialNumber);
      setLocations(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.row,
        index % 2 === 0 ? styles.evenRow : styles.oddRow, // Alternate row colors
      ]}
    >
      <Text style={styles.cell}>{item.serialNumber?.toString()}</Text>
      <Text style={styles.cell}>{item.stopName}</Text>
      <Text style={styles.cell}>{item.time}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent} // Add contentContainerStyle
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchLocations} />
      }
    >
      <Text style={styles.header}>Bus Stop Stats</Text>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.headerCell]}>#</Text>
          <Text style={[styles.cell, styles.headerCell]}>Stop Name</Text>
          <Text style={[styles.cell, styles.headerCell]}>Time</Text>
        </View>
        <FlatList
          data={locations}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.serialNumber?.toString()}-${index}`}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f0f0",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  table: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  evenRow: {
    backgroundColor: "#f9f9f9", // Light background for even rows
  },
  oddRow: {
    backgroundColor: "#ffffff", // White background for odd rows
  },
  cell: {
    flex: 1,
    padding: 10,
    textAlign: "center",
    fontSize: 16, // Slightly larger font
  },
  headerCell: {
    fontWeight: "bold",
    backgroundColor: "#4CAF50", // Green header background
    color: "#fff", // White text for header
    fontSize: 18, // Larger font for header
  },
  scrollContent: {
    paddingBottom: 20, // Add padding at the bottom
  },
});

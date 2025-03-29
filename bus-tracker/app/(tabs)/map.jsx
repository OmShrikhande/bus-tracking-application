import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
} from "react-native";
import { firestoreDb } from "../../configs/FirebaseConfigs"; // Import Firestore
import { doc, getDoc } from "firebase/firestore"; // Firestore methods
import { useNavigation } from "@react-navigation/native"; // Import navigation hook

export default function Explore() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [url, setUrl] = useState(null);
  const navigation = useNavigation(); // Initialize navigation

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const docRef = doc(firestoreDb, "Mapdisplay", "website link"); // Firestore path
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUrl(docSnap.data().urltoweb); // Fetch the URL
          console.log(docSnap.data().urltoweb);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching URL:", error);
      }
    };
    fetchUrl();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9, // Shrink slightly
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, // Return to original size
      friction: 3, // Control bounce effect
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      if (url) {
        Linking.openURL(url); // Use the dynamic URL
      } else {
        console.error("URL not available");
      }
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.buttonText}>Track your bus</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  button: {
    backgroundColor: "#4285F4",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // For Android shadow
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

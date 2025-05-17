import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert, ScrollView, SafeAreaView, TouchableOpacity, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BarChart, LineChart, PieChart, RadarChart } from "react-native-gifted-charts";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from '../firebase/FirebaseConfig'; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeModules } from "react-native";

const { HealthDataModule } = NativeModules;

const HomeScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  const [healthData, setHealthData] = useState({
    heartRate: "Cargando...",
    oxygen: "Cargando...",
    pressure: "Cargando...",
  });

  const saveHealthDataToFirebase = async (userId, healthData) => {
    try {
      const healthDataRef = collection(db, "healthData");
      await addDoc(healthDataRef, {
        userId,
        heartRate: healthData.heartRate,
        oxygen: healthData.oxygen,
        pressure: healthData.pressure,
        timestamp: serverTimestamp(),
      });
      console.log("Datos de salud guardados correctamente");
    } catch (error) {
      console.error("Error guardando datos de salud:", error);
      Alert.alert("Error", "No se pudo guardar los datos de salud");
    }
  };

  // Verificar sesión activa y obtener datos de salud
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigation.replace("Login");
        return;
      }

      if (HealthDataModule) {
        try {
          const data = await HealthDataModule.getHealthData();
          
          // Actualizar el estado local
          setHealthData({
            heartRate: `${data.heartRate} BPM`,
            oxygen: `${data.oxygen}%`,
            pressure: data.pressure,
          });

          // Guardar en Firebase
          await saveHealthDataToFirebase(user.uid, {
            heartRate: data.heartRate,
            oxygen: data.oxygen,
            pressure: data.pressure,
          });
          
        } catch (error) {
          console.error("Error obteniendo datos de salud:", error);
          setHealthData({
            heartRate: "Error",
            oxygen: "Error",
            pressure: "Error",
          });
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      setMenuVisible(false);
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error al cerrar sesión", error.message);
    }
  };

  const handleProfile = () => {
    setMenuVisible(false);
    navigation.navigate("Profile");
  };

  // Componente menú usuario personalizado
  const CustomMenu = () => (
    <View>
      <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconContainer}>
        <Icon name="person-circle-outline" size={30} color="#000" />
      </TouchableOpacity>
      
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleProfile}>
              <Icon name="person-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Perfil</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Icon name="log-out-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  // Gráficas completas
  const Graph1 = () => {
    const barData = [
      { value: 250, label: "M" },
      { value: 500, label: "T", frontColor: "#177AD5" },
      { value: 745, label: "W", frontColor: "#177AD5" },
      { value: 320, label: "T" },
      { value: 600, label: "F", frontColor: "#177AD5" },
      { value: 256, label: "S" },
      { value: 300, label: "S" },
    ];
    return (
      <BarChart
        barWidth={22}
        noOfSections={3}
        barBorderRadius={4}
        frontColor="lightgray"
        data={barData}
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        showReferenceLine1
        referenceLine1Position={420}
        referenceLine1Config={{
          color: "gray",
          dashWidth: 2,
          dashGap: 3,
        }}
        style={{ marginVertical: 10 }}
      />
    );
  };

  const Graph2 = () => {
    const barData = [
      { value: 40, label: "Jan", frontColor: "#177AD5" },
      { value: 20, frontColor: "#ED6665" },
      { value: 50, label: "Feb", frontColor: "#177AD5" },
      { value: 40, frontColor: "#ED6665" },
      { value: 75, label: "Mar", frontColor: "#177AD5" },
      { value: 25, frontColor: "#ED6665" },
      { value: 30, label: "Apr", frontColor: "#177AD5" },
      { value: 20, frontColor: "#ED6665" },
      { value: 60, label: "May", frontColor: "#177AD5" },
      { value: 40, frontColor: "#ED6665" },
      { value: 65, label: "Jun", frontColor: "#177AD5" },
      { value: 30, frontColor: "#ED6665" },
    ];
    return (
      <BarChart
        data={barData}
        barWidth={8}
        spacing={24}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: "gray" }}
        noOfSections={3}
        maxValue={75}
        style={{ marginVertical: 10 }}
      />
    );
  };

  const Graph3 = () => {
    const data1 = [{ value: 70 }, { value: 36 }, { value: 50 }, { value: 40 }, { value: 18 }, { value: 38 }];
    const data2 = [{ value: 50 }, { value: 10 }, { value: 45 }, { value: 30 }, { value: 45 }, { value: 18 }];
    return (
      <LineChart
        areaChart
        curved
        data={data1}
        data2={data2}
        hideDataPoints
        spacing={68}
        color1="#8a56ce"
        color2="#56acce"
        startFillColor1="#8a56ce"
        startFillColor2="#56acce"
        endFillColor1="#8a56ce"
        endFillColor2="#56acce"
        startOpacity={0.9}
        endOpacity={0.2}
        initialSpacing={0}
        noOfSections={4}
        yAxisColor="white"
        yAxisThickness={0}
        rulesType="solid"
        rulesColor="gray"
        yAxisTextStyle={{ color: "gray" }}
        yAxisLabelSuffix="%"
        xAxisColor="lightgray"
        style={{ marginVertical: 10 }}
      />
    );
  };

  const Graph4 = () => {
    const pieData = [
      { value: 47, color: "#009FFF" },
      { value: 40, color: "#93FCF8" },
      { value: 16, color: "#BDB2FA" },
      { value: 3, color: "#FFA5BA" },
    ];
    return (
      <PieChart
        data={pieData}
        donut
        showGradient
        sectionAutoFocus
        radius={90}
        innerRadius={60}
        innerCircleColor={"#232B5D"}
        centerLabelComponent={() => (
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 22, color: "white", fontWeight: "bold" }}>47%</Text>
            <Text style={{ fontSize: 14, color: "white" }}>Excellent</Text>
          </View>
        )}
        style={{ marginVertical: 10 }}
      />
    );
  };

  const Graph5 = () => {
    return (
      <RadarChart
        data={[42, 40, 35, 40, 38, 55]}
        labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
        labelConfig={{ stroke: "blue", fontWeight: "bold" }}
        dataLabels={["92", "160", "350", "40", "38", "55"]}
        dataLabelsConfig={{ stroke: "brown" }}
        maxValue={70}
        style={{ marginVertical: 10 }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header con menú */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Datos de Salud</Text>
        <CustomMenu />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.healthDataContainer}>
          <Text style={styles.healthDataText}>💓 Ritmo Cardíaco: {healthData.heartRate}</Text>
          <Text style={styles.healthDataText}>🩸 Saturación de Oxígeno: {healthData.oxygen}</Text>
          <Text style={styles.healthDataText}>💉 Presión Arterial: {healthData.pressure}</Text>
        </View>

        <Button 
          title="Ver Resumen de Salud" 
          onPress={() => navigation.navigate("Summary")} 
          color="#4CAF50"
        />

        <View style={styles.graphsContainer}>
          <Graph1 />
          <Graph2 />
          <Graph3 />
          <Graph4 />
          <Graph5 />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  iconContainer: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: 'white',
    marginTop: 60,
    marginRight: 20,
    borderRadius: 8,
    width: 180,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 10,
  },
  healthDataContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  healthDataText: {
    fontSize: 16,
    marginBottom: 8,
  },
  graphsContainer: {
    marginTop: 20,
  }
});

export default HomeScreen;
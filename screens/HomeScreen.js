import React, { useEffect, useState } from "react";
import { View, Text, Button, NativeModules } from "react-native";

const { HealthDataModule } = NativeModules;

const HomeScreen = () => {
  const [healthData, setHealthData] = useState({
    heartRate: "Cargando...",
    oxygen: "Cargando...",
    pressure: "Cargando...",
  });

  useEffect(() => {
    HealthDataModule.getHealthData()
      .then((data) => {
        setHealthData({
          heartRate: `${data.heartRate} BPM`,
          oxygen: `${data.oxygen}%`,
          pressure: data.pressure,
        });
      })
      .catch((error) => {
        console.error("Error obteniendo datos de salud:", error);
      });
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>📊 Datos de Salud</Text>
      <Text>💓 Ritmo Cardíaco: {healthData.heartRate}</Text>
      <Text>🩸 Saturación de Oxígeno: {healthData.oxygen}</Text>
      <Text>💉 Presión Arterial: {healthData.pressure}</Text>
    </View>
  );
};

export default HomeScreen;

import React, { useEffect, useState } from "react";
import { View, Text, Button, NativeModules } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BarChart, LineChart, PieChart, RadarChart } from 'react-native-gifted-charts';

// Modulo nativo para obtener los datos de salud
const { HealthDataModule } = NativeModules;

const HomeScreen = () => {
  const [healthData, setHealthData] = useState({
    heartRate: "Cargando...",
    oxygen: "Cargando...",
    pressure: "Cargando...",
  });

  const navigation = useNavigation();

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

  // Gráfica 1: Barra
  const Graph1 = () => {
    const barData = [
      { value: 250, label: 'M' },
      { value: 500, label: 'T', frontColor: '#177AD5' },
      { value: 745, label: 'W', frontColor: '#177AD5' },
      { value: 320, label: 'T' },
      { value: 600, label: 'F', frontColor: '#177AD5' },
      { value: 256, label: 'S' },
      { value: 300, label: 'S' },
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
          color: 'gray',
          dashWidth: 2,
          dashGap: 3,
        }}
      />
    );
  };

  // Gráfica 2: Lineal
  const Graph2 = () => {
    const barData = [
      { value: 40, label: 'Jan', frontColor: '#177AD5' },
      { value: 20, frontColor: '#ED6665' },
      { value: 50, label: 'Feb', frontColor: '#177AD5' },
      { value: 40, frontColor: '#ED6665' },
      { value: 75, label: 'Mar', frontColor: '#177AD5' },
      { value: 25, frontColor: '#ED6665' },
      { value: 30, label: 'Apr', frontColor: '#177AD5' },
      { value: 20, frontColor: '#ED6665' },
      { value: 60, label: 'May', frontColor: '#177AD5' },
      { value: 40, frontColor: '#ED6665' },
      { value: 65, label: 'Jun', frontColor: '#177AD5' },
      { value: 30, frontColor: '#ED6665' },
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
        yAxisTextStyle={{ color: 'gray' }}
        noOfSections={3}
        maxValue={75}
      />
    );
  };

  // Gráfica 3: Lineal
  const Graph3 = () => {
    const data1 = [
      { value: 70 },
      { value: 36 },
      { value: 50 },
      { value: 40 },
      { value: 18 },
      { value: 38 },
    ];
    const data2 = [
      { value: 50 },
      { value: 10 },
      { value: 45 },
      { value: 30 },
      { value: 45 },
      { value: 18 },
    ];
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
        yAxisTextStyle={{ color: 'gray' }}
        yAxisLabelSuffix="%"
        xAxisColor="lightgray"
      />
    );
  };

  // Gráfica 4: Pastel
  const Graph4 = () => {
    const pieData = [
      { value: 47, color: '#009FFF' },
      { value: 40, color: '#93FCF8' },
      { value: 16, color: '#BDB2FA' },
      { value: 3, color: '#FFA5BA' },
    ];
    return (
      <PieChart
        data={pieData}
        donut
        showGradient
        sectionAutoFocus
        radius={90}
        innerRadius={60}
        innerCircleColor={'#232B5D'}
        centerLabelComponent={() => (
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, color: 'white', fontWeight: 'bold' }}>47%</Text>
            <Text style={{ fontSize: 14, color: 'white' }}>Excellent</Text>
          </View>
        )}
      />
    );
  };

  // Gráfica 5: Radar
  const Graph5 = () => {
    return (
      <RadarChart
        data={[42, 40, 35, 40, 38, 55]}
        labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
        labelConfig={{ stroke: 'blue', fontWeight: 'bold' }}
        dataLabels={['92', '160', '350', '40', '38', '55']}
        dataLabelsConfig={{ stroke: 'brown' }}
        maxValue={70}
      />
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>📊 Datos de Salud</Text>
      <Text>💓 Ritmo Cardíaco: {healthData.heartRate}</Text>
      <Text>🩸 Saturación de Oxígeno: {healthData.oxygen}</Text>
      <Text>💉 Presión Arterial: {healthData.pressure}</Text>

      <Button
        title="Ver Resumen de Salud"
        onPress={() => navigation.navigate("Summary")}
      />

      {/* Aquí están las gráficas de la pantalla de resumen */}
      <Graph1 />
      <Graph2 />
      <Graph3 />
      <Graph4 />
      <Graph5 />
    </View>
  );
};

export default HomeScreen;

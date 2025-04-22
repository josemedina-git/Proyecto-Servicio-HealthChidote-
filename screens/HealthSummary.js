import React from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#caf0f8',
  backgroundGradientTo: '#90e0ef',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(0, 119, 182, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: '#0077b6',
  },
};

const sampleData = {
  labels: ['10 AM', '12 PM', '2 PM', '4 PM', '6 PM'],
  heartRate: [72, 75, 78, 76, 74],
  bloodPressure: [120, 122, 118, 119, 121],
  glucose: [90, 95, 100, 97, 93],
  temperature: [36.5, 36.7, 37.0, 36.8, 36.6],
  oxygen: [98, 97, 96, 97, 98],
};

const HealthSummary = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Health Summary</Text>

      <View style={styles.chartBox}>
        <Text style={styles.subtitle}>Heart Rate (bpm)</Text>
        <LineChart
          data={{
            labels: sampleData.labels,
            datasets: [{ data: sampleData.heartRate }],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
        />
      </View>

      <View style={styles.chartBox}>
        <Text style={styles.subtitle}>Blood Pressure (systolic)</Text>
        <LineChart
          data={{
            labels: sampleData.labels,
            datasets: [{ data: sampleData.bloodPressure }],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
        />
      </View>

      <View style={styles.chartBox}>
        <Text style={styles.subtitle}>Glucose (mg/dL)</Text>
        <LineChart
          data={{
            labels: sampleData.labels,
            datasets: [{ data: sampleData.glucose }],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
        />
      </View>

      <View style={styles.chartBox}>
        <Text style={styles.subtitle}>Temperature (Â°C)</Text>
        <LineChart
          data={{
            labels: sampleData.labels,
            datasets: [{ data: sampleData.temperature }],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
        />
      </View>

      <View style={styles.chartBox}>
        <Text style={styles.subtitle}>Blood Oxygen (%)</Text>
        <LineChart
          data={{
            labels: sampleData.labels,
            datasets: [{ data: sampleData.oxygen }],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f0f8ff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
    color: '#0077b6',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#03045e',
  },
  chartBox: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default HealthSummary;

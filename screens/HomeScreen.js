import React, { useEffect, useState, useRef } from "react";
import { View, Text, Button, StyleSheet, Alert, ScrollView, SafeAreaView, TouchableOpacity, Modal, ActivityIndicator, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BarChart, LineChart, PieChart, RadarChart } from "react-native-gifted-charts";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from '../firebase/FirebaseConfig'; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeModules, NativeEventEmitter } from "react-native";

const { HealthDataModule } = NativeModules;
const healthDataEmitter = new NativeEventEmitter(HealthDataModule);

const HomeScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Estado para permisos de salud
  const [healthPermissions, setHealthPermissions] = useState({
    granted: false,
    checked: false
  });

  // Estados para temperatura con Raspberry Pi
  const [raspberryPiIp, setRaspberryPiIp] = useState('192.168.0.100'); // IP por defecto
  const [isTemperatureMonitoring, setIsTemperatureMonitoring] = useState(false);
  const [temperatureStatus, setTemperatureStatus] = useState('Desconectado');

  const [healthData, setHealthData] = useState({
    heartRate: "Cargando...",
    oxygen: "Cargando...",
    pressure: "Cargando...",
    glucose: "Cargando...",
    temperature: "Cargando..."
  });

  // Referencia para controlar si los listeners se han configurado
  const listenersConfigured = useRef(false);



  // Función simple para guardar los datos en Firebase
  const saveToFirebase = async (data) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Extraer los valores numéricos o usar 0 como valor predeterminado
      const heartRateValue = typeof data.heartRate === 'number' ? data.heartRate : 
                            (data.heartRate && data.heartRate !== "No disponible" && data.heartRate !== "Cargando..." && 
                             data.heartRate !== "Error" && data.heartRate !== "Permisos requeridos") ?
                             parseInt(data.heartRate.toString().split(' ')[0]) : 0;
      
      const oxygenValue = typeof data.oxygen === 'number' ? data.oxygen : 
                         (data.oxygen && data.oxygen !== "No disponible" && data.oxygen !== "Cargando..." && 
                          data.oxygen !== "Error" && data.oxygen !== "Permisos requeridos") ?
                          parseInt(data.oxygen.toString().split('%')[0]) : 0;
      
      // Para presión, mantenemos el string "No disponible" si no hay valor
      const pressureValue = data.pressure && data.pressure !== "Cargando..." && 
                           data.pressure !== "Error" && data.pressure !== "Permisos requeridos" ?
                           data.pressure : "No disponible";
      
      // Para temperatura, usamos el valor numérico o extraemos el número
      const tempValue = typeof data.temperature === 'number' ? data.temperature : 
                       (data.temperature && data.temperature !== "No disponible" && data.temperature !== "Cargando..." && 
                        data.temperature !== "Error" && data.temperature !== "Permisos requeridos") ?
                        parseFloat(data.temperature.toString().split('°')[0]) : 0;
      
      // Para glucosa, usamos el valor numérico o extraemos el número
      const glucoseValue = typeof data.glucose === 'number' ? data.glucose : 
                          (data.glucose && data.glucose !== "No disponible" && data.glucose !== "Cargando..." && 
                           data.glucose !== "Error" && data.glucose !== "Permisos requeridos") ?
                          parseInt(data.glucose.toString().split(' ')[0]) : 0;
      
      // Crear documento simple con todos los valores
      const healthDoc = {
        glucose: glucoseValue,
        heartRate: heartRateValue,
        oxygen: oxygenValue,
        pressure: pressureValue,
        temperature: tempValue,
        timestamp: serverTimestamp(),
        userId: user.uid
      };

      // Guardar documento en la colección
      await addDoc(collection(db, "healthData"), healthDoc);
      console.log("Datos guardados en Firebase:", healthDoc);
      
    } catch (error) {
      console.error("Error guardando datos en Firebase:", error);
    }
  };

  // Configurar los event listeners para NFC, permisos y temperatura
  useEffect(() => {
    if (!listenersConfigured.current) {
      // Evento cuando comienza el escaneo
      const scanStartSubscription = healthDataEmitter.addListener(
        'onScanStarted',
        () => {
          setIsScanning(true);
        }
      );

      // Evento cuando se detiene el escaneo
      const scanStopSubscription = healthDataEmitter.addListener(
        'onScanStopped',
        () => {
          setIsScanning(false);
        }
      );

      // Evento cuando se está leyendo el sensor
      const sensorReadingSubscription = healthDataEmitter.addListener(
        'onSensorReading',                                                    
        () => {
          console.log("Leyendo sensor...");
        }
      );

      // Evento cuando se obtiene una lectura de glucosa
      const glucoseReadSubscription = healthDataEmitter.addListener(
        'onGlucoseRead',
        (data) => {
          console.log("Lectura de glucosa:", data);
          setIsScanning(false);
          
          // Actualizar el valor de glucosa en el estado
          setHealthData(prevData => {
            const newData = {
              ...prevData,
              glucose: `${data.value} mg/dL`
            };
            
            // Guardar los datos actualizados en Firebase
            saveToFirebase({
              ...prevData,
              glucose: data.value
            });
            
            return newData;
          });
        }
      );

      // Evento para actualización de todos los datos de salud
      const healthDataUpdateSubscription = healthDataEmitter.addListener(
        'onHealthDataUpdate',
        (data) => {
          console.log("Actualización de datos de salud:", data);
          
          // Actualizar todos los valores de salud en el estado
          const newHealthData = {
            heartRate: `${data.heartRate || 0} BPM`,
            oxygen: `${data.oxygen || 0}%`,
            pressure: data.pressure || "No disponible",
            glucose: data.glucose ? `${data.glucose} mg/dL` : "No disponible",
            temperature: data.temperature ? `${data.temperature.toFixed(1)}°C` : "No disponible",
          };
          
          setHealthData(newHealthData);
          
          // Guardar en Firebase
          saveToFirebase({
            heartRate: data.heartRate || 0,
            oxygen: data.oxygen || 0,
            pressure: data.pressure || "No disponible",
            glucose: data.glucose || 0,
            temperature: data.temperature || 0
          });
        }
      );

      // Listener para actualizaciones de temperatura
      const temperatureUpdateSubscription = healthDataEmitter.addListener(
        'onTemperatureUpdate',
        (data) => {
          console.log("Actualización de temperatura:", data);
          
          // Actualizar el valor de temperatura en el estado
          setHealthData(prevData => {
            const newData = {
              ...prevData,
              temperature: `${data.value.toFixed(1)}°C`
            };
            
            // Guardar los datos actualizados en Firebase
            saveToFirebase({
              ...prevData,
              temperature: data.value
            });
            
            return newData;
          });
          
          // Actualizar el estado para mostrar que estamos conectados
          setTemperatureStatus("Conectado - Último dato recibido");
        }
      );
      
      // Listener para cambios en el estado del monitoreo de temperatura
      const temperatureStatusSubscription = healthDataEmitter.addListener(
        'onTemperatureMonitoringStatus',
        (data) => {
          console.log("Estado del monitoreo:", data);
          
          if (data.status === 'connecting') {
            setTemperatureStatus(`Conectando a ${data.ipAddress}...`);
          } else if (data.status === 'disconnected') {
            setTemperatureStatus('Desconectado');
            setIsTemperatureMonitoring(false);
          }
        }
      );
      
      // Listener para errores de temperatura
      const temperatureErrorSubscription = healthDataEmitter.addListener(
        'onTemperatureError',
        (error) => {
          console.error("Error de temperatura:", error);
          setTemperatureStatus(`Error: ${error.message}`);
          setIsTemperatureMonitoring(false);
        }
      );

      // Evento cuando hay un error en la lectura
      const readErrorSubscription = healthDataEmitter.addListener(
        'onReadError',
        (error) => {
          console.error("Error en la lectura:", error);
          setIsScanning(false);
          Alert.alert("Error", `No se pudo leer el sensor: ${error.message}`);
        }
      );

      // Listener para cambios en los permisos de Health Connect
      const permissionsSubscription = healthDataEmitter.addListener(
        'onHealthPermissionsChanged',
        (data) => {
          console.log("Estado de permisos actualizado:", data);
          setHealthPermissions({
            granted: data.granted,
            checked: true
          });
        }
      );

      // Marcar que los listeners ya se configuraron
      listenersConfigured.current = true;

      // Limpieza al desmontar
      return () => {
        scanStartSubscription.remove();
        scanStopSubscription.remove();
        sensorReadingSubscription.remove();
        glucoseReadSubscription.remove();
        readErrorSubscription.remove();
        permissionsSubscription.remove();
        healthDataUpdateSubscription.remove();
        temperatureUpdateSubscription.remove();
        temperatureStatusSubscription.remove();
        temperatureErrorSubscription.remove();
      };
    }
  }, []);

  // Función para obtener datos de salud
  const fetchHealthData = async (userId) => {
    if (HealthDataModule) {
      try {
        console.log("Intentando obtener datos de salud...");
        
        // Obtener todos los datos de salud
        const data = await HealthDataModule.getHealthData();
        console.log("Datos obtenidos:", data);
        
        // Verificar si necesitamos solicitar permisos
        if (data.hasOwnProperty('permissionsGranted') && !data.permissionsGranted) {
          console.log("Se necesitan permisos de salud");
          setHealthPermissions({
            granted: false,
            checked: true
          });
          
          // Establecer datos predeterminados
          setHealthData({
            heartRate: "Permisos requeridos",
            oxygen: "Permisos requeridos",
            pressure: "Permisos requeridos",
            glucose: "Permisos requeridos",
            temperature: "Permisos requeridos"
          });
          
          return;
        }
        
        // Actualizar el estado local con los datos obtenidos
        setHealthData({
          heartRate: `${data.heartRate || 0} BPM`,
          oxygen: `${data.oxygen || 0}%`,
          pressure: data.pressure || "No disponible",
          glucose: data.glucose ? `${data.glucose} mg/dL` : "No disponible",
          temperature: data.temperature ? `${data.temperature.toFixed(1)}°C` : "No disponible"
        });

        // Guardar en Firebase de manera directa
        saveToFirebase({
          heartRate: data.heartRate || 0,
          oxygen: data.oxygen || 0,
          pressure: data.pressure || "No disponible",
          glucose: data.glucose || 0,
          temperature: data.temperature || 0
        });
        
      } catch (error) {
        console.error("Error obteniendo datos de salud:", error);
        setHealthData({
          heartRate: "Error",
          oxygen: "Error",
          pressure: "Error",
          glucose: "Error",
          temperature: "Error"
        });
      }
    }
  };

  // Verificar sesión activa y obtener datos de salud
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigation.replace("Login");
        return;
      }
      
      // Obtener datos de salud después de verificar la autenticación
      fetchHealthData(user.uid);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Función para forzar la subida cada vez que se vuelve a abrir la pantalla
  useEffect(() => {
    // Agregamos un listener para cuando la pantalla obtiene el foco
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log("HomeScreen obtuvo el foco - forzando actualización de datos");
      
      // Si el usuario está autenticado, obtenemos y subimos los datos
      if (auth.currentUser) {
        fetchHealthData(auth.currentUser.uid);
      }
    });
    
    // Limpieza del listener
    return unsubscribeFocus;
  }, [navigation]);

  // Solicitar permisos de salud
  const requestHealthPermissions = () => {
    fetchHealthData(auth.currentUser?.uid);
  };

  // Función para comenzar el escaneo de glucosa
  const handleStartGlucoseScan = async () => {
    try {
      // Verificar si NFC está disponible y habilitado
      const nfcStatus = await HealthDataModule.isNfcAvailable();
      
      if (!nfcStatus.available) {
        Alert.alert("Error", "NFC no está disponible en este dispositivo");
        return;
      }
      
      if (!nfcStatus.enabled) {
        Alert.alert(
          "NFC desactivado", 
          "Por favor, activa NFC en la configuración de tu dispositivo para continuar",
          [
            {
              text: "Cancelar",
              style: "cancel"
            },
            {
              text: "Ir a Configuración",
              onPress: () => {
                // Abrir la configuración de NFC
                const Intent = NativeModules.IntentAndroid || NativeModules.IntentManager;
                Intent.openSettings("android.settings.NFC_SETTINGS");
              }
            }
          ]
        );
        return;
      }
      
      // Comenzar el escaneo
      await HealthDataModule.startGlucoseScan();
      
    } catch (error) {
      console.error("Error al iniciar escaneo:", error);
      Alert.alert("Error", "No se pudo iniciar el escaneo");
    }
  };

  // Función para detener el escaneo
  const handleStopGlucoseScan = async () => {
    try {
      await HealthDataModule.stopGlucoseScan();
    } catch (error) {
      console.error("Error al detener escaneo:", error);
    }
  };

  // Funciones para controlar el monitoreo de temperatura
  const startTemperatureMonitoring = async () => {
    try {
      await HealthDataModule.startTemperatureMonitoring(raspberryPiIp);
      setIsTemperatureMonitoring(true);
    } catch (error) {
      console.error("Error al iniciar monitoreo:", error);
      Alert.alert("Error", `No se pudo iniciar el monitoreo: ${error.message}`);
    }
  };

  const stopTemperatureMonitoring = async () => {
    try {
      await HealthDataModule.stopTemperatureMonitoring();
      setIsTemperatureMonitoring(false);
    } catch (error) {
      console.error("Error al detener monitoreo:", error);
      Alert.alert("Error", `No se pudo detener el monitoreo: ${error.message}`);
    }
  };

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

  // Componentes de gráficas existentes
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
        {/* Mensaje de permisos faltantes */}
        {!healthPermissions.granted && healthPermissions.checked && (
          <View style={styles.permissionWarning}>
            <Text style={styles.permissionText}>
              Se requieren permisos para acceder a los datos de salud
            </Text>
            <TouchableOpacity 
              style={styles.permissionButton} 
              onPress={requestHealthPermissions}
            >
              <Text style={styles.permissionButtonText}>
                Solicitar Permisos
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.healthDataContainer}>
          <Text style={styles.healthDataText}>💓 Ritmo Cardíaco: {healthData.heartRate}</Text>
          <Text style={styles.healthDataText}>🩸 Saturación de Oxígeno: {healthData.oxygen}</Text>
          <Text style={styles.healthDataText}>💉 Presión Arterial: {healthData.pressure}</Text>
          <Text style={styles.healthDataText}>🌡️ Temperatura Corporal: {healthData.temperature}</Text>
          <Text style={styles.healthDataText}>📈 Nivel de Glucosa: {healthData.glucose}</Text>
          
          {/* Botón para escanear sensor de glucosa */}
          <TouchableOpacity 
            style={[styles.scanButton, isScanning && styles.scanningButton]} 
            onPress={isScanning ? handleStopGlucoseScan : handleStartGlucoseScan}
            disabled={isScanning}
          >
            <View style={styles.buttonContent}>
              {isScanning && <ActivityIndicator color="#fff" style={styles.indicator} />}
              <Text style={styles.scanButtonText}>
                {isScanning ? "Acerca el sensor FreeStyle..." : "Escanear Sensor de Glucosa"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sección de monitoreo de temperatura */}
       <View style={styles.temperatureContainer}>
         <Text style={styles.sectionTitle}>Monitoreo de Temperatura</Text>
         <Text style={styles.statusText}>{temperatureStatus}</Text>
         
         <View style={styles.ipInputContainer}>
           <Text style={styles.inputLabel}>IP de Raspberry Pi:</Text>
           <TextInput
             style={styles.ipInput}
             value={raspberryPiIp}
             onChangeText={setRaspberryPiIp}
             placeholder="Ej: 192.168.0.100"
             keyboardType="numeric"
             editable={!isTemperatureMonitoring}
           />
         </View>
         
         <TouchableOpacity 
           style={[
             styles.monitorButton, 
             isTemperatureMonitoring ? styles.stopButton : styles.startButton
           ]} 
           onPress={isTemperatureMonitoring ? stopTemperatureMonitoring : startTemperatureMonitoring}
         >
           <Text style={styles.buttonText}>
             {isTemperatureMonitoring ? "Detener Monitoreo" : "Iniciar Monitoreo"}
           </Text>
         </TouchableOpacity>
       </View>

       <Button 
         title="Ver Resumen de Salud" 
         onPress={() => navigation.navigate("Summary")} 
         color="#4CAF50"
       />

       <View style={styles.graphsContainer}>
         <Text style={styles.sectionTitle}>Monitoreo Semanal</Text>
         <Graph1 />
         
         <Text style={styles.sectionTitle}>Comparativa Mensual</Text>
         <Graph2 />
         
         <Text style={styles.sectionTitle}>Tendencias</Text>
         <Graph3 />
         
         <Text style={styles.sectionTitle}>Distribución</Text>
         <Graph4 />
         
         <Text style={styles.sectionTitle}>Análisis Semestral</Text>
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
 },
 sectionTitle: {
   fontSize: 18,
   fontWeight: "bold",
   marginTop: 20,
   marginBottom: 10,
   color: "#333"
 },
 scanButton: {
   backgroundColor: "#2196F3",
   padding: 15,
   borderRadius: 8,
   alignItems: "center",
   marginTop: 15,
   flexDirection: "row",
   justifyContent: "center"
 },
 scanningButton: {
   backgroundColor: "#FF9800",
 },
 scanButtonText: {
   color: "white",
   fontWeight: "bold",
   fontSize: 16,
 },
 buttonContent: {
   flexDirection: "row",
   alignItems: "center",
   justifyContent: "center"
 },
 indicator: {
   marginRight: 10
 },
 permissionWarning: {
   backgroundColor: "#FFECB3",
   borderRadius: 8,
   padding: 15,
   marginVertical: 10,
   borderWidth: 1,
   borderColor: "#FFC107"
 },
 permissionText: {
   fontSize: 14,
   marginBottom: 10,
   color: "#5D4037"
 },
 permissionButton: {
   backgroundColor: "#FFC107",
   padding: 10,
   borderRadius: 4,
   alignItems: "center"
 },
 permissionButtonText: {
   color: "#5D4037",
   fontWeight: "bold"
 },
 // Estilos para la sección de temperatura
 temperatureContainer: {
   marginTop: 20,
   backgroundColor: "#e3f2fd",
   borderRadius: 10,
   padding: 15,
   marginBottom: 20,
 },
 statusText: {
   fontSize: 14,
   color: "#555",
   marginBottom: 10,
 },
 ipInputContainer: {
   marginBottom: 15,
 },
 inputLabel: {
   fontSize: 14,
   marginBottom: 5,
 },
 ipInput: {
   borderWidth: 1,
   borderColor: "#ddd",
   borderRadius: 4,
   padding: 8,
   backgroundColor: "#fff",
 },
 monitorButton: {
   padding: 12,
   borderRadius: 8,
   alignItems: "center",
 },
 startButton: {
   backgroundColor: "#4CAF50",
 },
 stopButton: {
   backgroundColor: "#F44336",
 },
 buttonText: {
   color: "white",
   fontWeight: "bold",
 }
});

export default HomeScreen;
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Modal,
  Alert,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIon from 'react-native-vector-icons/Ionicons';
import CheckBox from '@react-native-community/checkbox';
import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from '../firebase/FirebaseConfig';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  addDoc,
  query,
  where
} from "firebase/firestore";

// Umbrales para alertas de salud
const HEALTH_THRESHOLDS = {
  heartRate: { min: 60, max: 100, unit: "BPM" }, // Latidos por minuto
  oxygen: { min: 95, max: 100, unit: "%" },      // Porcentaje de oxígeno
  temperature: { min: 36, max: 37.5, unit: "°C" }, // Grados Celsius
  glucose: { min: 70, max: 140, unit: "mg/dL" },  // mg/dL
  systolic: { min: 90, max: 120, unit: "mmHg" },  // Para presión arterial
  diastolic: { min: 60, max: 80, unit: "mmHg" }   // Para presión arterial
};

// Gravedad de las notificaciones
const SEVERITY = {
  LOW: 'low',       // Ligeramente fuera de rango normal
  MEDIUM: 'medium', // Considerablemente fuera de rango
  HIGH: 'high'      // Peligrosamente fuera de rango
};

// Función para evaluar la gravedad
const evaluateSeverity = (value, threshold) => {
  if (value < threshold.min) {
    // Valor bajo - cuánto por debajo
    const percentBelow = (threshold.min - value) / threshold.min * 100;
    if (percentBelow > 20) return SEVERITY.HIGH;
    if (percentBelow > 10) return SEVERITY.MEDIUM;
    return SEVERITY.LOW;
  } else if (value > threshold.max) {
    // Valor alto - cuánto por encima
    const percentAbove = (value - threshold.max) / threshold.max * 100;
    if (percentAbove > 20) return SEVERITY.HIGH;
    if (percentAbove > 10) return SEVERITY.MEDIUM;
    return SEVERITY.LOW;
  }
  return null; // Valor normal
};

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotifications, setSelectedNotifications] = useState({});
  const [userId, setUserId] = useState(null);
  const [emergencyContact, setEmergencyContact] = useState("4491105919"); // Número de emergencia predeterminado

  // Verificar sesión activa y obtener ID de usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigation.replace("Login");
        return;
      }
      
      setUserId(user.uid);
      // Obtener el contacto de emergencia del usuario
      fetchEmergencyContact(user.uid);
      
      // Cargar notificaciones y datos de salud
      fetchNotifications(user.uid);
      fetchHealthData(user.uid);
    });
    
    return () => unsubscribe();
  }, []);

  // Obtener contacto de emergencia
  const fetchEmergencyContact = async (uid) => {
    try {
      const userProfileRef = collection(db, "userProfiles");
      const q = query(userProfileRef, where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const profileData = querySnapshot.docs[0].data();
        if (profileData.emergencyContact) {
          setEmergencyContact(profileData.emergencyContact);
        }
      }
    } catch (error) {
      console.error("Error al obtener contacto de emergencia:", error);
    }
  };

  // Obtener notificaciones
  const fetchNotifications = async (uid) => {
    try {
      const notificationsRef = collection(db, "notifications");
      // Consulta simple sin orderBy
      const q = query(notificationsRef, where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      
      // Mapear resultados y convertir timestamps
      let notificationsData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }));
      
      // Ordenar manualmente por timestamp
      notificationsData.sort((a, b) => b.timestamp - a.timestamp);
      
      setNotifications(notificationsData);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
      setLoading(false);
    }
  };

  // Obtener datos de salud
  const fetchHealthData = async (uid) => {
    try {
      const healthDataRef = collection(db, "healthData");
      // Consulta simple sin orderBy
      const q = query(healthDataRef, where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      
      let healthData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Asegurarse que todos los datos tienen un formato consistente
        return { 
          id: doc.id, 
          ...data, 
          // Intentar convertir timestamp o usar una fecha predeterminada
          timestamp: data.timestamp?.toDate?.() || new Date(),
          // Asegurarse que el valor existe
          value: data.value !== undefined ? data.value : null
        };
      });
      
      console.log("DATOS BRUTOS:", JSON.stringify(healthData));
      
      // Ordenar manualmente
      healthData.sort((a, b) => b.timestamp - a.timestamp);
      
      // Procesar datos
      processHealthData(healthData);
      
      // Buscar manualmente alertas para valores extremos
      checkForExtremeValues(healthData);
    } catch (error) {
      console.error("Error al obtener datos de salud:", error);
    }
  };
  
  // Nueva función para verificar valores extremos específicamente
  const checkForExtremeValues = (healthData) => {
    if (!healthData || healthData.length === 0) return;
    
    console.log("Verificando valores extremos...");
    
    healthData.forEach(data => {
      // Si no hay valor o tipo de dato, ignorar
      if (!data.dataType || data.value === undefined || data.value === null) return;
      
      console.log(`Verificando ${data.dataType}:`, data.value);
      
      // Manejar temperatura específicamente
      if (data.dataType === 'temperature') {
        const threshold = HEALTH_THRESHOLDS.temperature;
        
        // 50 grados es definitivamente muy alto
        if (data.value > 45) {
          console.log(`VALOR EXTREMO DETECTADO: Temperatura ${data.value}°C`);
          
          // Crear notificación directamente con severidad alta
          createNotification(
            'temperature',
            data.value,
            threshold,
            SEVERITY.HIGH,
            'Temperatura Corporal',
            data.timestamp,
            `Temperatura extremadamente alta (${data.value}°C)`
          );
        }
      }
      
      // Revisar otros valores extremos para otros tipos de datos
      // ... podríamos añadir más casos específicos aquí
    });
  };

  // Procesar datos de salud y crear notificaciones
  const processHealthData = (healthData) => {
    console.log("Procesando datos de salud:", healthData.length, "registros");
    
    // Verificar que haya datos válidos
    if (!healthData || healthData.length === 0) {
      console.log("No hay datos de salud disponibles");
      return;
    }
    
    // Filtrar datos con valores válidos
    const validData = healthData.filter(item => 
      item && item.dataType && item.value !== undefined && item.value !== null
    );
    
    console.log("Datos válidos:", validData.length);
    
    // Obtener últimos valores por tipo
    const latestByType = {};
    validData.forEach(item => {
      // Solo considerar elementos con valores no cero
      if (typeof item.value === 'number' && item.value === 0) {
        return;
      }
      
      if (!latestByType[item.dataType]) {
        latestByType[item.dataType] = item;
      }
    });
    
    console.log("Tipos de datos encontrados:", Object.keys(latestByType));
    
    // Verificar valores contra umbrales
    for (const type in latestByType) {
      const data = latestByType[type];
      
      // Manejar presión arterial
      if (type === 'pressure' && typeof data.value === 'object') {
        const { systolic, diastolic } = data.value;
        
        // Verificar sistólica
        if (systolic !== undefined && systolic !== 0) {
          const systolicSeverity = evaluateSeverity(systolic, HEALTH_THRESHOLDS.systolic);
          if (systolicSeverity) {
            createNotification(
              'pressure_systolic',
              systolic,
              HEALTH_THRESHOLDS.systolic,
              systolicSeverity,
              'Presión Sistólica',
              data.timestamp,
              `La presión sistólica es ${systolic > HEALTH_THRESHOLDS.systolic.max ? 'alta' : 'baja'}`
            );
          }
        }
        
        // Verificar diastólica
        if (diastolic !== undefined && diastolic !== 0) {
          const diastolicSeverity = evaluateSeverity(diastolic, HEALTH_THRESHOLDS.diastolic);
          if (diastolicSeverity) {
            createNotification(
              'pressure_diastolic',
              diastolic,
              HEALTH_THRESHOLDS.diastolic,
              diastolicSeverity,
              'Presión Diastólica',
              data.timestamp,
              `La presión diastólica es ${diastolic > HEALTH_THRESHOLDS.diastolic.max ? 'alta' : 'baja'}`
            );
          }
        }
        
        continue;
      }
      
      // Manejar otros tipos de datos
      let threshold, title;
      
      switch(type) {
        case 'heartRate':
          threshold = HEALTH_THRESHOLDS.heartRate;
          title = 'Ritmo Cardíaco';
          break;
        case 'oxygen':
          threshold = HEALTH_THRESHOLDS.oxygen;
          title = 'Saturación de Oxígeno';
          break;
        case 'temperature':
          threshold = HEALTH_THRESHOLDS.temperature;
          title = 'Temperatura Corporal';
          break;
        case 'glucose':
          threshold = HEALTH_THRESHOLDS.glucose;
          title = 'Nivel de Glucosa';
          break;
        default:
          continue;
      }
      
      // Solo procesar valores válidos (no cero)
      if (data.value !== undefined && data.value !== null && data.value !== 0 && threshold) {
        const severity = evaluateSeverity(data.value, threshold);
        
        if (severity) {
          const description = data.value < threshold.min 
            ? `El valor está por debajo del rango normal (${threshold.min}-${threshold.max} ${threshold.unit})`
            : `El valor está por encima del rango normal (${threshold.min}-${threshold.max} ${threshold.unit})`;
          
          createNotification(
            type,
            data.value,
            threshold,
            severity,
            title,
            data.timestamp,
            description
          );
        }
      } else {
        console.log(`Valor no válido para ${type}:`, data.value);
      }
    }
  };

  // Crear una notificación en Firebase
  const createNotification = async (dataType, value, threshold, severity, title, timestamp, description) => {
    if (!userId) return;
    
    try {
      // Verificar si el valor es válido (no cero ni indefinido)
      if (value === 0 || value === undefined || value === null) {
        console.log(`Valor inválido (${value}) para ${dataType}, no se creará notificación`);
        return;
      }
      
      // Verificar si ya existe una notificación similar reciente
      const existingNotification = notifications.find(n => 
        n.dataType === dataType && 
        n.timestamp && 
        (new Date() - n.timestamp) < 30 * 60 * 1000
      );
      
      // No crear duplicados
      if (existingNotification) return;
      
      // Formatear valor para mostrar
      let displayValue = '';
      if (typeof value === 'number') {
        displayValue = `${value.toFixed(1)} ${threshold.unit}`;
      } else {
        displayValue = `${value} ${threshold.unit}`;
      }

      // Crear notificación
      const notification = {
        userId: userId,
        dataType: dataType,
        value: value,
        displayValue: displayValue,
        title: title,
        description: description,
        severity: severity,
        timestamp: serverTimestamp(),
        read: false
      };
      
      // Guardar en Firebase
      const docRef = await addDoc(collection(db, "notifications"), notification);
      
      // Actualizar lista local
      setNotifications(prev => [
        {
          id: docRef.id,
          ...notification,
          timestamp: new Date()
        },
        ...prev
      ]);
      
      console.log("Notificación creada");
    } catch (error) {
      console.error("Error al crear notificación:", error);
    }
  };

  // Manejar selección de notificación
  const handleSelectNotification = (id) => {
    try {
      setSelectedNotifications(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    } catch (error) {
      console.error("Error al seleccionar notificación:", error);
    }
  };

  // Manejar eliminación de notificaciones seleccionadas
  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(selectedNotifications).filter(id => selectedNotifications[id]);
    
    if (selectedIds.length === 0) {
      Alert.alert("Aviso", "No has seleccionado ninguna notificación para eliminar");
      return;
    }
    
    try {
      // Eliminar cada notificación seleccionada
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "notifications", id));
      }
      
      // Actualizar lista local
      setNotifications(prev => prev.filter(item => !selectedIds.includes(item.id)));
      setSelectedNotifications({});
      Alert.alert("Éxito", "Notificaciones eliminadas correctamente");
    } catch (error) {
      console.error("Error al eliminar notificaciones:", error);
      Alert.alert("Error", "No se pudieron eliminar las notificaciones");
    }
  };

  // Hacer llamada al contacto de emergencia
  const handleOnPressCallContact = () => {
    Linking.openURL(`tel:${emergencyContact}`);
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
        <IconIon name="person-circle-outline" size={30} color="#000" />
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
              <IconIon name="person-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Perfil</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <IconIon name="log-out-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
  
  // Renderizar icono de severidad
  const renderSeverityIcon = (severity) => {
    switch(severity) {
      case SEVERITY.HIGH:
        return <Icon name="error" size={24} color="#FF0000" />;
      case SEVERITY.MEDIUM:
        return <Icon name="warning" size={24} color="#FFA500" />;
      case SEVERITY.LOW:
        return <Icon name="info" size={24} color="#2196F3" />;
      default:
        return null;
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (date) => {
    if (!date) return "";
    
    const now = new Date();
    const diff = now - date;
    
    // Menos de 24 horas, mostrar hora
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Más de 24 horas, mostrar fecha y hora
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Recargar datos al enfocar la pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (userId) {
        fetchNotifications(userId);
        fetchHealthData(userId);
      }
    });
    return unsubscribe;
  }, [navigation, userId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header con menú */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 Notificaciones</Text>
        <CustomMenu />
      </View>

      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Notificaciones Recientes</Text>
          <Icon name="notifications-none" size={30} color="#555" />
        </View>

        <TouchableOpacity 
          style={styles.callButton} 
          onPress={handleOnPressCallContact}
        >
          <IconIon name="call" size={20} color="#fff" style={styles.callIcon} />
          <Text style={styles.callButtonText}>Llamar a Emergencias</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando notificaciones...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No hay notificaciones</Text>
          </View>
        ) : (
          <ScrollView style={styles.scroll}>
            {notifications.map((notification) => {
              // Verificar que cada notificación tenga un ID válido
              if (!notification || !notification.id) {
                return null;
              }
              
              return (
                <View key={notification.id} style={[
                  styles.notificationBox,
                  notification.severity === SEVERITY.HIGH && styles.highSeverity,
                  notification.severity === SEVERITY.MEDIUM && styles.mediumSeverity,
                  notification.severity === SEVERITY.LOW && styles.lowSeverity
                ]}>
                  {/* Quitamos completamente el checkbox por ahora para evitar cierres */}
                  {/*
                  <CheckBox 
                    value={!!selectedNotifications[notification.id]}
                    onValueChange={() => handleSelectNotification(notification.id)}
                    tintColors={{ true: '#007AFF', false: '#999' }}
                  />
                  */}
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationTitleRow}>
                      {renderSeverityIcon(notification.severity)}
                      <Text style={styles.notificationTitle}>
                        {notification.title} - {formatDate(notification.timestamp)}
                      </Text>
                    </View>
                    <View style={styles.notificationBody}>
                      <Text style={styles.valueText}>
                        Valor: {notification.displayValue || "No disponible"}
                      </Text>
                      <Text style={styles.descriptionText}>
                        {notification.description || "Sin descripción"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => {
            // Como quitamos el checkbox, ahora usamos esta función para eliminar todas las notificaciones
            Alert.alert(
              "Eliminar Notificaciones",
              "¿Deseas eliminar todas las notificaciones?",
              [
                {
                  text: "Cancelar",
                  style: "cancel"
                },
                {
                  text: "Eliminar Todas",
                  onPress: async () => {
                    try {
                      // Eliminar todas las notificaciones para este usuario
                      for (const notification of notifications) {
                        if (notification && notification.id) {
                          await deleteDoc(doc(db, "notifications", notification.id));
                        }
                      }
                      // Limpiar lista en memoria
                      setNotifications([]);
                      Alert.alert("Éxito", "Todas las notificaciones han sido eliminadas");
                    } catch (error) {
                      console.error("Error al eliminar notificaciones:", error);
                      Alert.alert("Error", "No se pudieron eliminar las notificaciones");
                    }
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.deleteButtonText}>Eliminar Notificaciones</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4'
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  scroll: {
    maxHeight: 440,
    marginBottom: 16
  },
  notificationBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  highSeverity: {
    borderLeftColor: '#FF0000',
    borderLeftWidth: 5,
  },
  mediumSeverity: {
    borderLeftColor: '#FFA500',
    borderLeftWidth: 5,
  },
  lowSeverity: {
    borderLeftColor: '#2196F3',
    borderLeftWidth: 5,
  },
  notificationContent: {
    marginLeft: 8,
    flex: 1
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
    flex: 1
  },
  notificationBody: {
    marginLeft: 28 // Alinear con el icono
  },
  valueText: {
    fontWeight: '500',
    marginBottom: 4
  },
  descriptionText: {
    color: '#555'
  },
  callButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
    marginBottom: 16
  },
  callIcon: {
    marginRight: 8
  },
  callButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center'
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    color: '#555',
    fontSize: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    marginTop: 16,
    color: '#555',
    fontSize: 18
  }
});

export default NotificationsScreen;
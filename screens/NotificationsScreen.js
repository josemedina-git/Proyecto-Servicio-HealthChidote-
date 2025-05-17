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
  SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIon from 'react-native-vector-icons/Ionicons';
import CheckBox from '@react-native-community/checkbox';
import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from '../firebase/FirebaseConfig';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  // Verificar sesión activa
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigation.replace("Login");
      }
    });
    
    // Importante: devolver la función de limpieza
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

  const handleOnPressCallContact = () => {
    Linking.openURL('tel:4491105919');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header con menú */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 Notificaciones</Text>
        <CustomMenu />
      </View>

      <View style={styles.container}>
        <View style={styles.notificationHeader}>
          <Text style={styles.title}>Recent Notifications</Text>
          <Icon name="notifications-none" size={30} color="#555" />
        </View>

        <TouchableOpacity style={styles.callButton} onPress={handleOnPressCallContact}>
          <Text style={styles.callButtonText}>Llamar</Text>
        </TouchableOpacity>

        <ScrollView style={styles.scroll}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={styles.notificationBox}>
              <CheckBox value={false} />
              <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>Temperatura Corporal 9:{58 - index * 10} am</Text>
                <Text>
                  El Familiar se encuentra con la temperatura corporal elevada ({index === 0 ? '38°C' : '37°C'}), se recomienda llamar para consultar el estado con más detalle.
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Eliminar</Text>
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
  notificationHeader: {
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
  notificationText: {
    marginLeft: 8,
    flex: 1
  },
  notificationTitle: {
    fontWeight: 'bold',
    marginBottom: 4
  },
  callButton: {
    backgroundColor: 'green',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    width: 200,
    alignSelf: 'center',
    marginBottom: 12
  },
  callButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    width: 200,
    alignSelf: 'center'
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

export default NotificationsScreen;
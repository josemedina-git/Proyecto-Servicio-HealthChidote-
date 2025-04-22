import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CheckBox from '@react-native-community/checkbox';

const NotificationsScreen = () => {
  const handleOnPressCallContact = () => {
    Linking.openURL('tel:4491105919');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f4'
  },
  header: {
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

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ContactsScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const contacts = [
    {
      id: '1',
      name: 'Contact 1',
      image:
        'https://dl.acm.org/cms/attachment/html/10.1145/3441852.3471222/assets/html/images/image1.png',
    },
    {
      id: '2',
      name: 'Contact 2',
      image:
        'https://framerusercontent.com/images/X46mucrwjRZ2hO0VStioX5e2kTs.png?scale-down-to=512',
    },
    {
      id: '3',
      name: 'Contact 3',
      image:
        'https://framerusercontent.com/images/I4HufX6GWAUsH3NK56jlQcwr4.png?scale-down-to=512',
    },
  ];

  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <Image source={{ uri: item.image }} style={styles.contactImage} />
      <Text style={styles.contactText}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contacts</Text>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Add Contact</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton}>
        <Text style={styles.buttonText}>Delete Contact</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>New Contact</Text>
            <Image
              source={{
                uri: 'https://framerusercontent.com/images/1ftrwTmj2lvEOrBgGUKkzzNyL6E.png?scale-down-to=512',
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editIcon}>
              <Icon name="edit" size={20} color="#0077b6" />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Name:</Text>
            <TextInput style={styles.input} placeholder="Enter name" />
            <Text style={styles.inputLabel}>Relationship:</Text>
            <TextInput style={styles.input} placeholder="Enter relationship" />
            <Text style={styles.inputLabel}>Phone:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone"
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#0077b6',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  contactImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  contactText: {
    fontSize: 18,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#0077b6',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#d90429',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: '90%',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
  },
  editIcon: {
    position: 'absolute',
    top: 100,
    right: '42%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 6,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
});

export default ContactsScreen;
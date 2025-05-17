import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from '../firebase/FirebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';

const ContactsScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  
  // Form states
  const [contactName, setContactName] = useState('');
  const [contactRelationship, setContactRelationship] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactImage, setContactImage] = useState('https://framerusercontent.com/images/1ftrwTmj2lvEOrBgGUKkzzNyL6E.png?scale-down-to=512');
  
  // Estado para controlar el modal de confirmación de eliminación
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);

  // Verificar sesión activa y cargar contactos
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigation.replace("Login");
      } else {
        setCurrentUser(user);
        fetchContacts(user.uid);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Función para obtener los contactos del usuario actual
  const fetchContacts = async (userId) => {
    try {
      setLoading(true);
      const contactsCollection = collection(db, 'contacts');
      const q = query(contactsCollection, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const contactsList = [];
      querySnapshot.forEach((doc) => {
        contactsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setContacts(contactsList);
    } catch (error) {
      console.error("Error al obtener contactos:", error);
      Alert.alert("Error", "No se pudieron cargar los contactos");
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la adición de un nuevo contacto
  const handleAddContact = async () => {
    if (!contactName || !contactPhone) {
      Alert.alert("Error", "El nombre y teléfono son obligatorios");
      return;
    }

    try {
      const contactData = {
        name: contactName,
        relationship: contactRelationship,
        phone: contactPhone,
        image: contactImage,
        userId: currentUser.uid,
        createdAt: new Date()
      };

      if (editMode && selectedContact) {
        // Actualizar contacto existente
        await updateDoc(doc(db, 'contacts', selectedContact.id), contactData);
        Alert.alert("Éxito", "Contacto actualizado correctamente");
      } else {
        // Agregar nuevo contacto
        await addDoc(collection(db, 'contacts'), contactData);
        Alert.alert("Éxito", "Contacto agregado correctamente");
      }
      
      // Limpiar formulario y cerrar modal
      resetFormAndCloseModal();
      
      // Recargar la lista de contactos
      fetchContacts(currentUser.uid);
    } catch (error) {
      console.error("Error al guardar contacto:", error);
      Alert.alert("Error", "No se pudo guardar el contacto");
    }
  };

  // Función para eliminar un contacto
  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'contacts', contactToDelete.id));
      setDeleteModalVisible(false);
      setContactToDelete(null);
      
      // Actualizar la lista de contactos
      fetchContacts(currentUser.uid);
      Alert.alert("Éxito", "Contacto eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar contacto:", error);
      Alert.alert("Error", "No se pudo eliminar el contacto");
    }
  };

  // Función para mostrar modal de edición con datos del contacto seleccionado
  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setContactName(contact.name || '');
    setContactRelationship(contact.relationship || '');
    setContactPhone(contact.phone || '');
    setContactImage(contact.image || 'https://framerusercontent.com/images/1ftrwTmj2lvEOrBgGUKkzzNyL6E.png?scale-down-to=512');
    setEditMode(true);
    setModalVisible(true);
  };

  // Función para abrir modal de eliminación
  const openDeleteModal = (contact) => {
    setContactToDelete(contact);
    setDeleteModalVisible(true);
  };

  // Función para resetear formulario y cerrar modal
  const resetFormAndCloseModal = () => {
    setContactName('');
    setContactRelationship('');
    setContactPhone('');
    setContactImage('https://framerusercontent.com/images/1ftrwTmj2lvEOrBgGUKkzzNyL6E.png?scale-down-to=512');
    setSelectedContact(null);
    setEditMode(false);
    setModalVisible(false);
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

  // Componente para mostrar cada contacto
  const renderContact = ({ item }) => (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => handleEditContact(item)}
      onLongPress={() => openDeleteModal(item)}
    >
      <Image source={{ uri: item.image || 'https://framerusercontent.com/images/1ftrwTmj2lvEOrBgGUKkzzNyL6E.png?scale-down-to=512' }} style={styles.contactImage} />
      <View style={styles.contactInfo}>
        <Text style={styles.contactText}>{item.name}</Text>
        {item.relationship && (
          <Text style={styles.relationshipText}>{item.relationship}</Text>
        )}
        <Text style={styles.phoneText}>{item.phone}</Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteIconButton}
        onPress={() => openDeleteModal(item)}
      >
        <Icon name="delete" size={24} color="#d90429" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Componente para mostrar mensaje cuando no hay contactos
  const EmptyContactsList = () => (
    <View style={styles.emptyContainer}>
      <IconIon name="people-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No hay contactos</Text>
      <Text style={styles.emptySubtext}>Agrega contactos tocando el botón de abajo</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header con menú */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 Contactos</Text>
        <CustomMenu />
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0077b6" />
            <Text style={styles.loadingText}>Cargando contactos...</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={EmptyContactsList}
            contentContainerStyle={contacts.length === 0 && styles.emptyListContainer}
          />
        )}

        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => {
            resetFormAndCloseModal();
            setModalVisible(true);
          }}
        >
          <IconIon name="add" size={30} color="#fff" />
        </TouchableOpacity>

        {/* Modal para agregar/editar contacto */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={resetFormAndCloseModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>
                {editMode ? 'Editar Contacto' : 'Nuevo Contacto'}
              </Text>
              <Image
                source={{ uri: contactImage }}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.editIcon}>
                <Icon name="edit" size={20} color="#0077b6" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Nombre:</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Nombre del contacto" 
                value={contactName}
                onChangeText={setContactName}
              />
              
              <Text style={styles.inputLabel}>Relación:</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Familiar, amigo, etc." 
                value={contactRelationship}
                onChangeText={setContactRelationship}
              />
              
              <Text style={styles.inputLabel}>Teléfono:</Text>
              <TextInput
                style={styles.input}
                placeholder="Número de teléfono"
                keyboardType="phone-pad"
                value={contactPhone}
                onChangeText={setContactPhone}
              />
              
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={resetFormAndCloseModal}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddContact}
                >
                  <Text style={styles.buttonText}>
                    {editMode ? 'Actualizar' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de confirmación de eliminación */}
        <Modal
          visible={deleteModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.confirmModalContent}>
              <Text style={styles.confirmTitle}>Eliminar Contacto</Text>
              <Text style={styles.confirmText}>
                ¿Estás seguro de que deseas eliminar a{' '}
                <Text style={styles.confirmName}>{contactToDelete?.name}</Text>?
              </Text>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setDeleteModalVisible(false);
                    setContactToDelete(null);
                  }}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={handleDeleteContact}
                >
                  <Text style={styles.buttonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    backgroundColor: '#f5f5f5',
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
    padding: 12,
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
  contactInfo: {
    flex: 1,
  },
  contactText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  relationshipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
  },
  deleteIconButton: {
    padding: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0077b6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d90429',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmName: {
    fontWeight: 'bold',
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
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#daeaf6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#0077b6',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  deleteButton: {
    backgroundColor: '#d90429',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default ContactsScreen;
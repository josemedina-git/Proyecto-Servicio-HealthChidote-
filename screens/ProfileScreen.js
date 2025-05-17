// screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, db } from '../firebase/FirebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const ProfileScreen = ({ navigation }) => {
  // Estados para los datos del perfil
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [direccion, setDireccion] = useState('');
  const [edad, setEdad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');
  
  // Estados para enfermedades crónicas
  const [enfermedadesCronicas, setEnfermedadesCronicas] = useState({
    diabetes: false,
    hipertension: false,
    cardiopatias: false,
    cancer: false,
    enfermedadRenal: false,
    enfermedadRespiratoria: false,
    otras: false
  });
  
  // Estado para otras enfermedades (si el usuario selecciona "otras")
  const [otrasEnfermedades, setOtrasEnfermedades] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userDocData, setUserDocData] = useState(null);
  
  useEffect(() => {
    // Verificar si hay un usuario autenticado
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigation.replace("Login");
      } else {
        setCurrentUser(user);
        fetchUserProfile(user.uid);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Función para obtener el perfil del usuario
  const fetchUserProfile = async (userId) => {
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserDocData(userData); // Guardamos todos los datos para no perder campos existentes
        
        // Cargar datos del perfil
        setNombre(userData.nombre || '');
        setApellidoPaterno(userData.apellidoPaterno || '');
        setApellidoMaterno(userData.apellidoMaterno || '');
        setDireccion(userData.direccion || '');
        setEdad(userData.edad ? userData.edad.toString() : '');
        setTelefono(userData.telefono || '');
        setPeso(userData.peso ? userData.peso.toString() : '');
        setEstatura(userData.estatura ? userData.estatura.toString() : '');
        
        // Cargar enfermedades crónicas o inicializar si no existen
        setEnfermedadesCronicas(
          userData.enfermedadesCronicas || {
            diabetes: false,
            hipertension: false,
            cardiopatias: false,
            cancer: false,
            enfermedadRenal: false,
            enfermedadRespiratoria: false,
            otras: false
          }
        );
        
        setOtrasEnfermedades(userData.otrasEnfermedades || '');
        
        // Si hay datos, inicialmente no estamos en modo edición
        setIsEditing(false);
      } else {
        // Si no existe el documento, mostrar una alerta
        Alert.alert(
          "Perfil no encontrado", 
          "No se encontró tu perfil de usuario. Por favor, crea uno nuevo.",
          [{ text: "OK", onPress: () => setIsEditing(true) }]
        );
      }
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      Alert.alert("Error", "No se pudo cargar tu perfil");
    } finally {
      setLoading(false);
    }
  };
  
  // Función para guardar el perfil del usuario
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Preparar los nuevos datos del perfil
      const profileData = {
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        direccion,
        edad: edad ? parseInt(edad) : null,
        telefono,
        peso: peso ? parseFloat(peso) : null,
        estatura: estatura ? parseFloat(estatura) : null,
        enfermedadesCronicas,
        otrasEnfermedades: enfermedadesCronicas.otras ? otrasEnfermedades : '',
        updatedAt: new Date()
      };
      
      // Preservar los datos existentes y solo actualizar los campos nuevos
      const updatedUserData = userDocData ? 
        { ...userDocData, ...profileData } : 
        { 
          ...profileData, 
          createdAt: new Date(),
          email: currentUser.email
        };
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updatedUserData);
      
      Alert.alert("Éxito", "Perfil guardado correctamente");
      setIsEditing(false);
      setUserDocData(updatedUserData);
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      Alert.alert("Error", "No se pudo guardar tu perfil");
    } finally {
      setSaving(false);
    }
  };
  
  // Validación del formulario
  const validateForm = () => {
    if (!nombre.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return false;
    }
    
    if (!apellidoPaterno.trim()) {
      Alert.alert("Error", "El apellido paterno es obligatorio");
      return false;
    }
    
    if (enfermedadesCronicas.otras && !otrasEnfermedades.trim()) {
      Alert.alert("Error", "Por favor especifica las otras enfermedades");
      return false;
    }
    
    return true;
  };
  
  // Toggle para una enfermedad
  const toggleEnfermedad = (enfermedad) => {
    setEnfermedadesCronicas(prev => ({
      ...prev,
      [enfermedad]: !prev[enfermedad]
    }));
  };
  
  // Componente para cada casilla de verificación
  const CheckboxItem = ({ label, value, onToggle }) => (
    <TouchableOpacity 
      style={styles.checkboxContainer} 
      onPress={onToggle}
      disabled={!isEditing}
    >
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Icon name="check" size={16} color="#fff" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
  
  // Renderizar campo de texto
  const renderTextField = (label, value, onChangeText, keyboardType = 'default', multiline = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[
            styles.input, 
            multiline && styles.multilineInput
          ]}
          value={value}
          onChangeText={onChangeText}
          editable={isEditing}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'No especificado'}</Text>
      )}
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077b6" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Perfil de Usuario</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Icon name={isEditing ? "close" : "edit"} size={24} color="#0077b6" />
            </TouchableOpacity>
          </View>
          
          {/* Sección de datos personales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos Personales</Text>
            
            {renderTextField('Nombre', nombre, setNombre)}
            {renderTextField('Apellido Paterno', apellidoPaterno, setApellidoPaterno)}
            {renderTextField('Apellido Materno', apellidoMaterno, setApellidoMaterno)}
            {renderTextField('Dirección', direccion, setDireccion)}
            {renderTextField('Edad', edad, setEdad, 'numeric')}
            {renderTextField('Teléfono', telefono, setTelefono, 'phone-pad')}
          </View>
          
          {/* Sección de medidas corporales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medidas Corporales</Text>
            
            {renderTextField('Peso (kg)', peso, setPeso, 'decimal-pad')}
            {renderTextField('Estatura (cm)', estatura, setEstatura, 'decimal-pad')}
          </View>
          
          {/* Sección de enfermedades crónicas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enfermedades Crónicas</Text>
            
            <CheckboxItem 
              label="Diabetes" 
              value={enfermedadesCronicas.diabetes} 
              onToggle={() => toggleEnfermedad('diabetes')} 
            />
            
            <CheckboxItem 
              label="Hipertensión" 
              value={enfermedadesCronicas.hipertension} 
              onToggle={() => toggleEnfermedad('hipertension')} 
            />
            
            <CheckboxItem 
              label="Cardiopatías" 
              value={enfermedadesCronicas.cardiopatias} 
              onToggle={() => toggleEnfermedad('cardiopatias')} 
            />
            
            <CheckboxItem 
              label="Cáncer" 
              value={enfermedadesCronicas.cancer} 
              onToggle={() => toggleEnfermedad('cancer')} 
            />
            
            <CheckboxItem 
              label="Enfermedad Renal" 
              value={enfermedadesCronicas.enfermedadRenal} 
              onToggle={() => toggleEnfermedad('enfermedadRenal')} 
            />
            
            <CheckboxItem 
              label="Enfermedad Respiratoria" 
              value={enfermedadesCronicas.enfermedadRespiratoria} 
              onToggle={() => toggleEnfermedad('enfermedadRespiratoria')} 
            />
            
            <CheckboxItem 
              label="Otras" 
              value={enfermedadesCronicas.otras} 
              onToggle={() => toggleEnfermedad('otras')} 
            />
            
            {enfermedadesCronicas.otras && (
              <View style={styles.otrasContainer}>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Especifique otras enfermedades"
                    value={otrasEnfermedades}
                    onChangeText={setOtrasEnfermedades}
                    multiline={true}
                    editable={isEditing}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{otrasEnfermedades}</Text>
                )}
              </View>
            )}
          </View>
          
          {isEditing && (
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar Perfil</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 10,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0077b6',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0077b6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#0077b6',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  otrasContainer: {
    marginTop: 8,
    marginLeft: 34,
  },
  saveButton: {
    backgroundColor: '#0077b6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonText: {
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
});

export default ProfileScreen;
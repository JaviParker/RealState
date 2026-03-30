import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../services/auth';
import { getVerificationKey, validateUser } from '../services/firestore';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#555555',
  primary: '#000000',
  accent: '#9A6C42',
  border: '#E0E0E0',
  lightBackground: '#F7F7F7',
  placeholder: '#999999',
};

export default function ValidationScreen() {
  const [inputKey, setInputKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  
  const { user, loading, isAdmin, isValidated, setIsValidated } = useAuth();
  const router = useRouter();

  // Redirect if already validated or admin
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.replace('/');
      return;
    }

    if (isAdmin) {
      router.replace('/admin');
      return;
    }

    if (isValidated) {
      router.replace('/(tabs)/home');
      return;
    }
  }, [user, loading, isAdmin, isValidated, router]);

  const handleValidate = async () => {
    if (!inputKey || inputKey.trim() === '') {
      Alert.alert("Campo Vacío", "Por favor ingresa la llave de seguridad.");
      return;
    }

    if (inputKey.length !== 13) {
      Alert.alert("Llave Inválida", "La llave de seguridad debe tener exactamente 13 caracteres.");
      return;
    }

    setIsValidating(true);
    try {
      // Obtenemos la llave secreta actual de la BD
      const currentSecret = await getVerificationKey();
      
      if (inputKey === currentSecret) {
        // Marcamos al usuario como validado en Firestore
        const success = await validateUser(user.uid, user.email);
        
        if (success) {
          Alert.alert("Éxito", "Has sido verificado correctamente.", [
            { 
                text: "Entrar", 
                onPress: () => {
                    setIsValidated(true); // actualizamos el context
                    router.replace('/(tabs)/home');
                }
            }
          ]);
        } else {
          Alert.alert("Error", "Ocurrió un problema guardando tu verificación. Intenta de nuevo.");
        }
      } else {
        Alert.alert("Llave Incorrecta", "La llave proporcionada no coincide. Pide acceso a tu administrador.");
      }
    } catch (error) {
       Alert.alert("Error", "Ocurrió un error inesperado al validar.");
    } finally {
       setIsValidating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      router.replace('/');
    } catch (error) {
      Alert.alert("Error", "Hubo un problema cerrando sesión.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentView}
      >
        <MaterialIcons name="security" size={60} color={COLORS.accent} style={styles.icon} />
        
        <Text style={styles.title}>Verificación de Seguridad</Text>
        <Text style={styles.subtitle}>
          Tu cuenta ha sido creada exitosamente. Para poder ingresar al sistema, necesitas una {"\n"}<Text style={{fontWeight: 'bold', color: COLORS.text}}>Llave de 13 caracteres</Text> proporcionada por el Administrador.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ingresa los 13 caracteres"
          placeholderTextColor={COLORS.placeholder}
          value={inputKey}
          onChangeText={setInputKey}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={13}
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleValidate}
          disabled={isValidating}
        >
          {isValidating ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.buttonText}>Validar y Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Regresar a Login</Text>
        </TouchableOpacity>
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentView: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  input: {
    height: 55,
    backgroundColor: COLORS.lightBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: 2, // Hace que los caracteres se separen un poco
  },
  button: {
    height: 55,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 15,
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
  }
});

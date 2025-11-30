import React, { useState } from 'react'; // Agregamos useState
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator, // Agregamos ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { logOut } from '../../services/auth';

const COLORS = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#555555',
  accent: '#9A6C42',
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Estado para controlar el proceso

  const handleLogout = async () => {
    setIsLoggingOut(true); // Bloqueamos el botón y mostramos carga
    try {
      await logOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      // ESTA ES LA CLAVE:
      // Usamos 'finally' para asegurar que la redirección ocurra
      // incluso si hubo un error o si el usuario ya es null.
      
      // Pequeño delay para asegurar que el ciclo de render termine
      setTimeout(() => {
        router.replace('/'); // Redirigimos al login
      }, 500);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenido agente</Text>
        
        {/* Mostramos el email solo si existe, si no, un texto fijo o nada */}
        <Text style={styles.email}>
          {user?.email || 'Agent'} 
        </Text>

        <TouchableOpacity 
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]} 
          onPress={handleLogout}
          disabled={isLoggingOut} // Deshabilitar para evitar doble click
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <Text style={styles.logoutButtonText}>Salir</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  email: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  info: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 40,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row', // Para centrar el spinner
    justifyContent: 'center',
    minWidth: 100,
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
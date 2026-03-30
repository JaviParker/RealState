import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  FlatList,
  Switch,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../services/auth';
import { getVerificationKey, generateVerificationKey, getAllUsers, toggleUserValidation } from '../services/firestore';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

const COLORS = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#555555',
  primary: '#000000',
  accent: '#9A6C42',
  border: '#E0E0E0',
  success: '#4CAF50',
  danger: '#F44336'
};

export default function AdminScreen() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Security Gate
  useEffect(() => {
    if (loading) return;
    
    // Si no está logueado o no es admin, lo expulsamos
    if (!user || !isAdmin) {
      router.replace('/');
    } else {
      fetchCurrentKey();
    }
  }, [user, loading, isAdmin, router]);

  const fetchCurrentKey = async () => {
    setIsFetching(true);
    const key = await getVerificationKey();
    setSecretKey(key);
    await fetchUsers(); // load users right after
    setIsFetching(false);
  };

  const fetchUsers = async () => {
    const list = await getAllUsers();
    setUsersList(list);
  };

  const handleToggleValidation = async (uid: string, currentState: boolean, email: string) => {
    // Optimistic UI update for immediate feedback
    setUsersList(prev => prev.map(u => u.id === uid ? { ...u, isValidated: !currentState } : u));
    
    const success = await toggleUserValidation(uid, currentState);
    if (!success) {
        Alert.alert("Error", `No se pudo actualizar el estado de ${email}`);
        fetchUsers(); // revert on failure
    }
  };

  const handleGenerateNewKey = async () => {
    Alert.alert(
      "¿Generar Nueva Llave?",
      "Al generar una nueva llave, los nuevos usuarios que intenten registrarse deberán usar esta nueva contraseña. La anterior dejará de funcionar.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, Generar", 
          style: "destructive",
          onPress: async () => {
            setIsGenerating(true);
            const newKey = await generateVerificationKey();
            if (newKey) {
              setSecretKey(newKey);
              Alert.alert("Éxito", "Nueva llave generada exitosamente.");
            } else {
              Alert.alert("Error", "No se pudo generar la nueva llave.");
            }
            setIsGenerating(false);
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await logOut();
      router.replace('/');
    } catch (error) {
      Alert.alert("Error", "Hubo un problema cerrando sesión.");
    }
  };

  if (loading || isFetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel de Control</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <FontAwesome5 name="user-shield" size={60} color={COLORS.accent} style={styles.icon} />
        <Text style={styles.title}>Super Administrador</Text>
        <Text style={styles.subtitle}>
          Aquí puedes ver o cambiar la llave de acceso para que los nuevos agentes puedan entrar a la aplicación.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>LLAVE DE SEGURIDAD ACTUAL</Text>
          <View style={styles.keyContainer}>
            <Text style={styles.keyValue}>{secretKey}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleGenerateNewKey}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color={COLORS.background} />
              <Text style={styles.buttonText}>Generar Nueva Llave</Text>
            </>
          )}
        </TouchableOpacity>

        {/* LISTA DE USUARIOS */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>Gestión de Agentes</Text>
          <FlatList
            data={usersList}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.userCard}>
                <View style={styles.userInfo}>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <Text style={[styles.userStatus, { color: item.isValidated ? COLORS.success : COLORS.danger }]}>
                    {item.isValidated ? "✓ Permitido" : "✗ Bloqueado"}
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: "#d3d3d3", true: COLORS.success }}
                  thumbColor={"#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={() => handleToggleValidation(item.id, item.isValidated, item.email)}
                  value={item.isValidated}
                />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <Text style={{ textAlign: 'center', color: COLORS.textSecondary, marginTop: 20 }}>
                Aún no hay usuarios registrados.
              </Text>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logoutButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 30,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 1.5,
  },
  keyContainer: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.success,
    width: '100%',
    alignItems: 'center',
  },
  keyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.success,
    letterSpacing: 2,
  },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  usersSection: {
    flex: 1, // Tomas the remaining height
    width: '100%',
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.text,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 12,
    fontWeight: '600',
  }
});

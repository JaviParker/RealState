import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { logOut } from '../../services/auth';
import { obtenerCotizacionesGlobales } from '../../services/firestore'; // <--- NUEVA FUNCIÓN
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#555555',
  accent: '#9A6C42',
  cardBg: '#F9F9F9',
  success: '#28a745',
  info: '#17a2b8',
  warning: '#ffc107',
  danger: '#dc3545'
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeQuotes, setActiveQuotes] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- CARGAR DATOS GLOBALES ---
  const cargarDashboard = async () => {
    try {
      const datos = await obtenerCotizacionesGlobales();
      setActiveQuotes(datos);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  // Recargar cada vez que volvemos a la pantalla Home
  useFocusEffect(
    useCallback(() => {
      cargarDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarDashboard();
  };

  // --- LOGOUT ---
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
    } catch (error) {
      console.error("Error logout:", error);
    } finally {
      setTimeout(() => router.replace('/'), 500);
    }
  };

  // --- RENDERIZADO DE TARJETA GLOBAL ---
  const renderQuoteCard = ({ item }: { item: any }) => {
    // Color del badge según estado
    let badgeColor = COLORS.textSecondary;
    let badgeBg = '#E0E0E0';
    
    if (item.estado === 'confirmada') { badgeColor = COLORS.info; badgeBg = '#E0F7FA'; }
    else if (item.estado === 'construcción') { badgeColor = COLORS.warning; badgeBg = '#FFF3E0'; }
    else if (item.estado === 'pagada') { badgeColor = COLORS.success; badgeBg = '#E8F5E9'; }

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9}
        onPress={() => {
            // Reutilizamos la pantalla de detalle enviando los datos
            router.push({
                pathname: '../Workflow/quoteDetail',
                params: { cotizacion: JSON.stringify(item) }
            });
        }}
      >
        {/* Imagen y Estado */}
        <View style={styles.cardTop}>
            <Image 
                source={{ uri: item.propiedad?.imagen || 'https://via.placeholder.com/150' }} 
                style={styles.propImage} 
            />
            <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.statusText, { color: badgeColor }]}>{item.estado?.toUpperCase()}</Text>
            </View>
        </View>

        {/* Info Principal */}
        <View style={styles.cardBody}>
            <Text style={styles.propTitle} numberOfLines={1}>{item.propiedad?.titulo}</Text>
            
            <View style={styles.infoRow}>
                <FontAwesome5 name="user-tie" size={12} color={COLORS.textSecondary} />
                <Text style={styles.infoText}> Vendedor: {item.agente?.email?.split('@')[0]}</Text>
            </View>
            
            <View style={styles.infoRow}>
                <FontAwesome5 name="user" size={12} color={COLORS.textSecondary} />
                <Text style={styles.infoText}> Cliente: {item.cliente?.nombre}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <Text style={styles.totalLabel}>Total Venta</Text>
                <Text style={styles.totalPrice}>${item.total?.toLocaleString()}</Text>
            </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER FIJO */}
      <View style={styles.headerContainer}>
        <View>
            <Text style={styles.welcomeText}>Bienvenido,</Text>
            <Text style={styles.agentEmail} numberOfLines={1}>{user?.email}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="log-out-outline" size={24} color="#FFF" />}
        </TouchableOpacity>
      </View>

      {/* CONTENIDO SCROLLABLE */}
      <View style={styles.contentContainer}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            <Text style={styles.sectionSubtitle}>Ventas globales en proceso</Text>
        </View>

        {loadingData ? (
            <ActivityIndicator size="large" color={COLORS.accent} style={{marginTop: 50}} />
        ) : (
            <FlatList
                data={activeQuotes}
                renderItem={renderQuoteCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <FontAwesome5 name="clipboard-check" size={40} color="#DDD" />
                        <Text style={styles.emptyText}>No hay ventas activas por el momento.</Text>
                        <Text style={styles.emptySubText}>Las cotizaciones "pendientes" no aparecen aquí.</Text>
                    </View>
                }
            />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Header Estilo Dashboard
  headerContainer: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  welcomeText: { fontSize: 14, color: COLORS.textSecondary },
  agentEmail: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, maxWidth: 200 },
  
  logoutButton: {
    backgroundColor: COLORS.text, // Botón negro elegante
    padding: 10,
    borderRadius: 12,
    elevation: 2
  },
  logoutButtonDisabled: { opacity: 0.7 },

  // Contenido
  contentContainer: { flex: 1, backgroundColor: '#FAFAFA' }, // Fondo gris muy claro para contraste
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  sectionSubtitle: { fontSize: 14, color: COLORS.textSecondary },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },

  // Card Estilo Dashboard
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden'
  },
  cardTop: { height: 120, width: '100%', position: 'relative' },
  propImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  statusBadge: {
    position: 'absolute',
    top: 10, right: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden'
  },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  cardBody: { padding: 15 },
  propTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, marginLeft: 6 },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase' },
  totalPrice: { fontSize: 18, fontWeight: 'bold', color: COLORS.accent },

  emptyState: { alignItems: 'center', marginTop: 60, padding: 20 },
  emptyText: { color: COLORS.text, fontWeight: 'bold', marginTop: 10, fontSize: 16 },
  emptySubText: { color: COLORS.textSecondary, marginTop: 5, textAlign: 'center' }
});
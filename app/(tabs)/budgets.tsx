import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext'; // Para saber quién está logueado
import { obtenerMisCotizaciones } from '../../services/firestore';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router'; // Para recargar al volver a la pestaña

const COLORS = {
  background: '#FFFFFF', text: '#000000', textLight: '#666666',
  accent: '#9A6C42', cardBg: '#F9F9F9',
  success: '#28a745', warning: '#ffc107'
};

export default function BudgetsScreen() {
  const { user } = useAuth();
  const [cotizaciones, setCotizaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Función para cargar datos
  const cargarDatos = async () => {
    if (!user) return;
    try {
      const datos = await obtenerMisCotizaciones(user.uid);
      setCotizaciones(datos);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Recargar cada vez que entramos a la pantalla
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const renderCotizacion = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: item.propiedad?.imagen || 'https://via.placeholder.com/150' }} 
          style={styles.propImage} 
        />
        <View style={styles.headerInfo}>
          <Text style={styles.propTitle} numberOfLines={1}>{item.propiedad?.titulo}</Text>
          <Text style={styles.clientName}>
            <FontAwesome5 name="user" size={12} color={COLORS.textLight} /> {item.cliente?.nombre}
          </Text>
          <Text style={styles.date}>
            {new Date(item.fecha?.seconds * 1000).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.estado?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View>
            <Text style={styles.label}>Total Cotizado</Text>
            <Text style={styles.totalPrice}>${item.total?.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="visibility" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>Mis Cotizaciones</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={cotizaciones}
          renderItem={renderCotizacion}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
                <FontAwesome5 name="folder-open" size={50} color="#DDD" />
                <Text style={styles.emptyText}>No tienes cotizaciones guardadas.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleContainer: { padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  listContent: { padding: 15 },
  
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', marginBottom: 10 },
  propImage: { width: 60, height: 60, borderRadius: 10, marginRight: 15 },
  headerInfo: { flex: 1, justifyContent: 'center' },
  propTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  clientName: { fontSize: 14, color: COLORS.textLight, marginBottom: 2 },
  date: { fontSize: 12, color: '#999' },
  
  statusBadge: { 
    backgroundColor: '#FFF3CD', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 5, 
    alignSelf: 'flex-start',
    height: 24,
    justifyContent: 'center'
  },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#856404' },

  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 10 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, color: COLORS.textLight },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: COLORS.success },
  
  actionButton: {
    backgroundColor: COLORS.accent,
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: COLORS.textLight, marginTop: 10, fontSize: 16 }
});
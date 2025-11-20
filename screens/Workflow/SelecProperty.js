import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { obtenerPropiedades, sembrarPropiedades } from '../../services/firestore'; // Ajusta ruta
import { FontAwesome5 } from '@expo/vector-icons';

// --- COLORES DE LUJO ---
const COLORS = {
  background: '#FFFFFF',
  text: '#000000',
  textLight: '#666666',
  accent: '#9A6C42', // Café madera
  cardBg: '#F9F9F9',
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8; // La tarjeta ocupa el 80% del ancho

export default function SelectProperty() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await obtenerPropiedades();
      setProperties(data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las propiedades");
    } finally {
      setLoading(false);
    }
  };

  // Función temporal para crear la tabla en Firebase
  const handleSembrar = async () => {
    setLoading(true);
    const success = await sembrarPropiedades();
    if (success) {
      Alert.alert("Éxito", "Base de datos poblada. Recargando...");
      await cargarDatos();
    } else {
      Alert.alert("Error", "Falló la carga de datos iniciales");
      setLoading(false);
    }
  };

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      {/* Imagen Principal */}
      <Image source={{ uri: item.imagen }} style={styles.cardImage} />
      
      <View style={styles.cardContent}>
        {/* Precio y Título */}
        <Text style={styles.price}>${item.precio?.toLocaleString()}</Text>
        <Text style={styles.title}>{item.titulo}</Text>
        <Text style={styles.address}>{item.direccion}</Text>

        {/* Detalles (Iconos) */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <FontAwesome5 name="bed" size={16} color={COLORS.accent} />
            <Text style={styles.detailText}>{item.habitaciones} Hab</Text>
          </View>
          <View style={styles.detailItem}>
            <FontAwesome5 name="bath" size={16} color={COLORS.accent} />
            <Text style={styles.detailText}>{item.banos} Baños</Text>
          </View>
          <View style={styles.detailItem}>
            <FontAwesome5 name="ruler-combined" size={16} color={COLORS.accent} />
            <Text style={styles.detailText}>{item.metrosTerreno} m²</Text>
          </View>
        </View>

        {/* Botón Seleccionar */}
        <TouchableOpacity style={styles.selectButton}>
          <Text style={styles.selectButtonText}>Seleccionar Propiedad</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ marginTop: 10 }}>Cargando catálogo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Catálogo de Propiedades</Text>
      <Text style={styles.headerSubtitle}>Desliza para ver opciones</Text>

      {properties.length === 0 ? (
        // Botón temporal por si la base de datos está vacía
        <View style={styles.emptyContainer}>
          <Text>No hay propiedades registradas.</Text>
          <TouchableOpacity style={styles.seedButton} onPress={handleSembrar}>
            <Text style={styles.seedButtonText}>Generar Datos de Prueba (Admin)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Carrusel de Propiedades
        <FlatList
          data={properties}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 20} // Ancho tarjeta + margen
          decelerationRate="fast"
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 20,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginLeft: 20,
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5, // Sombra para Android
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 20,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 5,
  },
  address: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 15,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  selectButton: {
    backgroundColor: COLORS.text, // Negro
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectButtonText: {
    color: COLORS.background, // Blanco
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seedButton: {
    marginTop: 20,
    backgroundColor: 'red', // Color de alerta para botón admin
    padding: 15,
    borderRadius: 10,
  },
  seedButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
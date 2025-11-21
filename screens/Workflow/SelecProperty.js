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
  Alert,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
// Importamos la nueva función actualizarPropiedad
import { obtenerPropiedades, sembrarPropiedades, agregarPropiedad, actualizarPropiedad } from '../../services/firestore'; 
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';

// --- COLORES DE LUJO ---
const COLORS = {
  background: '#FFFFFF',
  text: '#000000',
  textLight: '#666666',
  accent: '#9A6C42', // Café madera
  cardBg: '#F9F9F9',
  inputBg: '#F0F0F0',
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

export default function SelectProperty() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal y Formulario
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null); // NULL = Creando, ID = Editando

  const [form, setForm] = useState({
    titulo: '',
    direccion: '',
    precio: '',
    habitaciones: '',
    banos: '',
    metrosTerreno: '',
    descripcion: '',
    imagen: 'https://images.unsplash.com/photo-1600596542815-22b489997b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  });

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

  const handleSembrar = async () => {
    setLoading(true);
    const success = await sembrarPropiedades();
    if (success) {
      Alert.alert("Éxito", "Base de datos poblada.");
      await cargarDatos();
    }
  };

  // --- ABRIR MODAL PARA CREAR ---
  const abrirModalCrear = () => {
    setEditingId(null); // Modo crear
    setForm({ // Limpiar
      titulo: '', direccion: '', precio: '', habitaciones: '', banos: '', metrosTerreno: '', descripcion: '', 
      imagen: 'https://images.unsplash.com/photo-1600596542815-22b489997b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    });
    setModalVisible(true);
  };

  // --- ABRIR MODAL PARA EDITAR ---
  const abrirModalEditar = (item) => {
    setEditingId(item.id); // Modo editar
    setForm({
      titulo: item.titulo,
      direccion: item.direccion,
      precio: item.precio.toString(), // Convertir a string para el input
      habitaciones: item.habitaciones.toString(),
      banos: item.banos.toString(),
      metrosTerreno: item.metrosTerreno.toString(),
      descripcion: item.descripcion || '',
      imagen: item.imagen
    });
    setModalVisible(true);
  };

  // --- GUARDAR (CREAR O ACTUALIZAR) ---
  const handleGuardarPropiedad = async () => {
    if (!form.titulo || !form.precio || !form.direccion) {
      Alert.alert("Faltan datos", "Por favor completa título, precio y dirección.");
      return;
    }

    setUploading(true);

    const datosProcesados = {
      ...form,
      precio: parseFloat(form.precio) || 0,
      habitaciones: parseInt(form.habitaciones) || 0,
      banos: parseFloat(form.banos) || 0,
      metrosTerreno: parseFloat(form.metrosTerreno) || 0,
    };

    let success = false;

    if (editingId) {
      // ESTAMOS EDITANDO
      success = await actualizarPropiedad(editingId, datosProcesados);
    } else {
      // ESTAMOS CREANDO
      success = await agregarPropiedad(datosProcesados);
    }

    if (success) {
      Alert.alert("Éxito", `Propiedad ${editingId ? 'actualizada' : 'creada'} correctamente`);
      setModalVisible(false);
      cargarDatos();
    } else {
      Alert.alert("Error", "No se pudo guardar los cambios");
    }
    setUploading(false);
  };

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imagen }} style={styles.cardImage} />
      
      {/* Botón de Editar sobre la imagen o en la esquina */}
      <TouchableOpacity 
        style={styles.editButtonCard} 
        onPress={() => abrirModalEditar(item)}
      >
        <MaterialIcons name="edit" size={20} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.cardContent}>
        <Text style={styles.price}>${item.precio?.toLocaleString()}</Text>
        <Text style={styles.title} numberOfLines={1}>{item.titulo}</Text>
        <Text style={styles.address} numberOfLines={1}>{item.direccion}</Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <FontAwesome5 name="bed" size={14} color={COLORS.accent} />
            <Text style={styles.detailText}>{item.habitaciones} Hab</Text>
          </View>
          <View style={styles.detailItem}>
            <FontAwesome5 name="bath" size={14} color={COLORS.accent} />
            <Text style={styles.detailText}>{item.banos} Baños</Text>
          </View>
          <View style={styles.detailItem}>
            <FontAwesome5 name="ruler-combined" size={14} color={COLORS.accent} />
            <Text style={styles.detailText}>{item.metrosTerreno} m²</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.selectButton}>
          <Text style={styles.selectButtonText}>Seleccionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Catálogo de Propiedades</Text>
      <Text style={styles.headerSubtitle}>Desliza para ver opciones</Text>

      {loading ? (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : properties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text>No hay propiedades registradas.</Text>
          <TouchableOpacity style={styles.seedButton} onPress={handleSembrar}>
            <Text style={styles.seedButtonText}>Generar Datos de Prueba</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 20}
          decelerationRate="fast"
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* FAB para CREAR */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={abrirModalCrear}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              {/* Título dinámico */}
              <Text style={styles.modalTitle}>
                {editingId ? "Editar Propiedad" : "Nueva Propiedad"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }}>
              <Text style={styles.label}>Título de la Propiedad</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ej. Casa de Campo" 
                value={form.titulo}
                onChangeText={(text) => setForm({...form, titulo: text})}
              />

              <Text style={styles.label}>Dirección</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Dirección completa" 
                value={form.direccion}
                onChangeText={(text) => setForm({...form, direccion: text})}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Precio ($)</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="0.00" 
                        keyboardType="numeric"
                        value={form.precio}
                        onChangeText={(text) => setForm({...form, precio: text})}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Metros (m²)</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="0" 
                        keyboardType="numeric"
                        value={form.metrosTerreno}
                        onChangeText={(text) => setForm({...form, metrosTerreno: text})}
                    />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Habitaciones</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="0" 
                        keyboardType="numeric"
                        value={form.habitaciones}
                        onChangeText={(text) => setForm({...form, habitaciones: text})}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Baños</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="0" 
                        keyboardType="numeric"
                        value={form.banos}
                        onChangeText={(text) => setForm({...form, banos: text})}
                    />
                </View>
              </View>

               <Text style={styles.label}>URL de Imagen (Temporal)</Text>
               <TextInput 
                style={styles.input} 
                placeholder="https://..." 
                value={form.imagen}
                onChangeText={(text) => setForm({...form, imagen: text})}
              />

              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleGuardarPropiedad}
                disabled={uploading}
              >
                {uploading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.saveButtonText}>
                        {editingId ? "Actualizar Cambios" : "Guardar Propiedad"}
                    </Text>
                )}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>
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
    elevation: 5,
    overflow: 'hidden',
    position: 'relative', // Necesario para posicionar el botón de editar
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  // ESTILO NUEVO: Botón de editar en la tarjeta
  editButtonCard: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: COLORS.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 }
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
    backgroundColor: COLORS.text,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectButtonText: {
    color: COLORS.background,
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
    backgroundColor: COLORS.accent,
    padding: 15,
    borderRadius: 10,
  },
  seedButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    height: '85%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: COLORS.text,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: COLORS.text,
    padding: 18,
    borderRadius: 15,
    marginTop: 30,
    marginBottom: 40,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  }
});
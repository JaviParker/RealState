import React, { useEffect, useState } from "react";
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
  ScrollView,
} from "react-native";
import {
  obtenerPropiedades,
  sembrarPropiedades,
  agregarPropiedad,
  actualizarPropiedad,
} from "../../services/firestore";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';

// --- COLORES ---
const COLORS = {
  background: "#FFFFFF",
  text: "#000000",
  textLight: "#666666",
  accent: "#9A6C42",
  cardBg: "#F9F9F9",
  inputBg: "#F0F0F0",
  success: "#28a745",
  danger: "#dc3545",
  inactive: "#CCCCCC",
};

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

export default function SelectProperty() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS FORMULARIO ---
  const [modalFormVisible, setModalFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    titulo: "",
    direccion: "",
    precio: "",
    habitaciones: "",
    banos: "",
    metrosTerreno: "",
    imagen: "", // Campo para la URL de la imagen
    items: [],
  });

  // --- ESTADOS COTIZADOR ---
  const [modalItemsVisible, setModalItemsVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

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
      Alert.alert("Datos Generados", "Base de datos reiniciada.");
      await cargarDatos();
    }
  };

  // ==========================================
  // LÓGICA DE GESTIÓN DE ITEMS
  // ==========================================

  const agregarItemAlForm = () => {
    setForm({
      ...form,
      items: [...form.items, { nombre: "", costo: "" }],
    });
  };

  const borrarItemDelForm = (index) => {
    const nuevosItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: nuevosItems });
  };

  const actualizarItemDelForm = (index, campo, texto) => {
    const nuevosItems = [...form.items];
    nuevosItems[index] = { ...nuevosItems[index], [campo]: texto };
    setForm({ ...form, items: nuevosItems });
  };

  // ==========================================

  const abrirModalCrear = () => {
    setEditingId(null);
    setForm({
      titulo: "",
      direccion: "",
      precio: "",
      habitaciones: "",
      banos: "",
      metrosTerreno: "",
      imagen: "", // Limpiamos la imagen
      items: [],
    });
    setModalFormVisible(true);
  };

  const abrirModalEditar = (item) => {
    setEditingId(item.id);
    setForm({
      titulo: item.titulo,
      direccion: item.direccion,
      precio: item.precio.toString(),
      habitaciones: item.habitaciones.toString(),
      banos: item.banos.toString(),
      metrosTerreno: item.metrosTerreno.toString(),
      imagen: item.imagen || "", // Cargamos la imagen existente
      items: item.items
        ? item.items.map((i) => ({ ...i, costo: i.costo.toString() }))
        : [],
    });
    setModalFormVisible(true);
  };

  const handleGuardarPropiedad = async () => {
    if (!form.titulo || !form.precio)
      return Alert.alert("Error", "Completa los campos requeridos");

    setSaving(true);
    try {
      const itemsProcesados = form.items.map((item, index) => ({
        id: item.id || `item_${Date.now()}_${index}`,
        nombre: item.nombre || "Item sin nombre",
        costo: parseFloat(item.costo) || 0,
      }));

      const datosProcesados = {
        ...form,
        // Usamos la imagen del form, si está vacía usamos la default
        imagen:
          form.imagen && form.imagen.trim() !== ""
            ? form.imagen
            : DEFAULT_IMAGE,
        precio: parseFloat(form.precio) || 0,
        habitaciones: parseInt(form.habitaciones) || 0,
        banos: parseFloat(form.banos) || 0,
        metrosTerreno: parseFloat(form.metrosTerreno) || 0,
        items: itemsProcesados,
      };

      let success = false;
      if (editingId) {
        success = await actualizarPropiedad(editingId, datosProcesados);
      } else {
        success = await agregarPropiedad(datosProcesados);
      }

      if (success) {
        setModalFormVisible(false);
        cargarDatos();
        Alert.alert("Éxito", "Propiedad guardada correctamente");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Falló al guardar");
    } finally {
      setSaving(false);
    }
  };

  // --- LÓGICA COTIZADOR ---
  const abrirModalItems = (item) => {
    setSelectedProperty(item);
    setSelectedItemIds([]);
    setModalItemsVisible(true);
  };

  const toggleItemSelection = (itemId) => {
    if (selectedItemIds.includes(itemId)) {
      setSelectedItemIds(selectedItemIds.filter((id) => id !== itemId));
    } else {
      setSelectedItemIds([...selectedItemIds, itemId]);
    }
  };

  const calcularTotalExtras = () => {
    if (!selectedProperty?.items) return 0;
    return selectedProperty.items
      .filter((item) => selectedItemIds.includes(item.id))
      .reduce((acc, item) => acc + item.costo, 0);
  };

  // --- NAVEGACIÓN A COTIZACIÓN FINAL ---
const irACotizacion = (propiedad, itemsElegidosIds = []) => {
    // Filtramos los objetos completos de los items basados en los IDs seleccionados
    const itemsObj = propiedad.items ? propiedad.items.filter(i => itemsElegidosIds.includes(i.id)) : [];

    // Cerramos modales por si acaso
    setModalItemsVisible(false);

    // Navegamos pasando los datos como string JSON
    router.push({
        pathname: '/Workflow/createQuote',
        params: { 
            propiedad: JSON.stringify(propiedad),
            items: JSON.stringify(itemsObj)
        }
    });
};

  // --- RENDER ---
  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imagen || DEFAULT_IMAGE }}
        style={styles.cardImage}
      />
      <TouchableOpacity
        style={styles.editButtonCard}
        onPress={() => abrirModalEditar(item)}
      >
        <MaterialIcons name="edit" size={20} color="#FFF" />
      </TouchableOpacity>
      <View style={styles.cardContent}>
        <Text style={styles.price}>${item.precio?.toLocaleString()}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {item.titulo}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {item.direccion}
        </Text>
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>{item.habitaciones} Hab</Text>
          <Text style={styles.detailText}>{item.banos} Baños</Text>
          <Text style={styles.detailText}>{item.metrosTerreno} m²</Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.itemsButton}
            onPress={() => abrirModalItems(item)}
          >
            <FontAwesome5 name="list" size={14} color={COLORS.text} />
            <Text style={styles.itemsButtonText}>Cotizar Extras</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectButton} onPress={() => irACotizacion(item, [])}>
            <Text style={styles.selectButtonText}>Seleccionar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Cotizador de Propiedades</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.accent}
          style={{ marginTop: 50 }}
        />
      ) : properties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text>No hay datos.</Text>
          <TouchableOpacity style={styles.seedButton} onPress={handleSembrar}>
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Generar Datos
            </Text>
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

      <TouchableOpacity style={styles.fab} onPress={abrirModalCrear}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* --- MODAL 1: FORMULARIO --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalFormVisible}
        onRequestClose={() => setModalFormVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Editar" : "Nueva"} Propiedad
              </Text>
              <TouchableOpacity onPress={() => setModalFormVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Datos Básicos */}
              <Text style={styles.sectionHeader}>Datos Generales</Text>
              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Casa Moderna"
                value={form.titulo}
                onChangeText={(t) => setForm({ ...form, titulo: t })}
              />

              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                placeholder="Calle..."
                value={form.direccion}
                onChangeText={(t) => setForm({ ...form, direccion: t })}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Precio Base</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={form.precio}
                    onChangeText={(t) => setForm({ ...form, precio: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Metros (m²)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={form.metrosTerreno}
                    onChangeText={(t) => setForm({ ...form, metrosTerreno: t })}
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
                    onChangeText={(t) => setForm({ ...form, habitaciones: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Baños</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={form.banos}
                    onChangeText={(t) => setForm({ ...form, banos: t })}
                  />
                </View>
              </View>

              {/* INPUT DE IMAGEN RESTAURADO */}
              <Text style={styles.label}>URL Imagen (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                value={form.imagen}
                onChangeText={(t) => setForm({ ...form, imagen: t })}
              />

              <View style={styles.divider} />

              {/* --- SECCIÓN DE ITEMS --- */}
              {/* Solo dejamos el título, quitamos el botón duplicado que estaba aquí */}
              <Text style={styles.sectionHeader}>Configuración de Extras</Text>

              {form.items.map((item, index) => (
                <View key={index} style={styles.itemInputRow}>
                  <View style={{ flex: 2, marginRight: 5 }}>
                    <TextInput
                      style={styles.inputSmall}
                      placeholder="Nombre Item"
                      value={item.nombre}
                      onChangeText={(text) =>
                        actualizarItemDelForm(index, "nombre", text)
                      }
                    />
                  </View>
                  <View style={{ flex: 1, marginRight: 5 }}>
                    <TextInput
                      style={styles.inputSmall}
                      placeholder="$ Costo"
                      keyboardType="numeric"
                      value={item.costo}
                      onChangeText={(text) =>
                        actualizarItemDelForm(index, "costo", text)
                      }
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => borrarItemDelForm(index)}
                    style={styles.deleteItemBtn}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={COLORS.danger}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {form.items.length === 0 && (
                <Text
                  style={{
                    color: COLORS.textLight,
                    fontStyle: "italic",
                    marginBottom: 10,
                  }}
                >
                  Sin items adicionales configurados.
                </Text>
              )}

              <TouchableOpacity
                style={styles.addItemButtonFull}
                onPress={agregarItemAlForm}
              >
                <Text style={styles.addItemButtonText}>
                  + Agregar Nuevo Item
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleGuardarPropiedad}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 2: COTIZADOR --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalItemsVisible}
        onRequestClose={() => setModalItemsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: "70%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Personalizar Extras</Text>
              <TouchableOpacity onPress={() => setModalItemsVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.propertyName}>{selectedProperty?.titulo}</Text>
            <Text style={styles.basePrice}>
              Precio Base: ${selectedProperty?.precio?.toLocaleString()}
            </Text>

            <View style={styles.divider} />
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textLight,
                marginBottom: 10,
              }}
            >
              Selecciona los adicionales que deseas:
            </Text>

            <ScrollView>
              {selectedProperty?.items && selectedProperty.items.length > 0 ? (
                selectedProperty.items.map((item, index) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.itemRow,
                        isSelected && styles.itemRowSelected,
                      ]}
                      onPress={() => toggleItemSelection(item.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <Ionicons
                          name={isSelected ? "checkbox" : "square-outline"}
                          size={24}
                          color={isSelected ? COLORS.accent : COLORS.inactive}
                        />
                        <Text
                          style={[
                            styles.itemName,
                            isSelected && { fontWeight: "bold" },
                          ]}
                        >
                          {item.nombre}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.itemPrice,
                          !isSelected && { color: COLORS.textLight },
                        ]}
                      >
                        + ${item.costo?.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text
                  style={{ textAlign: "center", color: "#999", marginTop: 20 }}
                >
                  Sin items extras disponibles.
                </Text>
              )}
            </ScrollView>

            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total con Extras:</Text>
              <Text style={styles.totalPrice}>
                $
                {(
                  (selectedProperty?.precio || 0) + calcularTotalExtras()
                ).toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity style={styles.quoteButton} onPress={() => irACotizacion(selectedProperty, selectedItemIds)}>
              <Text style={styles.quoteButtonText}>CONFIRMAR COTIZACIÓN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 20 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 20,
    marginBottom: 10,
  },
  listContent: { paddingHorizontal: 10, paddingBottom: 30 },

  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    marginHorizontal: 10,
    elevation: 5,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 200, resizeMode: "cover" },
  cardContent: { padding: 20 },
  price: { fontSize: 22, fontWeight: "bold", color: COLORS.accent },
  title: { fontSize: 18, fontWeight: "bold", color: COLORS.text },
  address: { fontSize: 14, color: COLORS.textLight, marginBottom: 10 },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  detailText: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  editButtonCard: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: COLORS.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  buttonsContainer: { flexDirection: "row", gap: 10 },
  itemsButton: {
    flex: 1,
    backgroundColor: "#E0E0E0",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  itemsButtonText: { color: COLORS.text, fontWeight: "bold", fontSize: 14 },
  selectButton: {
    flex: 1,
    backgroundColor: COLORS.text,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  selectButtonText: {
    color: COLORS.background,
    fontWeight: "bold",
    fontSize: 14,
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    height: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold" },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textLight,
    marginBottom: 5,
  },
  rowInputs: { flexDirection: "row" },
  saveButton: {
    backgroundColor: COLORS.text,
    padding: 18,
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  seedButton: {
    marginTop: 20,
    backgroundColor: COLORS.accent,
    padding: 15,
    borderRadius: 10,
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 10,
  },
  itemInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  inputSmall: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    width: "100%",
  },
  deleteItemBtn: { padding: 10, backgroundColor: "#ffe6e6", borderRadius: 8 },
  addItemButtonFull: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  addItemButtonText: { color: COLORS.text, fontWeight: "bold" },

  propertyName: { fontSize: 18, fontWeight: "600", color: COLORS.text },
  basePrice: { fontSize: 16, color: COLORS.textLight, marginBottom: 15 },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 15 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  itemRowSelected: { backgroundColor: "#FAF3EB", borderRadius: 8 },
  itemName: { fontSize: 16, color: COLORS.text },
  itemPrice: { fontSize: 16, fontWeight: "bold", color: COLORS.success },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  totalLabel: { fontSize: 18, fontWeight: "bold" },
  totalPrice: { fontSize: 22, fontWeight: "bold", color: COLORS.accent },
  quoteButton: {
    backgroundColor: COLORS.accent,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  quoteButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});

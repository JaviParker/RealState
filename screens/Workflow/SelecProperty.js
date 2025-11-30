import React, { useEffect, useState, useRef } from "react";
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
import { useRouter } from "expo-router";
import {
  obtenerPropiedades,
  sembrarPropiedades,
  agregarPropiedad,
  actualizarPropiedad,
} from "../../services/firestore";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";

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
const CARD_IMAGE_HEIGHT = 200;
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

// COMPONENTE CARRUSEL
const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);
  const validImages = images && images.length > 0 ? images : [DEFAULT_IMAGE];

  const goToNext = () =>
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  const goToPrev = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + validImages.length) % validImages.length
    );

  useEffect(() => {
    if (validImages.length > 1) startTimer();
    return () => stopTimer();
  }, [validImages.length]);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(goToNext, 3000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleManualNext = () => {
    stopTimer();
    goToNext();
    startTimer();
  };
  const handleManualPrev = () => {
    stopTimer();
    goToPrev();
    startTimer();
  };

  return (
    <View style={styles.carouselContainer}>
      <Image
        source={{ uri: validImages[currentIndex] }}
        style={styles.cardImage}
      />
      {validImages.length > 1 && (
        <>
          <TouchableOpacity
            style={[styles.arrowBtn, styles.arrowLeft]}
            onPress={handleManualPrev}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.arrowBtn, styles.arrowRight]}
            onPress={handleManualNext}
          >
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.pagination}>
            {validImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex ? styles.paginationDotActive : null,
                ]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
};

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
    imagenes: [""],
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
      Alert.alert("Datos Actualizados", "Base de datos reiniciada.");
      await cargarDatos();
    }
  };

  // --- NAVEGACIÓN A COTIZACIÓN ---
  const irACotizacion = (propiedad, itemsElegidosIds = []) => {
    const itemsObj = propiedad.items
      ? propiedad.items.filter((i) => itemsElegidosIds.includes(i.id))
      : [];

    // FIX CRÍTICO: Seleccionamos la primera imagen del carrusel para que la siguiente pantalla tenga portada
    const imagenPortada =
      propiedad.imagenes && propiedad.imagenes.length > 0
        ? propiedad.imagenes[0]
        : DEFAULT_IMAGE;

    const propiedadParaCotizar = {
      ...propiedad,
      imagen: imagenPortada, // Agregamos este campo para compatibilidad
    };

    setModalItemsVisible(false);
    router.push({
      pathname: "/Workflow/createQuote",
      params: {
        propiedad: JSON.stringify(propiedadParaCotizar),
        items: JSON.stringify(itemsObj),
      },
    });
  };

  // --- GESTIÓN FORMULARIO ---
  const agregarCampoImagen = () =>
    setForm({ ...form, imagenes: [...form.imagenes, ""] });
  const actualizarCampoImagen = (text, index) => {
    const nuevas = [...form.imagenes];
    nuevas[index] = text;
    setForm({ ...form, imagenes: nuevas });
  };
  const borrarCampoImagen = (index) => {
    const nuevas = form.imagenes.filter((_, i) => i !== index);
    setForm({ ...form, imagenes: nuevas });
  };

  const agregarItemAlForm = () =>
    setForm({ ...form, items: [...form.items, { nombre: "", costo: "" }] });
  const borrarItemDelForm = (index) => {
    const nuevos = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: nuevos });
  };
  const actualizarItemDelForm = (index, campo, texto) => {
    const nuevos = [...form.items];
    nuevos[index] = { ...nuevos[index], [campo]: texto };
    setForm({ ...form, items: nuevos });
  };

  const abrirModalCrear = () => {
    setEditingId(null);
    setForm({
      titulo: "",
      direccion: "",
      precio: "",
      habitaciones: "",
      banos: "",
      metrosTerreno: "",
      imagenes: [""],
      items: [],
    });
    setModalFormVisible(true);
  };

  const abrirModalEditar = (item) => {
    setEditingId(item.id);
    let imagenesForm =
      item.imagenes && item.imagenes.length > 0 ? item.imagenes : [""];
    setForm({
      titulo: item.titulo,
      direccion: item.direccion,
      precio: item.precio.toString(),
      habitaciones: item.habitaciones.toString(),
      banos: item.banos.toString(),
      metrosTerreno: item.metrosTerreno.toString(),
      imagenes: imagenesForm,
      items: item.items
        ? item.items.map((i) => ({ ...i, costo: i.costo.toString() }))
        : [],
    });
    setModalFormVisible(true);
  };

  const handleGuardarPropiedad = async () => {
    if (!form.titulo || !form.precio)
      return Alert.alert("Error", "Completa campos requeridos");
    setSaving(true);
    try {
      const imagenesProcesadas = form.imagenes.filter(
        (url) => url && url.trim() !== ""
      );
      const itemsProcesados = form.items.map((item, index) => ({
        id: item.id || `item_${Date.now()}_${index}`,
        nombre: item.nombre || "Item",
        costo: parseFloat(item.costo) || 0,
      }));
      const datos = {
        ...form,
        imagenes: imagenesProcesadas,
        items: itemsProcesados,
        precio: parseFloat(form.precio) || 0,
        habitaciones: parseInt(form.habitaciones) || 0,
        banos: parseFloat(form.banos) || 0,
        metrosTerreno: parseFloat(form.metrosTerreno) || 0,
      };
      delete datos.imagen; // Limpieza

      let success = editingId
        ? await actualizarPropiedad(editingId, datos)
        : await agregarPropiedad(datos);
      if (success) {
        setModalFormVisible(false);
        cargarDatos();
        Alert.alert("Éxito", "Guardado");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Falló al guardar");
    } finally {
      setSaving(false);
    }
  };

  // --- GESTIÓN COTIZADOR ---
  const abrirModalItems = (item) => {
    setSelectedProperty(item);
    setSelectedItemIds([]);
    setModalItemsVisible(true);
  };
  const toggleItemSelection = (id) =>
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  const calcularTotalExtras = () => {
    if (!selectedProperty?.items) return 0;
    return selectedProperty.items
      .filter((i) => selectedItemIds.includes(i.id))
      .reduce((acc, i) => acc + i.costo, 0);
  };

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <ImageCarousel
        images={item.imagenes || (item.imagen ? [item.imagen] : [])}
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
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => irACotizacion(item, [])}
          >
            <Text style={styles.selectButtonText}>Seleccionar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Catálogo</Text>
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

      {/* MODAL FORMULARIO */}
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
              <Text style={styles.sectionHeader}>Datos Generales</Text>
              <TextInput
                style={styles.input}
                placeholder="Título"
                value={form.titulo}
                onChangeText={(t) => setForm({ ...form, titulo: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Dirección"
                value={form.direccion}
                onChangeText={(t) => setForm({ ...form, direccion: t })}
              />
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 5 }]}
                  placeholder="Precio"
                  keyboardType="numeric"
                  value={form.precio}
                  onChangeText={(t) => setForm({ ...form, precio: t })}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Metros"
                  keyboardType="numeric"
                  value={form.metrosTerreno}
                  onChangeText={(t) => setForm({ ...form, metrosTerreno: t })}
                />
              </View>
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 5 }]}
                  placeholder="Hab"
                  keyboardType="numeric"
                  value={form.habitaciones}
                  onChangeText={(t) => setForm({ ...form, habitaciones: t })}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Baños"
                  keyboardType="numeric"
                  value={form.banos}
                  onChangeText={(t) => setForm({ ...form, banos: t })}
                />
              </View>

              <View style={styles.divider} />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <Text style={styles.sectionHeader}>Galería</Text>
                <TouchableOpacity
                  onPress={agregarCampoImagen}
                  style={styles.addItemLink}
                >
                  <Text style={{ color: COLORS.accent, fontWeight: "bold" }}>
                    + URL
                  </Text>
                </TouchableOpacity>
              </View>
              {form.imagenes.map((url, index) => (
                <View key={index} style={styles.itemInputRow}>
                  <TextInput
                    style={[styles.inputSmall, { flex: 1, marginRight: 5 }]}
                    placeholder={`URL ${index + 1}`}
                    value={url}
                    onChangeText={(t) => actualizarCampoImagen(t, index)}
                  />
                  {form.imagenes.length > 1 && (
                    <TouchableOpacity
                      onPress={() => borrarCampoImagen(index)}
                      style={styles.deleteItemBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={COLORS.danger}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <View style={styles.divider} />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <Text style={styles.sectionHeader}>Extras</Text>
                <TouchableOpacity
                  onPress={agregarItemAlForm}
                  style={styles.addItemLink}
                >
                  <Text style={{ color: COLORS.accent, fontWeight: "bold" }}>
                    + Item
                  </Text>
                </TouchableOpacity>
              </View>
              {form.items.map((item, index) => (
                <View key={index} style={styles.itemInputRow}>
                  <TextInput
                    style={[styles.inputSmall, { flex: 2, marginRight: 5 }]}
                    placeholder="Nombre"
                    value={item.nombre}
                    onChangeText={(t) =>
                      actualizarItemDelForm(index, "nombre", t)
                    }
                  />
                  <TextInput
                    style={[styles.inputSmall, { flex: 1, marginRight: 5 }]}
                    placeholder="$"
                    keyboardType="numeric"
                    value={item.costo}
                    onChangeText={(t) =>
                      actualizarItemDelForm(index, "costo", t)
                    }
                  />
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

      {/* MODAL COTIZADOR */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalItemsVisible}
        onRequestClose={() => setModalItemsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: "70%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Extras</Text>
              <TouchableOpacity onPress={() => setModalItemsVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.propertyName}>{selectedProperty?.titulo}</Text>
            <Text style={styles.basePrice}>
              Base: ${selectedProperty?.precio?.toLocaleString()}
            </Text>
            <View style={styles.divider} />
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
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 10,
                          alignItems: "center",
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
                  Sin extras.
                </Text>
              )}
            </ScrollView>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalPrice}>
                $
                {(
                  (selectedProperty?.precio || 0) + calcularTotalExtras()
                ).toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.quoteButton}
              onPress={() => irACotizacion(selectedProperty, selectedItemIds)}
            >
              <Text style={styles.quoteButtonText}>CONFIRMAR</Text>
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
  carouselContainer: {
    width: "100%",
    height: CARD_IMAGE_HEIGHT,
    position: "relative",
  },
  cardImage: { width: "100%", height: "100%", resizeMode: "cover" },
  arrowBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    backgroundColor: "rgba(0,0,0,0.3)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowLeft: { left: 10 },
  arrowRight: { right: 10 },
  pagination: {
    position: "absolute",
    bottom: 10,
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    gap: 5,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  paginationDotActive: {
    backgroundColor: COLORS.accent,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
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
    zIndex: 10,
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
  deleteItemBtn: {
    padding: 10,
    backgroundColor: "#ffe6e6",
    borderRadius: 8,
    marginLeft: 5,
  },
  addItemLink: { padding: 5 },
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

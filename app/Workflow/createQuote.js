import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Modal
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import {
  guardarCotizacion,
  obtenerEquipos,
  sembrarEquipos,
  agregarEquipo,
  actualizarEquipo,
  eliminarEquipo,
  actualizarPropiedad // <--- IMPORTANTE: Necesitamos esto para guardar los cambios en los items
} from "../../services/firestore";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";

const COLORS = {
  background: "#FFFFFF", text: "#000000", textLight: "#666666",
  accent: "#9A6C42", cardBg: "#F9F9F9", inputBg: "#F0F0F0",
  success: "#28a745", danger: "#dc3545", activeItem: "#FAF3EB"
};

export default function CreateQuote() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(false);

  // Parseamos datos iniciales
  const propiedad = params.propiedad ? JSON.parse(params.propiedad) : null;

  // --- ESTADOS ITEMS (AHORA SON DINÁMICOS) ---
  const [itemsDisponibles, setItemsDisponibles] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // --- ESTADOS EQUIPOS ---
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // --- MODAL EQUIPO (CRUD) ---
  const [modalVisible, setModalVisible] = useState(false);
  const [teamForm, setTeamForm] = useState({ nombre: '', lider: '', costoSemanal: '', tiempoEstimado: '', imagen: '' });
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [savingTeam, setSavingTeam] = useState(false);

  // --- MODAL ITEM (CRUD) --- <--- NUEVO
  const [modalItemVisible, setModalItemVisible] = useState(false);
  const [itemForm, setItemForm] = useState({ id: '', nombre: '', costo: '', imagen: '' });
  const [savingItem, setSavingItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);

  const [cliente, setCliente] = useState({ nombre: "", telefono: "", correo: "" });

  // INICIALIZACIÓN
  useEffect(() => {
    // 1. Cargar items de la propiedad
    if (propiedad?.items) {
        setItemsDisponibles(propiedad.items);
    }
    
    // 2. Marcar items pre-seleccionados
    if (params.items) {
        const preSelected = JSON.parse(params.items);
        const ids = preSelected.map(i => i.id);
        setSelectedItemIds(ids);
    }

    // 3. Cargar equipos
    cargarEquipos();
  }, []);

  // --- CÁLCULOS ---
  const calcularTotalExtras = () => {
    return itemsDisponibles
        .filter(item => selectedItemIds.includes(item.id))
        .reduce((acc, item) => acc + item.costo, 0);
  };

  const precioFinal = (propiedad?.precio || 0) + calcularTotalExtras();

  // --- CARGAR EQUIPOS ---
  const cargarEquipos = async () => {
    setLoadingTeams(true);
    let datos = await obtenerEquipos();
    if (datos.length === 0) { await sembrarEquipos(); datos = await obtenerEquipos(); }
    setTeams(datos);
    setLoadingTeams(false);
  };

  // --- LÓGICA SELECCIÓN ITEMS ---
  const toggleItemSelection = (id) => {
    if (selectedItemIds.includes(id)) {
        setSelectedItemIds(selectedItemIds.filter(itemId => itemId !== id));
    } else {
        setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  // ==========================================
  // CRUD ITEMS (EXTRAS)
  // ==========================================
  
  const abrirModalCrearItem = () => {
    setIsEditingItem(false);
    setItemForm({ id: '', nombre: '', costo: '', imagen: '' });
    setModalItemVisible(true);
  };

  const abrirModalEditarItem = (item) => {
    setIsEditingItem(true);
    setItemForm({
        id: item.id,
        nombre: item.nombre,
        costo: item.costo.toString(),
        imagen: item.imagen
    });
    setModalItemVisible(true);
  };

  const handleGuardarItem = async () => {
    if (!itemForm.nombre || !itemForm.costo) return Alert.alert("Faltan datos", "Nombre y Costo requeridos");
    
    setSavingItem(true);
    
    // 1. Crear el objeto item actualizado
    const nuevoItem = {
        id: isEditingItem ? itemForm.id : `item_${Date.now()}`,
        nombre: itemForm.nombre,
        costo: parseFloat(itemForm.costo) || 0,
        imagen: itemForm.imagen || ""
    };

    // 2. Actualizar el array local
    let nuevosItems = [];
    if (isEditingItem) {
        nuevosItems = itemsDisponibles.map(i => i.id === nuevoItem.id ? nuevoItem : i);
    } else {
        nuevosItems = [...itemsDisponibles, nuevoItem];
    }

    // 3. Guardar en Firebase (Actualizamos la PROPIEDAD completa)
    // Nota: Esto actualiza la propiedad original, afectando futuras cotizaciones, lo cual es correcto para un CMS.
    const success = await actualizarPropiedad(propiedad.id, { items: nuevosItems });

    if (success) {
        setItemsDisponibles(nuevosItems);
        setModalItemVisible(false);
        Alert.alert("Éxito", "Lista de extras actualizada");
    } else {
        Alert.alert("Error", "No se pudo actualizar la base de datos");
    }
    setSavingItem(false);
  };

  const handleEliminarItem = (id) => {
    Alert.alert("Eliminar Extra", "¿Seguro que deseas quitar este acabado?", [
        { text: "Cancelar" },
        { 
            text: "Eliminar", style: "destructive", 
            onPress: async () => {
                const nuevosItems = itemsDisponibles.filter(i => i.id !== id);
                // Actualizar DB
                const success = await actualizarPropiedad(propiedad.id, { items: nuevosItems });
                if (success) {
                    setItemsDisponibles(nuevosItems);
                    // También quitarlo de la selección si estaba marcado
                    if (selectedItemIds.includes(id)) {
                        setSelectedItemIds(selectedItemIds.filter(sid => sid !== id));
                    }
                } else {
                    Alert.alert("Error", "No se pudo eliminar");
                }
            }
        }
    ]);
  };

  // ==========================================
  // CRUD EQUIPOS
  // ==========================================
  const abrirModalCrearEquipo = () => { setEditingTeamId(null); setTeamForm({ nombre: '', lider: '', costoSemanal: '', tiempoEstimado: '', imagen: '' }); setModalVisible(true); };
  const abrirModalEditarEquipo = (equipo) => { setEditingTeamId(equipo.id); setTeamForm({ nombre: equipo.nombre, lider: equipo.lider, costoSemanal: equipo.costoSemanal.toString(), tiempoEstimado: equipo.tiempoEstimado, imagen: equipo.imagen }); setModalVisible(true); };
  
  const handleGuardarEquipo = async () => {
      if (!teamForm.nombre || !teamForm.costoSemanal) return Alert.alert("Faltan datos", "Nombre y Costo obligatorios");
      setSavingTeam(true);
      const datos = { ...teamForm, costoSemanal: parseFloat(teamForm.costoSemanal) || 0 };
      let success = editingTeamId ? await actualizarEquipo(editingTeamId, datos) : await agregarEquipo(datos);
      if (success) { setModalVisible(false); cargarEquipos(); Alert.alert("Éxito", "Equipo guardado"); } 
      else { Alert.alert("Error", "No se pudo guardar"); }
      setSavingTeam(false);
  };

  const handleEliminarEquipo = (id) => {
      Alert.alert("Eliminar", "¿Seguro?", [{ text: "Cancelar" }, { text: "Eliminar", style: "destructive", onPress: async () => { await eliminarEquipo(id); if (selectedTeam?.id === id) setSelectedTeam(null); cargarEquipos(); }}]);
  };

  // --- GUARDAR COTIZACIÓN ---
  const handleGuardarCotizacion = async () => {
    if (!cliente.nombre || !cliente.telefono || !cliente.correo) return Alert.alert("Faltan datos", "Llena info cliente.");
    if (!selectedTeam) return Alert.alert("Falta Equipo", "Selecciona un equipo.");

    setLoading(true);
    const itemsFinales = itemsDisponibles.filter(i => selectedItemIds.includes(i.id));

    const datosCotizacion = {
      agente: { uid: user?.uid, email: user?.email },
      cliente: cliente,
      propiedad: {
        id: propiedad.id, titulo: propiedad.titulo, direccion: propiedad.direccion,
        precioBase: propiedad.precio, imagen: propiedad.imagen,
      },
      itemsAdicionales: itemsFinales,
      equipoDesarrollo: selectedTeam,
      total: precioFinal,
    };

    const exito = await guardarCotizacion(datosCotizacion);
    if (exito) { Alert.alert("¡Éxito!", "Cotización guardada.", [{ text: "OK", onPress: () => router.replace("/(tabs)/budgets") }]); } 
    else { Alert.alert("Error", "No se pudo guardar."); }
    setLoading(false);
  };

  // --- RENDERIZADO: ITEM CARD (CON BOTONES) ---
  const renderItemCard = ({ item }) => {
    const isSelected = selectedItemIds.includes(item.id);
    return (
        <TouchableOpacity 
            style={[styles.smallCard, isSelected && styles.cardSelected]}
            onPress={() => toggleItemSelection(item.id)}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.imagen || 'https://via.placeholder.com/150' }} style={styles.cardImage} />
            
            {/* BOTONES DE EDICIÓN PARA ITEMS */}
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => abrirModalEditarItem(item)}>
                    <MaterialIcons name="edit" size={14} color={COLORS.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleEliminarItem(item.id)}>
                    <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                </TouchableOpacity>
            </View>

            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.nombre}</Text>
                <Text style={[styles.cardPrice, isSelected && {color: COLORS.accent}]}>
                    + ${item.costo?.toLocaleString()}
                </Text>
            </View>
            <View style={styles.selectionCheck}>
                <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color={isSelected ? COLORS.accent : COLORS.textLight} />
            </View>
        </TouchableOpacity>
    );
  };

  // --- RENDERIZADO: TEAM CARD ---
  const renderTeamCard = ({ item }) => {
    const isSelected = selectedTeam?.id === item.id;
    return (
      <TouchableOpacity style={[styles.teamCard, isSelected && styles.teamCardSelected]} onPress={() => setSelectedTeam(item)} activeOpacity={0.8}>
        <Image source={{ uri: item.imagen }} style={styles.teamImage} />
        <View style={styles.teamActions}>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => abrirModalEditarEquipo(item)}><MaterialIcons name="edit" size={16} color={COLORS.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleEliminarEquipo(item.id)}><Ionicons name="trash-outline" size={16} color={COLORS.danger} /></TouchableOpacity>
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName} numberOfLines={1}>{item.nombre}</Text>
          <Text style={styles.teamLeader} numberOfLines={1}>{item.lider}</Text>
          <View style={styles.teamDetailRow}><FontAwesome5 name="clock" size={12} color={COLORS.textLight} /><Text style={styles.teamDetailText}>{item.tiempoEstimado}</Text></View>
          <View style={styles.teamDetailRow}><FontAwesome5 name="money-bill-wave" size={12} color={COLORS.success} /><Text style={[styles.teamDetailText, { color: COLORS.success, fontWeight: 'bold' }]}>${item.costoSemanal?.toLocaleString()}/sem</Text></View>
        </View>
        <View style={styles.selectionCheck}>
          <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={24} color={isSelected ? COLORS.accent : COLORS.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  if (!propiedad) return <View style={styles.container}><Text>Error cargando datos</Text></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Resumen de Cotización</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propiedad Base</Text>
          <View style={styles.propCard}>
            <Text style={styles.propTitle}>{propiedad.titulo}</Text>
            <Text style={styles.propAddress}>{propiedad.direccion}</Text>
            <Text style={styles.propPrice}>${propiedad.precio?.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* --- SECCIÓN ITEMS (AHORA CON BOTONES) --- */}
        <View style={styles.section}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Text style={styles.sectionTitle}>Extras ({selectedItemIds.length})</Text>
                <Text style={{color: COLORS.accent, fontWeight:'bold'}}>+ ${calcularTotalExtras().toLocaleString()}</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Personaliza los acabados:</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {itemsDisponibles.map((item, index) => (
                    <View key={index} style={{marginRight: 12}}>
                        {renderItemCard({item})}
                    </View>
                ))}
                {/* BOTÓN AGREGAR ITEM NUEVO */}
                <TouchableOpacity style={styles.addCard} onPress={abrirModalCrearItem}>
                    <View style={styles.addIcon}><Ionicons name="add" size={24} color={COLORS.textLight} /></View>
                    <Text style={styles.addText}>Nuevo</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* --- SECCIÓN EQUIPOS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipo de Desarrollo</Text>
          <Text style={styles.sectionSubtitle}>Selecciona el equipo asignado:</Text>
          {loadingTeams ? <ActivityIndicator size="small" color={COLORS.accent} /> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamsScroll}>
              {teams.map((item) => ( <View key={item.id} style={{ marginRight: 15 }}>{renderTeamCard({ item })}</View> ))}
              <TouchableOpacity style={styles.addTeamCard} onPress={abrirModalCrearEquipo}>
                <View style={styles.addTeamIconContainer}><Ionicons name="add" size={30} color={COLORS.textLight} /></View>
                <Text style={styles.addTeamText}>Nuevo</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <TextInput style={styles.input} placeholder="Nombre Completo" value={cliente.nombre} onChangeText={(t) => setCliente({ ...cliente, nombre: t })} />
          <TextInput style={styles.input} placeholder="Teléfono" keyboardType="phone-pad" value={cliente.telefono} onChangeText={(t) => setCliente({ ...cliente, telefono: t })} />
          <TextInput style={styles.input} placeholder="Correo Electrónico" keyboardType="email-address" autoCapitalize="none" value={cliente.correo} onChangeText={(t) => setCliente({ ...cliente, correo: t })} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendedor</Text>
          <TextInput style={[styles.input, styles.readOnlyInput]} value={user?.email} editable={false} />
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>PRECIO FINAL</Text>
          <Text style={styles.totalAmount}>${precioFinal.toLocaleString()}</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleGuardarCotizacion} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>CONFIRMAR Y GUARDAR</Text>}
        </TouchableOpacity>
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* --- MODAL 1: FORMULARIO EQUIPO --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingTeamId ? "Editar Equipo" : "Nuevo Equipo"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.label}>Nombre del Equipo</Text>
              <TextInput style={styles.input} value={teamForm.nombre} onChangeText={(t) => setTeamForm({ ...teamForm, nombre: t })} />
              <Text style={styles.label}>Líder / Encargado</Text>
              <TextInput style={styles.input} value={teamForm.lider} onChangeText={(t) => setTeamForm({ ...teamForm, lider: t })} />
              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Costo Semanal ($)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={teamForm.costoSemanal} onChangeText={(t) => setTeamForm({ ...teamForm, costoSemanal: t })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Tiempo Estimado</Text>
                  <TextInput style={styles.input} value={teamForm.tiempoEstimado} onChangeText={(t) => setTeamForm({ ...teamForm, tiempoEstimado: t })} />
                </View>
              </View>
              <Text style={styles.label}>URL Foto Equipo (Opcional)</Text>
              <TextInput style={styles.input} placeholder="https://..." value={teamForm.imagen} onChangeText={(t) => setTeamForm({ ...teamForm, imagen: t })} />
              <TouchableOpacity style={styles.saveButton} onPress={handleGuardarEquipo} disabled={savingTeam}>
                {savingTeam ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Guardar Equipo</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 2: FORMULARIO ITEM (NUEVO) --- */}
      <Modal animationType="slide" transparent={true} visible={modalItemVisible} onRequestClose={() => setModalItemVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditingItem ? "Editar Extra" : "Nuevo Extra"}</Text>
              <TouchableOpacity onPress={() => setModalItemVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.label}>Nombre del Acabado</Text>
              <TextInput style={styles.input} placeholder="Ej. Alberca" value={itemForm.nombre} onChangeText={(t) => setItemForm({ ...itemForm, nombre: t })} />
              
              <Text style={styles.label}>Costo Adicional ($)</Text>
              <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={itemForm.costo} onChangeText={(t) => setItemForm({ ...itemForm, costo: t })} />
              
              <Text style={styles.label}>URL Foto (Opcional)</Text>
              <TextInput style={styles.input} placeholder="https://..." value={itemForm.imagen} onChangeText={(t) => setItemForm({ ...itemForm, imagen: t })} />

              <TouchableOpacity style={styles.saveButton} onPress={handleGuardarItem} disabled={savingItem}>
                {savingItem ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Guardar Extra</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, marginTop: 10 },
  backButton: { padding: 5, marginRight: 10 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.text },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text, marginBottom: 5 },
  sectionSubtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 10 },
  
  propCard: { backgroundColor: COLORS.cardBg, padding: 15, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: COLORS.accent },
  propTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text },
  propAddress: { fontSize: 14, color: COLORS.textLight, marginBottom: 5 },
  propPrice: { fontSize: 16, fontWeight: "bold", color: COLORS.accent },

  input: { backgroundColor: COLORS.inputBg, borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 10 },
  readOnlyInput: { backgroundColor: "#E0E0E0", color: "#555" },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 10 },
  
  // ESTILOS DE CARDS (COMPARTIDOS)
  horizontalScroll: { paddingBottom: 10 },
  teamsScroll: { paddingBottom: 10 },
  
  // Card ITEM Pequeña
  smallCard: {
    width: 140, backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 0, 
    borderWidth: 1, borderColor: '#EEE', position: 'relative', overflow: 'hidden', paddingBottom: 10
  },
  cardSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.activeItem, borderWidth: 2 },
  cardImage: { width: '100%', height: 90, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  cardInfo: { padding: 8 },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  cardPrice: { fontSize: 13, fontWeight: 'bold', color: COLORS.textLight, marginTop: 2 },
  cardActions: { position: 'absolute', top: 5, right: 5, flexDirection: 'row', gap: 5, zIndex: 10 }, // Botones edit/delete
  
  // Card EQUIPO (Similar pero con más info)
  teamCard: { width: 160, backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#EEE', position: 'relative', paddingBottom: 40 },
  teamCardSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.activeItem, borderWidth: 2 },
  teamImage: { width: '100%', height: 80, borderRadius: 8, marginBottom: 8 },
  teamActions: { position: 'absolute', top: 5, right: 5, flexDirection: 'row', gap: 5, zIndex: 10 },
  teamInfo: { gap: 2 },
  teamName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  teamLeader: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  teamDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  teamDetailText: { fontSize: 11, color: COLORS.textLight },
  
  // Comunes
  actionIconBtn: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 4, borderRadius: 12, elevation: 2 },
  selectionCheck: { position: 'absolute', bottom: 5, right: 5 }, // Para items abajo, para equipos se ajusta en su estilo

  // Botón Nuevo Genérico
  addCard: { width: 80, height: 140, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#EEE', borderStyle: 'dashed', borderRadius: 12 },
  addTeamCard: { width: 100, height: 180, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#EEE', borderStyle: 'dashed', borderRadius: 12 },
  addIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  addTeamIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  addText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textLight },
  addTeamText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textLight },

  totalContainer: { alignItems: "center", marginVertical: 20 },
  totalLabel: { fontSize: 14, color: COLORS.textLight, letterSpacing: 1 },
  totalAmount: { fontSize: 32, fontWeight: "bold", color: COLORS.text },
  saveButton: { backgroundColor: COLORS.text, padding: 18, borderRadius: 15, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 5 },
  saveButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  
  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, height: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 5 },
  rowInputs: { flexDirection: 'row' },
});
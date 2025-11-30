import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Modal
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext"; 
import { 
    guardarCotizacion, obtenerEquipos, sembrarEquipos, 
    agregarEquipo, actualizarEquipo, eliminarEquipo // <--- IMPORTAMOS LAS NUEVAS FUNCIONES
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
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // --- ESTADOS PARA MODAL EQUIPO (CRUD) ---
  const [modalVisible, setModalVisible] = useState(false);
  const [teamForm, setTeamForm] = useState({
      nombre: '', lider: '', costoSemanal: '', tiempoEstimado: '', imagen: ''
  });
  const [editingTeamId, setEditingTeamId] = useState(null); // null = creando
  const [savingTeam, setSavingTeam] = useState(false);

  // Parseamos datos
  const propiedad = params.propiedad ? JSON.parse(params.propiedad) : null;
  const itemsSeleccionados = params.items ? JSON.parse(params.items) : [];
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", correo: "" });

  const totalExtras = itemsSeleccionados.reduce((acc, item) => acc + item.costo, 0);
  const precioFinal = (propiedad?.precio || 0) + totalExtras;

  useEffect(() => { cargarEquipos(); }, []);

  const cargarEquipos = async () => {
    setLoadingTeams(true);
    let datos = await obtenerEquipos();
    if (datos.length === 0) {
        await sembrarEquipos();
        datos = await obtenerEquipos();
    }
    setTeams(datos);
    setLoadingTeams(false);
  };

  // --- FUNCIONES CRUD EQUIPOS ---

  const abrirModalCrear = () => {
      setEditingTeamId(null);
      setTeamForm({ nombre: '', lider: '', costoSemanal: '', tiempoEstimado: '', imagen: '' });
      setModalVisible(true);
  };

  const abrirModalEditar = (equipo) => {
      setEditingTeamId(equipo.id);
      setTeamForm({
          nombre: equipo.nombre,
          lider: equipo.lider,
          costoSemanal: equipo.costoSemanal.toString(),
          tiempoEstimado: equipo.tiempoEstimado,
          imagen: equipo.imagen
      });
      setModalVisible(true);
  };

  const handleGuardarEquipo = async () => {
      if (!teamForm.nombre || !teamForm.costoSemanal) return Alert.alert("Faltan datos", "Nombre y Costo son obligatorios");
      
      setSavingTeam(true);
      const datosProcesados = {
          ...teamForm,
          costoSemanal: parseFloat(teamForm.costoSemanal) || 0
      };

      let success = false;
      if (editingTeamId) {
          success = await actualizarEquipo(editingTeamId, datosProcesados);
      } else {
          success = await agregarEquipo(datosProcesados);
      }

      if (success) {
          setModalVisible(false);
          cargarEquipos();
          Alert.alert("Éxito", "Equipo guardado correctamente");
      } else {
          Alert.alert("Error", "No se pudo guardar el equipo");
      }
      setSavingTeam(false);
  };

  const handleEliminarEquipo = (id) => {
      Alert.alert(
          "Eliminar Equipo",
          "¿Estás seguro? Esta acción no se puede deshacer.",
          [
              { text: "Cancelar", style: "cancel" },
              { 
                  text: "Eliminar", 
                  style: "destructive",
                  onPress: async () => {
                      const success = await eliminarEquipo(id);
                      if (success) {
                          if (selectedTeam?.id === id) setSelectedTeam(null); // Deseleccionar si era el activo
                          cargarEquipos();
                      } else {
                          Alert.alert("Error", "No se pudo eliminar");
                      }
                  }
              }
          ]
      );
  };

  // --- GUARDAR COTIZACIÓN ---
  const handleGuardarCotizacion = async () => {
    if (!cliente.nombre || !cliente.telefono || !cliente.correo) return Alert.alert("Faltan datos", "Llena info cliente.");
    if (!selectedTeam) return Alert.alert("Falta Equipo", "Selecciona un equipo.");

    setLoading(true);
    const datosCotizacion = {
      agente: { uid: user?.uid, email: user?.email },
      cliente: cliente,
      propiedad: {
        id: propiedad.id, titulo: propiedad.titulo, direccion: propiedad.direccion,
        precioBase: propiedad.precio, imagen: propiedad.imagen,
      },
      itemsAdicionales: itemsSeleccionados,
      equipoDesarrollo: selectedTeam,
      total: precioFinal,
    };

    const exito = await guardarCotizacion(datosCotizacion);
    if (exito) {
      Alert.alert("¡Éxito!", "Cotización guardada.", [{ text: "OK", onPress: () => router.replace("/(tabs)/budgets") }]);
    } else { Alert.alert("Error", "No se pudo guardar."); }
    setLoading(false);
  };

  const renderTeamCard = ({ item }) => {
    const isSelected = selectedTeam?.id === item.id;
    return (
        <TouchableOpacity 
            style={[styles.teamCard, isSelected && styles.teamCardSelected]}
            onPress={() => setSelectedTeam(item)}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.imagen }} style={styles.teamImage} />
            <View style={styles.teamActions}>
                <TouchableOpacity style={styles.actionIconBtn} onPress={() => abrirModalEditar(item)}>
                    <MaterialIcons name="edit" size={16} color={COLORS.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleEliminarEquipo(item.id)}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                </TouchableOpacity>
            </View>
            <View style={styles.teamInfo}>
                <Text style={styles.teamName} numberOfLines={1}>{item.nombre}</Text>
                <Text style={styles.teamLeader} numberOfLines={1}>{item.lider}</Text>
                <View style={styles.teamDetailRow}>
                    <FontAwesome5 name="clock" size={12} color={COLORS.textLight} />
                    <Text style={styles.teamDetailText}>{item.tiempoEstimado}</Text>
                </View>
                <View style={styles.teamDetailRow}>
                    <FontAwesome5 name="money-bill-wave" size={12} color={COLORS.success} />
                    <Text style={[styles.teamDetailText, {color: COLORS.success, fontWeight:'bold'}]}>${item.costoSemanal?.toLocaleString()}/sem</Text>
                </View>
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
          <Text style={styles.sectionTitle}>Propiedad</Text>
          <View style={styles.propCard}>
            <Text style={styles.propTitle}>{propiedad.titulo}</Text>
            <Text style={styles.propAddress}>{propiedad.direccion}</Text>
            <Text style={styles.propPrice}>Base: ${propiedad.precio?.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extras ({itemsSeleccionados.length})</Text>
          {itemsSeleccionados.length > 0 ? itemsSeleccionados.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemText}>• {item.nombre}</Text>
                <Text style={styles.itemPrice}>+ ${item.costo?.toLocaleString()}</Text>
              </View>
            )) : <Text style={{ color: COLORS.textLight, fontStyle: "italic" }}>Sin adicionales.</Text>}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipo de Desarrollo</Text>
            <Text style={styles.sectionSubtitle}>Selecciona el equipo asignado:</Text>
            {loadingTeams ? <ActivityIndicator size="small" color={COLORS.accent} /> : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamsScroll}>
                    {teams.map((item) => ( <View key={item.id} style={{marginRight: 15}}>{renderTeamCard({item})}</View> ))}
                    <TouchableOpacity style={styles.addTeamCard} onPress={abrirModalCrear}>
                        <View style={styles.addTeamIconContainer}><Ionicons name="add" size={30} color={COLORS.textLight} /></View>
                        <Text style={styles.addTeamText}>Nuevo Equipo</Text>
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

      {/* --- MODAL FORMULARIO EQUIPO --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editingTeamId ? "Editar Equipo" : "Nuevo Equipo"}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
                </View>
                <ScrollView>
                    <Text style={styles.label}>Nombre del Equipo</Text>
                    <TextInput style={styles.input} placeholder="Ej. Los Constructores" value={teamForm.nombre} onChangeText={(t) => setTeamForm({...teamForm, nombre: t})} />
                    
                    <Text style={styles.label}>Líder / Encargado</Text>
                    <TextInput style={styles.input} placeholder="Nombre del encargado" value={teamForm.lider} onChangeText={(t) => setTeamForm({...teamForm, lider: t})} />
                    
                    <View style={styles.rowInputs}>
                        <View style={{flex:1, marginRight:10}}>
                            <Text style={styles.label}>Costo Semanal ($)</Text>
                            <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={teamForm.costoSemanal} onChangeText={(t) => setTeamForm({...teamForm, costoSemanal: t})} />
                        </View>
                        <View style={{flex:1}}>
                            <Text style={styles.label}>Tiempo Estimado</Text>
                            <TextInput style={styles.input} placeholder="Ej. 3 Semanas" value={teamForm.tiempoEstimado} onChangeText={(t) => setTeamForm({...teamForm, tiempoEstimado: t})} />
                        </View>
                    </View>

                    <Text style={styles.label}>URL Foto Equipo (Opcional)</Text>
                    <TextInput style={styles.input} placeholder="https://..." value={teamForm.imagen} onChangeText={(t) => setTeamForm({...teamForm, imagen: t})} />

                    <TouchableOpacity style={styles.saveButton} onPress={handleGuardarEquipo} disabled={savingTeam}>
                        {savingTeam ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Guardar Equipo</Text>}
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
  sectionSubtitle: { fontSize: 14, color: COLORS.textLight, marginBottom: 10 },
  propCard: { backgroundColor: COLORS.cardBg, padding: 15, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: COLORS.accent },
  propTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text },
  propAddress: { fontSize: 14, color: COLORS.textLight, marginBottom: 5 },
  propPrice: { fontSize: 16, fontWeight: "bold", color: COLORS.accent },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  itemText: { fontSize: 14, color: COLORS.text },
  itemPrice: { fontSize: 14, fontWeight: "bold", color: COLORS.success },
  input: { backgroundColor: COLORS.inputBg, borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 10 },
  readOnlyInput: { backgroundColor: "#E0E0E0", color: "#555" },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 10 },
  teamsScroll: { paddingBottom: 10 },
  teamCard: { width: 160, backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#EEE', position: 'relative', paddingBottom: 40 },
  teamCardSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.activeItem, borderWidth: 2 },
  teamImage: { width: '100%', height: 80, borderRadius: 8, marginBottom: 8 },
  teamActions: { position: 'absolute', top: 5, right: 5, flexDirection: 'row', gap: 5, zIndex: 10 },
  actionIconBtn: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 4, borderRadius: 15, elevation: 2 },
  teamInfo: { gap: 2 },
  teamName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  teamLeader: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  teamDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  teamDetailText: { fontSize: 11, color: COLORS.textLight },
  selectionCheck: { position: 'absolute', bottom: 5, right: 5 },
  addTeamCard: { width: 100, height: 180, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#EEE', borderStyle: 'dashed', borderRadius: 12 },
  addTeamIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  addTeamText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textLight, textAlign: 'center' },
  totalContainer: { alignItems: "center", marginVertical: 20 },
  totalLabel: { fontSize: 14, color: COLORS.textLight, letterSpacing: 1 },
  totalAmount: { fontSize: 32, fontWeight: "bold", color: COLORS.text },
  saveButton: { backgroundColor: COLORS.text, padding: 18, borderRadius: 15, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 5 },
  saveButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  
  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, height: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 5 },
  rowInputs: { flexDirection: 'row' },
});
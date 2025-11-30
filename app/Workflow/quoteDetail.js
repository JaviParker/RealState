import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Modal
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext"; 
import { 
    actualizarCotizacion, obtenerEquipos, sembrarEquipos 
} from "../../services/firestore";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";

const COLORS = {
  background: "#FFFFFF", text: "#000000", textLight: "#666666",
  accent: "#9A6C42", cardBg: "#F9F9F9", inputBg: "#F0F0F0",
  success: "#28a745", warning: "#ffc107", info: "#17a2b8", danger: "#dc3545",
  activeItem: "#FAF3EB"
};

const ESTADOS = ["pendiente", "confirmada", "construcción", "pagada"];

export default function QuoteDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  // Recibimos la cotización completa como string JSON
  const cotizacionInicial = params.cotizacion ? JSON.parse(params.cotizacion) : null;

  const [loading, setLoading] = useState(false);
  const [cotizacion, setCotizacion] = useState(cotizacionInicial);
  
  // Estados para equipos
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  
  // Estado para el modal de selección de estado
  const [modalStatusVisible, setModalStatusVisible] = useState(false);

  useEffect(() => {
    cargarEquipos();
  }, []);

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

  const handleGuardarCambios = async () => {
    setLoading(true);
    const exito = await actualizarCotizacion(cotizacion.id, {
        cliente: cotizacion.cliente,
        equipoDesarrollo: cotizacion.equipoDesarrollo,
        estado: cotizacion.estado
    });

    if (exito) {
      Alert.alert("¡Éxito!", "Cambios guardados correctamente.");
    } else {
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    }
    setLoading(false);
  };

  // Renderiza el Badge de estado con color dinámico
  const renderStatusBadge = () => {
    let color = COLORS.textLight;
    if (cotizacion.estado === 'confirmada') color = COLORS.info;
    if (cotizacion.estado === 'construcción') color = COLORS.warning;
    if (cotizacion.estado === 'pagada') color = COLORS.success;

    return (
        <TouchableOpacity style={[styles.statusBadge, { borderColor: color }]} onPress={() => setModalStatusVisible(true)}>
            <Text style={[styles.statusText, { color: color }]}>{cotizacion.estado?.toUpperCase()}</Text>
            <Ionicons name="chevron-down" size={16} color={color} />
        </TouchableOpacity>
    );
  };

  const renderTeamCard = (item) => {
    const isSelected = cotizacion.equipoDesarrollo?.id === item.id;
    return (
        <TouchableOpacity 
            key={item.id}
            style={[styles.teamCard, isSelected && styles.teamCardSelected]}
            onPress={() => setCotizacion({...cotizacion, equipoDesarrollo: item})}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.imagen }} style={styles.teamImage} />
            <View style={styles.teamInfo}>
                <Text style={styles.teamName} numberOfLines={1}>{item.nombre}</Text>
                <Text style={styles.teamLeader} numberOfLines={1}>{item.lider}</Text>
                <Text style={[styles.teamDetailText, {color: COLORS.success, fontWeight:'bold'}]}>
                    ${item.costoSemanal?.toLocaleString()}/sem
                </Text>
            </View>
            <View style={styles.selectionCheck}>
                <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={24} color={isSelected ? COLORS.accent : COLORS.textLight} />
            </View>
        </TouchableOpacity>
    );
  };

  if (!cotizacion) return <View style={styles.container}><Text>Error cargando datos</Text></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle Cotización</Text>
          {renderStatusBadge()}
        </View>

        {/* Resumen Propiedad (No editable) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propiedad</Text>
          <View style={styles.propCard}>
            <Image source={{uri: cotizacion.propiedad.imagen}} style={styles.propImageHeader} />
            <View style={{flex:1}}>
                <Text style={styles.propTitle}>{cotizacion.propiedad.titulo}</Text>
                <Text style={styles.propAddress}>{cotizacion.propiedad.direccion}</Text>
                <Text style={styles.propPrice}>Total: ${cotizacion.total?.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Datos Cliente (Editable) */}
        <View style={styles.section}>
          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <FontAwesome5 name="edit" size={16} color={COLORS.textLight} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={cotizacion.cliente.nombre}
            onChangeText={(t) => setCotizacion({...cotizacion, cliente: {...cotizacion.cliente, nombre: t}})}
          />
          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            keyboardType="phone-pad"
            value={cotizacion.cliente.telefono}
            onChangeText={(t) => setCotizacion({...cotizacion, cliente: {...cotizacion.cliente, telefono: t}})}
          />
          <TextInput
            style={styles.input}
            placeholder="Correo"
            keyboardType="email-address"
            value={cotizacion.cliente.correo}
            onChangeText={(t) => setCotizacion({...cotizacion, cliente: {...cotizacion.cliente, correo: t}})}
          />
        </View>

        <View style={styles.divider} />

        {/* Equipo de Trabajo (Editable) */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asignar Equipo</Text>
            {loadingTeams ? <ActivityIndicator size="small" color={COLORS.accent} /> : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamsScroll}>
                    {teams.map((item) => (
                        <View key={item.id} style={{marginRight: 15}}>
                            {renderTeamCard(item)}
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>

        <View style={styles.divider} />

        {/* Items (Solo lectura) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extras Incluidos</Text>
          {cotizacion.itemsAdicionales && cotizacion.itemsAdicionales.length > 0 ? (
            cotizacion.itemsAdicionales.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemText}>• {item.nombre}</Text>
                <Text style={styles.itemPrice}>+ ${item.costo?.toLocaleString()}</Text>
              </View>
            ))
          ) : <Text style={{ color: COLORS.textLight, fontStyle: "italic" }}>Sin adicionales.</Text>}
        </View>

        {/* Agente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendedor Asignado</Text>
          <TextInput style={[styles.input, styles.readOnlyInput]} value={cotizacion.agente.email} editable={false} />
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleGuardarCambios} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>GUARDAR CAMBIOS</Text>}
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* --- MODAL CAMBIAR ESTADO --- */}
      <Modal animationType="fade" transparent={true} visible={modalStatusVisible} onRequestClose={() => setModalStatusVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContentSmall}>
                <Text style={styles.modalTitle}>Cambiar Estado</Text>
                {ESTADOS.map((estado) => (
                    <TouchableOpacity 
                        key={estado} 
                        style={styles.statusOption} 
                        onPress={() => {
                            setCotizacion({...cotizacion, estado: estado});
                            setModalStatusVisible(false);
                        }}
                    >
                        <Text style={[styles.statusOptionText, cotizacion.estado === estado && {color: COLORS.accent, fontWeight:'bold'}]}>
                            {estado.toUpperCase()}
                        </Text>
                        {cotizacion.estado === estado && <Ionicons name="checkmark" size={20} color={COLORS.accent} />}
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalStatusVisible(false)}>
                    <Text style={{color: COLORS.textLight}}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: 'space-between', marginBottom: 20, marginTop: 10 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.text },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, gap: 5 },
  statusText: { fontSize: 12, fontWeight: 'bold' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text, marginBottom: 10 },

  propCard: { flexDirection: 'row', backgroundColor: COLORS.cardBg, padding: 10, borderRadius: 10, alignItems: 'center' },
  propImageHeader: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  propTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  propAddress: { fontSize: 12, color: COLORS.textLight, marginBottom: 2 },
  propPrice: { fontSize: 14, fontWeight: "bold", color: COLORS.accent },

  input: { backgroundColor: COLORS.inputBg, borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 10 },
  readOnlyInput: { backgroundColor: "#E0E0E0", color: "#555" },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 10 },

  // Equipos
  teamsScroll: { paddingBottom: 10 },
  teamCard: { width: 140, backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#EEE', marginRight: 15 },
  teamCardSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.activeItem, borderWidth: 2 },
  teamImage: { width: '100%', height: 70, borderRadius: 8, marginBottom: 8 },
  teamInfo: { gap: 2 },
  teamName: { fontSize: 12, fontWeight: 'bold', color: COLORS.text },
  teamLeader: { fontSize: 11, color: COLORS.textLight },
  teamDetailText: { fontSize: 11, color: COLORS.textLight },
  selectionCheck: { position: 'absolute', top: 5, right: 5 },

  // Items
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  itemText: { fontSize: 14, color: COLORS.text },
  itemPrice: { fontSize: 14, fontWeight: "bold", color: COLORS.success },

  saveButton: { backgroundColor: COLORS.text, padding: 18, borderRadius: 15, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 5 },
  saveButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContentSmall: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  statusOption: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  statusOptionText: { fontSize: 16, color: COLORS.text },
  cancelButton: { marginTop: 15, padding: 10 }
});
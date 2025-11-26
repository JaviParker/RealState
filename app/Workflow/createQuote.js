import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext"; // Para el email del agente
import { guardarCotizacion } from "../../services/firestore";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";

const COLORS = {
  background: "#FFFFFF",
  text: "#000000",
  textLight: "#666666",
  accent: "#9A6C42",
  cardBg: "#F9F9F9",
  inputBg: "#F0F0F0",
  success: "#28a745",
};

export default function CreateQuote() {
  const router = useRouter();
  const { user } = useAuth(); // Obtenemos el agente logueado
  const params = useLocalSearchParams(); // Recibimos los datos de la pantalla anterior

  const [loading, setLoading] = useState(false);

  // Parseamos los datos recibidos (vienen como string JSON)
  const propiedad = params.propiedad ? JSON.parse(params.propiedad) : null;
  const itemsSeleccionados = params.items ? JSON.parse(params.items) : [];

  // Formulario del Cliente
  const [cliente, setCliente] = useState({
    nombre: "",
    telefono: "",
    correo: "",
  });

  // Cálculo del Total
  const totalExtras = itemsSeleccionados.reduce(
    (acc, item) => acc + item.costo,
    0
  );
  const precioFinal = (propiedad?.precio || 0) + totalExtras;

  const handleGuardar = async () => {
    if (!cliente.nombre || !cliente.telefono || !cliente.correo) {
      return Alert.alert(
        "Faltan datos",
        "Por favor llena la información del cliente."
      );
    }

    setLoading(true);

    const datosCotizacion = {
      agente: {
        uid: user?.uid,
        email: user?.email, // Correo del agente (no editable)
      },
      cliente: cliente,
      propiedad: {
        id: propiedad.id,
        titulo: propiedad.titulo,
        direccion: propiedad.direccion,
        precioBase: propiedad.precio,
        imagen: propiedad.imagen,
      },
      itemsAdicionales: itemsSeleccionados, // Lista de lo que eligió
      total: precioFinal,
    };

    const exito = await guardarCotizacion(datosCotizacion);

    if (exito) {
      Alert.alert("¡Éxito!", "Cotización guardada correctamente.", [
        { text: "OK", onPress: () => router.replace("/(tabs)/properties") }, // Te manda a la lista de presupuestos (que haremos luego) o al inicio
      ]);
    } else {
      Alert.alert("Error", "No se pudo guardar la cotización.");
    }
    setLoading(false);
  };

  if (!propiedad)
    return (
      <View style={styles.container}>
        <Text>Error cargando datos</Text>
      </View>
    );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Encabezado y Botón Atrás */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resumen de Cotización</Text>
        </View>

        {/* Resumen Propiedad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propiedad Seleccionada</Text>
          <View style={styles.propCard}>
            <Text style={styles.propTitle}>{propiedad.titulo}</Text>
            <Text style={styles.propAddress}>{propiedad.direccion}</Text>
            <Text style={styles.propPrice}>
              Base: ${propiedad.precio?.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Resumen Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adicionales Incluidos</Text>
          {itemsSeleccionados.length > 0 ? (
            itemsSeleccionados.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemText}>• {item.nombre}</Text>
                <Text style={styles.itemPrice}>
                  + ${item.costo?.toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: COLORS.textLight, fontStyle: "italic" }}>
              Sin adicionales seleccionados.
            </Text>
          )}
        </View>

        {/* Datos Agente (Read Only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agente Vendedor</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={user?.email}
            editable={false}
          />
        </View>

        {/* Datos Cliente (Editable) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre Completo"
            value={cliente.nombre}
            onChangeText={(t) => setCliente({ ...cliente, nombre: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            keyboardType="phone-pad"
            value={cliente.telefono}
            onChangeText={(t) => setCliente({ ...cliente, telefono: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Correo Electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            value={cliente.correo}
            onChangeText={(t) => setCliente({ ...cliente, correo: t })}
          />
        </View>

        <View style={styles.divider} />

        {/* Total Final */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>PRECIO FINAL</Text>
          <Text style={styles.totalAmount}>
            ${precioFinal.toLocaleString()}
          </Text>
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleGuardar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>CONFIRMAR Y GUARDAR</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: { padding: 5, marginRight: 10 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.text },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textLight,
    marginBottom: 10,
  },

  propCard: {
    backgroundColor: COLORS.cardBg,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  propTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text },
  propAddress: { fontSize: 14, color: COLORS.textLight, marginBottom: 5 },
  propPrice: { fontSize: 16, fontWeight: "bold", color: COLORS.accent },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  itemText: { fontSize: 14, color: COLORS.text },
  itemPrice: { fontSize: 14, fontWeight: "bold", color: COLORS.success },

  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  readOnlyInput: { backgroundColor: "#E0E0E0", color: "#555" },

  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 10 },

  totalContainer: { alignItems: "center", marginVertical: 20 },
  totalLabel: { fontSize: 14, color: COLORS.textLight, letterSpacing: 1 },
  totalAmount: { fontSize: 32, fontWeight: "bold", color: COLORS.text },

  saveButton: {
    backgroundColor: COLORS.text,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  saveButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});

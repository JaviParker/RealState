// services/firestore.js
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Asegúrate que la ruta sea correcta

// Nombre de la colección en Firebase
const COLLECTION_NAME = 'propiedades';

// --- DATOS DE PRUEBA (ESTRUCTURA EN ESPAÑOL) ---
const propiedadesDummy = [
  {
    titulo: "Residencia Villa Magna",
    descripcion: "Hermosa casa con acabados de lujo y jardín amplio.",
    precio: 4500000,
    direccion: "Av. de las Lomas 123, Zona Real",
    habitaciones: 4,
    banos: 3.5,
    metrosTerreno: 350,
    imagen: "https://images.unsplash.com/photo-1600596542815-22b489997b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    titulo: "Departamento Loft Urbano",
    descripcion: "Moderno loft en el centro de la ciudad con vista panorámica.",
    precio: 2800000,
    direccion: "Calle Reforma 45, Centro",
    habitaciones: 2,
    banos: 2,
    metrosTerreno: 120,
    imagen: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    titulo: "Casa de Campo Los Robles",
    descripcion: "Alejada del ruido, ideal para descanso con acabados en madera.",
    precio: 3200000,
    direccion: "Carretera Nacional km 20",
    habitaciones: 3,
    banos: 3,
    metrosTerreno: 500,
    imagen: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];

// --- FUNCIÓN 1: SEMBRAR DATOS (Ejecutar una sola vez) ---
export const sembrarPropiedades = async () => {
  try {
    console.log("Iniciando siembra de datos...");
    for (const propiedad of propiedadesDummy) {
      await addDoc(collection(db, COLLECTION_NAME), propiedad);
    }
    console.log("¡Datos agregados correctamente!");
    return true;
  } catch (error) {
    console.error("Error sembrando datos: ", error);
    return false;
  }
};

// --- FUNCIÓN 2: OBTENER PROPIEDADES ---
export const obtenerPropiedades = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const propiedades = [];
    querySnapshot.forEach((doc) => {
      // Unimos el ID del documento con sus datos
      propiedades.push({ id: doc.id, ...doc.data() });
    });
    return propiedades;
  } catch (error) {
    console.error("Error obteniendo propiedades: ", error);
    throw error;
  }
};

// --- FUNCIÓN 3: AGREGAR PROPIEDAD ---
export const agregarPropiedad = async (nuevaPropiedad) => {
  try {
    // Agregamos fecha de creación por si sirve para ordenar luego
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...nuevaPropiedad,
      createdAt: new Date(),
    });
    console.log("Propiedad agregada con ID: ", docRef.id);
    return true;
  } catch (error) {
    console.error("Error agregando propiedad: ", error);
    return false;
  }
};

// --- FUNCIÓN 4: ACTUALIZAR PROPIEDAD ---
export const actualizarPropiedad = async (id, datosActualizados) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, datosActualizados);
    console.log("Propiedad actualizada ID: ", id);
    return true;
  } catch (error) {
    console.error("Error actualizando propiedad: ", error);
    return false;
  }
};
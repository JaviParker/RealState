// services/firestore.js
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig'; 

const COLLECTION_NAME = 'propiedades';

// --- DATOS DE PRUEBA (CARRUSEL + ITEMS) ---
const propiedadesDummy = [
  {
    titulo: "Residencia Villa Magna",
    descripcion: "Hermosa casa con acabados de lujo y jardín amplio.",
    precio: 4500000,
    direccion: "Av. de las Lomas 123, Zona Real",
    habitaciones: 4,
    banos: 3.5,
    metrosTerreno: 350,
    // ARRAY DE IMÁGENES
    imagenes: [
      "https://images.unsplash.com/photo-1600596542815-22b489997b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    items: [
      { id: 'i1', nombre: 'Muebles de Lujo', costo: 250000 },
      { id: 'i2', nombre: 'Portón Eléctrico', costo: 20000 },
      { id: 'i3', nombre: 'Jacuzzi Exterior', costo: 150000 }
    ]
  },
  {
    titulo: "Departamento Loft Urbano",
    descripcion: "Moderno loft en el centro de la ciudad con vista panorámica.",
    precio: 2800000,
    direccion: "Calle Reforma 45, Centro",
    habitaciones: 2,
    banos: 2,
    metrosTerreno: 120,
    imagenes: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1622866306950-81d17097d458?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    items: [
      { id: 'i1', nombre: 'Muebles de Diseñador', costo: 250000 },
      { id: 'i2', nombre: 'Persianas Eléctricas', costo: 20000 },
      { id: 'i3', nombre: 'Jacuzzi en Terraza', costo: 150000 }
    ]
  },
  {
    titulo: "Casa de Campo Los Robles",
    descripcion: "Alejada del ruido, ideal para descanso con acabados en madera.",
    precio: 3200000,
    direccion: "Carretera Nacional km 20",
    habitaciones: 3,
    banos: 3,
    metrosTerreno: 500,
    imagenes: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    items: [
      { id: 'i1', nombre: 'Muebles Rústicos', costo: 250000 },
      { id: 'i2', nombre: 'Portón de Seguridad', costo: 20000 },
      { id: 'i3', nombre: 'Jacuzzi con Calefacción', costo: 150000 }
    ]
  }
];

// --- FUNCIÓN 1: SEMBRAR DATOS ---
export const sembrarPropiedades = async () => {
  try {
    console.log("Iniciando siembra de datos con carruseles...");
    for (const propiedad of propiedadesDummy) {
      await addDoc(collection(db, COLLECTION_NAME), {
          ...propiedad,
          createdAt: new Date()
      });
    }
    console.log("¡Datos sembrados correctamente!");
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
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Lógica de compatibilidad: Si tiene 'imagen' antigua, la metemos en un array 'imagenes'
      let listaImagenes = data.imagenes || [];
      if (data.imagen && listaImagenes.length === 0) {
          listaImagenes = [data.imagen];
      }

      propiedades.push({ 
          id: docSnap.id, 
          ...data,
          imagenes: listaImagenes 
      });
    });
    return propiedades.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.error("Error obteniendo propiedades: ", error);
    throw error;
  }
};

// --- FUNCIÓN 3: AGREGAR PROPIEDAD ---
export const agregarPropiedad = async (nuevaPropiedad) => {
  try {
    const datosAGuardar = {
      ...nuevaPropiedad,
      // Aseguramos que imagenes sea array
      imagenes: Array.isArray(nuevaPropiedad.imagenes) ? nuevaPropiedad.imagenes : [],
      imagen: null, // Eliminamos campo obsoleto para limpiar la BD
      createdAt: new Date(),
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), datosAGuardar);
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
    const datosAGuardar = {
      ...datosActualizados,
      imagenes: Array.isArray(datosActualizados.imagenes) ? datosActualizados.imagenes : [],
      imagen: null,
    };
    await updateDoc(docRef, datosAGuardar);
    console.log("Propiedad actualizada ID: ", id);
    return true;
  } catch (error) {
    console.error("Error actualizando propiedad: ", error);
    return false;
  }
};

// --- FUNCIÓN 5: GUARDAR COTIZACIÓN ---
export const guardarCotizacion = async (datosCotizacion) => {
  try {
    const docRef = await addDoc(collection(db, 'cotizaciones'), {
      ...datosCotizacion,
      fecha: new Date(),
      estado: 'pendiente'
    });
    console.log("Cotización guardada ID: ", docRef.id);
    return true;
  } catch (error) {
    console.error("Error guardando cotización: ", error);
    return false;
  }
};

// --- FUNCIÓN 6: OBTENER MIS COTIZACIONES ---
export const obtenerMisCotizaciones = async (uidAgente) => {
  try {
    const q = query(
      collection(db, 'cotizaciones'), 
      where('agente.uid', '==', uidAgente)
    );

    const querySnapshot = await getDocs(q);
    const cotizaciones = [];
    querySnapshot.forEach((doc) => {
      cotizaciones.push({ id: doc.id, ...doc.data() });
    });
    
    return cotizaciones.sort((a, b) => b.fecha.seconds - a.fecha.seconds);
  } catch (error) {
    console.error("Error obteniendo cotizaciones: ", error);
    return [];
  }
};

// --- DATOS DE PRUEBA DE EQUIPOS ---
const equiposDummy = [
  {
    nombre: "Equipo 'Los Maestros'",
    lider: "Juan Pérez",
    costoSemanal: 12000,
    tiempoEstimado: "4 Semanas",
    imagen: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    nombre: "Constructora FastBuild",
    lider: "Ing. Rodríguez",
    costoSemanal: 18000,
    tiempoEstimado: "3 Semanas",
    imagen: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    nombre: "Acabados Finos S.A.",
    lider: "Arq. Sophia",
    costoSemanal: 15000,
    tiempoEstimado: "5 Semanas",
    imagen: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];

// --- FUNCIÓN 7: SEMBRAR EQUIPOS ---
export const sembrarEquipos = async () => {
  try {
    for (const equipo of equiposDummy) {
      await addDoc(collection(db, 'equipos'), equipo);
    }
    return true;
  } catch (error) {
    console.error("Error sembrando equipos: ", error);
    return false;
  }
};

// --- FUNCIÓN 8: OBTENER EQUIPOS ---
export const obtenerEquipos = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'equipos'));
    const equipos = [];
    querySnapshot.forEach((doc) => {
      equipos.push({ id: doc.id, ...doc.data() });
    });
    return equipos;
  } catch (error) {
    console.error("Error obteniendo equipos: ", error);
    return [];
  }
};

// --- FUNCIÓN 9: AGREGAR EQUIPO ---
export const agregarEquipo = async (nuevoEquipo) => {
  try {
    // Si no trae imagen, ponemos una por defecto
    const datos = {
        ...nuevoEquipo,
        imagen: nuevoEquipo.imagen || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        createdAt: new Date()
    };
    const docRef = await addDoc(collection(db, 'equipos'), datos);
    return true;
  } catch (error) {
    console.error("Error agregando equipo: ", error);
    return false;
  }
};

// --- FUNCIÓN 10: ACTUALIZAR EQUIPO ---
export const actualizarEquipo = async (id, datosActualizados) => {
  try {
    const docRef = doc(db, 'equipos', id);
    await updateDoc(docRef, datosActualizados);
    return true;
  } catch (error) {
    console.error("Error actualizando equipo: ", error);
    return false;
  }
};

// --- FUNCIÓN 11: ELIMINAR EQUIPO ---
export const eliminarEquipo = async (id) => {
  try {
    const docRef = doc(db, 'equipos', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error eliminando equipo: ", error);
    return false;
  }
};
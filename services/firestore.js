// services/firestore.js
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  where,
  deleteDoc,
  getDoc,
  setDoc
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
    imagenes: [
      "https://images.unsplash.com/photo-1600596542815-22b489997b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    items: [
      { id: 'i1', nombre: 'Muebles de Lujo', costo: 250000, imagen: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
      { id: 'i2', nombre: 'Portón Eléctrico', costo: 20000, imagen: 'https://images.unsplash.com/photo-1595846519845-68e298c2edd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
      { id: 'i3', nombre: 'Jacuzzi Exterior', costo: 150000, imagen: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
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
      { id: 'i1', nombre: 'Muebles de Diseñador', costo: 250000, imagen: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
      { id: 'i2', nombre: 'Persianas Eléctricas', costo: 20000, imagen: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
      { id: 'i3', nombre: 'Jacuzzi en Terraza', costo: 150000, imagen: 'https://images.unsplash.com/photo-1575413552097-9db698dc9688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
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
      { id: 'i1', nombre: 'Muebles Rústicos', costo: 250000, imagen: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
      { id: 'i2', nombre: 'Portón de Seguridad', costo: 20000, imagen: 'https://plus.unsplash.com/premium_photo-1680302272828-66175e307779?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
      { id: 'i3', nombre: 'Jacuzzi con Calefacción', costo: 150000, imagen: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
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

// --- FUNCIÓN 3.5: OBTENER PROPIEDAD POR ID ---
export const obtenerPropiedadPorId = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo propiedad por ID: ", error);
    return null;
  }
};

// --- FUNCIÓN 4: ACTUALIZAR PROPIEDAD ---
export const actualizarPropiedad = async (id, datosActualizados) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const datosAGuardar = { ...datosActualizados };
    // Solo actualizamos imagenes si viene en los campos a actualizar
    if (datosActualizados.imagenes !== undefined) {
      datosAGuardar.imagenes = Array.isArray(datosActualizados.imagenes) ? datosActualizados.imagenes : [];
      datosAGuardar.imagen = null;
    }
    
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

// --- FUNCIÓN 12: ACTUALIZAR COTIZACIÓN COMPLETA ---
export const actualizarCotizacion = async (id, datosActualizados) => {
  try {
    const docRef = doc(db, 'cotizaciones', id);
    await updateDoc(docRef, {
        ...datosActualizados,
        ultimaActualizacion: new Date() // Para saber cuándo se modificó
    });
    console.log("Cotización actualizada ID: ", id);
    return true;
  } catch (error) {
    console.error("Error actualizando cotización: ", error);
    return false;
  }
};

// --- FUNCIÓN 13: OBTENER COTIZACIONES GLOBALES (DASHBOARD) ---
export const obtenerCotizacionesGlobales = async () => {
  try {
    // Queremos todo lo que YA NO ES un borrador/pendiente.
    // Traemos las que están confirmadas, en construcción o pagadas.
    const q = query(
      collection(db, 'cotizaciones'), 
      where('estado', 'in', ['confirmada', 'construcción', 'pagada'])
    );

    const querySnapshot = await getDocs(q);
    const cotizaciones = [];
    querySnapshot.forEach((doc) => {
      cotizaciones.push({ id: doc.id, ...doc.data() });
    });
    
    // Ordenamos por fecha (las más recientes primero)
    // Nota: Si la lista crece mucho, esto debería hacerse con orderBy() en la query
    // requiriendo un índice compuesto en Firebase.
    return cotizaciones.sort((a, b) => b.fecha.seconds - a.fecha.seconds);
  } catch (error) {
    console.error("Error obteniendo dashboard global: ", error);
    return [];
  }
};

// --- FUNCIÓN 14: OBTENER CLAVE DE VALIDACIÓN (ADMIN) ---
export const getVerificationKey = async () => {
  try {
    const docRef = doc(db, 'adminConfig', 'validationKey');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().key;
    } else {
      // Si no existe, creamos una primera
      return await generateVerificationKey();
    }
  } catch (error) {
    console.error("Error obteniendo llave de validación: ", error);
    return null;
  }
};

// --- FUNCIÓN 15: GENERAR NUEVA CLAVE DE VALIDACIÓN (ADMIN) ---
export const generateVerificationKey = async () => {
  try {
    // Generador alfanumérico aleatorio de 13 caracteres
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let newKey = '';
    for (let i = 0; i < 13; i++) {
        newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const docRef = doc(db, 'adminConfig', 'validationKey');
    // setDoc crea o sobrescribe el documento
    await setDoc(docRef, { key: newKey, updatedAt: new Date() });
    return newKey;
  } catch (error) {
    console.error("Error generando nueva llave: ", error);
    return null;
  }
};

// --- FUNCIÓN 16: REVISAR SI EL USUARIO ESTÁ VALIDADO ---
export const checkUserValidation = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().isValidated === true;
    }
    return false; // Si no existe el doc, no está validado
  } catch (error) {
    console.error("Error revisando validación de usuario: ", error);
    return false; // Por seguridad, si hay error, no está validado
  }
};

// --- FUNCIÓN 17: MARCAR USUARIO COMO VALIDADO ---
export const validateUser = async (uid, email) => {
  try {
    const docRef = doc(db, 'users', uid);
    // Usamos setDoc con merge:true por si acaso ya tenía otra info
    await setDoc(docRef, {
        email: email,
        isValidated: true,
        validatedAt: new Date()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error validando usuario: ", error);
    return false;
  }
};

// --- FUNCIÓN 18: REGISTRAR USUARIO INICIAL (PENDIENTE) ---
export const registerInitialUser = async (firebaseUser) => {
  try {
    const docRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(docRef);
    
    // Solo lo registramos si NO existía antes en la coleción
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Agente sin Nombre',
        isValidated: false,
        createdAt: new Date()
      });
    }
  } catch (error) {
    console.error("Error al registrar usuario inicial: ", error);
  }
};

// --- FUNCIÓN 19: OBTENER TODOS LOS USUARIOS (ADMIN PANEL) ---
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const usuarios = [];
    querySnapshot.forEach((docSnap) => {
      usuarios.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    // Ordenamos para que los desvalidados aparezcan primero, luego por fecha
    return usuarios.sort((a, b) => {
      if (a.isValidated === b.isValidated) {
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }
      return a.isValidated ? 1 : -1;
    });
  } catch (error) {
    console.error("Error obteniendo usuarios: ", error);
    return [];
  }
};

// --- FUNCIÓN 20: ALTERNAR BLOQUEO DE USUARIO (ADMIN PANEL) ---
export const toggleUserValidation = async (uid, currentState) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
        isValidated: !currentState,
        updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error alternando validación de usuario: ", error);
    return false;
  }
};

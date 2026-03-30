import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig'; // Asume que exportas 'storage' desde firebaseConfig.js

/**
 * Función para abrir la galería del usuario y seleccionar una imagen.
 * @returns {Promise<string|null>} La URI local de la imagen seleccionada o null si canceló.
 */
export const pickImageFromGallery = async () => {
  try {
    // Pedir permisos primero
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('¡Se requieren permisos para acceder a tu galería!');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Permite recortar
      quality: 0.7, // Reduce la calidad un poco para que no pese tanto y suba rápido
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
  } catch (error) {
    console.error("Error al seleccionar imagen:", error);
  }
  return null;
};

/**
 * Sube una imagen (desde una URI local) a Firebase Storage.
 * @param {string} uri - La URI local de la imagen (ej: file:///...)
 * @param {string} folderProp - (Opcional) El nombre de carpeta donde se guardará.
 * @returns {Promise<string|null>} La URL de descarga pública o null en caso de error.
 */
export const uploadImageToFirebase = async (uri, folderProp = 'propiedades') => {
  try {
    if (!uri) return null;

    // 1. Convertir la URI local nativa en un archivo binario (Blob)
    const response = await fetch(uri);
    const blob = await response.blob();

    // 2. Crear un nombre único para la imagen
    const filename = `${folderProp}/img_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpeg`;
    
    // 3. Crear la referencia apuntando al Storage
    const storageRef = ref(storage, filename);

    // 4. Subir el archivo
    await uploadBytes(storageRef, blob);

    // 5. Obtener el link mágico (URL pública de lectura)
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;

  } catch (error) {
    console.error("Error crítico al subir la imagen:", error);
    return null;
  }
};

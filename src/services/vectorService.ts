import { ChromaClient } from "chromadb";
import { pipeline } from "@xenova/transformers";

const client = new ChromaClient({ 
  host: "localhost", 
  port: 8000,
  ssl: false 
});
const collectionName = "chatbot_documents";
let embedder: any;
let collection: any;

// Crear una función de embedding personalizada que ChromaDB pueda usar
class CustomEmbeddingFunction {
  private embedder: any;
  private expectedDimension: number;

  constructor(embedder: any, expectedDimension: number = 384) {
    this.embedder = embedder;
    this.expectedDimension = expectedDimension;
  }

  async generate(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const output = await this.embedder(text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data) as number[];
      
      // Verificación más flexible
      if (embedding.length !== this.expectedDimension) {
        console.warn(`Advertencia: Dimensión inesperada del embedding (${embedding.length}). Ajustando expectativas.`);
        this.expectedDimension = embedding.length;
      }
      
      embeddings.push(embedding);
    }
    return embeddings;
  }
}

export const initVectorDB = async () => {
  // Limpiar caché del embedder
  embedder = null;
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  
  const customEmbedding = new CustomEmbeddingFunction(embedder);

  try {
    // Eliminar cualquier colección existente
    try {
      await client.deleteCollection({ name: collectionName });
      console.log("Colección existente eliminada");
    } catch (error) {
      console.log("No había colección previa para eliminar");
    }

    // Crear nueva colección
    collection = await client.createCollection({ 
      name: collectionName,
      metadata: { "hnsw:space": "cosine" },
      embeddingFunction: customEmbedding
    });
    
    console.log("Nueva colección creada con embeddings de dimensión flexible");
  } catch (error) {
    console.error("Error inicializando Vector DB:", error);
    throw error;
  }
};

// Función alternativa para reinicializar sin eliminar datos (si quieres mantener los documentos)
export const reinitVectorDB = async () => {
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const customEmbedding = new CustomEmbeddingFunction(embedder);

  try {
    // Intentar obtener la colección existente
    collection = await client.getCollection({ 
      name: collectionName,
      embeddingFunction: customEmbedding
    });
    
    // Verificar si hay incompatibilidad probando una consulta simple
    try {
      await collection.query({
        queryTexts: ["test"],
        nResults: 1
      });
      console.log("Colección existente compatible obtenida");
    } catch (queryError) {
      // Si hay error de dimensiones, eliminar y recrear
      if (queryError instanceof Error && queryError.message?.includes("dimension")) {
        console.log("Detectada incompatibilidad de dimensiones, recreando colección...");
        await client.deleteCollection({ name: collectionName });
        collection = await client.createCollection({ 
          name: collectionName,
          metadata: { "hnsw:space": "cosine" },
          embeddingFunction: customEmbedding
        });
        console.log("Colección recreada con dimensiones correctas");
      } else {
        throw queryError;
      }
    }
    
  } catch (error) {
    // Si no existe, crearla
    try {
      collection = await client.createCollection({ 
        name: collectionName,
        metadata: { "hnsw:space": "cosine" },
        embeddingFunction: customEmbedding
      });
      console.log("Vector DB lista - nueva colección creada");
    } catch (createError) {
      console.log("Error creando colección:", createError);
      throw createError;
    }
  }
};

export const addDocument = async (id: string, text: string) => {
  if (!collection) {
    throw new Error("La colección no está inicializada. Ejecuta initVectorDB primero.");
  }

  try {
    // Verificar si el documento ya existe y eliminarlo
    try {
      await collection.delete({ ids: [id] });
      console.log(`Documento existente ${id} eliminado antes de agregar nuevo`);
    } catch (deleteError) {
      // Si no existe, continuar
    }

    // Agregar el nuevo documento
    await collection.add({
      ids: [id],
      documents: [text],
      metadatas: [{
        filename: id,
        uploadDate: new Date().toISOString(),
        textLength: text.length
      }]
    });
    console.log(`Documento ${id} agregado exitosamente`);
  } catch (error) {
    console.log("Error agregando documento:", error);
    throw error;
  }
};

// Función para verificar si la colección tiene documentos
export const hasDocuments = async (): Promise<boolean> => {
  if (!collection) {
    return false;
  }

  try {
    const count = await collection.count();
    return count > 0;
  } catch (error) {
    console.log("Error verificando documentos:", error);
    return false;
  }
};

export const searchSimilar = async (query: string, topK = 1) => {
  if (!collection) {
    throw new Error("La colección no está inicializada. Ejecuta initVectorDB primero.");
  }

  try {
    // Verificar primero si la colección tiene documentos
    if (!(await hasDocuments())) {
      console.log("La colección está vacía, no se puede realizar búsqueda");
      return "No se encontró información relevante.";
    }

    // Usar queryTexts en lugar de queryEmbeddings
    const results = await collection.query({
      queryTexts: [query],
      nResults: topK,
      include: ["documents", "distances", "metadatas"]
    });

    // Verificar si hay resultados y retornar el documento más relevante
    if (results.documents && results.documents[0] && results.documents[0].length > 0) {
      console.log(`Documento encontrado con distancia: ${results.distances[0][0]}`);
      return results.documents[0][0];
    }
    
    return "No se encontró información relevante.";
  } catch (error) {
    console.log("Error en búsqueda:", error);
    
    // Si hay error de dimensiones, intentar reinicializar
   if (error instanceof Error && error.message?.includes("dimension")) {
      console.log("Error de dimensiones detectado, intentando reinicializar...");
      try {
        await reinitVectorDB();
        return "No se encontró información relevante.";
      } catch (reinitError) {
        console.log("Error reinicializando:", reinitError);
      }
    }
    
    return "No se encontró información relevante.";
  }
};

// Función adicional para obtener información de la colección
export const getCollectionInfo = async () => {
  if (!collection) {
    console.log("La colección no está inicializada");
    return null;
  }

  try {
    const count = await collection.count();
    console.log(`La colección tiene ${count} documentos`);
    return { count };
  } catch (error) {
    console.log("Error obteniendo información de colección:", error);
    return null;
  }
};

// Función para eliminar documentos
export const deleteDocument = async (id: string) => {
  if (!collection) {
    throw new Error("La colección no está inicializada. Ejecuta initVectorDB primero.");
  }

  try {
    await collection.delete({
      ids: [id]
    });
    console.log(`Documento ${id} eliminado exitosamente`);
  } catch (error) {
    console.log("Error eliminando documento:", error);
    throw error;
  }
};

// Función para actualizar un documento existente
export const updateDocument = async (id: string, text: string) => {
  if (!collection) {
    throw new Error("La colección no está inicializada. Ejecuta initVectorDB primero.");
  }

  try {
    await collection.update({
      ids: [id],
      documents: [text],
      metadatas: [{
        filename: id,
        updateDate: new Date().toISOString(),
        textLength: text.length
      }]
    });
    console.log(`Documento ${id} actualizado exitosamente`);
  } catch (error) {
    console.log("Error actualizando documento:", error);
    throw error;
  }
};

// Función para obtener todos los documentos con sus metadatos
export const getAllDocuments = async () => {
  if (!collection) {
    throw new Error("La colección no está inicializada. Ejecuta initVectorDB primero.");
  }

  try {
    const results = await collection.get({
      include: ["documents", "metadatas", "ids"]
    });
    
    return {
      ids: results.ids,
      documents: results.documents,
      metadatas: results.metadatas
    };
  } catch (error) {
    console.log("Error obteniendo documentos:", error);
    throw error;
  }
};

// Función para limpiar completamente la base de datos
export const resetVectorDB = async () => {
  try {
    // Limpiar completamente
    embedder = null;
    collection = null;
    
    // Forzar nueva descarga del modelo
    const model = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      revision: "main",
      quantized: false
    });
    
    // Eliminar colección existente
    await client.deleteCollection({ name: collectionName });
    
    // Crear nueva colección
    embedder = model;
    const customEmbedding = new CustomEmbeddingFunction(embedder);
    collection = await client.createCollection({
      name: collectionName,
      metadata: { "hnsw:space": "cosine" },
      embeddingFunction: customEmbedding
    });
    
    console.log("VectorDB completamente reinicializado");
  } catch (error) {
    console.error("Error en resetVectorDB:", error);
    throw error;
  }
};
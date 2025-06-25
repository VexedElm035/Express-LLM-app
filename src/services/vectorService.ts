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

  constructor(embedder: any) {
    this.embedder = embedder;
  }

  async generate(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const output = await this.embedder(text);
      embeddings.push(Array.from(output.data) as number[]);
    }
    return embeddings;
  }
}

export const initVectorDB = async () => {
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const customEmbedding = new CustomEmbeddingFunction(embedder);

  try {
    // Intentar obtener la colección primero
    collection = await client.getCollection({ 
      name: collectionName,
      embeddingFunction: customEmbedding
    });
    console.log("Colección existente obtenida");
  } catch (error) {
    try {
      // Si no existe, crearla con la función de embedding personalizada
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
    // Ahora no necesitas generar el embedding manualmente
    // ChromaDB usará tu función personalizada
    await collection.add({
      ids: [id],
      documents: [text],
      metadatas: [{}]
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
      return results.documents[0][0];
    }
    
    return "No se encontró información relevante.";
  } catch (error) {
    console.log("Error en búsqueda:", error);
    return "No se encontró información relevante.";
  }
};

// Esta función ya no es necesaria, pero la mantengo por compatibilidad
const generateEmbedding = async (text: string) => {
  const output = await embedder(text);
  return Array.from(output.data);
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
      metadatas: [{}]
    });
    console.log(`Documento ${id} actualizado exitosamente`);
  } catch (error) {
    console.log("Error actualizando documento:", error);
    throw error;
  }
};
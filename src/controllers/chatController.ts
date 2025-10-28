import { Request, Response, NextFunction } from 'express';
import { generateLLMResponse } from '../services/llmService';
import { searchSimilar, hasDocuments } from '../services/vectorService';

export const test = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).json({
            content: 'Test route is working',
        });
    } catch (error) {
        next(error);
    }
} 

export const chatHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;

    // Verificar si hay documentos en la base vectorial antes de buscar
    const hasVectorData = await hasDocuments();
    
    let finalResponse: string;

    if (hasVectorData) {
      // Si hay documentos, buscar información relevante
      const docResponse = await searchSimilar(content);
      
      if (docResponse !== "No se encontró información relevante.") {
        // Se encontró información relevante en la base vectorial
        finalResponse = docResponse;
      } else {
        // No se encontró información relevante, usar LLM
        finalResponse = await generateLLMResponse(content);
      }
    } else {
      // No hay documentos en la base vectorial, usar directamente el LLM
      console.log("Base de datos vectorial vacía, usando solo LLM");
      finalResponse = await generateLLMResponse(content);
    }

    res.status(200).json({
      response: {
        content: finalResponse.trim(),
        role: 'assistant',
      }
    });
  } catch (error) {
    console.error('Error en chatHandler:', error);
    
    // En caso de error, intentar responder con el LLM como fallback
    try {
      const { content } = req.body;
      const fallbackResponse = await generateLLMResponse(content);
      
      res.status(200).json({
        response: {
          content: fallbackResponse.trim(),
          role: 'assistant',
        }
      });
    } catch (fallbackError) {
      next(fallbackError);
    }
  }
};
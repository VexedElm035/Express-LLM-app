import axios from 'axios';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

export const generateLLMResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await axios.post(OLLAMA_API_URL, {
      model: 'llama3',
      prompt: prompt,
      stream: false
    });

    return response.data.response;
  } catch (error) {
    console.error('Error generando respuesta:', error);
    return 'Ocurrió un error al generar la respuesta.';
  }
};

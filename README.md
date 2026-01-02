src/
  core/            # modulos core (config, logger, utils)
  agents/          # agente LLM
  models/          # schemas y validación
  api/             # configuracion de endpoints-API
app.ts             # configuracion de express
index.ts           # inicio de app

# Setup
ollama pull llama3.1:8b-instruct-q4_K_M
npm install
npm run dev

# despliegue
npm run build
npm start

# Verificacion y correciones
npm run type-check
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Listar modelos:
GET http://localhost:8000/v1/models

# Estrucutura de Consulta:
POST http://localhost:8000/v1/chat/completions
Content-Type: application/json
{
  "model": "default",
  "messages": [
    {
      "role": "user",
      "content": "que es ecosur?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false    // true
}

Respuesta sin stream:
{
  "id": "chatcmpl-1730745600000",
  "object": "chat.completion",
  "created": 1730745600,
  "model": "default",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Ecosur es..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 15,
    "total_tokens": 40
  }
}

Respuesta con stream:
data: {"id":"chatcmpl-1730745600000","object":"chat.completion.chunk","created":1730745600,"model":"default","choices":[{"index":0,"delta":{"content":"La"},"finish_reason":null}]}

data: {"id":"chatcmpl-1730745600000","object":"chat.completion.chunk","created":1730745600,"model":"default","choices":[{"index":0,"delta":{"content":" inteligencia"},"finish_reason":null}]}

data: {"id":"chatcmpl-1730745600000","object":"chat.completion.chunk","created":1730745600,"model":"default","choices":[{"index":0,"delta":{"content":" artificial..."},"finish_reason":null}]}

data: {"id":"chatcmpl-1730745600000","object":"chat.completion.chunk","created":1730745600,"model":"default","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
















curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "default",
    "messages": [
      {"role": "user", "content": "Hola, ¿cómo estás?"}
    ],
    "stream": false
  }'

curl -N -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "default",
    "messages": [
      {"role": "user", "content": "Explícame qué es Docker"}
    ],
    "stream": true
  }'

curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "default",
    "messages": [
      {"role": "user", "content": "Me gusta la pizza"},
      {"role": "assistant", "content": "¡Excelente! La pizza es deliciosa."},
      {"role": "user", "content": "¿Qué ingredientes recomiendas?"}
    ],
    "temperature": 0.8,
    "stream": false
  }'


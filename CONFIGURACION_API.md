# Configuracion de la API de Google Gemini

## Problema Actual

La API key de Gemini en tu `.env` parece no ser valida o ha expirado. El sistema ahora esta configurado para:
- **Intentar usar Gemini** si la API key es valida
- **Usar automaticamente el modo de simulacion** si Gemini falla (sin detener la ejecucion)

## Como Obtener una Nueva API Key

### Opcion 1: Google AI Studio (Recomendado - Mas Simple)

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesion con tu cuenta de Google
3. Haz clic en "Get API Key" o "Crear clave de API"
4. Copia la clave generada
5. Pega la clave en tu archivo `.env`:
   ```
   GEMINI_API_KEY="tu_nueva_api_key_aqui"
   ```

### Opcion 2: Google Cloud Console (Mas Complejo)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea o selecciona un proyecto
3. Habilita la API de "Generative Language API"
4. Ve a "Credenciales" → "Crear credenciales" → "Clave de API"
5. Copia la clave y actualiza tu `.env`

## Verificar el Modelo

Si obtienes la API key y sigue fallando, puede ser que el modelo no este disponible. Los modelos comunes son:

- `gemini-1.5-pro` (Mas potente)
- `gemini-1.5-flash` (Rapido)
- `gemini-2.5-flash` (Mas reciente - el que estas usando actualmente)

Para cambiar el modelo, edita `backend/main.py` linea ~40:

```python
planning_agent = PlanningAgent(
    api_key=os.getenv("GEMINI_API_KEY"),
    model_name="gemini-1.5-flash"  # <-- Cambia aqui
)
```

Y linea ~43:

```python
execution_agent = ExecutionAgent(
    api_key=os.getenv("GEMINI_API_KEY"),
    model_name="gemini-1.5-flash"  # <-- Cambia aqui
)
```

## Probar la Conexion

Despues de actualizar la API key, reinicia el servidor:

```powershell
# Detener el servidor (Ctrl+C)
# Iniciar de nuevo
cd backend
python main.py
```

Si ves este mensaje, Gemini esta funcionando:
```
INFO:     Todos los agentes inicializados correctamente
```

Si ves advertencias como estas, esta usando el modo de simulacion:
```
Advertencia: No se pudo inicializar Gemini: ...
Se usara modo de simulacion
```

## Estado Actual del Sistema

El sistema esta ahora configurado para ser **tolerante a fallos**:

1. **Con API key valida**: Usa Gemini para generar planes y ejecutar tareas
2. **Sin API key o con error**: Usa simulaciones automaticas
3. **Nunca falla**: Siempre devuelve resultados, usando el mejor metodo disponible

## Notas Importantes

- Las API keys de Gemini son **gratuitas** con limites de uso
- Google AI Studio es mas rapido de configurar que Google Cloud
- El modo experimental `gemini-2.0-flash-exp` puede no estar disponible para todas las cuentas
- Si usas el modo de simulacion, los resultados son genericos pero funcionales

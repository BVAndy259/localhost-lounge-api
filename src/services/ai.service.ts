import { env } from '../config/env';
import { logger } from '../utils/logger';

async function callOpenRouter(prompt: string) {
  const apiKey = env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY no está configurada en el archivo .env');
  }

  const models = ['google/gemma-4-31b-it:free', 'openai/gpt-oss-120b:free'];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'LocalHost Lounge',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are an API that ONLY outputs raw, valid JSON. Do not include markdown formatting like ```json. ONLY return the JSON object.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1024,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.text();
        lastError = new Error(
          `OpenRouter HTTP error! status: ${response.status}, message: ${errorData}`
        );
        logger.warn(`[OPENROUTER] Modelo ${model} no disponible, probando el siguiente...`);
        continue;
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        lastError = new Error('La IA no devolvió una respuesta válida.');
        continue;
      }

      const rawText = data.choices[0].message.content.trim();

      const cleaned = rawText.startsWith('```json')
        ? rawText
            .replace(/^```json/, '')
            .replace(/```$/, '')
            .trim()
        : rawText.startsWith('```')
          ? rawText.replace(/^```/, '').replace(/```$/, '').trim()
          : rawText;

      return JSON.parse(cleaned);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(`[OPENROUTER] Modelo ${model} dio error de conexión: ${lastError.message}`);
    }
  }

  throw lastError || new Error('Todos los servidores de IA gratuitos están caídos.');
}

function formatHistory(history: { role: string; content: string }[]) {
  return history.length > 0
    ? history.map((h) => `${h.role === 'BOT' ? 'Assistant' : 'User'}: ${h.content}`).join('\n')
    : 'No previous history.';
}

export const AIService = {
  async processClientWebMessage(
    clientMessage: string,
    history: { role: string; content: string }[],
    clientData?: any
  ) {
    try {
      const prompt = `
        You are the friendly Web Copilot for "LocalHost Lounge" restaurant in Arequipa.
        Analyze the Client's message and return ONLY a valid JSON with "action", "reply", and "payload".

        CLIENT IDENTITY CONTEXT:
        ${
          clientData
            ? `¡ATENCIÓN! Estás hablando con un cliente registrado llamado ${clientData.name} ${clientData.last_name}. Trátalo con confianza y usa su nombre en la respuesta.`
            : `El cliente es anónimo actualmente. Trátalo con amabilidad.`
        }

        Knowledge Base:
        - Hours: 6:00 PM to 2:00 AM.
        - Food: Fusion cuisine, signature cocktails.
        - Location: Cerro Colorado, Arequipa.

        NAVIGATION & RESERVATION RULES:
        1. If the user wants info -> NAVIGATE_PAGE to "/nosotros", "/carta" or "/comunidad"
        2. If the user says "Quiero reservar" or wants to book a table:
           - YOU MUST ASK CONVERSATIONALLY, STRICTLY ONE BY ONE. DO NOT ask for everything at once.
           - Step 1: Ask for number of people and date.
           - Step 2: Ask for time.
           - Step 3: Ask for full name.
           - Step 4: Ask for email and phone number.
           - If the user provides multiple pieces of info at once, acknowledge them and ask for the NEXT missing piece.
           - Once ALL 6 pieces of data are collected, use action "PREFILL_RESERVATION" with payload: {"reservation_date": "YYYY-MM-DD", "reservation_time": "HH:MM", "number_people": number, "customer_name": string, "customer_email": string, "customer_phone": string}.
           - The backend will attach available tables. The reply must invite the client to choose a table with click or text.

        Rules for "action" (Choose EXACTLY ONE):
        - "REPLY": Greetings, FAQ, or ASKING FOR THE NEXT MISSING DATA to complete a reservation.
        - "NAVIGATE_PAGE": To send the user to a specific page.
        - "PREFILL_RESERVATION": ONLY when you have collected all 6 reservation fields.

        Rules for "payload":
        - For NAVIGATE_PAGE: {"route": "/nosotros" | "/carta" | "/comunidad" | "/reservar" | "/"}
        - For PREFILL_RESERVATION: {"reservation_date": "YYYY-MM-DD", "reservation_time": "HH:MM", "number_people": number, "customer_name": string, "customer_email": string, "customer_phone": string}
        - Otherwise: {}

        Reply Rule: WARM SPANISH. 
        - If "PREFILL_RESERVATION", reply exactly with: "¡Excelente! Tengo todos tus datos listos. Tengo estas mesas disponibles, elige una con clic o escríbeme el número."

        Conversation History:
        ${formatHistory(history)}

        Client: "${clientMessage}"
      `;

      return await callOpenRouter(prompt);
    } catch (error) {
      logger.error('[IA ERROR] Copiloto Cliente falló:', error);
      return {
        action: 'REPLY',
        reply: 'Tuvimos un error de conexión en nuestro sistema. Un asesor te ayudará pronto.',
        payload: {},
      };
    }
  },
  async processWorkerWebMessage(
    workerMessage: string,
    history: { role: string; content: string }[],
    userRole: string = 'RECEPCIONISTA'
  ) {
    try {
      const prompt = `
        You are the Internal Admin Copilot for "LocalHost Lounge" staff.
        The current user role is: ${userRole}.
        
        Analyze the Worker's command and return ONLY a valid JSON with "action", "reply", and "payload".

        SECURITY & PERMISSIONS (STRICT):
        - YOU CANNOT create Reservations, Users, or Orders. If the worker asks you to create any of these, use action "REPLY" and gently tell them: "No tengo permisos para crear reservas, usuarios u órdenes por este medio. Por favor, utiliza el panel de navegación manual."
        - If they want to CREATE a Waiter (Mesero), Table (Mesa), or Plate (Plato), you must ask for the missing data step-by-step using action "REPLY".
        - If the worker asks for dashboard, reportes, resumen or KPI de hoy, use action "SHOW_DASHBOARD" and only summarize data that exists in the payload returned by backend.

        CREATION RULES (Step-by-step):
        1. CREATE WAITER: Needs [name, phone_number (opcional)].
        2. CREATE TABLE: Needs [table_number, capacity, type (only NORMAL or VIP)].
        3. CREATE PLATE: Needs [name, description, price, category].
        * Once you have all the required data for the specific creation task, use the corresponding action below.

        Rules for "action" (Choose EXACTLY ONE):
        - "REPLY": General questions, declining forbidden creations, or ASKING FOR MISSING DATA.
        - "SHOW_DASHBOARD": If the worker asks to see today's overview, dashboard, reportes or resumen.
        - "RENDER_TABLE_STATUS": If the worker asks to see which tables are free/occupied.
        - "FIND_RESERVATION": If the worker wants to find a specific client's reservation.
        - "SHOW_RESERVATIONS": If the worker asks to see all reservations.
        - "SHOW_ORDERS": If the worker asks to see all orders.
        - "SHOW_WAITERS": If the worker asks to see all waiters/meseros.
        - "SHOW_MENU": If the worker asks to see the menu/platos/carta.
        - "NAVIGATE_PAGE": Only if the worker explicitly asks to open a specific admin page by name (e.g., "abrir dashboard"). Prefer SHOW_* actions above instead.
        - "CREATE_WAITER": When all waiter data is collected.
        - "CREATE_TABLE": When all table data is collected.
        - "CREATE_PLATE": When all plate data is collected.
        
        Rules for "payload":
        - For CREATE_WAITER: {"name": string, "phone_number": string | null}
        - For CREATE_TABLE: {"table_number": string, "capacity": number, "type": "NORMAL" | "VIP"}
        - For CREATE_PLATE: {"name": string, "description": string, "price": number, "category": string}
        - For NAVIGATE_PAGE: {"route": string, "label": string | null} — ONLY use admin routes like "/admin/reservas", "/admin/ordenes", "/admin/mesas", "/admin/meseros", "/admin/platos", "/admin/usuarios".
        - For FIND_RESERVATION: {"search_term": string}
        - Otherwise, return {}.

        Reply Rule: DIRECT, PROFESSIONAL SPANISH. 
        - If firing a CREATE action, reply with: "Datos completos. Por favor, confirma la creación en los botones de abajo."

        Conversation History:
        ${formatHistory(history)}

        Worker: "${workerMessage}"
      `;

      return await callOpenRouter(prompt);
    } catch (error) {
      logger.error('[IA ERROR] Copiloto Trabajador falló:', error);
      return {
        action: 'REPLY',
        reply: 'Error interno del motor de IA. Por favor, utiliza los menús manuales.',
        payload: {},
      };
    }
  },
};

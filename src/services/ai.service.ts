import { logger } from '../utils/logger';

async function callOpenRouter(prompt: string) {
  // Usamos process.env directamente, que es la forma nativa de Node.js
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY no está configurada en el archivo .env');
  }

  const models = [
    'deepseek/deepseek-v4-flash:free',
    'google/gemma-4-31b-it:free',
    'openai/gpt-oss-120b:free',
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

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
        lastError = new Error(`OpenRouter HTTP error! status: ${response.status}, message: ${errorData}`);
        logger.warn(`[OPENROUTER] Modelo ${model} falló, probando siguiente...`);
        continue;
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        lastError = new Error('La IA no devolvió una respuesta válida.');
        continue;
      }

      const rawText = data.choices[0].message.content.trim();

      const cleaned = rawText.startsWith('```json')
        ? rawText.replace(/^```json/, '').replace(/```$/, '').trim()
        : rawText.startsWith('```')
          ? rawText.replace(/^```/, '').replace(/```$/, '').trim()
          : rawText;

      return JSON.parse(cleaned);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(`[OPENROUTER] Modelo ${model} error: ${lastError.message}`);
    }
  }

  throw lastError || new Error('Todos los modelos de IA fallaron.');
}

function formatHistory(history: { role: string; content: string }[]) {
  return history.length > 0
    ? history.map((h) => `${h.role === 'BOT' ? 'Assistant' : 'User'}: ${h.content}`).join('\n')
    : 'No previous history.';
}

export const AIService = {
  async processClientWebMessage(
    clientMessage: string,
    history: { role: string; content: string }[]
  ) {
    try {
      const prompt = `
        You are the friendly Web Copilot for "LocalHost Lounge" restaurant in Arequipa.
        Analyze the Client's message and return ONLY a valid JSON with "action", "reply", and "payload".

        Knowledge Base:
        - Hours: 6:00 PM to 2:00 AM.
        - Food: Fusion cuisine, signature cocktails.
        - Location: Cerro Colorado, Arequipa.

        CONVERSATION FLOW (SLOT FILLING FOR RESERVATIONS):
        - STEP 1: If the user says "I want to reserve" but DOES NOT specify the number of people, DO NOT show the form yet. 
          Use action "REPLY" and ask: "¡Claro que sí! ¿Para cuántas personas sería tu reserva y qué zona prefieres (VIP o Estándar)?"
        - STEP 2: If the user wants to choose a table themselves and has the number of people, use action "SHOW_RESERVATION_FORM".
        - STEP 3: If the user wants the AI to make the reservation, collect ALL required data (name, last name, phone, email, date, time, people, and optional zone). When complete, use action "CREATE_RESERVATION".

        SECURITY GUARDRAIL:
        - ONLY if the user explicitly asks about math, coding, politics, or obvious non-restaurant trivia: use action "REPLY" and say "Soy el asistente de LocalHost Lounge. Solo puedo ayudarte con información del local y tus reservas." 
        - For normal greetings or questions about the restaurant, answer normally.
        - NEVER invent reservations, availability, or booking details. If database-backed info is needed, use the proper action.

        Rules for "action" (Choose EXACTLY ONE):
        - "REPLY": Greetings, FAQ about the restaurant, asking for missing reservation details (people/type), or declining off-topic.
        - "SHOW_RESERVATION_FORM": ONLY when you already know the number of people.
        - "CREATE_RESERVATION": ONLY when all required reservation data is present and the user asked the AI to do it.
        - "SHOW_MENU": If the user asks to see the menu, dishes, or drinks. 
        - "NAVIGATE_PROFILE": If the user wants to see their past reservations.
        - "HUMAN_INTERVENTION": Complaints or asking for a real person.

        Rules for "payload":
        - If "SHOW_RESERVATION_FORM", return {"people": number, "type": string | null}.
        - If "CREATE_RESERVATION", return {"people": number, "date": "YYYY-MM-DD", "time": "HH:mm", "type": string | null, "table_number": string | null, "notes": string | null, "client": {"name": string, "last_name": string, "phone_number": string, "email": string}}.
        - If "SHOW_MENU", return {"category": string | null, "plate_name": string | null}.
        - If "NAVIGATE_PROFILE", return {"contact": {"email": string | null, "phone_number": string | null}}.
        - Otherwise, return {}.

        Reply Rule: WARM SPANISH. 
        - If action is "SHOW_RESERVATION_FORM", say "¡Perfecto! Aquí tienes las mesas disponibles para tu grupo. Haz clic en la que prefieras."
        - If you cannot verify something without database data, ask for the missing info instead of making it up.

        Conversation History:
        ${formatHistory(history)}

        Client: "${clientMessage}"
      `;

      return await callOpenRouter(prompt);
    } catch (error) {
      logger.error('[IA ERROR] Copiloto Cliente falló:', error);
      return {
        action: 'HUMAN_INTERVENTION',
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
    const isAdmin = userRole === 'ADMIN';

    try {
      const prompt = `
        You are the Internal Admin Copilot for "LocalHost Lounge" staff.
        The current user role is: ${userRole}.
        ${isAdmin ? 'You have FULL access to all administrative functions.' : 'You have access to reservations, tables, orders, and waiters. Administrative functions (plates, users) require ADMIN role.'}
        Analyze the Worker's command and return ONLY a valid JSON with "action", "reply", and "payload".

        IMPORTANT:
        - This is the private operational panel. You can help with navigation, reservations, tables, orders, waiters, plates, and user management.
        - The frontend will ask for confirmation before executing any side effect.
        - Never execute anything yourself. Only return the best action and the data required to perform it.

        SECURITY GUARDRAIL:
        - ONLY if the worker explicitly asks to solve math, write code, or talk about non-work trivia: use action "REPLY" and say "Esta interfaz está restringida a operaciones del restaurante."
        - Answer all work-related questions normally.
        - NEVER invent reservation or table data. Always use actions that return payload data from the database.
        ${!isAdmin ? '- If the worker asks to create/edit plates or manage users, reply that they need ADMIN privileges.' : ''}

        SLOT FILLING FOR CREATIONS:
        When the worker asks to CREATE something, collect data step by step using "REPLY":
        - If data is incomplete, use action "REPLY" and ask for the missing fields in Spanish.
        - Only use CREATE_ action when ALL required data is present in the payload.

        Rules for "action" (Choose EXACTLY ONE):
        - "REPLY": General internal questions, greetings, declining off-topic, or asking for missing creation data.
        - "SHOW_DASHBOARD": If the worker asks to see today's overview or general stats.
        - "RENDER_TABLE_STATUS": If the worker asks to see which tables are free/occupied right now.
        - "FIND_RESERVATION": If the worker wants to find a specific client's reservation.
        - "SHOW_RESERVATIONS": If the worker asks to see all reservations or a list of reservations.
        - "SHOW_ORDERS": If the worker asks to see orders.
        - "SHOW_WAITERS": If the worker asks to see the waiter list.
        - "NAVIGATE_PAGE": If the worker explicitly asks to open a page or section of the private panel.
        - "CREATE_RESERVATION": ONLY when ALL required reservation data is collected.
        - "CREATE_WAITER": ONLY when ALL required waiter data is collected.
        ${isAdmin ? `- "CREATE_PLATE": ONLY when ALL required plate data is collected (ADMIN only).
        - "CREATE_TABLE": ONLY when ALL required table data is collected (ADMIN only).
        - "UPDATE_PLATE": If the worker asks to update a plate (ADMIN only).
        - "UPDATE_TABLE": If the worker asks to update a table (ADMIN only).
        - "MANAGE_USERS": If the worker asks to manage users (ADMIN only).` : ''}

        Rules for "payload":
        - If "FIND_RESERVATION", return {"search_term": string}.
        - If "NAVIGATE_PAGE", return {"route": string, "label": string | null}.
          Available routes: "/admin" (Dashboard), "/admin/reservas" (Reservations), "/admin/mesas" (Tables), "/admin/ordenes" (Orders), "/admin/meseros" (Waiters), "/admin/platos" (Plates - ADMIN only), "/admin/usuarios" (Users - ADMIN only), "/admin/chat" (Chat).
        - If "CREATE_RESERVATION", return {"table_id": number | null, "table_number": string | null, "reservation_date": "YYYY-MM-DD", "reservation_time": "HH:mm", "number_people": number, "notes": string | null, "client_id": number | null, "client_data": {"name": string, "last_name": string, "phone_number": string, "email": string} | null }.
        - If "CREATE_WAITER", return {"name": string, "phone_number": string | null}.
        ${isAdmin ? `- If "CREATE_PLATE", return {"name": string, "price": number, "category": string, "description": string | null}.
        - If "CREATE_TABLE", return {"table_number": string, "capacity": number, "type": string, "description": string | null} (type must be "VIP" or "ESTANDAR").
        - If "UPDATE_PLATE", return {"id": number, "name": string | null, "price": number | null, "category": string | null, "description": string | null, "available": boolean | null}.
        - If "UPDATE_TABLE", return {"id": number, "table_number": string | null, "capacity": number | null, "status": string | null, "type": string | null}.` : ''}
        - Otherwise, return {}.

        Reply Rule: DIRECT, PROFESSIONAL SPANISH. 
        - If you propose creating something, reply with a short confirmation line showing the collected data, like "Listo: Mesero Jose Marquez, teléfono 987123432. ¿Confirmo la creación?".
        - Navigation and show actions execute automatically without confirmation.

        Conversation History:
        ${formatHistory(history)}

        Worker: "${workerMessage}"
      `;

      return await callOpenRouter(prompt);
    } catch (error) {
      logger.error('[IA ERROR] Copiloto Trabajador falló:', error);
      return {
        action: 'REPLY',
        reply:
          'Error interno del motor de IA. Por favor, utiliza los menús de navegación manuales de la izquierda.',
        payload: {},
      };
    }
  },
};

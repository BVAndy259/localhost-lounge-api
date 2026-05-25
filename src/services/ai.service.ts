async function callOllama(prompt: string) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      prompt: prompt,
      format: 'json',
      stream: false,
      options: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.response);
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
        - If "CREATE_RESERVATION", return {"people": number, "date": "YYYY-MM-DD", "time": "HH:mm", "type": string | null, "table_number": number | null, "notes": string | null, "client": {"name": string, "last_name": string, "phone_number": string, "email": string}}.
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

      return await callOllama(prompt);
    } catch (error) {
      const { logger } = await import('../utils/logger.js');
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
    history: { role: string; content: string }[]
  ) {
    try {
      const prompt = `
        You are the Internal Admin Copilot for "LocalHost Lounge" staff.
        Analyze the Worker's command and return ONLY a valid JSON with "action", "reply", and "payload".

        SECURITY GUARDRAIL:
        - ONLY if the worker explicitly asks to solve math, write code, or talk about non-work trivia: use action "REPLY" and say "Esta interfaz está restringida a operaciones del restaurante."
        - Answer all work-related questions normally.
        - NEVER invent reservation or table data. Always use actions that return payload data from the database.

        Rules for "action" (Choose EXACTLY ONE):
        - "REPLY": General internal questions, greetings, or declining strict off-topic.
        - "SHOW_DASHBOARD": If the worker asks to see today's overview or general stats.
        - "RENDER_TABLE_STATUS": If the worker asks to see which tables are free/occupied right now.
        - "FIND_RESERVATION": If the worker wants to find a specific client's reservation.

        Rules for "payload":
        - If "FIND_RESERVATION", return {"search_term": string}.
        - Otherwise, return {}.

        Reply Rule: DIRECT, PROFESSIONAL SPANISH. 

        Conversation History:
        ${formatHistory(history)}

        Worker: "${workerMessage}"
      `;

      return await callOllama(prompt);
    } catch (error) {
      const { logger } = await import('../utils/logger.js');
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

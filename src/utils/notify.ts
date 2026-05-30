import prisma from '../config/prisma';

export async function sendWaiterWhatsapp(waiterId: number, message: string) {
  const waiter: any = await prisma.waiter.findUnique({
    where: { id: waiterId },
    // select as any because Prisma client not regenerated yet
    select: { id: true, name: true, phone_number: true } as any,
  });

  if (!waiter) {
    console.warn(`[notify] Mesero ${waiterId} no encontrado. Mensaje no enviado.`);
    return;
  }

  const phone = (waiter as any).phone_number;
  if (!phone) {
    console.warn(`[notify] Mesero ${waiter.name} (${waiter.id}) no tiene número registrado.`);
    return;
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. 'whatsapp:+1415XXXX'

  if (!sid || !token || !from) {
    console.warn('[notify] Twilio no configurado. Mensaje:', message);
    return;
  }

  try {
    // require here to avoid TS type issues if package not installed
    // and to fail only at runtime when actually used.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio');
    const client = twilio(sid, token);

    await client.messages.create({
      body: message,
      from,
      to: `whatsapp:${phone}`,
    });

    console.log(`[notify] Mensaje WhatsApp enviado a ${waiter.name} (${phone})`);
  } catch (err: any) {
    console.error('[notify] Error al enviar WhatsApp:', err?.message ?? err);
  }
}

export default sendWaiterWhatsapp;

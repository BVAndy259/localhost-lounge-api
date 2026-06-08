"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWaiterWhatsapp = sendWaiterWhatsapp;
exports.notifyAllWaiters = notifyAllWaiters;
// @ts-nocheck
const prisma_1 = __importDefault(require("../config/prisma"));
const env_1 = require("../config/env");
async function sendWaiterWhatsapp(waiterId, message) {
    const waiter = await prisma_1.default.waiter.findUnique({
        where: { id: waiterId },
        select: { id: true, name: true, phone_number: true },
    });
    if (!waiter) {
        return { success: false, reason: `Mesero ${waiterId} no encontrado` };
    }
    const phone = waiter.phone_number;
    if (!phone) {
        return { success: false, reason: `${waiter.name} no tiene teléfono registrado` };
    }
    const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_WHATSAPP_FROM: from } = env_1.env;
    if (!sid || !token || !from) {
        console.warn('[notify] Twilio no configurado. Mensaje:', message);
        return { success: false, reason: 'Twilio no configurado' };
    }
    try {
        const { default: twilio } = await import('twilio');
        const client = twilio(sid, token);
        await client.messages.create({
            body: message,
            from,
            to: `whatsapp:${phone}`,
        });
        console.log(`[notify] Mensaje WhatsApp enviado a ${waiter.name} (${phone})`);
        return { success: true };
    }
    catch (err) {
        console.error('[notify] Error al enviar WhatsApp:', err?.message ?? err);
        return { success: false, reason: err?.message ?? 'Error desconocido' };
    }
}
async function notifyAllWaiters() {
    const waiters = await prisma_1.default.waiter.findMany({
        where: { active: true },
        select: { id: true, name: true, phone_number: true },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = { total: waiters.length, sent: 0, failed: [] };
    for (const waiter of waiters) {
        const tables = await prisma_1.default.table.findMany({
            where: { waiter_id: waiter.id, status: { not: 'LIBRE' } },
            include: { reservations: { where: { reservation_date: { gte: today, lt: tomorrow } }, take: 1 } },
        });
        if (tables.length === 0)
            continue;
        const tableLines = tables.map((t) => {
            const res = t.reservations?.[0];
            return `Mesa ${t.table_number} (${t.type})${res ? ` — ${res.reservation_time}` : ''}`;
        }).join('\n');
        const message = `📋 *Tus mesas asignadas hoy:*\n\n${tableLines}\n\n— LocalHost Lounge`;
        const r = await sendWaiterWhatsapp(waiter.id, message);
        if (r.success)
            result.sent++;
        else
            result.failed.push({ name: waiter.name, reason: r.reason || 'Error' });
    }
    return result;
}
exports.default = sendWaiterWhatsapp;

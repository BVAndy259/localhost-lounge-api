import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { OrderService } from '../services/order.service';
import { logger } from '../utils/logger';
import HttpError from '../utils/httpError';
import { OrderStatus } from '@prisma/client';

const parseOrderId = (rawId: string): number | null => {
  const orderId = parseInt(rawId, 10);
  return Number.isNaN(orderId) ? null : orderId;
};

const respondOrderError = (
  res: Response,
  error: unknown,
  fallbackStatus = 400,
  fallbackMessage = 'Error al procesar la orden'
) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message, code: error.code });
    return;
  }

  if (error instanceof Error) {
    res.status(fallbackStatus).json({ error: error.message });
    return;
  }

  res.status(fallbackStatus).json({ error: fallbackMessage });
};

const formatMoney = (value: unknown) => `S/ ${Number(value ?? 0).toFixed(2)}`;

const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

const getDocumentLabel = (documentType: string) =>
  documentType === 'FACTURA' ? 'FACTURA' : 'BOLETA DE VENTA ELECTRÓNICA';

const getDocumentSeries = (documentType: string) => (documentType === 'FACTURA' ? 'F001' : 'B001');

const formatReceiptDate = (value: Date | string | null | undefined) => {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export const OrderController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const statusParam = String(req.query.status || '').toUpperCase();
      const includePaidParam = String(req.query.include_paid || '').toLowerCase();
      const dateParam = String(req.query.date || '').trim();
      const includePaid = includePaidParam === 'true' || includePaidParam === '1';

      const validStatuses: OrderStatus[] = [
        'PENDIENTE',
        'PREPARANDO',
        'LISTO',
        'SERVIDO',
        'PAGADO',
      ];

      let status: OrderStatus | undefined;
      if (statusParam) {
        if (!validStatuses.includes(statusParam as OrderStatus)) {
          res.status(400).json({ error: 'Estado de orden no válido' });
          return;
        }
        status = statusParam as OrderStatus;
      }

      if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        res.status(400).json({ error: 'Formato de fecha no válido. Usa YYYY-MM-DD' });
        return;
      }

      const orders = await OrderService.getOrders({
        status,
        includePaid,
        date: dateParam || undefined,
      });
      res.status(200).json({ message: 'Órdenes obtenidas correctamente', data: orders });
    } catch (error: unknown) {
      logger.error(`[ORDER ERROR] GetAll: ${error instanceof Error ? error.message : error}`);
      respondOrderError(res, error, 500, 'No se pudieron obtener las órdenes');
    }
  },

  async getActiveByTable(req: Request, res: Response): Promise<void> {
    try {
      const tableId = parseOrderId(req.params.tableId as string);
      if (tableId == null) {
        res.status(400).json({ error: 'ID de mesa inválido' });
        return;
      }

      const order = await OrderService.getActiveByTable(tableId);
      res.status(200).json({ message: 'Orden activa obtenida correctamente', data: order });
    } catch (error: unknown) {
      logger.error(
        `[ORDER ERROR] GetActiveByTable: ${error instanceof Error ? error.message : error}`
      );
      respondOrderError(res, error, 404, 'No se pudo obtener la orden activa');
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { client_id, table_id, waiter_id, items } = req.body;
      const newOrder = await OrderService.createOrder({ client_id, table_id, waiter_id, items });
      res.status(201).json({ message: 'Mesa aperturada con éxito', data: newOrder });
    } catch (error: unknown) {
      logger.error(`[ORDER ERROR] Create: ${error instanceof Error ? error.message : error}`);
      respondOrderError(res, error);
    }
  },

  async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseOrderId(req.params.id as string);
      const itemId = parseOrderId(req.params.itemId as string);
      if (orderId == null || itemId == null) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }

      const updatedOrder = await OrderService.deleteItemFromOrder(orderId, itemId);
      res.status(200).json({ message: 'Plato retirado de la orden', data: updatedOrder });
    } catch (error: unknown) {
      logger.error(`[ORDER ERROR] DeleteItem: ${error instanceof Error ? error.message : error}`);
      respondOrderError(res, error);
    }
  },

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseOrderId(req.params.id as string);
      if (orderId == null) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }

      const result = await OrderService.cancelOrder(orderId);
      res.status(200).json({ message: 'Orden cancelada correctamente', data: result });
    } catch (error: unknown) {
      logger.error(`[ORDER ERROR] Cancel: ${error instanceof Error ? error.message : error}`);
      respondOrderError(res, error);
    }
  },

  async addItems(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseOrderId(req.params.id as string);
      if (orderId == null) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }

      const { items } = req.body;
      const result = await OrderService.addItemsToOrder(orderId, items);
      res.status(201).json({ message: 'Platos añadidos a la comanda', data: result });
    } catch (error: unknown) {
      logger.error(`[ORDER ERROR] AddItems: ${error instanceof Error ? error.message : error}`);
      respondOrderError(res, error);
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseOrderId(req.params.id as string);
      if (orderId == null) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }

      const order = await OrderService.getOrderDetails(orderId);
      res.status(200).json({ message: 'Orden obtenida correctamente', data: order });
    } catch (error: unknown) {
      logger.error(`[ORDER ERROR] GetById: ${error instanceof Error ? error.message : error}`);
      respondOrderError(res, error, 404, 'Orden no encontrada');
    }
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseOrderId(req.params.id as string);
      if (orderId == null) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }

      const { status } = req.body;
      const updatedOrder = await OrderService.updateStatus(orderId, status);
      res.status(200).json({ message: 'Estado actualizado', data: updatedOrder });
    } catch (error: unknown) {
      logger.error(`[ORDER ERROR] UpdateStatus: ${error instanceof Error ? error.message : error}`);
      respondOrderError(res, error);
    }
  },

  async checkout(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseOrderId(req.params.id as string);
      if (orderId == null) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }

      const { payment_method, reservation_cost } = req.body;
      const receipt = await OrderService.checkout(orderId, payment_method, reservation_cost);
      res.status(200).json({ message: 'Mesa cerrada y cuenta generada', data: receipt });
    } catch (error: unknown) {
      logger.error(`[ORDER ERROR] Checkout: ${error instanceof Error ? error.message : error}`);
      respondOrderError(res, error);
    }
  },

  async receiptPdf(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseOrderId(req.params.id as string);
      if (orderId == null) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }

      const documentType = String(req.query.document_type || 'BOLETA').toUpperCase();
      const order = await OrderService.getOrderDetails(orderId);

      if (!order.receipt || order.status !== 'PAGADO') {
        res.status(400).json({ error: 'La orden debe estar pagada para generar el PDF' });
        return;
      }

      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="comprobante-orden-${order.id}.pdf"`);

      doc.pipe(res);

      const customerName = order.client
        ? `${order.client.name ?? ''} ${order.client.last_name ?? ''}`.trim()
        : 'CONSUMIDOR FINAL';
      const customerPhone = order.client?.phone_number ?? '-';
      const receiptCode = `${getDocumentSeries(documentType)}-${String(order.receipt.id).padStart(8, '0')}`;
      const documentLabel = getDocumentLabel(documentType);
      const tableLabel = order.table?.table_number ?? String(order.table_id);
      const pageWidth = doc.page.width;
      const leftMargin = 36;
      const rightMargin = 36;
      const contentWidth = pageWidth - leftMargin - rightMargin;

      doc.fillColor('#111111').font('Helvetica-Bold').fontSize(20).text('LOCALHOST LOUNGE', {
        align: 'center',
      });
      doc.font('Helvetica').fontSize(8).text('Sistema de comprobantes', { align: 'center' });
      doc.moveDown(0.4);

      doc.font('Helvetica-Bold').fontSize(20).text(documentLabel, {
        align: 'center',
      });
      doc.font('Helvetica').fontSize(11).text(receiptCode, { align: 'center' });
      doc.moveDown(0.8);

      const topY = doc.y;
      const leftColX = leftMargin;
      const rightColX = leftMargin + contentWidth / 2 + 6;
      const colWidth = contentWidth / 2 - 6;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('FACTURAR A', leftColX, topY, { width: colWidth });
      doc.text('DETALLE', rightColX, topY, { width: colWidth });

      doc.font('Helvetica').fontSize(10);
      doc.text(customerName, leftColX, topY + 16, { width: colWidth });
      doc.text(`Teléfono: ${customerPhone}`, leftColX, topY + 30, { width: colWidth });
      doc.text(`Mesa: ${tableLabel}`, rightColX, topY + 16, { width: colWidth });
      doc.text(`Fecha: ${formatReceiptDate(order.receipt.issued_at)}`, rightColX, topY + 30, {
        width: colWidth,
      });
      doc.text(`Pago: ${order.receipt.payment_method}`, rightColX, topY + 44, { width: colWidth });

      doc.y = topY + 72;
      doc
        .moveTo(leftMargin, doc.y)
        .lineTo(pageWidth - rightMargin, doc.y)
        .stroke('#D1D5DB');
      doc.moveDown(0.8);

      const headerY = doc.y;
      const headers = [
        { label: 'CANT.', x: leftMargin, width: 52 },
        { label: 'DESCRIPCIÓN', x: leftMargin + 54, width: 245 },
        { label: 'PRECIO U.', x: leftMargin + 304, width: 95 },
        { label: 'TOTAL', x: leftMargin + 404, width: 92 },
      ];

      doc.rect(leftMargin, headerY - 2, contentWidth, 22).fill('#F3F4F6');
      doc.fillColor('#111111').font('Helvetica-Bold').fontSize(9);
      headers.forEach((header) => {
        doc.text(header.label, header.x, headerY + 4, { width: header.width, align: 'center' });
      });

      let rowY = headerY + 28;
      doc.font('Helvetica').fontSize(9);

      order.items.forEach((item) => {
        const lineTotal = Number(item.price) * item.quantity;
        const rowHeight = Math.max(
          24,
          doc.heightOfString(item.plate?.name ?? 'Plato', {
            width: 245,
          }) + 10
        );

        doc.text(String(item.quantity), leftMargin, rowY + 4, { width: 52, align: 'center' });
        doc.text(item.plate?.name ?? 'Plato', leftMargin + 54, rowY + 4, { width: 245 });
        if (item.notes) {
          doc
            .fillColor('#6B7280')
            .fontSize(8)
            .text(`Nota: ${item.notes}`, leftMargin + 54, rowY + 16, {
              width: 245,
            });
          doc.fillColor('#111111').fontSize(9);
        }
        doc.text(formatMoney(item.price), leftMargin + 304, rowY + 4, {
          width: 95,
          align: 'right',
        });
        doc.text(formatMoney(lineTotal), leftMargin + 404, rowY + 4, {
          width: 92,
          align: 'right',
        });

        doc
          .moveTo(leftMargin, rowY + rowHeight)
          .lineTo(pageWidth - rightMargin, rowY + rowHeight)
          .stroke('#E5E7EB');
        rowY += rowHeight + 4;
      });

      rowY += 8;
      const summaryX = pageWidth - 185 - rightMargin;

      const taxableTotal =
        Number(order.receipt.items_total) + Number(order.receipt.reservation_cost);
      const igvTotal = Number(order.receipt.final_total) - taxableTotal;

      doc.font('Helvetica').fontSize(10);
      doc.text('TOTAL GRAVADO', summaryX, rowY, { width: 110, align: 'left' });
      doc.text(formatMoney(taxableTotal), summaryX + 110, rowY, {
        width: 75,
        align: 'right',
      });

      rowY += 16;
      doc.text(`I.G.V ${formatPercent(0.18)}`, summaryX, rowY, { width: 110, align: 'left' });
      doc.text(formatMoney(igvTotal), summaryX + 110, rowY, { width: 75, align: 'right' });

      rowY += 20;
      doc.font('Helvetica-Bold').fontSize(14);
      doc.text('TOTAL', summaryX, rowY, { width: 110, align: 'left' });
      doc.text(formatMoney(order.receipt.final_total), summaryX + 92, rowY, {
        width: 93,
        align: 'right',
      });

      doc.font('Helvetica').fontSize(10);
      rowY += 28;
      doc.text(`SON: ${Number(order.receipt.final_total).toFixed(2)} SOLES`, leftMargin, rowY, {
        width: contentWidth,
      });
      rowY += 16;
      doc.text(`FORMA DE PAGO: ${order.receipt.payment_method}`, leftMargin, rowY, {
        width: contentWidth,
      });
      rowY += 14;
      doc.text(`COND. VENTA: CONTADO`, leftMargin, rowY, { width: contentWidth });

      rowY += 26;
      doc
        .fontSize(8)
        .fillColor('#6B7280')
        .text(
          'Representación impresa del comprobante generado por el sistema de punto de venta.',
          leftMargin,
          rowY,
          { width: contentWidth, align: 'center' }
        );

      doc.fillColor('#111111');

      doc.end();
    } catch (error: unknown) {
      logger.error(`[ORDER ERROR] ReceiptPdf: ${error instanceof Error ? error.message : error}`);
      respondOrderError(res, error, 500, 'No se pudo generar el PDF del comprobante');
    }
  },
};

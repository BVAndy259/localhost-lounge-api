import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AIService } from "../services/ai.service";
import { ReservationService } from "../services/reservation.service";

export const ChatController = {
  async handleWebMessage(
    req: Request,
    res: Response,
  ): Promise<Response | void> {
    try {
      const { sessionToken, clientId, message, role } = req.body;

      if (!sessionToken || !message) {
        return res
          .status(400)
          .json({ error: "Faltan datos obligatorios (sessionToken, message)" });
      }

      const userRole = role || "CLIENTE";

      let session = await prisma.chat_Session.findUnique({
        where: { session_token: sessionToken },
      });

      if (!session) {
        session = await prisma.chat_Session.create({
          data: {
            session_token: sessionToken,
            client_id: clientId || null,
          },
        });
      }

      const historyRaw = await prisma.chat_Message.findMany({
        where: { session_id: session.id },
        orderBy: { created_on: "desc" },
        take: 6,
      });
      const history = historyRaw.reverse();

      await prisma.chat_Message.create({
        data: { session_id: session.id, role: userRole, content: message },
      });

      let aiResponse;

      if (userRole === "RECEPCIONISTA" || userRole === "ADMIN") {
        aiResponse = await AIService.processWorkerWebMessage(message, history);
      } else {
        aiResponse = await AIService.processClientWebMessage(message, history);
      }

      if (!aiResponse.payload) {
        aiResponse.payload = {};
      } else if (typeof aiResponse.payload === "string") {
        try {
          const parsedPayload = JSON.parse(aiResponse.payload);
          aiResponse.payload =
            parsedPayload &&
            typeof parsedPayload === "object" &&
            !Array.isArray(parsedPayload)
              ? parsedPayload
              : {};
        } catch {
          aiResponse.payload = {};
        }
      } else if (
        typeof aiResponse.payload !== "object" ||
        Array.isArray(aiResponse.payload)
      ) {
        aiResponse.payload = {};
      }

      const isWorker = userRole === "RECEPCIONISTA" || userRole === "ADMIN";
      const rawMessage = typeof message === "string" ? message : "";
      const normalizedMessage = rawMessage.toLowerCase();

      if (isWorker && aiResponse.action === "REPLY") {
        const wantsDashboard =
          normalizedMessage.includes("dashboard") ||
          normalizedMessage.includes("resumen") ||
          normalizedMessage.includes("estadistic");
        const wantsTableStatus =
          normalizedMessage.includes("estado de mesas") ||
          normalizedMessage.includes("mesas libres") ||
          normalizedMessage.includes("mesas ocup") ||
          normalizedMessage.includes("mesas") ||
          normalizedMessage.includes("mesa");
        const wantsReservation =
          normalizedMessage.includes("reserva") ||
          normalizedMessage.includes("reservacion") ||
          normalizedMessage.includes("reservacion") ||
          normalizedMessage.includes("reservaciones") ||
          normalizedMessage.includes("reservas");

        if (wantsDashboard) {
          aiResponse.action = "SHOW_DASHBOARD";
          aiResponse.payload = {};
        } else if (wantsReservation) {
          const numericMatch = rawMessage.match(/\d+/);
          const searchTerm = numericMatch ? numericMatch[0] : rawMessage.trim();
          aiResponse.action = "FIND_RESERVATION";
          aiResponse.payload = { search_term: searchTerm };
        } else if (wantsTableStatus) {
          aiResponse.action = "RENDER_TABLE_STATUS";
          aiResponse.payload = {};
        }
      }

      const getTodayRange = () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { start, end };
      };

      const normalizeZone = (value: unknown) => {
        if (typeof value !== "string") return null;
        const normalized = value
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .trim()
          .toUpperCase();
        return normalized || null;
      };

      if (aiResponse.action === "SHOW_MENU") {
        const { category, plate_name } = aiResponse.payload;

        const whereClause: any = { available: true };
        if (category)
          whereClause.category = { contains: category, mode: "insensitive" };
        if (plate_name)
          whereClause.name = { contains: plate_name, mode: "insensitive" };

        const plates = await prisma.plate.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image_url: true,
          },
        });

        aiResponse.payload.plates = plates;

        if (plates.length === 0) {
          aiResponse.reply =
            "No encontré opciones exactas en este momento, pero puedes explorar nuestro menú completo.";
        }
      } else if (aiResponse.action === "SHOW_RESERVATION_FORM") {
        const { people, type } = aiResponse.payload;

        const whereClause: any = { status: "LIBRE", active: true };

        if (people) {
          const capacityInt = parseInt(people);
          if (!isNaN(capacityInt)) whereClause.capacity = { gte: capacityInt };
        }
        if (type) whereClause.type = type.toUpperCase();

        const availableTables = await prisma.table.findMany({
          where: whereClause,
          select: {
            id: true,
            table_number: true,
            capacity: true,
            type: true,
            reservation_price: true,
            description: true,
          },
        });

        aiResponse.payload.available_tables = availableTables;

        if (availableTables.length === 0) {
          aiResponse.reply =
            "Lo siento, ahora mismo no tenemos mesas disponibles que coincidan con tu solicitud. ¿Gustas ver otras opciones?";
        }
      } else if (aiResponse.action === "SHOW_DASHBOARD") {
        const { start, end } = getTodayRange();

        const [
          totalTables,
          activeTables,
          inactiveTables,
          freeTables,
          occupiedTables,
          reservedTables,
          reservationsToday,
          pendingReservations,
          supportRequired,
        ] = await Promise.all([
          prisma.table.count(),
          prisma.table.count({ where: { active: true } }),
          prisma.table.count({ where: { active: false } }),
          prisma.table.count({ where: { active: true, status: "LIBRE" } }),
          prisma.table.count({ where: { active: true, status: "OCUPADO" } }),
          prisma.table.count({ where: { active: true, status: "RESERVADO" } }),
          prisma.reservation.count({
            where: { reservation_date: { gte: start, lt: end } },
          }),
          prisma.reservation.count({ where: { status: "PENDIENTE" } }),
          prisma.reservation.count({
            where: { status: "PENDIENTE", support_required: true },
          }),
        ]);

        aiResponse.payload.dashboard = {
          tables: {
            total: totalTables,
            active: activeTables,
            inactive: inactiveTables,
            libres: freeTables,
            ocupadas: occupiedTables,
            reservadas: reservedTables,
          },
          reservations: {
            today_total: reservationsToday,
            pending: pendingReservations,
            support_required: supportRequired,
          },
        };
      } else if (aiResponse.action === "RENDER_TABLE_STATUS") {
        const tables = await prisma.table.findMany({
          orderBy: { table_number: "asc" },
          select: {
            id: true,
            table_number: true,
            capacity: true,
            type: true,
            status: true,
            active: true,
            reservation_price: true,
            description: true,
            waiter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        aiResponse.payload.tables = tables;

        if (tables.length === 0) {
          aiResponse.reply =
            "No hay mesas registradas en este momento. Puedes crear nuevas desde el panel de mesas.";
        }
      } else if (aiResponse.action === "FIND_RESERVATION") {
        const rawSearchTerm = aiResponse.payload.search_term;
        const searchTerm =
          typeof rawSearchTerm === "string" ? rawSearchTerm.trim() : "";

        if (!searchTerm) {
          aiResponse.reply =
            "Necesito un dato para buscar la reserva (ID, nombre, correo, telefono o mesa).";
          aiResponse.payload.reservations = [];
        } else {
          const numericTerm = parseInt(searchTerm, 10);
          const hasNumeric = !isNaN(numericTerm);

          const reservations = await prisma.reservation.findMany({
            where: {
              OR: [
                ...(hasNumeric ? [{ id: numericTerm }] : []),
                ...(hasNumeric
                  ? [{ table: { table_number: numericTerm } }]
                  : []),
                {
                  client: {
                    OR: [
                      {
                        name: {
                          contains: searchTerm,
                          mode: "insensitive",
                        },
                      },
                      {
                        last_name: {
                          contains: searchTerm,
                          mode: "insensitive",
                        },
                      },
                      {
                        email: {
                          contains: searchTerm,
                          mode: "insensitive",
                        },
                      },
                      {
                        phone_number: {
                          contains: searchTerm,
                          mode: "insensitive",
                        },
                      },
                    ],
                  },
                },
              ],
            },
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  last_name: true,
                  email: true,
                  phone_number: true,
                },
              },
              table: {
                select: {
                  id: true,
                  table_number: true,
                  type: true,
                  capacity: true,
                },
              },
              receptionist: { select: { id: true, name: true } },
            },
            orderBy: [
              { reservation_date: "desc" },
              { reservation_time: "asc" },
            ],
            take: 10,
          });

          aiResponse.payload.reservations = reservations;

          if (reservations.length === 0) {
            aiResponse.reply =
              "No encontre reservas con ese dato. Intenta con el nombre completo, correo o numero de mesa.";
          }
        }
      } else if (aiResponse.action === "CREATE_RESERVATION") {
        const payload = aiResponse.payload || {};
        const clientPayload = payload.client || {};
        const missingFields: string[] = [];

        if (!payload.people) missingFields.push("cantidad de personas");
        if (!payload.date) missingFields.push("fecha (YYYY-MM-DD)");
        if (!payload.time) missingFields.push("hora (HH:mm)");
        if (!clientPayload.name) missingFields.push("nombre");
        if (!clientPayload.last_name) missingFields.push("apellido");
        if (!clientPayload.phone_number) missingFields.push("telefono");
        if (!clientPayload.email) missingFields.push("correo");

        if (missingFields.length > 0) {
          aiResponse.action = "REPLY";
          aiResponse.payload = {};
          aiResponse.reply = `Para crear tu reserva necesito: ${missingFields.join(", ")}.`;
        } else {
          const peopleInt = parseInt(payload.people, 10);
          if (isNaN(peopleInt) || peopleInt <= 0) {
            aiResponse.action = "REPLY";
            aiResponse.payload = {};
            aiResponse.reply =
              "La cantidad de personas no es valida. Indica un numero mayor a cero.";
          } else {
            const normalizedType = normalizeZone(payload.type);
            let tableId = payload.table_id;

            if (!tableId && payload.table_number) {
              const tableNumber = parseInt(payload.table_number, 10);
              if (!isNaN(tableNumber)) {
                const table = await prisma.table.findFirst({
                  where: {
                    table_number: tableNumber,
                    active: true,
                    status: "LIBRE",
                  },
                  select: { id: true },
                });
                tableId = table?.id;
              }
            }

            if (!tableId) {
              const table = await prisma.table.findFirst({
                where: {
                  active: true,
                  status: "LIBRE",
                  capacity: { gte: peopleInt },
                  ...(normalizedType ? { type: normalizedType } : {}),
                },
                orderBy: { capacity: "asc" },
                select: { id: true },
              });
              tableId = table?.id;
            }

            if (!tableId) {
              const availableTables = await prisma.table.findMany({
                where: {
                  active: true,
                  status: "LIBRE",
                  capacity: { gte: peopleInt },
                  ...(normalizedType ? { type: normalizedType } : {}),
                },
                orderBy: { capacity: "asc" },
                select: {
                  id: true,
                  table_number: true,
                  capacity: true,
                  type: true,
                  reservation_price: true,
                  description: true,
                },
              });

              aiResponse.action = "REPLY";
              aiResponse.payload = { available_tables: availableTables };
              aiResponse.reply =
                "No encontre una mesa libre con esos criterios. Puedes elegir una de estas opciones disponibles.";
            } else {
              try {
                const reservationTime = `${payload.date}T${payload.time}`;
                const reservation = await ReservationService.createReservation({
                  table_id: tableId,
                  reservation_date: payload.date,
                  reservation_time: reservationTime,
                  number_people: peopleInt,
                  notes: payload.notes || "",
                  client_data: {
                    name: clientPayload.name,
                    last_name: clientPayload.last_name,
                    phone_number: clientPayload.phone_number,
                    email: clientPayload.email,
                  },
                });

                aiResponse.payload.reservation = reservation;
                aiResponse.reply =
                  "Listo, tu reserva quedo registrada. Si deseas modificar algun detalle, dimelo.";
              } catch (error: any) {
                aiResponse.action = "REPLY";
                aiResponse.payload = {};
                aiResponse.reply =
                  error?.message ||
                  "No pude registrar la reserva. Intenta de nuevo.";
              }
            }
          }
        }
      } else if (aiResponse.action === "NAVIGATE_PROFILE") {
        let resolvedClientId = clientId || session.client_id;
        const contact = aiResponse.payload?.contact || {};

        if (!resolvedClientId && (contact.email || contact.phone_number)) {
          const clientMatch = await prisma.client.findFirst({
            where: {
              OR: [
                ...(contact.email ? [{ email: contact.email }] : []),
                ...(contact.phone_number
                  ? [{ phone_number: contact.phone_number }]
                  : []),
              ],
            },
            select: { id: true },
          });
          resolvedClientId = clientMatch?.id;
        }

        if (!resolvedClientId) {
          aiResponse.reply =
            "Para mostrar tu historial necesito tu correo o telefono de cliente.";
          aiResponse.payload.profile = null;
        } else {
          const clientProfile = await prisma.client.findUnique({
            where: { id: resolvedClientId },
            select: {
              id: true,
              name: true,
              last_name: true,
              email: true,
              phone_number: true,
              total_reservations: true,
              category: true,
              reservations: {
                orderBy: { created_on: "desc" },
                take: 5,
                select: {
                  id: true,
                  reservation_date: true,
                  reservation_time: true,
                  number_people: true,
                  status: true,
                  support_required: true,
                  table: {
                    select: {
                      id: true,
                      table_number: true,
                      type: true,
                      capacity: true,
                    },
                  },
                },
              },
            },
          });

          aiResponse.payload.profile = clientProfile;

          if (!clientProfile) {
            aiResponse.reply =
              "No encontre tu perfil en el sistema. Verifica tus datos o contacta al personal.";
          }
        }
      } else if (aiResponse.action === "HUMAN_INTERVENTION" && clientId) {
        const activeReservation = await prisma.reservation.findFirst({
          where: { client_id: clientId, status: "PENDIENTE" },
          orderBy: { created_on: "desc" },
        });

        if (activeReservation) {
          await prisma.reservation.update({
            where: { id: activeReservation.id },
            data: { support_required: true },
          });
          console.log(
            `[WEB ALERT] Reserva ${activeReservation.id} requiere atención del personal.`,
          );
        }
      }

      await prisma.chat_Message.create({
        data: {
          session_id: session.id,
          role: "BOT",
          content: aiResponse.reply,
        },
      });

      return res.status(200).json({
        action: aiResponse.action,
        reply: aiResponse.reply,
        payload: aiResponse.payload,
      });
    } catch (error) {
      console.error("[CHAT CTRL ERROR] Fallo al procesar el chat web:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  },
};

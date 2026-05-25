import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HttpError from '../src/utils/httpError';

// Mock prisma module
vi.mock('../src/config/prisma', () => {
  const mockPrisma = {
    client: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    table: {
      findUnique: vi.fn(),
    },
    reservation: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  };
  return { default: mockPrisma };
});

import { ReservationService } from '../src/services/reservation.service';
import prisma from '../src/config/prisma';

describe('ReservationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw HttpError when time is outside allowed range', async () => {
    const payload = {
      table_id: 1,
      reservation_date: '2026-05-26',
      reservation_time: '1970-01-01T15:00:00', // 15:00
      number_people: 2,
      client_data: {
        name: 'Test',
        last_name: 'User',
        phone_number: '999999999',
        email: 't@example.com',
      },
    };

    await expect(ReservationService.createReservation(payload as any)).rejects.toBeInstanceOf(
      HttpError
    );
    await expect(ReservationService.createReservation(payload as any)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('should create reservation and client when none exists', async () => {
    const payload = {
      table_id: 1,
      reservation_date: '2026-05-26',
      reservation_time: '1970-01-01T19:00:00', // 19:00
      number_people: 2,
      client_data: {
        name: 'Test',
        last_name: 'User',
        phone_number: '999999999',
        email: 't@example.com',
      },
    };

    // client.findMany -> no existing clients
    (prisma as any).client.findMany.mockResolvedValue([]);
    // table exists
    (prisma as any).table.findUnique.mockResolvedValue({ id: 1, capacity: 4 });
    // no existing reservations
    (prisma as any).reservation.findMany.mockResolvedValue([]);
    // create client
    (prisma as any).client.create.mockResolvedValue({
      id: 42,
      ...payload.client_data,
      total_reservations: 1,
      category: 'NUEVO',
    });
    // create reservation
    const createdReservation = { id: 100, client_id: 42, table_id: 1 };
    (prisma as any).reservation.create.mockResolvedValue(createdReservation);

    const result = await ReservationService.createReservation(payload as any);

    expect((prisma as any).client.create).toHaveBeenCalled();
    expect((prisma as any).reservation.create).toHaveBeenCalled();
    expect(result).toEqual(createdReservation);
  });
});

import { Request, Response } from "express";
import { PlateService } from "../services/plate.service";

export const TableController = {
    async create(req: Request, res: Response) {
        try {
            const {table_number, capacity, type, reservation_price, description} = req.body
        } catch (error: any) {
            console.error(`[TABLE ERROR] Create: ${error.message}`)
            res.status(400).json({error: error.message})
        }
    },

    async getAll() {},

    async update() {},

    async changeStatus() {},

    async toggleActive() {}
}
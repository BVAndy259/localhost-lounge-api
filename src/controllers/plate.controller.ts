import { Request, Response } from "express";
import { PlateService } from "../services/plate.service";
import console from "node:console";

export const PlateController = {
    async create(req: Request, res: Response): Promise<void> {
        try {
            
        } catch (error: any) {
            console.error(`[PLATE ERROR] Create: ${error.message}`)
            res.status(400).json({error: error.message})
        }
    },

    async getAll(req: Request, res: Response): Promise<void> {
        try {
            
        } catch (error: any) {
            console.error(`[PLATE ERROR] GetAll: ${error.message}`)
            res.status(500).json({error: 'Error interno del servidor'})
        }
    },

    async update(req: Request, res: Response): Promise<void> {
        try {
            
        } catch (error: any) {
            
        }
    }, 

    async toggleStatus(req: Request, res: Response): Promise<void> {
        try {
            
        } catch (error: any) {
            
        }
    }
}
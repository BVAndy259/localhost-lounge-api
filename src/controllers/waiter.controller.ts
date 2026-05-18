import { Request, Response } from "express";
import { WaiterService } from "../services/waiter.service";

export const WaiterController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      if (!name) {
        res
          .status(400)
          .json({ error: "Es obligatorio indicar el nombre del mesero" });
        return;
      }

      const newWaiter = await WaiterService.createWaiter(name);
      res.status(201).json({
        message: "El mesero se ha creado correctamente",
        data: newWaiter,
      });
    } catch (error: any) {
      console.error(`[WAITER ERROR] Create: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const waiters = await WaiterService.getAllWaiters();
      res.status(200).json({
        message: "Se han recuperado correctamente los meseros",
        data: waiters,
      });
    } catch (error: any) {
      console.error(`[WAITER ERROR] GetAll: ${error.message}`);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const waiterId = parseInt(req.params.id as string, 10);
      if (isNaN(waiterId)) {
        res.status(400).json({ error: "Formato de ID de mesero no válido" });
        return;
      }

      const { name } = req.body;
      if (!name) {
        res.status(400).json({
          error:
            "Es necesario indicar el nombre del mesero para realizar la actualización",
        });
        return;
      }

      const updatedWaiter = await WaiterService.updateWaiter(waiterId, name);
      res.status(200).json({
        message: "El mesero se ha actualizado correctamente",
        data: updatedWaiter,
      });
    } catch (error: any) {
      console.error(`[WAITER ERROR] Update: ${error.message}`);
      if (error.message === "No se ha encontrado el mesero") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  },

  async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const waiterId = parseInt(req.params.id as string, 10);
      if (isNaN(waiterId)) {
        res.status(400).json({ error: "Formato de ID de mesero no válido" });
        return;
      }

      const { active } = req.body;
      if (typeof active !== "boolean") {
        res
          .status(400)
          .json({ error: "El campo «activo» debe ser un valor booleano" });
        return;
      }

      const updatedWaiter = await WaiterService.toggleWaiterStatus(
        waiterId,
        active,
      );
      const statusMessage = active ? "activado" : "desactivado/suspendido";

      res.status(200).json({
        message: `Mesero ${statusMessage} con éxito`,
        data: updatedWaiter,
      });
    } catch (error: any) {
      console.error(`[WAITER ERROR] ToggleStatus: ${error.message}`);
      if (error.message === "No se ha encontrado el mesero") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  },
};

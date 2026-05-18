import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        res
          .status(400)
          .json({
            error:
              "Es necesario introducir el nombre, el correo electrónico y la contraseña",
          });
        return;
      }

      const newUser = await AuthService.registerUser(
        name,
        email,
        password,
        role,
      );

      res.status(201).json({
        message: "El usuario se ha registrado correctamente",
        data: newUser,
      });
    } catch (error: any) {
      console.error(`[AUTH ERROR] Registro: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res
          .status(400)
          .json({
            error:
              "Es necesario introducir el correo electrónico y la contraseña",
          });
        return;
      }

      const authData = await AuthService.loginUser(email, password);

      res.status(200).json({
        message: "Inicio de sesión correcto",
        data: authData,
      });
    } catch (error: any) {
      console.error(`[AUTH ERROR] Login: ${error.message}`);
      res.status(401).json({ error: error.message });
    }
  },
};

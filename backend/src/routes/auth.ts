import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (role defaults to CUSTOMER unless explicitly set to ADMIN)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // A SOLUÇÃO ESTÁ AQUI:
    // Rejeite se o usuário não for encontrado OU se o usuário não tiver uma senha (é um guest)
    if (!user || !user.password) {
      // Usamos a mesma mensagem de erro para não vazar a informação de que o e-mail existe mas é de um guest
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    // Neste ponto, o TypeScript já sabe que user.password é uma string e o erro desaparece.
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * POST /api/auth/guest
 * Creates a new guest user and returns a JWT token
 */
router.post('/guest', async (req: Request, res: Response) => {
  try {
    // 1. Gere um email único para o guest para evitar conflitos de constraint
    const guestEmail = `guest_${randomUUID()}@telegram-secrets.com`;

    // 2. Crie o usuário com a role 'GUEST' e sem senha
    // @ts-ignore
    // @ts-ignore
    const user = await prisma.user.create({
      data: {
        email: guestEmail,
        role: 'GUEST',
        // O campo 'password' é opcional no schema, então não é necessário aqui
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    // 3. Gere o JWT para o usuário convidado
    const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' } // Você pode definir uma expiração menor para guests se desejar
    );

    res.status(201).json({
      message: 'Guest session created successfully',
      user,
      token,
    });
  } catch (error) {
    console.error('Guest session creation error:', error);
    res.status(500).json({ error: 'Internal server error during guest session creation' });
  }
});

export default router;

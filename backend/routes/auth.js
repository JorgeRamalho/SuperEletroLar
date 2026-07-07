import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { store, isUsingPostgres } from '../utils/store.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const existing = isUsingPostgres()
      ? await store.findUserByEmail(email)
      : (await store.getUsers()).find(u => u.email === email.toLowerCase());

    if (existing) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      createdAt: new Date().toISOString(),
    };

    if (isUsingPostgres()) {
      await store.insertUser(user);
    } else {
      const users = await store.getUsers();
      users.push(user);
      await store.saveUsers(users);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch {
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const user = isUsingPostgres()
      ? await store.findUserByEmail(email)
      : (await store.getUsers()).find(u => u.email === email.toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = isUsingPostgres()
    ? await store.findUserById(req.user.id)
    : (await store.getUsers()).find(u => u.id === req.user.id);

  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone });
});

export default router;

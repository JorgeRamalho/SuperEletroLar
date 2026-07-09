import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { store, isUsingDatabase } from '../utils/store.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    cpf: user.cpf || '',
    birthdate: user.birthdate || '',
    address: user.address || {},
    createdAt: user.createdAt || null,
  };
}

async function findUserByEmail(email) {
  if (store.findUserByEmail) {
    const found = await store.findUserByEmail(email);
    if (found) return found;
  }
  const users = await store.getUsers();
  return users.find(u => u.email === String(email).toLowerCase()) || null;
}

async function findUserById(id) {
  if (store.findUserById) {
    const found = await store.findUserById(id);
    if (found) return found;
  }
  const users = await store.getUsers();
  return users.find(u => u.id === id) || null;
}

async function findUserByCpf(cpf) {
  const digits = String(cpf || '').replace(/\D/g, '');
  if (!digits) return null;
  if (store.findUserByCpf) {
    const found = await store.findUserByCpf(digits);
    if (found) return found;
  }
  const users = await store.getUsers();
  return users.find(u => (u.cpf || '').replace(/\D/g, '') === digits) || null;
}

async function saveNewUser(user) {
  if (isUsingDatabase() && store.insertUser) {
    await store.insertUser(user);
    return;
  }
  const users = await store.getUsers();
  users.push(user);
  await store.saveUsers(users);
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, cpf, birthdate, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Telefone é obrigatório' });
    }

    if (!cpf) {
      return res.status(400).json({ error: 'CPF é obrigatório' });
    }

    if (!birthdate) {
      return res.status(400).json({ error: 'Data de nascimento é obrigatória' });
    }

    if (!address?.cep || !address?.street || !address?.number || !address?.city || !address?.state || !address?.neighborhood) {
      return res.status(400).json({ error: 'Endereço completo é obrigatório' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const cpfDigits = String(cpf).replace(/\D/g, '');
    const existingCpf = await findUserByCpf(cpfDigits);
    if (existingCpf) {
      return res.status(409).json({ error: 'CPF já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      name: String(name).trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: String(phone).trim(),
      cpf: cpfDigits,
      birthdate,
      address: {
        cep: address.cep,
        street: address.street,
        number: address.number,
        complement: address.complement || '',
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      },
      createdAt: new Date().toISOString(),
    };

    await saveNewUser(user);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: toPublicUser(user),
      storage: isUsingDatabase() ? 'database' : 'json',
    });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const user = await findUserByEmail(email);

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
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(toPublicUser(user));
  } catch (err) {
    console.error('Erro em /me:', err);
    res.status(500).json({ error: 'Erro ao carregar perfil' });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const current = await findUserById(req.user.id);
    if (!current) return res.status(404).json({ error: 'Usuário não encontrado' });

    const { name, phone, birthdate, address, password } = req.body;

    const updated = {
      ...current,
      name: name?.trim() || current.name,
      phone: phone?.trim() ?? current.phone,
      birthdate: birthdate || current.birthdate,
      address: address
        ? {
            cep: address.cep || current.address?.cep || '',
            street: address.street || current.address?.street || '',
            number: address.number || current.address?.number || '',
            complement: address.complement ?? current.address?.complement ?? '',
            neighborhood: address.neighborhood || current.address?.neighborhood || '',
            city: address.city || current.address?.city || '',
            state: address.state || current.address?.state || '',
          }
        : (current.address || {}),
    };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
      }
      updated.password = await bcrypt.hash(password, 10);
    }

    if (isUsingDatabase() && store.updateUser) {
      await store.updateUser(updated);
    } else {
      const users = await store.getUsers();
      const idx = users.findIndex(u => u.id === current.id);
      if (idx < 0) return res.status(404).json({ error: 'Usuário não encontrado' });
      users[idx] = updated;
      await store.saveUsers(users);
    }

    const saved = await findUserById(current.id);
    res.json(toPublicUser(saved));
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

export default router;

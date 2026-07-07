import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

const RUNTIME_FILES = {
  'users.json': [],
  'orders.json': [],
  'payments.json': [],
};

export function ensureRuntimeData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  Object.entries(RUNTIME_FILES).forEach(([file, defaultValue]) => {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
    }
  });
}

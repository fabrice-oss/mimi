import { Category, Transaction, Budget, User } from '../types';
import { DEFAULT_CATEGORIES } from './defaultData';
import { v4 as uuidv4 } from 'uuid';

// ── Types GIS ────────────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
  callback: (r: TokenResponse) => void;
}

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (r: TokenResponse) => void;
          }) => TokenClient;
          revoke: (token: string, cb: () => void) => void;
        };
      };
    };
  }
}

// ── État interne ─────────────────────────────────────────────────────────────

let tokenClient: TokenClient | null = null;
let _accessToken = '';
let _expiresAt = 0;

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'email',
  'profile',
].join(' ');

// ── Auth ─────────────────────────────────────────────────────────────────────

export function initGoogleAuth(clientId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.google !== 'undefined') {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: () => {},
      });
      resolve();
      return;
    }
    // Si le script GIS n'est pas encore chargé
    const check = setInterval(() => {
      if (typeof window.google !== 'undefined') {
        clearInterval(check);
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: () => {},
        });
        resolve();
      }
    }, 100);
    setTimeout(() => {
      clearInterval(check);
      reject(new Error('Google Identity Services non chargé'));
    }, 10000);
  });
}

export function requestAccessToken(prompt = ''): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client non initialisé'));
      return;
    }
    tokenClient.callback = (resp: TokenResponse) => {
      if (resp.error) {
        reject(new Error(resp.error));
        return;
      }
      _accessToken = resp.access_token;
      _expiresAt = Date.now() + resp.expires_in * 1000 - 60_000; // 1 min de marge
      resolve(_accessToken);
    };
    tokenClient.requestAccessToken({ prompt });
  });
}

async function getToken(): Promise<string> {
  if (_accessToken && Date.now() < _expiresAt) return _accessToken;
  // Renouvellement silencieux
  return requestAccessToken('');
}

export function revokeToken(): Promise<void> {
  return new Promise((resolve) => {
    if (!_accessToken) { resolve(); return; }
    window.google.accounts.oauth2.revoke(_accessToken, () => {
      _accessToken = '';
      _expiresAt = 0;
      resolve();
    });
  });
}

export async function fetchUserInfo(token: string): Promise<User> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return { email: data.email, name: data.name, picture: data.picture };
}

// ── Helpers fetch Sheets ─────────────────────────────────────────────────────

async function api(url: string, opts: RequestInit = {}): Promise<unknown> {
  const token = await getToken();
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API error ${res.status}: ${text}`);
  }
  return res.json();
}

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function getValues(spreadsheetId: string, range: string): Promise<string[][]> {
  const data = (await api(`${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`)) as {
    values?: string[][];
  };
  return data.values ?? [];
}

async function appendValues(spreadsheetId: string, range: string, values: unknown[][]): Promise<void> {
  await api(
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values }) },
  );
}

async function clearAndWrite(spreadsheetId: string, range: string, values: unknown[][]): Promise<void> {
  await api(`${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, { method: 'POST' });
  if (values.length > 0) {
    await api(
      `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      { method: 'PUT', body: JSON.stringify({ values }) },
    );
  }
}

// ── Création du classeur ─────────────────────────────────────────────────────

const SPREADSHEET_KEY = (email: string) => `mimi_spreadsheet_${email}`;

export function getSavedSpreadsheetId(email: string): string | null {
  return localStorage.getItem(SPREADSHEET_KEY(email));
}

export async function createSpreadsheet(email: string): Promise<string> {
  const data = (await api(`${BASE}`, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: 'Mimi Comptabilité', locale: 'fr_FR' },
      sheets: [
        { properties: { title: 'Transactions' } },
        { properties: { title: 'Budgets' } },
        { properties: { title: 'Catégories' } },
      ],
    }),
  })) as { spreadsheetId: string };

  const id = data.spreadsheetId;
  localStorage.setItem(SPREADSHEET_KEY(email), id);

  // En-têtes
  await clearAndWrite(id, 'Transactions!A1:F1', [
    ['id', 'date', 'description', 'categoryId', 'type', 'amount'],
  ]);
  await clearAndWrite(id, 'Budgets!A1:D1', [
    ['id', 'monthYear', 'categoryId', 'amount'],
  ]);
  await clearAndWrite(id, 'Catégories!A1:E1', [
    ['id', 'name', 'type', 'color', 'icon'],
  ]);

  // Catégories par défaut
  const catRows = DEFAULT_CATEGORIES.map((c) => [c.id, c.name, c.type, c.color, c.icon]);
  await appendValues(id, 'Catégories!A2', catRows);

  return id;
}

// ── Lecture de toutes les données ─────────────────────────────────────────────

export async function loadAllData(spreadsheetId: string): Promise<{
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
}> {
  const [tRows, bRows, cRows] = await Promise.all([
    getValues(spreadsheetId, 'Transactions!A2:F'),
    getValues(spreadsheetId, 'Budgets!A2:D'),
    getValues(spreadsheetId, 'Catégories!A2:E'),
  ]);

  const transactions: Transaction[] = tRows
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0],
      date: r[1],
      description: r[2],
      categoryId: r[3],
      type: r[4] as Transaction['type'],
      amount: parseFloat(r[5]) || 0,
    }));

  const budgets: Budget[] = bRows
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0],
      monthYear: r[1],
      categoryId: r[2],
      amount: parseFloat(r[3]) || 0,
    }));

  const categories: Category[] = cRows
    .filter((r) => r[0])
    .map((r) => ({
      id: r[0],
      name: r[1],
      type: r[2] as Category['type'],
      color: r[3],
      icon: r[4],
    }));

  return { transactions, budgets, categories };
}

// ── Transactions ─────────────────────────────────────────────────────────────

export async function addTransaction(
  spreadsheetId: string,
  t: Omit<Transaction, 'id'>,
): Promise<Transaction> {
  const newT: Transaction = { ...t, id: uuidv4() };
  await appendValues(spreadsheetId, 'Transactions!A2', [
    [newT.id, newT.date, newT.description, newT.categoryId, newT.type, newT.amount],
  ]);
  return newT;
}

export async function updateTransaction(
  spreadsheetId: string,
  updated: Transaction,
  all: Transaction[],
): Promise<void> {
  const rows = all.map((t) =>
    t.id === updated.id
      ? [updated.id, updated.date, updated.description, updated.categoryId, updated.type, updated.amount]
      : [t.id, t.date, t.description, t.categoryId, t.type, t.amount],
  );
  await clearAndWrite(spreadsheetId, 'Transactions!A2:F', rows);
}

export async function deleteTransaction(
  spreadsheetId: string,
  id: string,
  all: Transaction[],
): Promise<void> {
  const rows = all
    .filter((t) => t.id !== id)
    .map((t) => [t.id, t.date, t.description, t.categoryId, t.type, t.amount]);
  await clearAndWrite(spreadsheetId, 'Transactions!A2:F', rows);
}

// ── Budgets ───────────────────────────────────────────────────────────────────

export async function saveBudget(
  spreadsheetId: string,
  b: Omit<Budget, 'id'>,
  all: Budget[],
): Promise<Budget> {
  const existing = all.find((x) => x.monthYear === b.monthYear && x.categoryId === b.categoryId);
  if (existing) {
    const updated = { ...existing, amount: b.amount };
    const rows = all.map((x) =>
      x.id === existing.id
        ? [updated.id, updated.monthYear, updated.categoryId, updated.amount]
        : [x.id, x.monthYear, x.categoryId, x.amount],
    );
    await clearAndWrite(spreadsheetId, 'Budgets!A2:D', rows);
    return updated;
  }
  const newB: Budget = { ...b, id: uuidv4() };
  await appendValues(spreadsheetId, 'Budgets!A2', [
    [newB.id, newB.monthYear, newB.categoryId, newB.amount],
  ]);
  return newB;
}

export async function deleteBudget(
  spreadsheetId: string,
  id: string,
  all: Budget[],
): Promise<void> {
  const rows = all
    .filter((b) => b.id !== id)
    .map((b) => [b.id, b.monthYear, b.categoryId, b.amount]);
  await clearAndWrite(spreadsheetId, 'Budgets!A2:D', rows);
}

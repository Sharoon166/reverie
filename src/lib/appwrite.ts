import { Account, Client, Storage, TablesDB } from 'appwrite';

export const client = new Client();

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as
  | string
  | undefined;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as
  | string
  | undefined;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID) {
  console.warn(
    '[appwrite] Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID. API routes will return empty results.'
  );
} else {
  client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setDevKey(
      '05aff288a754e26e7154c8260db07e0a6ad2293fa9d6aa39db115e459377e15c844f3fa0809ec6b1639e62447730d46e9177ab589ba0e7e5f3f4570cf88cc95c34697dde654854d21e4b026f06b3fb38059b05d311be08e50764011f070ee31d4c5bdea21aab5e163ed134604e747b441a4c598e0477f23a276e26e4a9711abe'
    );
}

export const account = new Account(client);

export const db = new TablesDB(client);
export const storage = new Storage(client);

export const APPWRITE_DB = {
  databaseId: '68b00c82003517559e80',
  tables: {
    employees: 'employees',
    projects: 'projects',
    clients: 'clients',
    leads: 'leads',
    invoices: 'invoices',
    salary_payments: 'salary_payments',
    attendance: 'attendance',
    bonus: 'bonus',
    expenses: 'expenses',
    expense_targets: 'expense_targets',
    expense_quarters: 'expense_quarters',
    quarters: 'quarters',
  },
  buckets: {
    reverie: '68b00e030000c6f5d281',
  },
};

export { ID } from 'appwrite';

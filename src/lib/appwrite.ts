import { Account, Client, Storage, TablesDB } from 'appwrite';

export const client = new Client();

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as
  | string
  | undefined;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as
  | string
  | undefined;
const API_KEY = process.env.APPWRITE_API_KEY as string;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID) {
  console.warn(
    '[appwrite] Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID. API routes will return empty results.'
  );
} else {
  client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID) 
    .setDevKey(API_KEY);
}

export const checkAuth = async () => {
  try {
    const session = await account.getSession('current');
    return session;
  } catch (error) {
    console.error('Not authenticated:', error);
    return null;
  }
};

export const account = new Account(client);

export const db = new TablesDB(client);
export const storage = new Storage(client);

export const APPWRITE_DB = {
  databaseId: '68e38e530009e5262f29',
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
    reverie: '68e39af9002fb2fbc1bb',
  },
};

export { ID } from 'appwrite';

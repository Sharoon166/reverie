// Database IDs
export const APPWRITE_DB = {
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  tables: {
    leads: process.env.NEXT_PUBLIC_APPWRITE_TABLE_LEADS!,
    clients: process.env.NEXT_PUBLIC_APPWRITE_TABLE_CLIENTS!,
    invoices: process.env.NEXT_PUBLIC_APPWRITE_TABLE_INVOICES!,
    expenses: process.env.NEXT_PUBLIC_APPWRITE_TABLE_EXPENSES!,
    employees: process.env.NEXT_PUBLIC_APPWRITE_TABLE_EMPLOYEES!,
    quarters: process.env.NEXT_PUBLIC_APPWRITE_TABLE_QUARTERS!,
    salary_payments: process.env.NEXT_PUBLIC_APPWRITE_TABLE_SALARY_PAYMENTS!,
  },
} as const;

// Storage Bucket IDs
export const APPWRITE_STORAGE = {
  reports: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_REPORTS!,
  documents: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_DOCUMENTS!,
  profilePictures: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_PROFILE_PICTURES!,
} as const;

// Collection IDs (if using Appwrite's database)
export const APPWRITE_COLLECTIONS = {
  leads: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_LEADS!,
  clients: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CLIENTS!,
  invoices: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVOICES!,
  expenses: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_EXPENSES!,
  employees: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_EMPLOYEES!,
  quarters: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_QUARTERS!,
} as const;

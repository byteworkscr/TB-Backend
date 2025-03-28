export interface User {
  walletAddress: string;
  nonce: string; // Used for signature verification
  createdAt: Date;
  lastLogin?: Date;
}


export interface Context {
  user?: {
    id: string;
    email: string;
  }
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  walletAddress: string;
  roleIds: string[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  walletAddress?: string;
}




export interface UserSession {
  walletAddress: string;
}

// In-memory store for users (replace with database in production)
export const users: User[] = [];

// Keep track of last used nonce timestamp to ensure uniqueness
let lastNonceTimestamp = 0;

// Generate a unique nonce
export async function generateNonce(): Promise<string> {
  // Add a small delay to ensure unique timestamps
  await new Promise(resolve => setTimeout(resolve, 1));
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  const microseconds = process.hrtime()[1];
  return `${timestamp}-${microseconds}-${random}`;
}

export const findUserByWalletAddress = (walletAddress: string): User | undefined => {
  return users.find(user => user.walletAddress === walletAddress);
};

export const createUser = async (walletAddress: string): Promise<User> => {
  const user: User = {
    walletAddress,
    nonce: await generateNonce(),
    createdAt: new Date()
  };
  users.push(user);
  return user;
};

export const updateUserNonce = async (user: User): Promise<string> => {
  const newNonce = await generateNonce();
  user.nonce = newNonce;
  return newNonce;
};

export const updateLastLogin = (user: User): void => {
  user.lastLogin = new Date();
};

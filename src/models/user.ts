import { type IUser } from "../interfaces";


// In-memory store for users (replace with database in production)
export const users: IUser[] = [];

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

export const findUserByWalletAddress = (
  walletAddress: string
): IUser | undefined => {
  return users.find((user) => user.walletAddress === walletAddress);
};

export const createUser = async (walletAddress: string): Promise<IUser> => {
  const user: IUser = {
    walletAddress,
    nonce: await generateNonce(),
    createdAt: new Date(),
   } as IUser;
  users.push(user);
  return user;
};

export const updateUserNonce = async (user: IUser): Promise<string> => {
  const newNonce = await generateNonce();
  user.nonce = newNonce;
  return newNonce;
};

export const updateLastLogin = (user: IUser): void => {
  user.lastLogin = new Date();
};

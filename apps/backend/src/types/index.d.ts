declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        avatar: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export {};

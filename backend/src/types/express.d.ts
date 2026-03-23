import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    wallet: {
      address: string;
      chain?: 'aptos' | 'sui' | 'movement' | 'base';
    };
  }
}

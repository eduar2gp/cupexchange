import { createServer } from 'node:http';
import bootstrapHandler from './dist/ecommerce-frontend/server/main.server.mjs';

const port = process.env.PORT || 3000;
const host = '0.0.0.0'; 

createServer(bootstrapHandler).listen(port, host, () => { 
  console.log(`Angular SSR running on ${host}:${port}`);
});

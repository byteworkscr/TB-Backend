import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function testDBConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Conexión a la base de datos exitosa");
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Solo ejecuta la prueba si este archivo se ejecuta directamente
if (require.main === module) {
  testDBConnection();
}

export default prisma;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const auditHook_1 = require("./hooks/auditHook");
const creditScoreHooks_1 = require("./hooks/creditScoreHooks");
dotenv_1.default.config();
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000;
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        // Integrate GraphQL with existing app
        yield createGraphQLServer(app_1.default);
        // Start the server
        app_1.default.listen(PORT, () => {
            console.log(`TrustBridge API running on port ${PORT}`);
            console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            (0, auditHook_1.auditTrigger)();
            (0, creditScoreHooks_1.creditScoreTrigger)();
        });
    });
}
startServer().catch(console.error);
function createGraphQLServer(app) {
    throw new Error('Function not implemented.');
}

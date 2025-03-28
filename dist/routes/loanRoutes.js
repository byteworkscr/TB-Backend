"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const blockchainService_1 = __importDefault(require("../services/blockchainService"));
const router = express_1.default.Router();
// Public route - Get available loans
router.get('/available', (req, res) => {
    blockchainService_1.default.getAvailableLoans()
        .then(loans => {
        res.json({ success: true, data: loans });
    })
        .catch(error => {
        console.error('Error fetching loans:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch loans' });
    });
});
// Protected route - Specific loan details
router.get('/:id', auth_1.isAuthenticated, (req, res) => {
    var _a;
    const loanId = req.params.id;
    // In a real implementation, you would fetch this loan from the blockchain
    res.json({
        success: true,
        data: {
            id: loanId,
            amount: '500',
            interest: '4%',
            duration: '45 days',
            borrower: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.walletAddress) || 'unknown',
            status: 'active'
        }
    });
});
exports.default = router;

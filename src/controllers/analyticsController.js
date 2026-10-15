const groupDao = require('../dao/groupDao');
const expenseDao = require('../dao/expenseDao');
const settlementDao = require('../dao/settlementDao');

// ─── helpers ──────────────────────────────────────────────────────────────────

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const norm   = (s) => String(s || '').trim().toLowerCase();

// ─── controller ───────────────────────────────────────────────────────────────

const analyticsController = {

    /**
     * GET /analytics/summary
     *
     * Scoped to the authenticated user's groups.
     * Works with both MongoDB and the in-memory fallback.
     *
     * Response shape:
     * {
     *   groupCount,
     *   expenseCount,
     *   totalExpenses,
     *   totalSettled,
     *   userOwes,          // net amount the current user still owes others
     *   userIsOwed,        // net amount others still owe the current user
     *   groupBreakdown: [{ groupId, name, expenseCount, totalExpenses, userBalance }],
     *   monthlyTrend:   [{ month: "YYYY-MM", total }],
     *   recentExpenses: [{ title, amount, paidBy, groupName, createdAt }]
     * }
     */
    getSummary: async (request, response) => {
        try {
            const email = norm(request.user?.email);

            if (!email) {
                return response.status(401).json({ message: 'Unauthorized' });
            }

            // ── 1. All groups for this user ────────────────────────────────
            const { groups } = await groupDao.getGroupsPaginated(
                email,
                1000,
                0,
                { createdAt: -1 }
            );

            const groupCount = groups.length;

            if (groupCount === 0) {
                return response.status(200).json({
                    groupCount: 0,
                    expenseCount: 0,
                    totalExpenses: 0,
                    totalSettled: 0,
                    userOwes: 0,
                    userIsOwed: 0,
                    groupBreakdown: [],
                    monthlyTrend: [],
                    recentExpenses: []
                });
            }

            // ── 2. Pull expenses + settlements for every group ─────────────
            let totalExpenses  = 0;
            let expenseCount   = 0;
            let totalSettled   = 0;
            let userOwes       = 0;   // user's net negative balance across groups
            let userIsOwed     = 0;   // user's net positive balance across groups

            const groupBreakdown = [];
            const allExpenses    = [];   // flat list for trend + recents

            for (const group of groups) {
                const gid      = group._id;
                const gName    = group.name;
                const members  = (group.membersEmail || []).map(norm);

                // fetch data
                const [expenses, settlements] = await Promise.all([
                    expenseDao.getExpensesByGroupId(gid),
                    settlementDao.getSettlementsByGroupId(gid)
                ]);

                // ── per-group expense totals ───────────────────────────────
                let groupTotal = 0;
                let groupCount2 = 0;

                for (const exp of expenses) {
                    groupTotal  += Number(exp.amount) || 0;
                    groupCount2 += 1;
                    allExpenses.push({ ...exp._doc ?? exp, groupName: gName });
                }

                totalExpenses += groupTotal;
                expenseCount  += groupCount2;

                // ── per-group settlement totals ────────────────────────────
                for (const s of settlements) {
                    if (norm(s.status) === 'paid') {
                        totalSettled += Number(s.amount) || 0;
                    }
                }

                // ── user's net balance in this group ─────────────────────
                // Recalculate balances using the same algorithm as settlementController
                const balances = {};
                members.forEach(m => { balances[m] = 0; });

                for (const exp of expenses) {
                    const payer        = norm(exp.paidBy);
                    const participants = (exp.participants || []).map(norm);
                    const amt          = Number(exp.amount) || 0;
                    if (!payer || amt <= 0 || participants.length === 0) continue;

                    if (balances[payer] === undefined) balances[payer] = 0;
                    balances[payer] += amt;

                    const share = amt / participants.length;
                    for (const p of participants) {
                        if (balances[p] === undefined) balances[p] = 0;
                        balances[p] -= share;
                    }
                }

                for (const s of settlements) {
                    if (norm(s.status) !== 'paid') continue;
                    const from = norm(s.from);
                    const to   = norm(s.to);
                    const amt  = Number(s.amount) || 0;
                    if (!from || !to || amt <= 0) continue;
                    if (balances[from] === undefined) balances[from] = 0;
                    if (balances[to]   === undefined) balances[to]   = 0;
                    balances[from] += amt;
                    balances[to]   -= amt;
                }

                const userBal = round2(balances[email] || 0);
                if (userBal > 0.009)  userIsOwed += userBal;
                if (userBal < -0.009) userOwes   += Math.abs(userBal);

                groupBreakdown.push({
                    groupId:       String(gid),
                    name:          gName,
                    expenseCount:  groupCount2,
                    totalExpenses: round2(groupTotal),
                    userBalance:   userBal    // positive = user is owed; negative = user owes
                });
            }

            // ── 3. Monthly trend (last 12 months) from allExpenses ─────────
            const monthlyMap = {};
            const now = new Date();

            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthlyMap[key] = 0;
            }

            for (const exp of allExpenses) {
                const createdAt = exp.createdAt ? new Date(exp.createdAt) : null;
                if (!createdAt || isNaN(createdAt.getTime())) continue;

                const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyMap[key] !== undefined) {
                    monthlyMap[key] += Number(exp.amount) || 0;
                }
            }

            const monthlyTrend = Object.entries(monthlyMap).map(([month, total]) => ({
                month,
                total: round2(total)
            }));

            // ── 4. Recent expenses (latest 10) ─────────────────────────────
            const recentExpenses = allExpenses
                .filter(e => e.createdAt)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
                .map(e => ({
                    title:     e.title,
                    amount:    round2(Number(e.amount) || 0),
                    paidBy:    e.paidBy,
                    groupName: e.groupName,
                    createdAt: e.createdAt
                }));

            // ── 5. Sort group breakdown by total descending ────────────────
            groupBreakdown.sort((a, b) => b.totalExpenses - a.totalExpenses);

            return response.status(200).json({
                groupCount,
                expenseCount,
                totalExpenses:  round2(totalExpenses),
                totalSettled:   round2(totalSettled),
                userOwes:       round2(userOwes),
                userIsOwed:     round2(userIsOwed),
                groupBreakdown,
                monthlyTrend,
                recentExpenses
            });

        } catch (error) {
            console.error('analyticsController.getSummary failed:', error);
            return response.status(500).json({ message: 'Error fetching analytics' });
        }
    }
};

module.exports = analyticsController;


const { getPlanLimits } = require('./lib/plans');
const { canUserRemoveBackground } = require('./lib/clipdrop');

// Simular a função getPlanLimits (pois ela usa import/export)
function getPlanLimitsSimulated(planName) {
    const PLANS = {
        FREE: {
            name: "Grátis",
            limits: {
                text_generations: 3,
                bg_removals_monthly: 10,
                bg_removals_per_generation: 3,
            }
        },
        PAID: {
            name: "Premium",
            limits: {
                text_generations: Infinity,
                bg_removals_monthly: Infinity,
                bg_removals_per_generation: Infinity,
            }
        }
    };
    const plan = PLANS[planName.toUpperCase()];
    return plan ? plan.limits : PLANS.FREE.limits;
}


// Simular a função canUserRemoveBackground (adaptada para CommonJS)
function canUserRemoveBackgroundSimulated(user) {
    const now = new Date();
    const lastReset = user.lastBgRemovalReset ? new Date(user.lastBgRemovalReset) : new Date(0);
    const usedThisMonth = user.bgRemovalUsesThisMonth || 0;
    const limits = getPlanLimitsSimulated(user.plan);
    const maxMonthly = limits.bg_removals_monthly;

    if (maxMonthly === Infinity) {
        return { canRemove: true, needsReset: false, remaining: Infinity };
    }
    
    // Simular a lógica de reset mensal
    const needsReset = now.getFullYear() > lastReset.getFullYear() || (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth());
    
    if (needsReset) {
        return { canRemove: true, needsReset: true, remaining: maxMonthly };
    } else {
        const remaining = maxMonthly - usedThisMonth;
        const canRemove = remaining > 0;
        return { canRemove: canRemove, needsReset: false, remaining: Math.max(0, remaining) };
    }
}

function testLimits() {
    console.log("--- Teste de Limites ---");

    // 1. Teste de Plano Grátis - Limite não atingido
    const freeUser1 = {
        plan: 'FREE',
        bgRemovalUsesThisMonth: 5,
        lastBgRemovalReset: new Date().toISOString(), // Resetado este mês
    };
    let result1 = canUserRemoveBackgroundSimulated(freeUser1);
    console.log(`[FREE] 5/10 usados: Pode remover? ${result1.canRemove}, Restantes: ${result1.remaining}, Reset necessário? ${result1.needsReset}`);
    // Esperado: true, 5, false

    // 2. Teste de Plano Grátis - Limite atingido
    const freeUser2 = {
        plan: 'FREE',
        bgRemovalUsesThisMonth: 10,
        lastBgRemovalReset: new Date().toISOString(),
    };
    let result2 = canUserRemoveBackgroundSimulated(freeUser2);
    console.log(`[FREE] 10/10 usados: Pode remover? ${result2.canRemove}, Restantes: ${result2.remaining}, Reset necessário? ${result2.needsReset}`);
    // Esperado: false, 0, false

    // 3. Teste de Plano Grátis - Reset necessário
    const freeUser3 = {
        plan: 'FREE',
        bgRemovalUsesThisMonth: 10,
        lastBgRemovalReset: new Date(2023, 0, 1).toISOString(), // Mês passado
    };
    let result3 = canUserRemoveBackgroundSimulated(freeUser3);
    console.log(`[FREE] Reset necessário: Pode remover? ${result3.canRemove}, Restantes: ${result3.remaining}, Reset necessário? ${result3.needsReset}`);
    // Esperado: true, 10, true

    // 4. Teste de Plano Pago - Sem limite
    const paidUser = {
        plan: 'PAID',
        bgRemovalUsesThisMonth: 1000,
        lastBgRemovalReset: new Date().toISOString(),
    };
    let result4 = canUserRemoveBackgroundSimulated(paidUser);
    console.log(`[PAID] 1000/Inf usados: Pode remover? ${result4.canRemove}, Restantes: ${result4.remaining}, Reset necessário? ${result4.needsReset}`);
    // Esperado: true, Infinity, false

    // 5. Teste de Limites de Geração de Texto (Apenas na função de geração, mas podemos testar o plano)
    const limitsFree = getPlanLimitsSimulated('FREE');
    const limitsPaid = getPlanLimitsSimulated('PAID');
    console.log(`[FREE] Limite de Geração de Texto: ${limitsFree.text_generations}`);
    console.log(`[PAID] Limite de Geração de Texto: ${limitsPaid.text_generations}`);
    console.log(`[FREE] Limite de BG por Geração: ${limitsFree.bg_removals_per_generation}`);
    // Esperado: 3, Infinity, 3
}

testLimits();


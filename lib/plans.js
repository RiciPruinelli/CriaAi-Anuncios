// /lib/plans.js

export const PLANS = {
    FREE: {
        name: "Grátis",
        limits: {
            text_generations: 30, // 30 gerações de texto por mês
            bg_removals_monthly: 3, // 3 remoções de fundo por mês
            bg_removals_per_generation: 1, // 1 remoção de fundo por geração
        }
    },
    PAID: {
        name: "Premium",
        limits: {
            text_generations: Infinity, // Sem limites de geração de texto
            bg_removals_monthly: 10, // 10 remoções de fundo por mês
            bg_removals_per_generation: 3, // 3 remoções de fundo por geração
        }
    }
};

/**
 * Retorna os limites de uso para o plano do usuário.
 * @param {string} planName - O nome do plano (ex: 'FREE', 'PAID').
 * @returns {object} Os limites do plano.
 */
export function getPlanLimits(planName) {
    const plan = PLANS[planName.toUpperCase()];
    return plan ? plan.limits : PLANS.FREE.limits;
}


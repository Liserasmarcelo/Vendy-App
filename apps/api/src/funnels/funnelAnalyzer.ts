import { PrismaClient } from '@prisma/client';

// ==========================================
// FUNNEL TYPES
// ==========================================
export interface FunnelStep {
  id: string;
  name: string;
  label: string;
  count: number;
  conversionRate: number; // % from previous step
  dropOffRate: number; // % that left at this step
  avgTimeSeconds?: number; // avg time to reach this step
}

export interface FunnelAnalysis {
  id: string;
  name: string;
  steps: FunnelStep[];
  totalConversionRate: number; // from first to last step
  totalDropOffRate: number;
  avgTotalTimeSeconds?: number;
  period: {
    start: string;
    end: string;
  };
}

export type FunnelType = 'purchase' | 'onboarding' | 'retention' | 'reactivation';

// ==========================================
// FUNNEL DEFINITIONS
// ==========================================
const FUNNEL_DEFINITIONS: Record<FunnelType, { name: string; steps: { id: string; name: string; label: string; eventType: string }[] }> = {
  purchase: {
    name: 'Funnel de Compra',
    steps: [
      { id: 'visit', name: 'page_view', label: 'Visitas', eventType: 'page_view' },
      { id: 'product_view', name: 'product_view', label: 'Vistas de Producto', eventType: 'product_view' },
      { id: 'add_cart', name: 'add_to_cart', label: 'Agregado al Carrito', eventType: 'add_to_cart' },
      { id: 'checkout', name: 'checkout_started', label: 'Inicio Checkout', eventType: 'checkout_started' },
      { id: 'purchase', name: 'checkout_completed', label: 'Compra Completada', eventType: 'checkout_completed' },
    ],
  },
  onboarding: {
    name: 'Funnel de Onboarding',
    steps: [
      { id: 'start', name: 'onboarding_started', label: 'Inicio Onboarding', eventType: 'onboarding_started' },
      { id: 'personal_info', name: 'personal_info_entered', label: 'Info Personal', eventType: 'personal_info_entered' },
      { id: 'shop_info', name: 'shop_info_entered', label: 'Info Tienda', eventType: 'shop_info_entered' },
      { id: 'terms_accepted', name: 'terms_accepted', label: 'Términos Aceptados', eventType: 'terms_accepted' },
      { id: 'shop_created', name: 'shop_created', label: 'Tienda Creada', eventType: 'shop_created' },
    ],
  },
  retention: {
    name: 'Funnel de Retención',
    steps: [
      { id: 'day_0', name: 'first_purchase', label: 'Primera Compra', eventType: 'checkout_completed' },
      { id: 'day_7', name: 'return_7d', label: 'Retorno 7 días', eventType: 'page_view' },
      { id: 'day_30', name: 'return_30d', label: 'Retorno 30 días', eventType: 'page_view' },
      { id: 'day_90', name: 'return_90d', label: 'Retorno 90 días', eventType: 'page_view' },
    ],
  },
  reactivation: {
    name: 'Funnel de Reactivación',
    steps: [
      { id: 'inactive', name: 'inactive_user', label: 'Usuario Inactivo', eventType: 'inactive_user' },
      { id: 'email_sent', name: 'email_sent', label: 'Email Enviado', eventType: 'email_sent' },
      { id: 'email_opened', name: 'email_opened', label: 'Email Abierto', eventType: 'email_opened' },
      { id: 'return_visit', name: 'return_visit', label: 'Visita de Retorno', eventType: 'page_view' },
      { id: 'reactivated', name: 'checkout_completed', label: 'Reactivado', eventType: 'checkout_completed' },
    ],
  },
};

// ==========================================
// FUNNEL ANALYZER
// ==========================================
export class FunnelAnalyzer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async analyze(
    funnelType: FunnelType,
    shopId: number,
    startDate: Date,
    endDate: Date
  ): Promise<FunnelAnalysis> {
    const definition = FUNNEL_DEFINITIONS[funnelType];
    if (!definition) {
      throw new Error(`Unknown funnel type: ${funnelType}`);
    }

    // Get event counts for each step
    const stepCounts = await Promise.all(
      definition.steps.map(async (step) => {
        const count = await this.getEventCount(
          shopId,
          step.eventType,
          startDate,
          endDate,
          funnelType === 'retention' ? step.id : undefined
        );
        return { step, count };
      })
    );

    // Build funnel steps with conversion rates
    const steps: FunnelStep[] = [];
    let previousCount = 0;

    for (let i = 0; i < stepCounts.length; i++) {
      const { step, count } = stepCounts[i];
      
      let conversionRate = 0;
      let dropOffRate = 0;

      if (i === 0) {
        conversionRate = 100; // First step is always 100%
        dropOffRate = 0;
      } else if (previousCount > 0) {
        conversionRate = (count / previousCount) * 100;
        dropOffRate = 100 - conversionRate;
      }

      previousCount = count;

      steps.push({
        id: step.id,
        name: step.name,
        label: step.label,
        count,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dropOffRate: Math.round(dropOffRate * 100) / 100,
      });
    }

    // Calculate total conversion and drop-off
    const firstStep = steps[0];
    const lastStep = steps[steps.length - 1];
    const totalConversionRate = firstStep.count > 0
      ? (lastStep.count / firstStep.count) * 100
      : 0;
    const totalDropOffRate = 100 - totalConversionRate;

    return {
      id: `${funnelType}_${shopId}_${startDate.toISOString().split('T')[0]}`,
      name: definition.name,
      steps,
      totalConversionRate: Math.round(totalConversionRate * 100) / 100,
      totalDropOffRate: Math.round(totalDropOffRate * 100) / 100,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }

  async compareFunnels(
    funnelType: FunnelType,
    shopId: number,
    currentPeriod: { start: Date; end: Date },
    previousPeriod: { start: Date; end: Date }
  ): Promise<{ current: FunnelAnalysis; previous: FunnelAnalysis; changes: any[] }> {
    const [current, previous] = await Promise.all([
      this.analyze(funnelType, shopId, currentPeriod.start, currentPeriod.end),
      this.analyze(funnelType, shopId, previousPeriod.start, previousPeriod.end),
    ]);

    // Calculate changes
    const changes = current.steps.map((step, index) => {
      const prevStep = previous.steps[index];
      const countChange = prevStep ? step.count - prevStep.count : step.count;
      const rateChange = prevStep ? step.conversionRate - prevStep.conversionRate : 0;

      return {
        stepId: step.id,
        stepLabel: step.label,
        countChange,
        rateChange: Math.round(rateChange * 100) / 100,
        trend: rateChange > 0 ? 'up' : rateChange < 0 ? 'down' : 'stable',
      };
    });

    return { current, previous, changes };
  }

  async getDropOffAnalysis(
    funnelType: FunnelType,
    shopId: number,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const funnel = await this.analyze(funnelType, shopId, startDate, endDate);

    // Find the step with highest drop-off
    const dropOffs = funnel.steps
      .filter((_, i) => i > 0) // Skip first step
      .map((step) => ({
        stepId: step.id,
        stepLabel: step.label,
        dropOffRate: step.dropOffRate,
        dropOffCount: Math.round((step.dropOffRate / 100) * (step.count / (1 - step.dropOffRate / 100))),
      }))
      .sort((a, b) => b.dropOffRate - a.dropOffRate);

    const biggestDropOff = dropOffs[0];

    return {
      funnelId: funnel.id,
      biggestDropOff,
      allDropOffs: dropOffs,
      recommendations: this.generateRecommendations(biggestDropOff),
    };
  }

  private async getEventCount(
    shopId: number,
    eventType: string,
    startDate: Date,
    endDate: Date,
    retentionDay?: string
  ): Promise<number> {
    // For retention funnel, we need special logic
    if (retentionDay) {
      return this.getRetentionCount(shopId, retentionDay, startDate, endDate);
    }

    // For regular events, count from AnalyticsEvent table
    const result = await this.prisma.$queryRaw`
      SELECT COUNT(DISTINCT "userId") as count
      FROM "AnalyticsEvent"
      WHERE "shopId" = ${shopId}
        AND type = ${eventType}
        AND timestamp BETWEEN ${startDate} AND ${endDate}
    `;

    return (result as any)[0]?.count || 0;
  }

  private async getRetentionCount(
    shopId: number,
    day: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Simplified retention logic
    // In a real implementation, you'd track users who made first purchase
    // and then returned after N days
    const days = parseInt(day.replace('day_', '').replace('d', ''));
    
    const result = await this.prisma.$queryRaw`
      SELECT COUNT(DISTINCT "userId") as count
      FROM "AnalyticsEvent"
      WHERE "shopId" = ${shopId}
        AND type = 'checkout_completed'
        AND timestamp BETWEEN ${startDate} AND ${endDate}
    `;

    return (result as any)[0]?.count || 0;
  }

  private generateRecommendations(biggestDropOff: any): string[] {
    const recommendations: string[] = [];

    if (biggestDropOff.dropOffRate > 50) {
      recommendations.push(`🔴 El drop-off en "${biggestDropOff.stepLabel}" es crítico (${biggestDropOff.dropOffRate}%). Revisá la UX de este paso.`);
    } else if (biggestDropOff.dropOffRate > 30) {
      recommendations.push(`🟡 El drop-off en "${biggestDropOff.stepLabel}" es alto (${biggestDropOff.dropOffRate}%). Considerá simplificar el proceso.`);
    }

    if (biggestDropOff.stepId === 'add_cart') {
      recommendations.push('💡 Considerá agregar reviews o fotos de clientes para aumentar confianza.');
      recommendations.push('💡 Ofrecé envío gratis o descuentos para reducir fricción.');
    }

    if (biggestDropOff.stepId === 'checkout') {
      recommendations.push('💡 Simplificá el formulario de checkout. Menos campos = más conversiones.');
      recommendations.push('💡 Agregá opciones de pago locales (efectivo, transferencia).');
    }

    if (biggestDropOff.stepId === 'product_view') {
      recommendations.push('💡 Mejorá las fotos y descripciones de productos.');
      recommendations.push('💡 Agregá filtros y búsqueda más intuitiva.');
    }

    return recommendations;
  }
}

// Singleton
let analyzer: FunnelAnalyzer | null = null;

export function getFunnelAnalyzer(prisma: PrismaClient): FunnelAnalyzer {
  if (!analyzer) {
    analyzer = new FunnelAnalyzer(prisma);
  }
  return analyzer;
}

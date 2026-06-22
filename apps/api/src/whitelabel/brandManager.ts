import { PrismaClient } from '@prisma/client';

// ==========================================
// BRAND CONFIG TYPES
// ==========================================
export interface BrandConfig {
  shopId: number;
  name: string;
  description?: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
  customDomain?: string;
  subdomain?: string;
  isActive: boolean;
  updatedAt: Date;
}

export interface DomainConfig {
  domain: string;
  shopId: number;
  status: 'pending' | 'active' | 'error';
  sslStatus: 'pending' | 'active' | 'error';
  dnsRecords: DNSRecord[];
  createdAt: Date;
  verifiedAt?: Date;
}

export interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT';
  name: string;
  value: string;
  ttl: number;
}

// ==========================================
// BRAND MANAGER
// ==========================================
export class BrandManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Get brand config for a shop
  async getBrandConfig(shopId: number): Promise<BrandConfig | null> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        favicon: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        fontFamily: true,
        customCss: true,
        customDomain: true,
        subdomain: true,
        isActive: true,
        updatedAt: true,
      },
    });

    if (!shop) return null;

    return {
      shopId: shop.id,
      name: shop.name,
      description: shop.description || undefined,
      logo: shop.logo || undefined,
      favicon: shop.favicon || undefined,
      primaryColor: shop.primaryColor || '#FF7403',
      secondaryColor: shop.secondaryColor || undefined,
      accentColor: shop.accentColor || undefined,
      fontFamily: shop.fontFamily || undefined,
      customCss: shop.customCss || undefined,
      customDomain: shop.customDomain || undefined,
      subdomain: shop.subdomain || undefined,
      isActive: shop.isActive,
      updatedAt: shop.updatedAt,
    };
  }

  // Update brand config
  async updateBrandConfig(shopId: number, config: Partial<BrandConfig>): Promise<BrandConfig> {
    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(config.name && { name: config.name }),
        ...(config.description && { description: config.description }),
        ...(config.logo && { logo: config.logo }),
        ...(config.favicon && { favicon: config.favicon }),
        ...(config.primaryColor && { primaryColor: config.primaryColor }),
        ...(config.secondaryColor && { secondaryColor: config.secondaryColor }),
        ...(config.accentColor && { accentColor: config.accentColor }),
        ...(config.fontFamily && { fontFamily: config.fontFamily }),
        ...(config.customCss && { customCss: config.customCss }),
        ...(config.customDomain && { customDomain: config.customDomain }),
        ...(config.subdomain && { subdomain: config.subdomain }),
        updatedAt: new Date(),
      },
    });

    return this.getBrandConfig(updated.id) as Promise<BrandConfig>;
  }

  // Validate custom domain
  async validateDomain(domain: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      errors.push('Formato de dominio inválido');
    }

    // Check if already in use
    const existing = await this.prisma.shop.findFirst({
      where: { customDomain: domain },
    });

    if (existing) {
      errors.push('Dominio ya está en uso por otra tienda');
    }

    // Check if it's not a reserved domain
    const reservedDomains = ['vendy.com', 'www.vendy.com', 'admin.vendy.com'];
    if (reservedDomains.includes(domain.toLowerCase())) {
      errors.push('Dominio reservado');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Configure custom domain
  async configureDomain(shopId: number, domain: string): Promise<DomainConfig> {
    const validation = await this.validateDomain(domain);
    if (!validation.valid) {
      throw new Error(`Invalid domain: ${validation.errors.join(', ')}`);
    }

    // Update shop with custom domain
    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        customDomain: domain,
        updatedAt: new Date(),
      },
    });

    // Generate DNS records
    const dnsRecords: DNSRecord[] = [
      {
        type: 'CNAME',
        name: domain,
        value: 'shops.vendy.com',
        ttl: 3600,
      },
      {
        type: 'TXT',
        name: `_vendy.${domain}`,
        value: `vendy-verification=${shopId}`,
        ttl: 3600,
      },
    ];

    return {
      domain,
      shopId,
      status: 'pending',
      sslStatus: 'pending',
      dnsRecords,
      createdAt: new Date(),
    };
  }

  // Verify domain DNS records
  async verifyDomain(shopId: number): Promise<{ verified: boolean; records: DNSRecord[] }> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { customDomain: true },
    });

    if (!shop?.customDomain) {
      throw new Error('No custom domain configured');
    }

    // In a real implementation, you'd verify DNS records
    // For now, simulate verification
    const records: DNSRecord[] = [
      {
        type: 'CNAME',
        name: shop.customDomain,
        value: 'shops.vendy.com',
        ttl: 3600,
      },
    ];

    // Update status
    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        domainVerified: true,
        updatedAt: new Date(),
      },
    });

    return {
      verified: true,
      records,
    };
  }

  // Generate CSS variables for brand
  generateBrandCSS(config: BrandConfig): string {
    return `
      :root {
        --brand-primary: ${config.primaryColor};
        --brand-secondary: ${config.secondaryColor || '#333333'};
        --brand-accent: ${config.accentColor || '#FF7403'};
        --brand-font: ${config.fontFamily || 'Inter, sans-serif'};
      }

      .brand-logo {
        ${config.logo ? `background-image: url(${config.logo});` : ''}
      }

      ${config.customCss || ''}
    `;
  }

  // Get default brand config
  getDefaultBrandConfig(shopId: number): BrandConfig {
    return {
      shopId,
      name: 'Mi Tienda',
      primaryColor: '#FF7403',
      isActive: true,
      updatedAt: new Date(),
    };
  }
}

// Singleton
let brandManager: BrandManager | null = null;

export function getBrandManager(prisma: PrismaClient): BrandManager {
  if (!brandManager) {
    brandManager = new BrandManager(prisma);
  }
  return brandManager;
}

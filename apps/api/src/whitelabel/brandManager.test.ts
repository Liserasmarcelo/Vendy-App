import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrandManager, getBrandManager } from './brandManager';

// Mock Prisma
const mockPrisma = {
  shop: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
} as any;

describe('BrandManager', () => {
  let manager: BrandManager;

  beforeEach(() => {
    manager = new BrandManager(mockPrisma);
    vi.clearAllMocks();
  });

  it('gets brand config', async () => {
    mockPrisma.shop.findUnique.mockResolvedValue({
      id: 1,
      name: 'TechStore',
      description: 'Tienda de tecnología',
      logo: 'https://example.com/logo.png',
      primaryColor: '#FF7403',
      secondaryColor: '#333333',
      isActive: true,
      updatedAt: new Date('2024-06-01'),
    });

    const config = await manager.getBrandConfig(1);

    expect(config).toBeDefined();
    expect(config?.name).toBe('TechStore');
    expect(config?.primaryColor).toBe('#FF7403');
    expect(config?.logo).toBe('https://example.com/logo.png');
  });

  it('returns null for non-existent shop', async () => {
    mockPrisma.shop.findUnique.mockResolvedValue(null);

    const config = await manager.getBrandConfig(999);
    expect(config).toBeNull();
  });

  it('updates brand config', async () => {
    mockPrisma.shop.update.mockResolvedValue({
      id: 1,
      name: 'Nuevo Nombre',
      primaryColor: '#2196F3',
      updatedAt: new Date(),
    });

    mockPrisma.shop.findUnique.mockResolvedValue({
      id: 1,
      name: 'Nuevo Nombre',
      primaryColor: '#2196F3',
      isActive: true,
      updatedAt: new Date(),
    });

    const config = await manager.updateBrandConfig(1, {
      name: 'Nuevo Nombre',
      primaryColor: '#2196F3',
    });

    expect(config.name).toBe('Nuevo Nombre');
    expect(config.primaryColor).toBe('#2196F3');
  });

  it('validates domain format', async () => {
    const result = await manager.validateDomain('invalid-domain');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Formato de dominio inválido');
  });

  it('validates domain availability', async () => {
    mockPrisma.shop.findFirst.mockResolvedValue({ id: 2 });

    const result = await manager.validateDomain('example.com');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Dominio ya está en uso por otra tienda');
  });

  it('rejects reserved domains', async () => {
    const result = await manager.validateDomain('vendy.com');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Dominio reservado');
  });

  it('validates correct domain', async () => {
    mockPrisma.shop.findFirst.mockResolvedValue(null);

    const result = await manager.validateDomain('mitienda.com');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('configures custom domain', async () => {
    mockPrisma.shop.findFirst.mockResolvedValue(null);
    mockPrisma.shop.update.mockResolvedValue({ id: 1 });

    const config = await manager.configureDomain(1, 'mitienda.com');

    expect(config.domain).toBe('mitienda.com');
    expect(config.shopId).toBe(1);
    expect(config.status).toBe('pending');
    expect(config.dnsRecords).toHaveLength(2);
  });

  it('throws on invalid domain configuration', async () => {
    await expect(
      manager.configureDomain(1, 'invalid')
    ).rejects.toThrow('Invalid domain');
  });

  it('verifies domain', async () => {
    mockPrisma.shop.findUnique.mockResolvedValue({
      customDomain: 'mitienda.com',
    });
    mockPrisma.shop.update.mockResolvedValue({});

    const result = await manager.verifyDomain(1);

    expect(result.verified).toBe(true);
    expect(result.records).toHaveLength(1);
  });

  it('throws when verifying without domain', async () => {
    mockPrisma.shop.findUnique.mockResolvedValue({ customDomain: null });

    await expect(manager.verifyDomain(1)).rejects.toThrow('No custom domain configured');
  });

  it('generates brand CSS', () => {
    const css = manager.generateBrandCSS({
      shopId: 1,
      name: 'Test',
      primaryColor: '#FF7403',
      secondaryColor: '#333333',
      accentColor: '#2196F3',
      fontFamily: 'Inter',
      isActive: true,
      updatedAt: new Date(),
    });

    expect(css).toContain('--brand-primary: #FF7403');
    expect(css).toContain('--brand-secondary: #333333');
    expect(css).toContain('--brand-accent: #2196F3');
    expect(css).toContain('--brand-font: Inter');
  });

  it('generates default brand config', () => {
    const config = manager.getDefaultBrandConfig(1);

    expect(config.shopId).toBe(1);
    expect(config.name).toBe('Mi Tienda');
    expect(config.primaryColor).toBe('#FF7403');
    expect(config.isActive).toBe(true);
  });
});

describe('getBrandManager', () => {
  it('returns singleton instance', () => {
    const manager1 = getBrandManager(mockPrisma);
    const manager2 = getBrandManager(mockPrisma);
    expect(manager1).toBe(manager2);
  });
});

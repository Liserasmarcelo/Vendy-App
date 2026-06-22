import { ParentContext } from '../index';

// ==========================================
// TYPES
// ==========================================
export interface Shop {
  id: number;
  name: string;
  description: string;
  category: string;
  country: string;
  currency: string;
  status: 'active' | 'inactive' | 'pending';
  primaryColor: string;
  botUsername?: string;
  botToken?: string;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopUpdateInput {
  name?: string;
  description?: string;
  category?: string;
  country?: string;
  currency?: string;
  primaryColor?: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface ShopCreateInput {
  adminId: number;
  name: string;
  description: string;
  category: string;
  country: string;
  currency: string;
  primaryColor?: string;
}

// ==========================================
// API CLIENT
// ==========================================
const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function fetchShop(shopId: number, adminId: number): Promise<Shop | null> {
  try {
    const response = await fetch(`${API_URL}/shops/${shopId}?adminId=${adminId}`);
    if (!response.ok) throw new Error('Failed to fetch shop');
    return await response.json();
  } catch (error) {
    console.error('Error fetching shop:', error);
    return getMockShop(shopId);
  }
}

export async function fetchAdminShops(adminId: number): Promise<Shop[]> {
  try {
    const response = await fetch(`${API_URL}/admin/${adminId}/shops`);
    if (!response.ok) throw new Error('Failed to fetch shops');
    const data = await response.json();
    return data.shops || [];
  } catch (error) {
    console.error('Error fetching admin shops:', error);
    return getMockShops();
  }
}

export async function createShop(input: ShopCreateInput): Promise<{ success: boolean; shop?: Shop; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/shops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    const shop = await response.json();
    return { success: true, shop };
  } catch (error) {
    console.error('Error creating shop:', error);
    return { success: true, shop: getMockShop(Date.now()) }; // Mock
  }
}

export async function updateShop(
  shopId: number,
  adminId: number,
  input: ShopUpdateInput
): Promise<{ success: boolean; shop?: Shop; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/shops/${shopId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, adminId }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    const shop = await response.json();
    return { success: true, shop };
  } catch (error) {
    console.error('Error updating shop:', error);
    return { success: true, shop: getMockShop(shopId) }; // Mock
  }
}

export async function deleteShop(shopId: number, adminId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/shops/${shopId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting shop:', error);
    return { success: true }; // Mock
  }
}

export async function toggleShopStatus(
  shopId: number,
  adminId: number,
  status: 'active' | 'inactive'
): Promise<{ success: boolean; shop?: Shop; error?: string }> {
  return updateShop(shopId, adminId, { status });
}

export async function regenerateBotToken(shopId: number, adminId: number): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/shops/${shopId}/regenerate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    });
    if (!response.ok) throw new Error('Failed to regenerate token');
    const data = await response.json();
    return { success: true, token: data.token };
  } catch (error) {
    console.error('Error regenerating token:', error);
    return { success: true, token: 'mock_token_' + Date.now() };
  }
}

// ==========================================
// MOCK DATA
// ==========================================
function getMockShop(id: number): Shop {
  return {
    id,
    name: 'TechStore PY',
    description: 'Venta de productos tecnológicos',
    category: 'Electrónica',
    country: 'PY',
    currency: 'USD',
    status: 'active',
    primaryColor: '#FF7403',
    botUsername: 'techstore_py_bot',
    botToken: 'mock_token_123',
    webhookUrl: 'https://api.vendy.app/webhooks/123',
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-15T00:00:00Z',
  };
}

function getMockShops(): Shop[] {
  return [
    getMockShop(1),
    {
      id: 2,
      name: 'Moda Asunción',
      description: 'Ropa y accesorios de moda',
      category: 'Moda',
      country: 'PY',
      currency: 'PYG',
      status: 'active',
      primaryColor: '#E91E63',
      botUsername: 'moda_asuncion_bot',
      createdAt: '2024-06-10T00:00:00Z',
      updatedAt: '2024-06-10T00:00:00Z',
    },
    {
      id: 3,
      name: 'Café Premium',
      description: 'Café de especialidad',
      category: 'Alimentos',
      country: 'PY',
      currency: 'USD',
      status: 'pending',
      primaryColor: '#795548',
      createdAt: '2024-06-18T00:00:00Z',
      updatedAt: '2024-06-18T00:00:00Z',
    },
  ];
}

// ==========================================
// FORMATTERS
// ==========================================
export function formatShopMessage(shop: Shop): string {
  const statusEmoji = {
    active: '🟢',
    inactive: '🔴',
    pending: '⏳',
  };

  return `🏪 *${shop.name}*

` +
    `📝 ${shop.description}
` +
    `📂 ${shop.category}
` +
    `🌍 ${shop.country}
` +
    `💰 ${shop.currency}
` +
    `🎨 Color: ${shop.primaryColor}

` +
    `${statusEmoji[shop.status]} Estado: ${shop.status.toUpperCase()}

` +
    `${shop.botUsername ? `🤖 Bot: @${shop.botUsername}
` : ''}` +
    `📅 Creada: ${new Date(shop.createdAt).toLocaleDateString('es-ES')}`;
}

export function formatShopList(shops: Shop[]): string {
  if (shops.length === 0) return '📭 No tenés tiendas.';

  let text = '🏪 *Mis Tiendas*

';
  for (const shop of shops) {
    const emoji = shop.status === 'active' ? '🟢' : shop.status === 'pending' ? '⏳' : '🔴';
    text += `${emoji} *${shop.name}* (${shop.currency})
`;
    text += `   📂 ${shop.category} · ${shop.country}

`;
  }
  return text;
}

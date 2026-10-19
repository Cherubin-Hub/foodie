import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase_client.js';
import {
  IDatabaseRepository,
  LicenseStatusResponse,
  LicenseActivationResponse,
  GuestSessionResponse,
  RenderedHomePayload,
  PlaceOrderInput,
  PlaceOrderResponse,
  OrderRecord,
  ModulePermission,
  StoreBranding,
  FoodItem
} from '../db_types.js';

function parseErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const errorObj = err as { message?: string; details?: string; hint?: string };
    if (errorObj.message) {
      return errorObj.hint ? `${errorObj.message} (${errorObj.hint})` : errorObj.message;
    }
  }
  if (typeof err === 'string') return err;
  return fallback;
}

export class SupabaseRepository implements IDatabaseRepository {
  private client: SupabaseClient;

  constructor() {
    this.client = getSupabaseClient();
  }

  public async getLicenseStatus(): Promise<LicenseStatusResponse> {
    try {
      const { data, error } = await this.client.rpc('fn_verify_license_status');
      if (error) throw error;
      return data as LicenseStatusResponse;
    } catch (err) {
      console.error('[SupabaseRepository] getLicenseStatus Error:', err);
      return {
        success: false,
        status: 'INACTIVE',
        is_usable: false,
        message: parseErrorMessage(err, 'Database error')
      };
    }
  }

  public async activateLicense(licenseKey: string): Promise<LicenseActivationResponse> {
    try {
      const { data, error } = await this.client.rpc('sp_activate_license', {
        p_license_key: licenseKey
      });
      if (error) throw error;
      return data as LicenseActivationResponse;
    } catch (err) {
      console.error('[SupabaseRepository] activateLicense Error:', err);
      return {
        success: false,
        message: parseErrorMessage(err, 'Activation error')
      };
    }
  }

  public async createGuestSession(tempName: string): Promise<GuestSessionResponse> {
    try {
      const { data, error } = await this.client.rpc('sp_create_guest_session', {
        p_temp_name: tempName
      });
      if (error) throw error;
      return data as GuestSessionResponse;
    } catch (err) {
      console.error('[SupabaseRepository] createGuestSession Error:', err);
      return {
        success: false,
        session_token: '',
        guest_temporary_name: tempName,
        role: 'GUEST'
      };
    }
  }

  public async renderHomePage(role: string = 'GUEST', guestToken?: string): Promise<RenderedHomePayload> {
    try {
      const { data, error } = await this.client.rpc('sp_render_home_page', {
        p_role: role,
        p_guest_token: guestToken || null
      });
      if (error) throw error;
      return data as RenderedHomePayload;
    } catch (err) {
      console.error('[SupabaseRepository] renderHomePage Error:', err);
      return {
        success: false,
        license_locked: true,
        license_status: 'INACTIVE'
      };
    }
  }

  public async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResponse> {
    try {
      const { data, error } = await this.client.rpc('sp_place_order', {
        p_user_id: input.user_id || null,
        p_guest_session_token: input.guest_session_token || null,
        p_guest_temporary_name: input.guest_temporary_name || null,
        p_order_type: input.order_type,
        p_promo_code: input.promo_code || null,
        p_delivery_address: input.delivery_address || null,
        p_items: input.items
      });
      if (error) throw error;
      return data as PlaceOrderResponse;
    } catch (err) {
      console.error('[SupabaseRepository] placeOrder Error:', err);
      return {
        success: false,
        message: parseErrorMessage(err, 'Order placement failed')
      };
    }
  }

  public async getOrderByToken(token: string): Promise<OrderRecord | null> {
    try {
      const { data: order, error } = await this.client
        .from('tbl_orders')
        .select('*')
        .eq('tracking_token', token)
        .single();

      if (error || !order) return null;

      const { data: items } = await this.client
        .from('tbl_order_items')
        .select('*')
        .eq('order_id', order.id);

      return {
        ...order,
        items: items || []
      } as OrderRecord;
    } catch (err) {
      console.error('[SupabaseRepository] getOrderByToken Error:', err);
      return null;
    }
  }

  public async getAllOrders(): Promise<OrderRecord[]> {
    try {
      const { data: orders, error } = await this.client
        .from('tbl_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !orders) return [];

      const { data: items } = await this.client.from('tbl_order_items').select('*');

      return orders.map(order => ({
        ...order,
        items: items?.filter(item => item.order_id === order.id) || []
      })) as OrderRecord[];
    } catch (err) {
      console.error('[SupabaseRepository] getAllOrders Error:', err);
      return [];
    }
  }

  public async updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.client
        .from('tbl_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      return { success: true, message: 'Status updated' };
    } catch (err) {
      console.error('[SupabaseRepository] updateOrderStatus Error:', err);
      return { success: false, message: 'Failed to update order status' };
    }
  }

  public async getRoleModuleMatrix(): Promise<ModulePermission[]> {
    try {
      const { data, error } = await this.client
        .from('vw_role_module_matrix')
        .select('*');

      if (error) throw error;
      return (data || []) as ModulePermission[];
    } catch (err) {
      console.error('[SupabaseRepository] getRoleModuleMatrix Error:', err);
      return [];
    }
  }

  public async toggleRoleModulePermission(
    roleCode: string,
    moduleCode: string,
    field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    value: boolean
  ): Promise<{ success: boolean }> {
    try {
      const { error } = await this.client
        .from('tbl_role_modules')
        .update({ [field]: value })
        .match({ role_code: roleCode, module_code: moduleCode });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('[SupabaseRepository] toggleRoleModulePermission Error:', err);
      return { success: false };
    }
  }

  public async updateStoreBranding(branding: Partial<StoreBranding>): Promise<{ success: boolean }> {
    try {
      const { error } = await this.client
        .from('tbl_store_settings')
        .update({ ...branding, updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('[SupabaseRepository] updateStoreBranding Error:', err);
      return { success: false };
    }
  }

  public async createOrUpdateFoodItem(item: Partial<FoodItem>): Promise<{ success: boolean; id?: number }> {
    try {
      if (item.id) {
        const { error } = await this.client
          .from('tbl_food_items')
          .update(item)
          .eq('id', item.id);
        if (error) throw error;
        return { success: true, id: item.id };
      } else {
        const { data, error } = await this.client
          .from('tbl_food_items')
          .insert(item)
          .select('id')
          .single();
        if (error) throw error;
        return { success: true, id: data?.id };
      }
    } catch (err) {
      console.error('[SupabaseRepository] createOrUpdateFoodItem Error:', err);
      return { success: false };
    }
  }
}
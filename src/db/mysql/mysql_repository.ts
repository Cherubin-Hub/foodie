import { Pool, RowDataPacket } from 'mysql2/promise';
import { getMySQLPool } from './mysql_client.js';
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
  FoodItem,
  Category,
  Deal
} from '../db_types.js';

export class MySqlRepository implements IDatabaseRepository {
  private pool: Pool;

  constructor() {
    this.pool = getMySQLPool();
  }

  public async getLicenseStatus(): Promise<LicenseStatusResponse> {
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>('CALL sp_verify_license_status()');
      const result = (rows as any)[0]?.[0];
      return {
        success: Boolean(result?.success),
        status: result?.status || 'INACTIVE',
        is_usable: Boolean(result?.is_usable)
      };
    } catch (err) {
      console.error('[MySqlRepository] getLicenseStatus Error:', err);
      return {
        success: false,
        status: 'INACTIVE',
        is_usable: false,
        message: err instanceof Error ? err.message : 'MySQL connection error'
      };
    }
  }

  public async activateLicense(licenseKey: string): Promise<LicenseActivationResponse> {
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>('CALL sp_activate_license(?)', [licenseKey]);
      const result = (rows as any)[0]?.[0];
      return {
        success: Boolean(result?.success),
        message: result?.message || '',
        expires_at: result?.expires_at,
        new_request_code: result?.new_request_code
      };
    } catch (err) {
      console.error('[MySqlRepository] activateLicense Error:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'MySQL activation error'
      };
    }
  }

  public async createGuestSession(tempName: string): Promise<GuestSessionResponse> {
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>('CALL sp_create_guest_session(?)', [tempName]);
      const result = (rows as any)[0]?.[0];
      return {
        success: Boolean(result?.success),
        session_token: result?.session_token || '',
        guest_temporary_name: result?.guest_temporary_name || tempName,
        role: 'GUEST'
      };
    } catch (err) {
      console.error('[MySqlRepository] createGuestSession Error:', err);
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
      const licCheck = await this.getLicenseStatus();
      if (!licCheck.is_usable && role !== 'ADMIN') {
        return {
          success: false,
          license_locked: true,
          license_status: licCheck.status
        };
      }

      const [brandRows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM tbl_store_settings LIMIT 1');
      const [moduleRows] = await this.pool.query<RowDataPacket[]>(
        'SELECT module_code, can_view, can_create, can_edit, can_delete FROM tbl_role_modules WHERE role_code = ?',
        [role]
      );
      const [catRows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM tbl_categories WHERE is_active = TRUE ORDER BY sort_order');
      const [dealRows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM tbl_deals WHERE is_active = TRUE');
      const [itemRows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM tbl_food_items WHERE is_available = TRUE');

      let guestName: string | null = null;
      if (guestToken) {
        const [gRows] = await this.pool.query<RowDataPacket[]>(
          'SELECT guest_temporary_name FROM tbl_guest_sessions WHERE session_token = ? LIMIT 1',
          [guestToken]
        );
        guestName = (gRows as any)[0]?.guest_temporary_name || null;
      }

      return {
        success: true,
        license_locked: false,
        branding: brandRows[0] as StoreBranding,
        guest_temporary_name: guestName,
        permitted_modules: moduleRows as ModulePermission[],
        categories: catRows as Category[],
        deals: dealRows as Deal[],
        food_items: itemRows as FoodItem[]
      };
    } catch (err) {
      console.error('[MySqlRepository] renderHomePage Error:', err);
      return {
        success: false,
        license_locked: true,
        license_status: 'INACTIVE'
      };
    }
  }

  public async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResponse> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const trackingToken = 'TRK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      let subtotal = 0;

      for (const item of input.items) {
        subtotal += Number(item.unit_price) * Number(item.quantity);
      }

      let discount = 0;
      let deliveryFee = input.order_type === 'DELIVERY' ? 3.50 : 0.00;

      if (input.promo_code) {
        const [dRows] = await conn.query<RowDataPacket[]>(
          'SELECT * FROM tbl_deals WHERE promo_code = ? AND is_active = TRUE LIMIT 1',
          [input.promo_code.toUpperCase().trim()]
        );
        const deal = dRows[0];
        if (deal) {
          discount = Number((subtotal * (Number(deal.discount_percentage) / 100.00)).toFixed(2));
          if (deal.free_delivery) deliveryFee = 0.00;
        }
      }

      const total = Number(((subtotal - discount) + deliveryFee).toFixed(2));

      const [res] = await conn.query<any>(
        `INSERT INTO tbl_orders (
          tracking_token, user_id, guest_session_token, guest_temporary_name,
          order_type, status, subtotal, discount_amount, delivery_fee, total_amount,
          promo_code, delivery_address
        ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?)`,
        [
          trackingToken,
          input.user_id || null,
          input.guest_session_token || null,
          input.guest_temporary_name || null,
          input.order_type,
          subtotal,
          discount,
          deliveryFee,
          total,
          input.promo_code || null,
          input.delivery_address || null
        ]
      );

      const orderId = res.insertId;

      for (const item of input.items) {
        const itemTotal = Number(item.unit_price) * Number(item.quantity);
        await conn.query(
          `INSERT INTO tbl_order_items (order_id, food_item_id, item_name, unit_price, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.food_item_id, item.item_name, item.unit_price, item.quantity, itemTotal]
        );
      }

      await conn.commit();
      return {
        success: true,
        tracking_token: trackingToken,
        order_id: orderId,
        total_amount: total
      };
    } catch (err) {
      await conn.rollback();
      console.error('[MySqlRepository] placeOrder Error:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'MySQL order transaction failed'
      };
    } finally {
      conn.release();
    }
  }

  public async getOrderByToken(token: string): Promise<OrderRecord | null> {
    try {
      const [orders] = await this.pool.query<RowDataPacket[]>(
        'SELECT * FROM tbl_orders WHERE tracking_token = ? LIMIT 1',
        [token]
      );
      const order = orders[0];
      if (!order) return null;

      const [items] = await this.pool.query<RowDataPacket[]>(
        'SELECT * FROM tbl_order_items WHERE order_id = ?',
        [order.id]
      );

      return {
        ...order,
        items: items as any
      } as OrderRecord;
    } catch (err) {
      console.error('[MySqlRepository] getOrderByToken Error:', err);
      return null;
    }
  }

  public async getAllOrders(): Promise<OrderRecord[]> {
    try {
      const [orders] = await this.pool.query<RowDataPacket[]>('SELECT * FROM tbl_orders ORDER BY created_at DESC');
      const [items] = await this.pool.query<RowDataPacket[]>('SELECT * FROM tbl_order_items');

      return (orders as any[]).map(order => ({
        ...order,
        items: (items as any[]).filter(i => i.order_id === order.id)
      }));
    } catch (err) {
      console.error('[MySqlRepository] getAllOrders Error:', err);
      return [];
    }
  }

  public async updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.pool.query('UPDATE tbl_orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, orderId]);
      return { success: true, message: 'Status updated' };
    } catch (err) {
      console.error('[MySqlRepository] updateOrderStatus Error:', err);
      return { success: false, message: 'MySQL update status failed' };
    }
  }

  public async getRoleModuleMatrix(): Promise<ModulePermission[]> {
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM vw_role_module_matrix');
      return rows as ModulePermission[];
    } catch (err) {
      console.error('[MySqlRepository] getRoleModuleMatrix Error:', err);
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
      await this.pool.query(
        `UPDATE tbl_role_modules SET ${field} = ? WHERE role_code = ? AND module_code = ?`,
        [value, roleCode, moduleCode]
      );
      return { success: true };
    } catch (err) {
      console.error('[MySqlRepository] toggleRoleModulePermission Error:', err);
      return { success: false };
    }
  }

  public async updateStoreBranding(branding: Partial<StoreBranding>): Promise<{ success: boolean }> {
    try {
      await this.pool.query('UPDATE tbl_store_settings SET ? WHERE id = 1', [branding]);
      return { success: true };
    } catch (err) {
      console.error('[MySqlRepository] updateStoreBranding Error:', err);
      return { success: false };
    }
  }

  public async createOrUpdateFoodItem(item: Partial<FoodItem>): Promise<{ success: boolean; id?: number }> {
    try {
      if (item.id) {
        await this.pool.query('UPDATE tbl_food_items SET ? WHERE id = ?', [item, item.id]);
        return { success: true, id: item.id };
      } else {
        const [res] = await this.pool.query<any>('INSERT INTO tbl_food_items SET ?', [item]);
        return { success: true, id: res.insertId };
      }
    } catch (err) {
      console.error('[MySqlRepository] createOrUpdateFoodItem Error:', err);
      return { success: false };
    }
  }
}
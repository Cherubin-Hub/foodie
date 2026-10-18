export interface LicenseStatusResponse {
  success: boolean;
  status: 'VALID' | 'EXPIRED' | 'CLOCK_TAMPERED' | 'INACTIVE' | 'NO_RECORD';
  is_usable: boolean;
  app_code?: string;
  installation_request_code?: string;
  expires_at?: string;
  message?: string;
}

export interface LicenseActivationResponse {
  success: boolean;
  message: string;
  expires_at?: string;
  new_request_code?: string;
}

export interface GuestSessionResponse {
  success: boolean;
  session_token: string;
  guest_temporary_name: string;
  role: 'GUEST';
}

export interface StoreBranding {
  id?: number;
  store_name: string;
  tagline: string;
  hero_image_url: string;
  default_address: string;
  primary_color: string;
}

export interface ModulePermission {
  id?: number;
  role_code: string;
  role_name?: string;
  module_code: string;
  module_name?: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface Category {
  id: number;
  name: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface FoodItem {
  id: number;
  category_id: number;
  name: string;
  image_url: string;
  price: number;
  calories: number;
  prep_time_minutes: number;
  is_available: boolean;
}

export interface Deal {
  id: number;
  title: string;
  description: string;
  promo_code: string;
  discount_percentage: number;
  free_delivery: boolean;
  is_active: boolean;
}

export interface RenderedHomePayload {
  success: boolean;
  license_locked: boolean;
  license_status?: string;
  branding?: StoreBranding;
  guest_temporary_name?: string | null;
  permitted_modules?: ModulePermission[];
  categories?: Category[];
  deals?: Deal[];
  food_items?: FoodItem[];
}

export interface OrderItemInput {
  food_item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
}

export interface PlaceOrderInput {
  user_id?: number | null;
  guest_session_token?: string | null;
  guest_temporary_name?: string | null;
  order_type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  promo_code?: string | null;
  delivery_address?: string | null;
  items: OrderItemInput[];
}

export interface PlaceOrderResponse {
  success: boolean;
  tracking_token?: string;
  order_id?: number;
  total_amount?: number;
  message?: string;
}

export interface OrderRecord {
  id: number;
  tracking_token: string;
  user_id?: number | null;
  guest_session_token?: string | null;
  guest_temporary_name?: string | null;
  order_type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  promo_code?: string | null;
  delivery_address?: string | null;
  created_at: string;
  items?: {
    id: number;
    food_item_id: number;
    item_name: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }[];
}

export interface IDatabaseRepository {
  getLicenseStatus(): Promise<LicenseStatusResponse>;
  activateLicense(licenseKey: string): Promise<LicenseActivationResponse>;
  createGuestSession(tempName: string): Promise<GuestSessionResponse>;
  renderHomePage(role: string, guestToken?: string): Promise<RenderedHomePayload>;
  placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResponse>;
  getOrderByToken(token: string): Promise<OrderRecord | null>;
  getAllOrders(): Promise<OrderRecord[]>;
  updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean; message: string }>;
  getRoleModuleMatrix(): Promise<ModulePermission[]>;
  toggleRoleModulePermission(
    roleCode: string,
    moduleCode: string,
    field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    value: boolean
  ): Promise<{ success: boolean }>;
  updateStoreBranding(branding: Partial<StoreBranding>): Promise<{ success: boolean }>;
  createOrUpdateFoodItem(item: Partial<FoodItem>): Promise<{ success: boolean; id?: number }>;
}
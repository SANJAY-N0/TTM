// Repository Layer: Direct Supabase Client Integration for project 'uveefyorkrcyfzkmpakn'
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import path from 'path';

// Ensure dotenv finds root .env file regardless of CWD
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uveefyorkrcyfzkmpakn.supabase.co';

// Backend uses service_role key to bypass RLS for server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZWVmeW9ya3JjeWZ6a21wYWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MjQ4MjIsImV4cCI6MjEwMTQwMDgyMn0.DuKFmkjNEsc7c6yvVtO4DU6bISBVrzrx8K2hulAhdVI';
const activeKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set — using anon key. Add it to .env for full backend access.');
}

export const supabase = createClient(supabaseUrl, activeKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// ─────────────────────────────────────────────
// USER REPOSITORY (Supabase Direct)
// ─────────────────────────────────────────────
export class UserRepository {
  async findByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) throw new Error(`No account found for email: ${email}`);
    return data;
  }

  async findById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Database error: ${error.message}`);
    if (!data) throw new Error(`User not found for id: ${id}`);
    return data;
  }

  async create(data: any) {
    const password_hash = await bcrypt.hash(data.password || 'password123', 10);
    const newUserObj = {
      email: data.email.trim().toLowerCase(),
      password_hash,
      name: data.name || data.full_name || 'New Student',
      phone: data.phone || null,
      roll_number: data.roll_number || null,
      role: data.role || 'STUDENT',
      college_id: data.college_id || null,
      canteen_id: data.canteen_id || null,
      status: 'ACTIVE'
    };

    const { data: inserted, error } = await supabase
      .from('users')
      .insert([newUserObj])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    if (inserted && (data.department || data.year || data.full_name)) {
      await supabase.from('user_profiles').insert([{
        user_id: inserted.id,
        full_name: data.name || data.full_name,
        department: data.department || null,
        batch_year: data.year ? parseInt(data.year) : null
      }]);
    }

    return inserted;
  }

  async createCanteenOwner(data: {
    email: string;
    password?: string;
    name: string;
    phone?: string;
    college_id: string;
    canteen_id: string;
  }) {
    const password_hash = await bcrypt.hash(data.password || 'canteen123', 10);
    const newOwner = {
      email: data.email.trim().toLowerCase(),
      password_hash,
      name: data.name,
      phone: data.phone || null,
      role: 'CANTEEN_ADMIN',
      status: 'ACTIVE',
      college_id: data.college_id,
      canteen_id: data.canteen_id
    };

    const { data: inserted, error } = await supabase
      .from('users')
      .insert([newOwner])
      .select()
      .single();

    if (error) throw new Error(`Failed to create canteen owner: ${error.message}`);

    await supabase.from('user_profiles').insert([{
      user_id: inserted.id,
      full_name: data.name,
      department: 'Canteen Management'
    }]);

    return inserted;
  }

  async getAllStudents() {
    const { data, error } = await supabase
      .from('users')
      .select('*, user_profiles(*), colleges(name, code)')
      .eq('role', 'STUDENT')
      .order('created_at', { ascending: false });

    if (error) console.warn('Supabase getAllStudents error:', error.message);
    return data || [];
  }

  async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}

// ─────────────────────────────────────────────
// COLLEGE REPOSITORY (Supabase Direct)
// ─────────────────────────────────────────────
export class CollegeRepository {
  async getAll() {
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) console.warn('Supabase CollegeRepository.getAll error:', error.message);
    return data || [];
  }

  async create(data: any) {
    const { data: inserted, error } = await supabase
      .from('colleges')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(`Failed to create college: ${error.message}`);
    return inserted;
  }

  async update(id: string, data: any) {
    const { data: updated, error } = await supabase
      .from('colleges')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update college: ${error.message}`);
    return updated;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('colleges')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete college: ${error.message}`);
    return { success: true, id };
  }
}

// ─────────────────────────────────────────────
// CANTEEN REPOSITORY (Supabase Direct)
// ─────────────────────────────────────────────
export class CanteenRepository {
  async getAll() {
    const { data, error } = await supabase
      .from('canteens')
      .select('*, colleges(name, code), canteen_settings(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) console.warn('Supabase CanteenRepository.getAll error:', error.message);
    return data || [];
  }

  async findAll() {
    return this.getAll();
  }

  async getByCollege(collegeId: string) {
    const { data, error } = await supabase
      .from('canteens')
      .select('*, canteen_settings(*)')
      .eq('college_id', collegeId)
      .is('deleted_at', null);

    if (error) console.warn('Supabase CanteenRepository.getByCollege error:', error.message);
    return data || [];
  }

  async findById(id: string) {
    const { data, error } = await supabase
      .from('canteens')
      .select('*, colleges(name, code), canteen_settings(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Database error: ${error.message}`);
    return data;
  }

  async create(data: any) {
    const { data: inserted, error } = await supabase
      .from('canteens')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(`Failed to create canteen: ${error.message}`);

    // Create default settings row
    await supabase.from('canteen_settings').insert([{
      canteen_id: inserted.id,
      opening_time: '08:00:00',
      closing_time: '20:00:00',
      is_accepting_orders: true
    }]);

    return inserted;
  }

  async update(id: string, data: any) {
    const { data: updated, error } = await supabase
      .from('canteens')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update canteen: ${error.message}`);
    return updated;
  }

  async setupCanteenProfile(canteenId: string, payload: {
    name: string;
    location: string;
    contact_phone: string;
    opening_time: string;
    closing_time: string;
    logo_url?: string;
    banner_url?: string;
  }) {
    // Update main canteen record
    const { data: canteen, error: cErr } = await supabase
      .from('canteens')
      .update({
        name: payload.name,
        location: payload.location,
        contact_phone: payload.contact_phone
      })
      .eq('id', canteenId)
      .select()
      .single();

    if (cErr) throw new Error(`Canteen setup error: ${cErr.message}`);

    // Upsert canteen settings
    const { error: sErr } = await supabase
      .from('canteen_settings')
      .upsert({
        canteen_id: canteenId,
        opening_time: payload.opening_time || '08:00:00',
        closing_time: payload.closing_time || '20:00:00',
        is_accepting_orders: true
      }, { onConflict: 'canteen_id' });

    if (sErr) console.warn('Canteen settings setup error:', sErr.message);

    return canteen;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('canteens')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete canteen: ${error.message}`);
    return { success: true, id };
  }
}

// ─────────────────────────────────────────────
// ORDER REPOSITORY (Supabase Direct)
// ─────────────────────────────────────────────
export class OrderRepository {
  async findById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), users(name, phone, roll_number)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Database error: ${error.message}`);
    if (!data) throw new Error(`Order not found for id: ${id}`);
    return data;
  }

  async createOrder(orderData: any) {
    const orderCode = `TTM-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newOrderPayload = {
      order_code: orderCode,
      student_id: orderData.student_id,
      canteen_id: orderData.canteen_id,
      total_amount: Number(orderData.total_amount || 0),
      paid_amount: Number(orderData.paid_amount || 0),
      payment_method: orderData.payment_method || 'CASH',
      payment_status: orderData.payment_status || 'PENDING',
      order_status: 'PENDING'
    };

    const { data: createdOrder, error } = await supabase
      .from('orders')
      .insert([newOrderPayload])
      .select()
      .single();

    if (error) throw new Error(`Failed to create order: ${error.message}`);

    if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
      const itemsPayload = orderData.items.map((item: any) => ({
        order_id: createdOrder.id,
        food_id: item.menu_item_id || item.food_id || item.meal_id || null,
        item_name: item.item_name || item.name || 'Food Item',
        quantity: item.quantity || 1,
        price_per_unit: item.price || item.price_per_unit || 0,
        total_price: (item.price || item.price_per_unit || 0) * (item.quantity || 1)
      }));

      await supabase.from('order_items').insert(itemsPayload);
    }

    return createdOrder;
  }

  async getOrdersByCanteen(canteenId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), users(name, phone, roll_number)')
      .eq('canteen_id', canteenId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) console.warn('Supabase getOrdersByCanteen error:', error.message);
    return data || [];
  }

  async getOrdersByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), canteens(name, location)')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) console.warn('Supabase getOrdersByStudent error:', error.message);
    return data || [];
  }

  async updateOrderStatus(orderId: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) console.warn('Supabase updateOrderStatus error:', error.message);
    return data || { id: orderId, order_status: status };
  }
}

// ─────────────────────────────────────────────
// FOOD ITEM REPOSITORY (Supabase Direct)
// ─────────────────────────────────────────────
export class FoodItemRepository {
  async getByCanteen(canteenId: string) {
    const { data, error } = await supabase
      .from('food_items')
      .select('*, food_images(*), categories(name)')
      .eq('canteen_id', canteenId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) console.warn('Supabase FoodItemRepository.getByCanteen error:', error.message);
    return data || [];
  }

  async getAll() {
    const { data, error } = await supabase
      .from('food_items')
      .select('*, food_images(*), categories(name), canteens(name)')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) console.warn('Supabase FoodItemRepository.getAll error:', error.message);
    return data || [];
  }

  async create(itemData: any) {
    const { data, error } = await supabase
      .from('food_items')
      .insert([itemData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create food item: ${error.message}`);
    return data;
  }

  async update(id: string, itemData: any) {
    const { data, error } = await supabase
      .from('food_items')
      .update(itemData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update food item: ${error.message}`);
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('food_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete food item: ${error.message}`);
    return { success: true, id };
  }
}

// ─────────────────────────────────────────────
// CATEGORY REPOSITORY (Supabase Direct)
// ─────────────────────────────────────────────
export class CategoryRepository {
  async getByCanteen(canteenId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('canteen_id', canteenId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) console.warn('Supabase CategoryRepository.getByCanteen error:', error.message);
    return data || [];
  }

  async create(data: any) {
    const { data: inserted, error } = await supabase
      .from('categories')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(`Failed to create category: ${error.message}`);
    return inserted;
  }

  async update(id: string, data: any) {
    const { data: updated, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update category: ${error.message}`);
    return updated;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete category: ${error.message}`);
    return { success: true, id };
  }
}

// ─────────────────────────────────────────────
// FOOD IMAGE REPOSITORY (Supabase Direct)
// ─────────────────────────────────────────────
export class FoodImageRepository {
  async createImage(imageData: {
    food_id: string;
    image_url: string;
    public_id?: string;
    secure_url?: string;
    width?: number;
    height?: number;
    format?: string;
    folder?: string;
    bytes?: number;
    is_primary?: boolean;
  }) {
    const { data, error } = await supabase
      .from('food_images')
      .insert([{ ...imageData, is_primary: imageData.is_primary ?? true }])
      .select()
      .single();

    if (error) console.warn('Supabase FoodImageRepository.createImage error:', error.message);
    return data;
  }

  async getByFoodId(foodId: string) {
    const { data, error } = await supabase
      .from('food_images')
      .select('*')
      .eq('food_id', foodId)
      .order('is_primary', { ascending: false });

    if (error) console.warn('Supabase FoodImageRepository.getByFoodId error:', error.message);
    return data || [];
  }

  async getPrimaryImage(foodId: string) {
    const { data, error } = await supabase
      .from('food_images')
      .select('*')
      .eq('food_id', foodId)
      .eq('is_primary', true)
      .maybeSingle();

    if (error) console.warn('Supabase FoodImageRepository.getPrimaryImage error:', error.message);
    return data;
  }

  async deleteByPublicId(publicId: string) {
    const { error } = await supabase
      .from('food_images')
      .delete()
      .eq('public_id', publicId);

    if (error) console.warn('Supabase FoodImageRepository.deleteByPublicId error:', error.message);
    return { success: !error };
  }

  async deleteByFoodId(foodId: string) {
    const { error } = await supabase
      .from('food_images')
      .delete()
      .eq('food_id', foodId);

    if (error) console.warn('Supabase FoodImageRepository.deleteByFoodId error:', error.message);
    return { success: !error };
  }
}

// ─────────────────────────────────────────────
// CART REPOSITORY (Supabase Direct)
// ─────────────────────────────────────────────
export class CartRepository {
  async getCartByStudent(studentId: string) {
    let { data: cart } = await supabase
      .from('carts')
      .select('id, canteen_id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (!cart) {
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert([{ student_id: studentId }])
        .select()
        .single();
      if (error) {
        console.warn('Cart creation error:', error.message);
        return { id: null, items: [] };
      }
      cart = newCart;
    }

    const { data: items, error: iErr } = await supabase
      .from('cart_items')
      .select('*, food_items(*, food_images(*))')
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: true });

    if (iErr) console.warn('Cart items error:', iErr.message);
    return { id: cart.id, canteen_id: cart.canteen_id, items: items || [] };
  }

  async addItemToCart(studentId: string, foodId: string, quantity: number = 1) {
    const cart = await this.getCartByStudent(studentId);
    if (!cart.id) throw new Error('Could not get or create student cart');

    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('food_id', foodId)
      .maybeSingle();

    if (existing) {
      const newQty = existing.quantity + quantity;
      const { data: updated, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new Error(`Failed to update cart item: ${error.message}`);
      return updated;
    } else {
      const { data: inserted, error } = await supabase
        .from('cart_items')
        .insert([{ cart_id: cart.id, food_id: foodId, quantity }])
        .select()
        .single();
      if (error) throw new Error(`Failed to add cart item: ${error.message}`);
      return inserted;
    }
  }

  async updateItemQty(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);
      if (error) throw new Error(`Failed to delete cart item: ${error.message}`);
      return { success: true, id: cartItemId };
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', cartItemId)
      .select()
      .single();
    if (error) throw new Error(`Failed to update cart item quantity: ${error.message}`);
    return data;
  }

  async clearCart(studentId: string) {
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (!cart) return { success: true };

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (error) console.warn('Clear cart error:', error.message);
    return { success: !error };
  }
}

// ─────────────────────────────────────────────
// Backward compatibility alias
// ─────────────────────────────────────────────
export const MealRepository = FoodItemRepository;


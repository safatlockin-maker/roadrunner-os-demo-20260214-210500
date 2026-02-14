import { z } from 'zod';

// Zod schemas for validation
export const VehicleStatusSchema = z.enum(['available', 'pending', 'sold', 'service']);
export const TransmissionTypeSchema = z.enum(['automatic', 'manual', 'cvt']);
export const FuelTypeSchema = z.enum(['gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid']);
export const BodyStyleSchema = z.enum(['sedan', 'suv', 'truck', 'coupe', 'hatchback', 'van', 'wagon', 'convertible']);

// Vehicle image schema
export const VehicleImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  is_primary: z.boolean().default(false),
});

// Inventory/Vehicle schema
export const VehicleSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),

  // Vehicle Details
  year: z.number().min(1900).max(new Date().getFullYear() + 2),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().optional().nullable(),
  vin: z.string().length(17).optional().nullable(),

  // Specs
  mileage: z.number().min(0).optional().nullable(),
  exterior_color: z.string().optional().nullable(),
  interior_color: z.string().optional().nullable(),
  transmission: TransmissionTypeSchema.optional().nullable(),
  fuel_type: FuelTypeSchema.optional().nullable(),
  body_style: BodyStyleSchema.optional().nullable(),

  // Pricing
  list_price: z.number().min(0),
  cost: z.number().min(0).optional().nullable(),
  days_in_inventory: z.number().min(0).default(0),

  // Status
  status: VehicleStatusSchema,

  // Media
  images: z.array(VehicleImageSchema).default([]),

  // Tracking
  inquiry_count: z.number().min(0).default(0),
  test_drive_count: z.number().min(0).default(0),
  last_inquiry_at: z.string().datetime().optional().nullable(),
});

// TypeScript types inferred from schemas
export type VehicleStatus = z.infer<typeof VehicleStatusSchema>;
export type TransmissionType = z.infer<typeof TransmissionTypeSchema>;
export type FuelType = z.infer<typeof FuelTypeSchema>;
export type BodyStyle = z.infer<typeof BodyStyleSchema>;
export type VehicleImage = z.infer<typeof VehicleImageSchema>;
export type Vehicle = z.infer<typeof VehicleSchema>;

// Vehicle creation type (without generated fields)
export type CreateVehicleInput = Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'inquiry_count' | 'test_drive_count'>;

// Vehicle update type
export type UpdateVehicleInput = Partial<Omit<Vehicle, 'id' | 'created_at'>>;

// Vehicle filters for search/queries
export interface VehicleFilters {
  year_min?: number;
  year_max?: number;
  make?: string | string[];
  model?: string | string[];
  price_min?: number;
  price_max?: number;
  mileage_max?: number;
  body_style?: BodyStyle | BodyStyle[];
  fuel_type?: FuelType | FuelType[];
  transmission?: TransmissionType | TransmissionType[];
  status?: VehicleStatus | VehicleStatus[];
  search?: string; // Full-text search across make, model, trim
}

// Vehicle with inquiry metrics
export interface VehicleWithMetrics extends Vehicle {
  inquiry_to_test_drive_rate?: number;
  avg_days_to_sell?: number;
  is_hot?: boolean; // inquiry_count > threshold
}

// Inventory metrics for dashboard
export interface InventoryMetrics {
  total_vehicles: number;
  available_vehicles: number;
  pending_sales: number;
  sold_this_month: number;
  avg_days_in_inventory: number;
  total_inventory_value: number;
  most_inquired: Vehicle[];
  vehicles_without_inquiries: number;
  avg_price: number;
  vehicles_by_type: Record<BodyStyle, number>;
}

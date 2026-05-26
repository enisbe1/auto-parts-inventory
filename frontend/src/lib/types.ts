export interface Make { id: number; name: string; countryOfOrigin?: string; }
export interface CarModel { id: number; name: string; makeId: number; make?: Make; bodyType?: string; }
export interface Generation { id: number; name: string; code?: string; yearStart?: number; yearEnd?: number; modelId: number; model?: CarModel; }
export interface Variant { id: number; name: string; engine?: string; fuelType?: string; powerKw?: number; generationId: number; generation?: Generation; }
export interface Vehicle { id: number; vin?: string; year?: number; mileage?: number; purchasePrice?: number; purchaseDate?: string; status: string; notes?: string; variantId?: number; variant?: Variant; parts?: Part[]; createdAt: string; }
export interface Category { id: number; name: string; description?: string; }
export interface Part { id: number; name: string; partNumber?: string; condition: string; price?: number; status: string; notes?: string; vehicleId?: number; vehicle?: Vehicle; categoryId?: number; category?: Category; createdAt: string; }

import { cuisineMap, amenityMap }  from './assets/cuisine-map';
export { };

declare global {
  // declares a 
  type CuisineType = keyof typeof  cuisineMap

  interface AmenityInfo {
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
    address: string;
    phone: string;
    email: string;
    website: string;
    cuisine: CuisineType;
    amenity_type: keyof typeof amenityMap
  }
}

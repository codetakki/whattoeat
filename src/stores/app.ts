// Utilities
import { defineStore } from 'pinia'
import { useFetch, useGeolocation } from '@vueuse/core'
import { refDebounced } from '@vueuse/core'


export const useAppStore = defineStore('app', {
  state: () => {
    const { coords, error, isSupported, pause } = useGeolocation({})
    const locationToAdressUrl = computed(() => `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.value.latitude}&lon=${coords.value.longitude}`)
    const { execute } = useFetch(locationToAdressUrl, {}, {
      immediate: false, refetch: false, afterFetch: (ctx) => {
        console.log(ctx.data);

        if (!ctx.data?.address) return ctx
        if (ctx.data.name && ctx.data.name.length > 0) {
          typedAdress.value = `${ctx.data.name}`
          return ctx
        }
        if (ctx.data.address.road) {
          typedAdress.value = `${ctx.data.address.road}`
        }
        if (ctx.data.address.house_number) {
          typedAdress.value += ` ${ctx.data.address.house_number}`
        }
        if (!ctx.data.address.road && ctx.data.value.address.house_number) {
          typedAdress.value = `${ctx.data.display_name}`
        }
        return ctx
      }
    }).json<any>()
    watchEffect(() => {
      if (!isSupported.value) return
      if (!coords.value) return
      if (error.value) return
      if (coords.value.latitude && coords.value.longitude) {
        if (coords.value.latitude !== Infinity && coords.value.longitude !== Infinity) {
          execute()
          pause()

        }
      }
    })
    // Convert a typed adress into coordinates
    const typedAdress = ref()
    const adressDebounced = refDebounced(typedAdress, 1000)
    const addressRequestUrl = computed(() => `https://nominatim.openstreetmap.org/search?q=${adressDebounced.value}&format=json&limit=1`)
    const { data: adressCoordinatesData } = useFetch(addressRequestUrl, { immediate: false, refetch: true }).json<any[]>()
    const adressCoordinates = computed(() => {
      if (adressCoordinatesData && adressCoordinatesData.value && adressCoordinatesData.value[0]) {
        return { latitude: adressCoordinatesData.value[0].lat, longitude: adressCoordinatesData.value[0].lon }
      }
      return null
    })


    // const data = getFoodAmenitiesNearCoordinate(coords.value.latitude, coords.value.longitude)
    const radiusKm = ref(5)
    const radius = computed(() => radiusKm.value * 1000)
    const overpassQuery = computed(() => {
      if (!adressCoordinates.value) return null
      return `
          [out:json];
          (
            node["amenity"="restaurant"](around:${radius.value},${adressCoordinates.value.latitude},${adressCoordinates.value.longitude});
            way["amenity"="restaurant"](around:${radius.value},${adressCoordinates.value.latitude},${adressCoordinates.value.longitude});
            relation["amenity"="restaurant"](around:${radius.value},${adressCoordinates.value.latitude},${adressCoordinates.value.longitude});
            node["amenity"="fast_food"](around:${radius.value},${adressCoordinates.value.latitude},${adressCoordinates.value.longitude});
            way["amenity"="fast_food"](around:${radius.value},${adressCoordinates.value.latitude},${adressCoordinates.value.longitude});
            relation["amenity"="fast_food"](around:${radius.value},${adressCoordinates.value.latitude},${adressCoordinates.value.longitude});
            node["amenity"="food_court"](around:${radius.value},${adressCoordinates.value.latitude},${adressCoordinates.value.longitude});
            way["amenity"="food_court"](around:${radius.value},${adressCoordinates.value.latitude},${adressCoordinates.value.longitude});
            relation["amenity"="food_court"](around:${radius.value},${adressCoordinates.value.latitude},${adressCoordinates.value.longitude});
          );
          out body;
          >;
          out skel qt;
          `
    })
    const overpassUrl = 'http://overpass-api.de/api/interpreter'
    watch(overpassQuery, () => {
      if (!overpassQuery.value) return
      fetchRestaurants()
    })
    const { data: restaurantData, execute: fetchRestaurants } = useFetch(overpassUrl,
      {
        body: overpassQuery.value,
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
      },
      {
        beforeFetch(ctx) {
          if (!overpassQuery.value || overpassQuery.value.length < 1) ctx.cancel()
          ctx.options.body = overpassQuery.value
          return ctx
        },
        afterFetch(ctx) {
          return ctx
        },
      }).json<{ elements: [] }>()

    const restaurants = computed(() => {
      if (!restaurantData.value) {
        return []
      }
      const amenities: AmenityInfo[] = []

      // Extract relevant information about each amenity
      restaurantData.value.elements.forEach((element: any) => {
        if (element.tags && element.tags.name) {
          const amenityInfo: AmenityInfo = {
            ...element,
            id: element.id,
            name: element.tags.name,
            latitude: element.lat || (element.center && element.center.lat) || null,
            longitude: element.lon || (element.center && element.center.lon) || null,
            address: element.tags['addr:full'],
            phone: element.tags.phone,
            email: element.tags.email,
            website: element.tags.website,
            cuisine: element.tags.cuisine,
            amenity_type: element.tags.amenity,
          }
          amenities.push(amenityInfo)
        }
      })
      console.log(amenities)
      return amenities
    })

    const randMax = computed(() => {
      return restaurants.value.length || 0
    })

    const randomRestaurant = ref<AmenityInfo>()
    const getRandomRestaurant = () => {
      randomRestaurant.value = restaurants.value[Math.floor(Math.random() * randMax.value)]
      return randomRestaurant
    }

    watch(restaurants, () => {
      getRandomRestaurant()
    })
    return {
      coords,
      restaurantData,
      adressCoordinates,
      restaurants,
      error,
      getRandomRestaurant,
      randomRestaurant,
      typedAdress,
      radiusKm
    }
  },
},
)

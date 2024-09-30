<template>
  <div class="align-center d-flex flex-column justify-center h-100 w-100 text-center px-2 py-4 overflow-x-hidden">
    <v-expand-transition group>
      <div key="search-title" class="d-flex flex-column align-center">
        <div class="text-h2 font-weight-bold">Enter your adress</div>
        <v-chip v-if="appStore.fetchingCoordinatesAdress">Getting address
          <template #prepend><v-progress-circular indeterminate size="20" class="ml-n1 mr-1"></v-progress-circular></template>
        </v-chip>
        <div class="my-4  my-md-8  ">
          <v-text-field v-model="appStore.typedAdress"
            width="300"
            variant="outlined"
            class="text-h3"
            :style="{ scale: mobile ? 1 : 1.4 }"
            label="Adress" />
        </div>
      </div>
      <div v-if="appStore.fetchingRestaurants || appStore.fetchingAdressCoordinates"
        width="300" key="progress">
        <v-progress-circular indeterminate
          :size="128"
          :width="15"
          class="text-h2"
          speed="0.9">
          🍽️
        </v-progress-circular>

      </div>
      <div v-else-if="restaurant" key="result"
        class="d-flex flex-column align-center w-100">
        <div class="text-md-h3 text-h4 font-weight-bold">What do you think about:</div>
        <v-card v-if="restaurant"
          :width="mobile ? '90%' : 600" min-height="140"
          :style="{ scale: mobile ? 1 : 1 }"
          class="text-left my-4 mx-2">
          <v-card-title class="text-h5 text-md-h3 text-bold d-flex align-center">
            <div class="flex-shrink-1 text-truncate">{{ restaurant.name }}</div>
            <v-btn icon="mdi-open-in-new"
              target="_blank"
              :href="googleSearchQuary"
              variant="flat"></v-btn>
          </v-card-title>
          <v-card-text class="text-h6 text-md-h5">
            <div v-if="restaurant.amenity_type">{{ amenityMap[restaurant.amenity_type] }}</div>
            <div v-if="restaurant.cuisine">{{ getCuisine(restaurant.cuisine || '') }}</div>
            <div>
              <a v-if="restaurant.phone"
                :href="`tel:${restaurant.phone.replace(/[^\d]/g, '')}`"
                class="text-decoration-none">
                ☎️ {{ restaurant.phone }}
              </a>
            </div>

            <!-- <pre>{{ restaurant }}</pre> -->
          </v-card-text>
        </v-card>
        <v-btn size="x-large"
          @click="appStore.getRandomRestaurant">I dont like it</v-btn>
        <div class="text-body-1 text-medium-emphasis">
          Giving suggestions in a {{ appStore.radiusKm }} km radius <br>
          {{ appStore.restaurants.length }} restaurants found
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script lang="ts" setup>
  import { useAppStore } from '@/stores/app'
  import { storeToRefs } from 'pinia';
  import { cuisineMap, amenityMap } from '@/assets/cuisine-map';
  import { useDisplay } from 'vuetify';
  import { useFetch } from '@vueuse/core';
  import emojiFromWord from "emoji-from-word";

  const { mobile } = useDisplay()
  const appStore = useAppStore()
  const { randomRestaurant: restaurant } = storeToRefs(appStore)
  const getCuisine = (cuisine: string) => {
    const list: CuisineType[] = cuisine.split(/[;,:\s]+/).filter(c => c) as CuisineType[]
    const cuisines = list
      .map(c => c.trim().replace('_', '') as CuisineType)
      .filter(c => c)
      .map((c) => {
        if (cuisineMap[c]) {
          return cuisineMap[c].name + ' ' + cuisineMap[c].emoji
        }
        return c.charAt(0).toUpperCase() + c.slice(1).replace('_', ' ') + ' 🍽️'
      })
      .join(', ')
    return cuisines
  }

  const restaurantLocationUrl = computed(() => {
    if (restaurant.value) { return `https://nominatim.openstreetmap.org/reverse?format=json&lat=${restaurant.value?.latitude}&lon=${restaurant.value?.longitude}` }
    else return ''
  })
  const { data: restaurantLocation } = useFetch(restaurantLocationUrl, {}, { refetch: true }).json<any>()
  const googleSearchQuary = computed(() => {
    console.log(appStore.coordinatesAdress?.address);
    console.log(restaurantLocation.value);

    var string = `${restaurant.value?.name} restaurant`
    if (!restaurantLocation.value || !restaurant.value?.longitude) return ''
    else { string += ` in ${restaurantLocation.value.address.road || restaurantLocation.value.address.house_number} ${restaurantLocation.value.address.city || restaurantLocation.value.address.municipality}` }
    return `https://www.google.com/search?q=${string.replace(' ', '+')}`
  })
</script>

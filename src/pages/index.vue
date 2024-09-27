<template>
  <div class="align-center d-flex flex-column justify-center h-100 w-100 text-center px-2 py-4">
    <div class="text-h2 font-weight-bold">Enter your adress</div>
    <div class="my-8  ">
      <v-text-field v-model="appStore.typedAdress"
        width="300"
        variant="outlined"
        :style="{scale: mobile ? 1 : 1.5}"
        label="Adress" />
    </div>
    <template v-if="restaurant">
      <div class="text-h2 font-weight-bold">What do you think about:</div>
      <v-card v-if="restaurant" :style="{scale: mobile ? 1 : 1.5}"
        max-width="400"
        class="text-left my-12">
        <v-card-title class="d-flex align-center text-h4">{{ restaurant.name }} <v-spacer></v-spacer> <v-btn icon="mdi-open-in-new" target="_blank" :href="googleSearchQuary"  variant="flat"></v-btn></v-card-title>
        <v-card-text class="text-h5">
          <div v-if="restaurant.amenity_type">{{ amenityMap[restaurant.amenity_type] }}</div>
          <span v-if="restaurant.cuisine">{{getCuisine(restaurant.cuisine || '') }}</span>
          <!-- <pre>{{ restaurant }}</pre> -->
        </v-card-text>
      </v-card>
      <v-btn size="x-large"
      @click="appStore.getRandomRestaurant">I dont like it</v-btn>
      <div class="text-body-1 text-medium-emphasis">
        Giving suggestions in a {{ appStore.radiusKm  }} km radius <br>
        {{ appStore.restaurants.length }} restaurants found
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import { useAppStore } from '@/stores/app'
  import { storeToRefs } from 'pinia';
  import { cuisineMap, amenityMap } from '@/assets/cuisine-map';
  import { useDisplay } from 'vuetify';
  const { mobile } = useDisplay()
  const appStore = useAppStore()
  const { randomRestaurant: restaurant } = storeToRefs(appStore)
  const getCuisine = (cuisine: string) => {
    const list : CuisineType[] = cuisine.split(/[;,:\s]+/).filter(c => c) as CuisineType[]
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

  const googleSearchQuary = computed(() => {
    const string = `${restaurant.value?.name} restaurant ${appStore.typedAdress} `
    return `https://www.google.com/search?q=${string.replace(' ', '+')}`
  })
</script>

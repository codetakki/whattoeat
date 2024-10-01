<template>
  <div class="align-center d-flex flex-column justify-center h-100 w-100 text-center px-2 py-4 overflow-x-hidden">
    <v-expand-transition group>
      <div key="search-title"
        class="d-flex flex-column align-center">
        <div class="text-h2 font-weight-bold">Enter your adress</div>
        <v-chip v-if="appStore.fetchingCoordinatesAdress">Getting address
          <template #prepend><v-progress-circular indeterminate
              size="20"
              class="ml-n1 mr-1"></v-progress-circular></template>
        </v-chip>
        <div class="mt-4 mt-md-8 text-center">
          <v-text-field v-model="appStore.typedAdress"
            width="300"
            variant="outlined"
            class="text-h3"
            clearable
            :style="{ scale: mobile ? 1 : 1.4 }"
            label="Adress" />
        </div>

      </div>
      <div v-if="appStore.fetchingRestaurants || appStore.fetchingAdressCoordinates"
        key="progress">
        <v-progress-circular indeterminate
          :size="128"
          :width="15"
          class="text-h2 mb-5 mt-2"
          speed="0.9">
          🍽️
        </v-progress-circular>

      </div>
      <div v-else-if="!appStore.restaurants.length && appStore.restaurantData">
        <div>Could not find any restaurants matching your search 😢</div>
      </div>

      <div v-else-if="restaurant"
        key="result"
        class="d-flex flex-column align-center w-100">
        <div class="text-md-h3 text-h4 font-weight-bold">You could eat at:</div>
        <v-card v-if="restaurant"
          :width="mobile ? '90%' : 600"
          :style="{ scale: mobile ? 1 : 1 }"
          class="text-left my-4 mx-2 mb-8">
          <v-card-title>
            <div class="text-h5 text-md-h3 text-bold d-flex align-center">

              <div class="flex-shrink-1 text-truncate">{{ restaurant?.name }}</div>
              <v-spacer />
              <v-btn v-if="restaurant?.latitude"
                target="_blank"
                :href="`https://www.google.com/maps/search/?api=1&query=${restaurant?.latitude},${restaurant?.longitude}`"
                icon="mdi-directions"
                variant="flat"
                ></v-btn>
              <v-btn icon="mdi-open-in-new"
                target="_blank"
                :href="googleSearchQuary"
                variant="flat"></v-btn>
            </div>
            <div class="mt-n1 text-caption text-medium-emphasis">{{ restaurant?.name }}</div>
          </v-card-title>
          <v-card-text class="text-h6 text-md-h5">
            <div v-if="restaurant?.amenity_type">{{ amenityMap[restaurant?.amenity_type || 'bar'] }}</div>
            <div v-if="restaurant?.cuisine">{{ getCuisine(restaurant?.cuisine || '') }}</div>
            <div>
              <a v-if="restaurant?.phone"
                :href="`tel:${restaurant?.phone.replace(/[^\d]/g, '')}`"
                class="text-decoration-none">
                ☎️ {{ restaurant?.phone }}
              </a>
            </div>
            <!-- <pre>{{ restaurant }}</pre> -->
          </v-card-text>
        </v-card>
        <v-btn size="x-large" class="mb-4"
          v-if="appStore.availableRestaurants.length !== 0"
          @click="appStore.getRandomRestaurant">I don't like it</v-btn>
        <div v-else-if="!appStore.availableRestaurants.length">
          <div>No more suggestions to give. Are you a really picky eater? 😳</div>
          <v-btn size="x-large" class="my-1"
            @click="appStore.suggestedRestaurants = []; appStore.getRandomRestaurant">Reset suggestions</v-btn>
        </div>
        <div class="text-body-1 text-medium-emphasis py-1">
          {{ appStore.restaurants.length }} restaurants found<br>
          {{ appStore.availableRestaurants.length }} suggestions left <v-btn icon="mdi-restore"
            @click="appStore.suggestedRestaurants = []; appStore.getRandomRestaurant"
            density="compact"
            size="small"
            variant="flat"></v-btn>
        </div>
      </div>
    </v-expand-transition>
    <div class="text-body-1 text-medium-emphasis ">
      Giving suggestions in a
      <!-- KM radius dialog -->
      <span class="text-high-emphasis font-weight-bold text-decoration-underline">
        {{ appStore.radiusKm }} km<v-icon size="small">mdi-pencil</v-icon>
        <v-dialog activator="parent"
          v-model="kmDialog"
          max-width="400"
          @keydown.esc="kmDialog = false"
          persistent>
          <v-card class="bg-surface pa-1"
            title="Enter radius">
            <v-form v-model="radiusValid">
              <v-card-text>
                <v-text-field variant="outlined"
                  label="Radius in km"
                  :rules="[v => !!v || v === '0' || 'Radius is required', v => v <= 100 || 'Radius must be less than 100 km']"
                  v-model.number="radiusKm"
                  type="number"
                  autofocus
                  @keydown.enter.prevent="submitRadius"
                  eager></v-text-field>
              </v-card-text>
              <v-card-actions class="mt-n6">
                <v-spacer></v-spacer>
                <v-btn variant="flat"
                  @click="kmDialog = false; appStore.radiusKm = radiusKm"
                  :disabled="!radiusValid">Done</v-btn>
              </v-card-actions>
            </v-form>
          </v-card>
        </v-dialog>
      </span> radius<br>

    </div>
    <v-expansion-panels :style="{ width: mobile ? '90%' : '600px' }"
      key="filter"
      class="mt-2">
      <v-expansion-panel :title="'Picky eater? ' + (appStore.amenityFilter.length + appStore.cuisineFilter.length > 0 ? '(Selection made)' : '')">
        <v-expansion-panel-text style="max-width: 100%">
          <v-autocomplete label="Amenity type"
            v-model="appStore.amenityFilter"
            :items="amenityList"
            multiple
            chips
            closable-chips
            item-title="text"
            item-value="value"></v-autocomplete>
          <v-autocomplete label="Cuisine"
            v-model="appStore.cuisineFilter"
            :items="cuisineList"
            multiple
            chips
            closable-chips
            item-title="text"
            item-value="value"></v-autocomplete>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <div class="text-caption text-medium-emphasis mt-4">
      Created by <span class="text-decoration-underline text-blue-darken-1 cursor-pointer">Tarek Auf der Strasse
        <v-dialog activator="parent">
          <v-card title="Contact info">
            <v-card-text>
              <v-icon>mdi-linkedin</v-icon> <a href="https://www.linkedin.com/in/tarek-auf-der-strasse-4854331b1/" target="_blank">LinkedIn</a>
              <br>
              <v-icon>mdi-github</v-icon> <a href="https://github.com/codetakki" target="_blank">Github</a>
              
            </v-card-text>
          </v-card>
        </v-dialog>
      </span><br>
      Data provided by <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy;OpenStreetMap</a><br>     
      Built with <a href="https://v3.vuejs.org/" target="_blank">Vue 3</a>, <a href="https://vuetifyjs.com/en/" target="_blank">Vuetify</a>, <a href="https://pinia.vuejs.org/" target="_blank">Pinia</a> and <a href="https://vitejs.dev/" target="_blank">Vite</a>
      <br>
    </div>
  </div>

</template>

<script lang="ts" setup>
  import { useAppStore, useFetch } from '@/stores/app'
  import { storeToRefs } from 'pinia';
  import { cuisineMap, amenityMap } from '@/assets/cuisine-map';
  import { useDisplay } from 'vuetify';

  const { mobile } = useDisplay()
  const appStore = useAppStore()
  const { randomRestaurant: restaurant } = storeToRefs(appStore)
  const kmDialog = ref(false)
  const radiusKm = ref(appStore.radiusKm)
  const radiusValid = ref(true)
  const submitRadius = () => {
    if (!radiusValid.value) return
    appStore.radiusKm = radiusKm.value
    kmDialog.value = false
  }
  watch(kmDialog, () => {
    radiusKm.value = appStore.radiusKm
  })
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

    var string = `${restaurant.value?.name} `
    if (!restaurantLocation.value || !restaurant.value?.longitude) ''
    else if (restaurantLocation.value){ string += ` ${ restaurantLocation.value.address.city || restaurantLocation.value.address.municipality || restaurantLocation.value.address.road }` }
    return `https://www.google.com/search?q=${string.replace(' ', '+')}`
  })

  const cuisineList = computed(() => {
    return Object.keys(cuisineMap).map((c) => {
      return {
        text: cuisineMap[c as CuisineType].name + ' ' + cuisineMap[c as CuisineType].emoji,
        value: c
      }
    })
  })
  const amenityList = computed(() => {
    return Object.keys(amenityMap).map((c) => {
      return {
        text: amenityMap[c as AmenityType],
        value: c
      }
    })
  })
</script>

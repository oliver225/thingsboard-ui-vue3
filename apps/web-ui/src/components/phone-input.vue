<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@vben/common-ui';

interface CountryOption {
  dial: string;
  iso: string;
  name: string;
}

interface Props {
  class?: any;
  disabled?: boolean;
  placeholder?: string;
}

const props = defineProps<Props>();

const phoneValue = defineModel<string | undefined>('value');

const defaultCountry: CountryOption = { dial: '+86', iso: 'CN', name: 'China' };

const countries: CountryOption[] = [
  { dial: '+86', iso: 'CN', name: 'China' },
  { dial: '+1', iso: 'US', name: 'United States' },
  { dial: '+1', iso: 'CA', name: 'Canada' },
  { dial: '+44', iso: 'GB', name: 'United Kingdom' },
  { dial: '+852', iso: 'HK', name: 'Hong Kong' },
  { dial: '+853', iso: 'MO', name: 'Macao' },
  { dial: '+886', iso: 'TW', name: 'Taiwan' },
  { dial: '+81', iso: 'JP', name: 'Japan' },
  { dial: '+82', iso: 'KR', name: 'Korea, Republic of' },
  { dial: '+65', iso: 'SG', name: 'Singapore' },
  { dial: '+60', iso: 'MY', name: 'Malaysia' },
  { dial: '+66', iso: 'TH', name: 'Thailand' },
  { dial: '+84', iso: 'VN', name: 'Vietnam' },
  { dial: '+63', iso: 'PH', name: 'Philippines' },
  { dial: '+62', iso: 'ID', name: 'Indonesia' },
  { dial: '+91', iso: 'IN', name: 'India' },
  { dial: '+61', iso: 'AU', name: 'Australia' },
  { dial: '+64', iso: 'NZ', name: 'New Zealand' },
  { dial: '+33', iso: 'FR', name: 'France' },
  { dial: '+49', iso: 'DE', name: 'Germany' },
  { dial: '+39', iso: 'IT', name: 'Italy' },
  { dial: '+34', iso: 'ES', name: 'Spain' },
  { dial: '+31', iso: 'NL', name: 'Netherlands' },
  { dial: '+41', iso: 'CH', name: 'Switzerland' },
  { dial: '+46', iso: 'SE', name: 'Sweden' },
  { dial: '+47', iso: 'NO', name: 'Norway' },
  { dial: '+45', iso: 'DK', name: 'Denmark' },
  { dial: '+358', iso: 'FI', name: 'Finland' },
  { dial: '+7', iso: 'RU', name: 'Russia' },
  { dial: '+90', iso: 'TR', name: 'Turkey' },
  { dial: '+971', iso: 'AE', name: 'United Arab Emirates' },
  { dial: '+966', iso: 'SA', name: 'Saudi Arabia' },
  { dial: '+972', iso: 'IL', name: 'Israel' },
  { dial: '+20', iso: 'EG', name: 'Egypt' },
  { dial: '+27', iso: 'ZA', name: 'South Africa' },
  { dial: '+55', iso: 'BR', name: 'Brazil' },
  { dial: '+52', iso: 'MX', name: 'Mexico' },
  { dial: '+57', iso: 'CO', name: 'Colombia' },
  { dial: '+54', iso: 'AR', name: 'Argentina' },
  { dial: '+56', iso: 'CL', name: 'Chile' },
  { dial: '+51', iso: 'PE', name: 'Peru' },
  { dial: '+599', iso: 'BQ', name: 'Bonaire, Sint Eustatius and Saba' },
  { dial: '+269', iso: 'KM', name: 'Comoros' },
  { dial: '+243', iso: 'CD', name: 'Congo, Democratic Republic of the' },
  { dial: '+242', iso: 'CG', name: 'Congo' },
  { dial: '+682', iso: 'CK', name: 'Cook Islands' },
].toSorted((a, b) => a.iso.localeCompare(b.iso));

const selectedIso = ref(defaultCountry.iso);
const inputFocused = ref(false);

const currentCountry = computed(
  () =>
    countries.find((country) => country.iso === selectedIso.value) ??
    defaultCountry,
);

const countryValue = computed({
  get() {
    return selectedIso.value;
  },
  set(iso: string) {
    const previousDial = currentCountry.value.dial;
    const nextCountry = countries.find((country) => country.iso === iso);
    if (!nextCountry) {
      return;
    }

    selectedIso.value = nextCountry.iso;
    phoneValue.value = replaceDialCode(
      phoneValue.value ?? '',
      previousDial,
      nextCountry.dial,
    );
  },
});

watch(
  phoneValue,
  (value) => {
    const country = detectCountry(value ?? '');
    if (country) {
      selectedIso.value = country.iso;
    }
  },
  { immediate: true },
);

function detectCountry(value: string) {
  if (!value.startsWith('+')) {
    return;
  }

  return [...countries]
    .toSorted((a, b) => b.dial.length - a.dial.length)
    .find((country) => value.startsWith(country.dial));
}

function replaceDialCode(
  value: string,
  previousDial: string,
  nextDial: string,
) {
  if (!value) {
    return nextDial;
  }
  if (value === previousDial || value.startsWith(previousDial)) {
    return value.replace(previousDial, nextDial);
  }
  if (/^\+\d+/.test(value)) {
    return value.replace(/^\+\d+/, nextDial);
  }
  return `${nextDial}${value}`;
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  phoneValue.value = target.value || undefined;
}
</script>

<template>
  <div :class="props.class" class="flex w-full items-center gap-2">
    <Select v-model="countryValue" :disabled="disabled">
      <SelectTrigger
        class="phone-country-trigger h-10 w-24 shrink-0 bg-background"
      >
        <span>{{ currentCountry.iso }}</span>
      </SelectTrigger>
      <SelectContent class="w-80">
        <template v-for="country in countries" :key="country.iso">
          <SelectItem :value="country.iso">
            {{ country.iso }} {{ country.name }} {{ country.dial }}
          </SelectItem>
        </template>
      </SelectContent>
    </Select>

    <input
      :disabled="disabled"
      :placeholder="placeholder"
      :value="phoneValue ?? ''"
      class="phone-control border-input bg-background ring-offset-background placeholder:text-muted-foreground/50 flex h-10 min-w-0 flex-1 rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      :class="{ 'is-focused': inputFocused }"
      inputmode="tel"
      type="tel"
      @blur="inputFocused = false"
      @focus="inputFocused = true"
      @input="handleInput"
    />
  </div>
</template>

<style scoped>
:deep(.phone-country-trigger) {
  --ring: var(--primary);
}

:deep(.phone-country-trigger:focus-visible) {
  box-shadow: inset 0 0 0 1px hsl(var(--ring));
}

.phone-control {
  --ring: var(--primary);
}

.phone-control.is-focused {
  outline: none;
  box-shadow: inset 0 0 0 1px hsl(var(--ring));
}
</style>

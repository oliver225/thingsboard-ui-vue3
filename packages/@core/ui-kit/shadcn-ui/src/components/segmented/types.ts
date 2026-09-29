import type { Component } from 'vue';

interface SegmentedItem {
  icon?: Component | string;
  label: string;
  value: string;
}

export type { SegmentedItem };

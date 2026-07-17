import * as React from 'react';
export interface GenotypeChipProps {
  genotype?: React.ReactNode;
  effect?: 'protective' | 'neutral' | 'risk' | 'highRisk';
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}
/** Compact allele-pair (genotype) chip tinted by effect. */
export function GenotypeChip(props: GenotypeChipProps): JSX.Element;

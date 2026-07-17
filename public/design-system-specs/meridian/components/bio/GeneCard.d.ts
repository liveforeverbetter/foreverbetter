import * as React from 'react';
export interface GeneCardProps {
  trait?: React.ReactNode;
  gene?: React.ReactNode;
  genotype?: React.ReactNode;
  effect?: 'protective' | 'neutral' | 'risk' | 'highRisk';
  summary?: React.ReactNode;
  level?: string;
  riskCaption?: React.ReactNode;
  tag?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** Genetic trait / variant result with gene, genotype and risk meter.
 * @startingPoint section="Bio" subtitle="Genetic trait card" viewport="700x300" */
export function GeneCard(props: GeneCardProps): JSX.Element;

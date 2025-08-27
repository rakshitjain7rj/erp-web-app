declare module '../components/dashboard' {
  import { FC } from 'react';
  export interface TotalASUUnit1YarnSummaryProps { days?: number; showRefreshButton?: boolean; }
  const TotalASUUnit1YarnSummary: FC<TotalASUUnit1YarnSummaryProps>;
  export default TotalASUUnit1YarnSummary;
}
import ReportsClient from '@/components/reports/ReportsClient';
import { getQuarterlySummaries } from '@/actions/reports';

export default async function ReportsPage() {
  const summaries = await getQuarterlySummaries();
  return <ReportsClient summaries={summaries} />;
}

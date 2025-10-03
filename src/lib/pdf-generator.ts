import { jsPDF } from 'jspdf';
import { formatPakistaniCurrency } from './utils';

export async function generateQuarterlyReportPDF(quarterId: string) {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text(`Quarterly Report - ${quarterId}`, 105, 20, { align: 'center' });

  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, {
    align: 'center',
  });

  // Add company info
  doc.setFontSize(12);
  doc.text('Synctom', 14, 40);
  doc.setFontSize(10);
  doc.text('Quarterly Financial Report', 14, 46);

  // Add financial summary
  doc.setFontSize(14);
  doc.text('Financial Summary', 14, 60);

  // Add financial metrics (these would be populated with actual data)
  const metrics = [
    { label: 'Total Revenue', value: 0 },
    { label: 'Total Expenses', value: 0 },
    { label: 'Net Profit', value: 0 },
    { label: 'Cash on Hand', value: 0 },
  ];

  metrics.forEach((metric, index) => {
    const y = 75 + index * 10;
    doc.setFontSize(10);
    doc.text(metric.label, 20, y);
    doc.text(
      metric.value === 0 ? 'PKR 0' : formatPakistaniCurrency(metric.value),
      100,
      y
    );
  });

  // Add page number
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
  }

  return doc.output('arraybuffer');
}

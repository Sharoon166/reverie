'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download, CreditCard, Edit, Trash2 } from 'lucide-react';
import { Employee } from '@/types/employee';
import { toast } from 'sonner';
import { deleteEmployee, updateEmployee } from '@/actions';
import jsPDF from 'jspdf';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { EmployeeForm, EmployeeFormValues } from '@/components/forms';

export default function EmployeeActions({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  async function handleDownloadPDF() {
    try {
      setIsLoading(true);
      toast.loading(`Generating PDF for ${employee.name}...`, {
        id: 'employee-pdf-download',
      });

      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Set default font
      doc.setFont('helvetica');

      // Modern minimalist header with subtle line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, 40, pageWidth - margin, 40);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(24);
      doc.setFont('helvatica', 'bold');
      doc.text('REVERIE', margin, 30);

      doc.setFontSize(12);
      doc.setFont('helvatica', 'normal');
      doc.text('Employee Profile', pageWidth - margin, 30, { align: 'right' });

      // Employee name with subtle underline
      doc.setFontSize(20);
      doc.setFont('helvatica', 'bold');
      doc.text(employee.name, margin, 60);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(margin, 63, margin + doc.getTextWidth(employee.name), 63);

      // Generation date and status badge
      doc.setFontSize(10);
      doc.setFont('helvatica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Generated on ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}`,
        margin,
        75
      );

      // Status badge with modern rounded design
      const statusText =
        employee.status.charAt(0).toUpperCase() + employee.status.slice(1);
      const statusWidth = doc.getTextWidth(statusText) + 10;

      const statusColor =
        employee.status === 'active'
          ? [34, 197, 94] // subtle green
          : [107, 114, 128]; // subtle gray

      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(
        pageWidth - margin - statusWidth,
        70,
        statusWidth,
        8,
        4,
        4,
        'F'
      );

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvatica', 'bold');
      doc.text(statusText, pageWidth - margin - statusWidth / 2, 75.5, {
        align: 'center',
      });

      doc.setTextColor(15, 23, 42); // Reset to dark text

      // Section dividers function
      const addSection = (title: string, y: number, contentHeight: number) => {
        // Section title with small accent line
        doc.setFontSize(14);
        doc.setFont('helvatica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(title, margin, y);

        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(1.5);
        doc.line(margin, y + 2, margin + 40, y + 2);

        // Light background for section
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, y + 5, contentWidth, contentHeight, 3, 3, 'F');

        return y + 10;
      };

      // Personal Information Section
      let yPos = addSection('Personal Information', 90, 80);

      doc.setFontSize(10);
      doc.setFont('helvatica', 'bold');
      doc.setTextColor(71, 85, 105);

      // Left column
      doc.text('Employee ID:', margin + 5, yPos + 10);
      doc.text('Full Name:', margin + 5, yPos + 20);
      doc.text('Email:', margin + 5, yPos + 30);
      doc.text('Phone:', margin + 5, yPos + 40);
      doc.text('Address:', margin + 5, yPos + 50);

      doc.setFont('helvatica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(employee.employeeId || 'N/A', margin + 35, yPos + 10);
      doc.text(employee.name, margin + 35, yPos + 20);
      doc.text(employee.email, margin + 35, yPos + 30);
      doc.text(employee.phone || 'N/A', margin + 35, yPos + 40);

      const splitAddress = doc.splitTextToSize(employee.address || 'N/A', 80);
      doc.text(splitAddress, margin + 35, yPos + 50);

      // Right column
      doc.setFont('helvatica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Position:', margin + 100, yPos + 10);
      doc.text('Department:', margin + 100, yPos + 20);
      doc.text('Join Date:', margin + 100, yPos + 30);
      doc.text('ID Card:', margin + 100, yPos + 40);

      doc.setFont('helvatica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(employee.position || 'N/A', margin + 140, yPos + 10);
      doc.text(employee.department || 'N/A', margin + 140, yPos + 20);
      doc.text(
        employee.joinDate
          ? new Date(employee.joinDate).toLocaleDateString()
          : 'N/A',
        margin + 140,
        yPos + 30
      );
      doc.text(employee.cnic || 'N/A', margin + 140, yPos + 40);

      // Emergency Contact Section
      yPos = addSection('Emergency Contact', yPos + 70, 35);

      doc.setFontSize(10);
      doc.setFont('helvatica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Contact Person:', margin + 5, yPos + 10);
      doc.text('Phone Number:', margin + 5, yPos + 20);

      doc.setFont('helvatica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(employee.emergencyContact || 'N/A', margin + 45, yPos + 10);
      doc.text(employee.emergencyPhone || 'N/A', margin + 45, yPos + 20);

      // Salary Information Section
      yPos = addSection('Compensation', yPos + 35, 20);

      doc.setFontSize(11);
      doc.setFont('helvatica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Salary:', margin + 5, yPos + 10);

      doc.setFont('helvatica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(
        `Rs${employee.salary ? employee.salary.toLocaleString() : 'N/A'}`,
        margin + 25,
        yPos + 10
      );

      // Notes Section (if exists)
      if (employee.notes) {
        yPos = addSection('Additional Notes', yPos + 30, 30);

        doc.setFontSize(10);
        doc.setFont('helvatica', 'normal');
        doc.setTextColor(15, 23, 42);

        const splitNotes = doc.splitTextToSize(
          employee.notes,
          contentWidth - 10
        );
        doc.text(splitNotes, margin + 5, yPos + 10);
      }

      // Modern footer with subtle line
      const footerY = pageHeight - 15;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Confidential - Reverie HR System', margin, footerY);
      doc.text(
        `Employee ID: ${employee.employeeId || 'N/A'}`,
        pageWidth - margin,
        footerY,
        {
          align: 'right',
        }
      );

      // Generate filename and save
      const fileName = `employee-${employee.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success(
        `Employee report for ${employee.name} downloaded successfully`,
        { id: 'employee-pdf-download' }
      );
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate employee PDF. Please try again.', {
        id: 'employee-pdf-download',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExportCard() {
    try {
      setIsLoading(true);
      toast.loading(`Generating ID card for ${employee.name}...`, {
        id: 'card-download',
      });

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Modern gradient background
      doc.setFillColor(15, 23, 42); // Dark slate background
      doc.rect(15, 25, pageWidth - 30, 130, 'F');

      // Accent gradient strip
      doc.setFillColor(59, 130, 246); // Blue
      doc.rect(15, 25, pageWidth - 30, 8, 'F');
      doc.setFillColor(147, 51, 234); // Purple gradient effect
      doc.rect(15, 25, (pageWidth - 30) * 0.7, 8, 'F');
      doc.setFillColor(236, 72, 153); // Pink gradient effect
      doc.rect(15, 25, (pageWidth - 30) * 0.4, 8, 'F');

      // Company logo area with modern styling
      doc.setFillColor(30, 41, 59); // Darker section
      doc.roundedRect(25, 40, 50, 25, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('REVERIE', 27, 50);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('TECH SOLUTIONS', 27, 58);

      // Modern photo frame
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(25, 75, 45, 55, 5, 5, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(2);
      doc.roundedRect(25, 75, 45, 55, 5, 5);

      // Photo placeholder with modern styling
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(28, 78, 39, 49, 3, 3, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text('EMPLOYEE', 35, 100);
      doc.text('PHOTO', 40, 108);

      // Employee details with modern typography
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(employee.name.toUpperCase(), 85, 50);

      // Position with accent color
      doc.setTextColor(147, 197, 253); // Light blue
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(employee.position, 85, 62);

      // Department badge
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(85, 68, 40, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(employee.department, 87, 76);

      // ID and details with modern spacing
      doc.setTextColor(203, 213, 225); // Light gray
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`ID: ${employee.employeeId}`, 85, 90);
      doc.text(`Since: ${new Date(employee.joinDate).getFullYear()}`, 85, 100);
      doc.text(`Card: ${employee.cnic}`, 85, 110);

      // Status indicator
      const statusColor =
        employee.status === 'active'
          ? [34, 197, 94]
          : employee.status === 'on-leave'
            ? [251, 191, 36]
            : [156, 163, 175];
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.circle(165, 95, 3, 'F');
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setFontSize(8);
      doc.text(employee.status.toUpperCase(), 140, 98);

      // Modern QR code placeholder
      doc.setFillColor(255, 255, 255);
      doc.rect(140, 105, 25, 25, 'F');
      doc.setFillColor(0, 0, 0);
      // Simple QR-like pattern
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          if ((i + j) % 2 === 0) {
            doc.rect(142 + i * 4, 107 + j * 4, 3, 3, 'F');
          }
        }
      }

      // Back of card - Modern contact info
      doc.setFillColor(248, 250, 252); // Light background
      doc.roundedRect(15, 170, pageWidth - 30, 90, 5, 5, 'F');

      // Header with gradient
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(15, 170, pageWidth - 30, 20, 5, 5, 'F');
      doc.setFillColor(147, 51, 234);
      doc.roundedRect(15, 170, (pageWidth - 30) * 0.6, 20, 5, 5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTACT INFORMATION', 25, 182);

      // Contact details with modern layout
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');

      // Email section
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(25, 195, 70, 12, 2, 2, 'F');
      doc.text('EMAIL', 27, 202);
      doc.setFont('helvetica', 'normal');
      doc.text(employee.email, 27, 209);

      // Phone section
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(105, 195, 70, 12, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('PHONE', 107, 202);
      doc.setFont('helvetica', 'normal');
      doc.text(employee.phone, 107, 209);

      // Emergency contact
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(25, 215, 150, 15, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('EMERGENCY CONTACT', 27, 222);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${employee.emergencyContact} - ${employee.emergencyPhone}`,
        27,
        229
      );

      // Security info
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text(`Card ID: ${employee.cnic}`, 25, 245);
      doc.text('This card remains property of Reverie Tech Solutions', 25, 252);
      doc.text('If found, please return to HR Department', 120, 252);

      const fileName = `id-card-${employee.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      doc.save(fileName);

      toast.success(`ID card for ${employee.name} downloaded successfully`, {
        id: 'card-download',
      });
    } catch (error) {
      console.error('Card generation error:', error);
      toast.error('Failed to generate ID card. Please try again.', {
        id: 'card-download',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(data: EmployeeFormValues) {
    try {
      setIsLoading(true);

      if (!employee?.$id || typeof employee?.$id !== 'string') return;
      await updateEmployee(employee?.$id, data);

      setShowEditDialog(false);
      toast.success('Employee updated successfully');
      router.refresh(); // Refresh the page to get updated data
    } catch {
      toast.error('Failed to update employee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    try {
      setIsLoading(true);

      if (!employee?.$id || typeof employee?.$id !== 'string') return;
      await deleteEmployee(employee?.$id);
      toast.success('Employee deleted successfully');
      router.push('/employees');
    } catch {
      toast.error('Failed to delete employee. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={handleExportCard}
          disabled={isLoading}
          className="border-gray-300 hover:bg-yellow-50"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Export Card
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadPDF}
          disabled={isLoading}
          className="border-gray-300 hover:bg-yellow-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Button
          onClick={() => setShowEditDialog(true)}
          disabled={isLoading}
          className="bg-gray-800 hover:bg-gray-900 text-white"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={isLoading}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update the employee information below.
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm
            mode="edit"
            onSubmit={handleSave}
            initialData={employee}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

'use server';

import { APPWRITE_DB, db, ID } from '@/lib/appwrite';
import type { EmployeeFormValues } from '@/components/forms';
import type {
  AttendanceRecord,
  BonusRecord,
  Employee,
  SalaryPayment,
} from '@/types';
import { Query } from 'appwrite';
import { revalidatePath } from 'next/cache';
import { deleteFile, uploadFile } from '@/services/storage';

type ModifiedEmployee = Employee & {
  $createdAt: string;
  $updatedAt: string;
  $databaseId: string;
  $tableId: string;
  $id: string;
};

export async function getAllEmployees() {
  try {
    // Step 1: Fetch employees
    const employeesRes = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.employees,
      queries: [Query.limit(25)],
    });

    const employees = employeesRes.rows as unknown as ModifiedEmployee[];

    // Step 2: Fetch salary payments for each employee
    const employeesWithPayments = await Promise.all(
      employees.map(async (emp) => {
        try {
          const salaryRes = await db.listRows({
            databaseId: APPWRITE_DB.databaseId,
            tableId: APPWRITE_DB.tables.salary_payments,
            queries: [Query.equal('employee', emp.$id)],
          });

          const salaryPayments = salaryRes.rows as unknown as SalaryPayment[];

          return {
            ...emp,
            salaryPayments,
          };
        } catch (err) {
          console.warn(`Failed to fetch salary payments for ${emp.$id}`, err);
          return {
            ...emp,
            salaryPayments: [],
          };
        }
      })
    );

    return employeesWithPayments;
  } catch (error) {
    console.error('Error in getAllEmployees:', error);
    throw error;
  }
}

export async function getEmployeeFullProfile(cnic: string) {
  try {
    if (!cnic) {
      throw new Error('CNIC is required to fetch employee profile.');
    }

    // Step 1: Fetch Employee
    const employeeRes = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.employees,
      queries: [Query.equal('cnic', cnic)],
    });

    const employee = employeeRes.rows.at(0) as unknown as ModifiedEmployee;
    if (!employee) {
      throw new Error(`No employee found with CNIC: ${cnic}`);
    }

    // Step 2: Fetch Attendance
    let attendanceRecords: AttendanceRecord[] = [];
    try {
      const attendanceRes = await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.attendance,
        queries: [Query.equal('employee', employee.$id)],
      });
      attendanceRecords = attendanceRes.rows as unknown as AttendanceRecord[];
    } catch (err) {
      console.warn(
        `Failed to fetch attendance for employee ${employee.$id}`,
        err
      );
    }

    // Step 3: Fetch Salary Payments
    let salaryPayments: SalaryPayment[] = [];
    try {
      const salaryRes = await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.salary_payments,
        queries: [Query.equal('employee', employee.$id)],
      });
      salaryPayments = salaryRes.rows as unknown as SalaryPayment[];

      // Step 3.1: Populate bonuses
      const bonusIds = salaryPayments
        .map((sp) => (typeof sp.bonus === 'string' ? sp.bonus : sp.bonus?.id))
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

      if (bonusIds.length > 0) {
        const bonusRes = await db.listRows({
          databaseId: APPWRITE_DB.databaseId,
          tableId: APPWRITE_DB.tables.bonus,
          queries: [Query.equal('$id', bonusIds)],
        });

        const bonusMap = new Map(
          bonusRes.rows.map((b) => [b.$id, b as unknown as BonusRecord])
        );

        salaryPayments = salaryPayments.map((sp) => {
          const bonusKey =
            typeof sp.bonus === 'string' ? sp.bonus : sp.bonus?.id;
          return {
            ...sp,
            bonus: bonusKey ? (bonusMap.get(bonusKey) ?? null) : null,
          } as SalaryPayment;
        });
      }
    } catch (err) {
      console.warn(
        `Failed to fetch salary payments for employee ${employee.$id}`,
        err
      );
    }

    // Final aggregated response
    return {
      ...employee,
      attendanceRecords,
      salaryPayments,
    };
  } catch (error) {
    console.error('Error in getEmployeeFullProfile:', error);
    throw error;
  }
}

export async function createEmployee(employee: EmployeeFormValues) {
  const { avatar, ...employeeData } = employee;
  let profileImage = '';
  if (avatar) {
    const uploaded = await uploadFile(APPWRITE_DB.buckets.reverie, avatar);
    profileImage = uploaded.$id || '';
  }

  const emp = await db.createRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.employees,
    data: { ...employeeData, profileImage },
    rowId: ID.unique(),
  });
  console.log(emp);
  revalidatePath('/employees');
}

export async function updateEmployee(
  id: string,
  employee: Partial<EmployeeFormValues>
) {
  try {
    const emp = await db.getRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.employees,
      rowId: id,
    });

    if (!emp) {
      throw new Error('Employee not found');
    }

    const { avatar, ...employeeData } = employee;
    let profileImage = emp.profileImage;
    if (avatar) {
      if (emp.profileImage) {
        try {
          await deleteFile(APPWRITE_DB.buckets.reverie, emp.profileImage);
        } catch (error) {
          console.warn('Failed to delete old profile image:', error);
        }
      }

      // Upload new image
      const uploaded = await uploadFile(APPWRITE_DB.buckets.reverie, avatar);
      profileImage = uploaded.$id;
    }

    // Update employee data including the profile image
    await db.updateRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.employees,
      rowId: id,
      data: { ...employeeData, profileImage },
    });

    revalidatePath('/employees');
    revalidatePath(`/employees/${id}`);
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
}

export async function deleteEmployee(id: string) {
  try {
    if (!id) throw Error('ID is required to delete an employee.');
    await db.deleteRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.employees,
      rowId: id,
    });
    revalidatePath('/employees');
    revalidatePath(`/employees/${id}`);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updateSalaryPayment(
  paymentId: string,
  data: {
    amount?: number;
    bonus?: { amount: number } | null;
    paidDate?: string;
  }
) {
  try {
    // Get the existing payment
    const existingPayment = await db.getRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.salary_payments,
      rowId: paymentId,
    });

    if (!existingPayment) {
      throw new Error('Payment not found');
    }

    let netAmount = data.amount ?? existingPayment.amount;
    let bonusRecord: BonusRecord | null = null;
    let bonusId = existingPayment.bonus;

    // Handle bonus update
    if (data.bonus !== undefined) {
      if (data.bonus) {
        // Update or create bonus
        if (bonusId) {
          bonusRecord = (await db.updateRow({
            databaseId: APPWRITE_DB.databaseId,
            tableId: APPWRITE_DB.tables.bonus,
            rowId: bonusId,
            data: {
              amount: data.bonus.amount,
              updatedAt: new Date().toISOString(),
            },
          })) as unknown as BonusRecord;
        } else {
          bonusRecord = (await db.createRow({
            databaseId: APPWRITE_DB.databaseId,
            tableId: APPWRITE_DB.tables.bonus,
            rowId: ID.unique(),
            data: {
              amount: data.bonus.amount,
              reason: 'Performance bonus',
              date: new Date().toISOString(),
              salaryPayment: paymentId,
            },
          })) as unknown as BonusRecord;
          bonusId = bonusRecord.$id;
        }
        netAmount += data.bonus.amount;
      } else if (bonusId) {
        // Remove bonus if it exists but no bonus is provided
        await db.deleteRow({
          databaseId: APPWRITE_DB.databaseId,
          tableId: APPWRITE_DB.tables.bonus,
          rowId: bonusId,
        });
        bonusId = null;
        // Recalculate net amount without bonus
        netAmount =
          data.amount ??
          existingPayment.amount - (existingPayment.bonus?.amount || 0);
      }
    }

    // Update the salary payment
    const updatedPayment = await db.updateRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.salary_payments,
      rowId: paymentId,
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.paidDate && { paidDate: data.paidDate }),
        bonus: bonusId,
        netAmount,
        updatedAt: new Date().toISOString(),
      },
    });

    revalidatePath('/employees');
    return { ...updatedPayment, bonus: bonusRecord };
  } catch (error) {
    console.error('Error updating salary payment:', error);
    throw error;
  }
}

export async function deleteSalaryPayment(paymentId: string) {
  try {
    // First, delete any associated bonus
    const payment = await db.getRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.salary_payments,
      rowId: paymentId,
    });

    if (payment?.bonus) {
      try {
        await db.deleteRow({
          databaseId: APPWRITE_DB.databaseId,
          tableId: APPWRITE_DB.tables.bonus,
          rowId: payment.bonus,
        });
      } catch (error) {
        console.warn('Error deleting associated bonus:', error);
        // Continue with payment deletion even if bonus deletion fails
      }
    }

    // Then delete the payment
    await db.deleteRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.salary_payments,
      rowId: paymentId,
    });

    revalidatePath('/employees');
    return true;
  } catch (error) {
    console.error('Error deleting salary payment:', error);
    throw error;
  }
}

export async function markSalaryPaid(
  employeeId: string,
  { month, bonusAmount }: { month: string; bonusAmount?: number }
) {
  try {
    // 1. Check if salary payment already exists for this month
    const existing = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.salary_payments,
      queries: [
        Query.equal('employee', employeeId),
        Query.equal('month', month),
      ],
    });

    let salaryPayment;
    let existingBonusId: string | null = null;

    if (existing.rows.length > 0) {
      // Update existing salary payment
      salaryPayment = existing.rows[0];

      // Check if there's an existing bonus linked to this salary payment
      if (salaryPayment.bonus) {
        existingBonusId = salaryPayment.bonus;
      }
    } else {
      // Create new salary payment
      salaryPayment = await db.createRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.salary_payments,
        rowId: ID.unique(),
        data: {
          employee: employeeId,
          month,
          amount: 0, // will calculate below
          paidDate: new Date().toISOString(),
          bonus: null,
          netAmount: 0,
        },
      });
    }

    // 2. Calculate net amount (salary + bonus - deductions)
    let netAmount = 0;
    let bonusRecord: BonusRecord | null = null;

    // fetch employee base salary
    const employee = await db.getRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.employees,
      rowId: employeeId,
    });

    netAmount = employee.salary;

    // Handle bonus logic
    if (bonusAmount && bonusAmount > 0) {
      if (existingBonusId) {
        // Update existing bonus
        const bonus = await db.updateRow({
          databaseId: APPWRITE_DB.databaseId,
          tableId: APPWRITE_DB.tables.bonus,
          rowId: existingBonusId,
          data: {
            amount: bonusAmount,
            reason: 'Monthly performance bonus (updated)',
            date: new Date().toISOString(),
          },
        });
        bonusRecord = bonus as unknown as BonusRecord;
      } else {
        // Create new bonus
        const bonus = await db.createRow({
          databaseId: APPWRITE_DB.databaseId,
          tableId: APPWRITE_DB.tables.bonus,
          rowId: ID.unique(),
          data: {
            amount: bonusAmount,
            reason: 'Monthly performance bonus',
            date: new Date().toISOString(),
            salaryPayment: salaryPayment.$id,
          },
        });
        bonusRecord = bonus as unknown as BonusRecord;
      }
      netAmount += bonusAmount;
    } else if (existingBonusId) {
      // Remove bonus if it existed but no bonusAmount is provided now
      await db.deleteRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.bonus,
        rowId: existingBonusId,
      });
      existingBonusId = null;
    }

    // 3. Update salary payment with final values
    const updatedSalaryPayment = await db.updateRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.salary_payments,
      rowId: salaryPayment.$id,
      data: {
        amount: employee.salary,
        netAmount,
        bonus: bonusRecord ? bonusRecord.id : null,
        paidDate: new Date().toISOString(),
      },
    });

    revalidatePath('/employees');
    return { ...updatedSalaryPayment, netAmount, bonus: bonusRecord };
  } catch (error) {
    console.error('Error marking salary as paid:', error);
    throw error;
  }
}

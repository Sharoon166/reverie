'use client';

import { useId, useMemo, useRef, useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleXIcon,
  Columns3Icon,
  EllipsisIcon,
  FilterIcon,
  ListFilterIcon,
  TrashIcon,
  Edit,
  FileText,
  Clock,
  CreditCard,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';

import { cn, formatPakistaniPhoneNumber } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Employee, EmployeeStatus } from '@/types/employee';
import { Department } from '@/lib/constants';
import { getImageUrl } from '@/lib/file-utils';
import { deleteEmployee } from '@/actions';
import { format } from 'date-fns';

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<Employee> = (
  row,
  columnId,
  filterValue
) => {
  const searchableRowContent =
    `${row.original.name} ${row.original.email} ${row.original.employeeId} ${row.original.position} ${row.original.department}`.toLowerCase();
  const searchTerm = (filterValue ?? '').toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

const statusFilterFn: FilterFn<Employee> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId) as string;
  return filterValue.includes(status);
};

const departmentFilterFn: FilterFn<Employee> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true;
  const department = row.getValue(columnId) as string;
  return filterValue.includes(department);
};

function getDepartmentColor(department: Department) {
  switch (department) {
    case 'Development':
      return 'bg-yellow-400 text-gray-900';
    case 'Design':
      return 'bg-gray-800 text-white';
    case 'Marketing':
      return 'bg-yellow-500 text-gray-900';
    case 'Sales':
      return 'bg-gray-700 text-white';
    case 'HR':
      return 'bg-yellow-400 text-gray-900';
    case 'Finance':
      return 'bg-gray-800 text-white';
    case 'Operations':
      return 'bg-yellow-500 text-gray-900';
    default:
      return 'bg-gray-600 text-white';
  }
}

function getStatusColor(status: EmployeeStatus) {
  switch (status) {
    case 'active':
      return 'bg-green-500 ';
    case 'inactive':
      return 'bg-gray-400 text-white';
    case 'on-leave':
      return 'bg-orange-500 text-gray-900';
    case 'terminated':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
}

interface EmployeeTableProps {
  data: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  onAddNotes: (employee: Employee) => void;
  onMarkAttendance: (employee: Employee) => void;
  onPaySalary: (employee: Employee) => void;
  onRowClick: (employeeId: string) => void;
  isLoading?: boolean;
}

export default function EmployeeTable({
  data,
  onEdit,
  onDelete,
  onAddNotes,
  onMarkAttendance,
  onPaySalary,
  onRowClick,
}: EmployeeTableProps) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'name',
      desc: false,
    },
  ]);

  const columns: ColumnDef<Employee>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 28,
        enableSorting: false,
        enableHiding: false,
      },
      {
        header: 'Employee',
        accessorKey: 'name',
        cell: ({ row }) => {
          const today = new Date().toISOString().split('T')[0];
          const hasAttendanceToday = (
            row.original.attendanceRecords ?? []
          ).some((record) => record.date === today);
          return (
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full  bg-yellow-50 flex items-center justify-center border border-yellow-200">
                {row.original.profileImage ? (
                  <Image
                    src={getImageUrl(row.original.profileImage)}
                    alt={row.original.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-gray-800 font-medium text-sm">
                    {row.original.name.charAt(0)}
                  </span>
                )}
                {!hasAttendanceToday && (
                  <span
                    title="Attendance not marked today"
                    className="absolute -top-0.5 -right-0.5 block w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white z-40"
                  />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {row.original.name}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {row.original.employeeId}
                </div>
              </div>
            </div>
          );
        },
        size: 200,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
      },
      {
        header: 'Contact',
        accessorKey: 'email',
        cell: ({ row }) => (
          <div>
            <div className="text-sm text-gray-900">{row.original.email}</div>
            <div className="text-sm text-gray-500">
              {formatPakistaniPhoneNumber(row.original.phone)}
            </div>
          </div>
        ),
        size: 300,
      },
      {
        header: 'Position',
        accessorKey: 'position',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-gray-900">
              {row.original.position}
            </div>
            <div className="text-sm text-gray-500">{row.original.level}</div>
          </div>
        ),
        size: 180,
      },
      {
        header: 'Department',
        accessorKey: 'department',
        cell: ({ row }) => (
          <Badge className={getDepartmentColor(row.original.department)}>
            {row.original.department}
          </Badge>
        ),
        size: 120,
        filterFn: departmentFilterFn,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <Badge className={getStatusColor(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
        size: 100,
        filterFn: statusFilterFn,
      },
      {
        header: 'Salary Status',
        id: 'salary_status',
        cell: ({ row }) => {
          const currentMonth = format(new Date(), 'yyyy-MM');

          const isPaid = (row.original.salaryPayments ?? []).some((p) => {
            const paymentMonth = format(new Date(p.month), 'yyyy-MM');
            return paymentMonth === currentMonth;
          });
          return (
            <Badge
              className={
                isPaid ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }
            >
              {isPaid ? 'PAID' : 'UNPAID'}
            </Badge>
          );
        },
        size: 140,
      },
      {
        header: 'Salary',
        accessorKey: 'salary',
        cell: ({ row }) => {
          const amount = row.original.salary;
          const formatted = new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
          }).format(amount);
          return <div className="font-medium">{formatted}</div>;
        },
        size: 120,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <RowActions
            row={row}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddNotes={onAddNotes}
            onMarkAttendance={onMarkAttendance}
            onPaySalary={onPaySalary}
          />
        ),
        size: 60,
        enableHiding: false,
      },
    ],
    [onEdit, onDelete, onAddNotes, onMarkAttendance, onPaySalary]
  );

  const handleDeleteRows = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original.$id);

    for await (const id of selectedRows) {
      if (id) deleteEmployee(id);
    }
    table.resetRowSelection();
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
  });

  // Get unique status values
  const uniqueStatusValues = useMemo(() => {
    const statusColumn = table.getColumn('status');
    if (!statusColumn) return [];
    const values = Array.from(statusColumn.getFacetedUniqueValues().keys());
    return values.sort();
  }, [table]);

  // Get unique department values
  const uniqueDepartmentValues = useMemo(() => {
    const departmentColumn = table.getColumn('department');
    if (!departmentColumn) return [];
    const values = Array.from(departmentColumn.getFacetedUniqueValues().keys());
    return values.sort();
  }, [table]);

  // Get counts for each status
  const statusCounts = useMemo(() => {
    const statusColumn = table.getColumn('status');
    if (!statusColumn) return new Map();
    return statusColumn.getFacetedUniqueValues();
  }, [table]);

  // Get counts for each department
  const departmentCounts = useMemo(() => {
    const departmentColumn = table.getColumn('department');
    if (!departmentColumn) return new Map();
    return departmentColumn.getFacetedUniqueValues();
  }, [table]);

  const selectedStatuses = useMemo(() => {
    const filterValue = table.getColumn('status')?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table]);

  const selectedDepartments = useMemo(() => {
    const filterValue = table
      .getColumn('department')
      ?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table]);

  const handleStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn('status')?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table
      .getColumn('status')
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  const handleDepartmentChange = (checked: boolean, value: string) => {
    const filterValue = table
      .getColumn('department')
      ?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table
      .getColumn('department')
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Filter by name, email, ID, etc. */}
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                'peer min-w-60 ps-9 bg-white',
                Boolean(table.getColumn('name')?.getFilterValue()) && 'pe-9'
              )}
              value={
                (table.getColumn('name')?.getFilterValue() ?? '') as string
              }
              onChange={(e) =>
                table.getColumn('name')?.setFilterValue(e.target.value)
              }
              placeholder="Search employees..."
              type="text"
              aria-label="Search employees"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <ListFilterIcon size={16} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn('name')?.getFilterValue()) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn('name')?.setFilterValue('');
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <CircleXIcon size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Filter by status */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <FilterIcon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Status
                {selectedStatuses.length > 0 && (
                  <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                    {selectedStatuses.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-muted-foreground text-xs font-medium">
                  Filter by Status
                </div>
                <div className="space-y-3">
                  {uniqueStatusValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-status-${i}`}
                        checked={selectedStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) =>
                          handleStatusChange(checked, value)
                        }
                      />
                      <Label
                        htmlFor={`${id}-status-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        {value}{' '}
                        <span className="text-muted-foreground ms-2 text-xs">
                          {statusCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Filter by department */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <FilterIcon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Department
                {selectedDepartments.length > 0 && (
                  <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                    {selectedDepartments.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-muted-foreground text-xs font-medium">
                  Filter by Department
                </div>
                <div className="space-y-3">
                  {uniqueDepartmentValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-dept-${i}`}
                        checked={selectedDepartments.includes(value)}
                        onCheckedChange={(checked: boolean) =>
                          handleDepartmentChange(checked, value)
                        }
                      />
                      <Label
                        htmlFor={`${id}-dept-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        {value}{' '}
                        <span className="text-muted-foreground ms-2 text-xs">
                          {departmentCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3Icon
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuItem
                      key={column.id}
                      className="capitalize"
                      onClick={() =>
                        column.toggleVisibility(!column.getIsVisible())
                      }
                    >
                      <Checkbox
                        checked={column.getIsVisible()}
                        className="mr-2"
                      />
                      {column.id}
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          {/* Delete button */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="text-destructive hover:text-destructive/80"
                  variant="outline"
                >
                  <TrashIcon
                    className="opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  Delete
                  <span className="bg-background text-destructive/70 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                    {table.getSelectedRowModel().rows.length}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                    aria-hidden="true"
                  >
                    <CircleAlertIcon className="opacity-80" size={16} />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete{' '}
                      {table.getSelectedRowModel().rows.length} selected{' '}
                      {table.getSelectedRowModel().rows.length === 1
                        ? 'employee'
                        : 'employees'}
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/80"
                    onClick={handleDeleteRows}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-background overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="h-11"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() &&
                              'flex h-full cursor-pointer items-center justify-between gap-2 select-none'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (
                              header.column.getCanSort() &&
                              (e.key === 'Enter' || e.key === ' ')
                            ) {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: (
                              <ChevronUpIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                            desc: (
                              <ChevronDownIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onRowClick(row.original.cnic as string)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="last:py-0"
                      onClick={(e) => {
                        // Prevent row click when clicking on action buttons
                        if (
                          cell.column.id === 'actions' ||
                          cell.column.id === 'select'
                        ) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-8">
        {/* Results per page */}
        <div className="flex items-center gap-3">
          <Label htmlFor={id} className="max-sm:sr-only">
            Rows per page
          </Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger id={id} className="w-fit whitespace-nowrap">
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page number information */}
        <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
          <p
            className="text-muted-foreground text-sm whitespace-nowrap"
            aria-live="polite"
          >
            <span className="text-foreground">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
              -
              {Math.min(
                Math.max(
                  table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    table.getState().pagination.pageSize,
                  0
                ),
                table.getRowCount()
              )}
            </span>{' '}
            of{' '}
            <span className="text-foreground">
              {table.getRowCount().toString()}
            </span>
          </p>
        </div>

        {/* Pagination buttons */}
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirstIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLastIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}

function RowActions({
  row,
  onEdit,
  onDelete,
  onAddNotes,
  onMarkAttendance,
  onPaySalary,
}: {
  row: Row<Employee>;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  onAddNotes: (employee: Employee) => void;
  onMarkAttendance: (employee: Employee) => void;
  onPaySalary: (employee: Employee) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="ghost"
            className="shadow-none"
            aria-label="Employee actions"
          >
            <EllipsisIcon size={16} aria-hidden="true" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(row.original)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Employee
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddNotes(row.original)}>
          <FileText className="mr-2 h-4 w-4" />
          Add Notes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMarkAttendance(row.original)}>
          <Clock className="mr-2 h-4 w-4" />
          Mark Attendance
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPaySalary(row.original)}>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay Salary
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(row.original?.$id ?? row.original.id)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

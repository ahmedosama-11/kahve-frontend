import { Component, OnInit } from '@angular/core';
import { CustomerService } from '../../../services/customer.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-customer-management',
  templateUrl: './customer-management.component.html',
  styleUrls: ['./customer-management.component.css'],
})
export class CustomerManagementComponent implements OnInit {
  customers: any[] = [];
  selectedCustomer: any = null;
  selectedOrders: any[] = [];
  loading = false;
  detailsLoading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  statusFilter = 'all';

  constructor(private customerService: CustomerService, public languageService: LanguageService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  t(en: string, ar: string): string {
    return this.languageService.currentLanguage === 'ar' ? ar : en;
  }

  loadCustomers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        this.customers = response?.customers || response?.data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Customers load error:', error);
        this.errorMessage = this.t('Failed to load customers.', 'فشل تحميل العملاء.');
        this.loading = false;
      },
    });
  }

  get filteredCustomers(): any[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.customers.filter((customer) => {
      const values = [customer.name, customer.email, customer.phone, ...(customer.phones || [])].filter(Boolean);
      const matchesTerm = !term || values.some((value) => String(value).toLowerCase().includes(term));
      const matchesStatus = this.statusFilter === 'all' || customer.status === this.statusFilter;
      return matchesTerm && matchesStatus;
    });
  }

  get totals() {
    const customers = this.filteredCustomers;
    return {
      customers: customers.length,
      active: customers.filter((c) => c.status === 'active').length,
      orders: customers.reduce((sum, c) => sum + Number(c.orderCount || 0), 0),
      sales: customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0),
    };
  }

  openDetails(customer: any): void {
    this.selectedCustomer = customer;
    this.selectedOrders = [];
    this.detailsLoading = true;
    this.customerService.getCustomerDetails(customer._id).subscribe({
      next: (response) => {
        this.selectedCustomer = response?.customer || response?.data?.customer || customer;
        this.selectedOrders = response?.orders || response?.data?.orders || [];
        this.detailsLoading = false;
      },
      error: () => {
        this.errorMessage = this.t('Failed to load customer details.', 'فشل تحميل تفاصيل العميل.');
        this.detailsLoading = false;
      },
    });
  }

  closeDetails(): void {
    this.selectedCustomer = null;
    this.selectedOrders = [];
  }

  updateStatus(customer: any, status: 'active' | 'inactive' | 'blocked'): void {
    this.customerService.updateCustomerStatus(customer._id, status).subscribe({
      next: () => {
        customer.status = status;
        this.successMessage = this.t('Customer status updated.', 'تم تعديل حالة العميل.');
      },
      error: () => {
        this.errorMessage = this.t('Failed to update status.', 'فشل تعديل الحالة.');
      },
    });
  }

  updateRole(customer: any, role: 'user' | 'admin'): void {
    this.customerService.updateCustomerRole(customer._id, role).subscribe({
      next: () => {
        customer.role = role;
        this.successMessage = this.t('Customer role updated.', 'تم تعديل صلاحية العميل.');
      },
      error: () => {
        this.errorMessage = this.t('Failed to update role.', 'فشل تعديل الصلاحية.');
      },
    });
  }

  disableCustomer(customer: any): void {
    if (!confirm(this.t('Disable this customer account?', 'هل تريد تعطيل حساب العميل؟'))) return;
    this.customerService.deleteCustomer(customer._id).subscribe({
      next: () => {
        customer.status = 'blocked';
        customer.role = 'user';
        this.successMessage = this.t('Customer disabled.', 'تم تعطيل العميل.');
      },
      error: () => {
        this.errorMessage = this.t('Failed to disable customer.', 'فشل تعطيل العميل.');
      },
    });
  }

  downloadCustomerReport(): void {
    const rows = this.filteredCustomers.map((customer) => ({
      Name: customer.name || '',
      Email: customer.email || '',
      Phone: customer.phone || (customer.phones || []).join(' / '),
      Role: customer.role || '',
      Status: customer.status || '',
      Email_Verified: customer.isEmailVerified ? 'Yes' : 'No',
      Orders_Count: customer.orderCount || 0,
      Line_Items_Count: customer.lineItemsCount || 0,
      Items_Count: customer.itemsCount || 0,
      Total_Spent_EGP: customer.totalSpent || 0,
      Last_Order_Number: customer.lastOrderNumber || '',
      Last_Order_Status: customer.lastOrderStatus || '',
      Last_Order_Date: customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleString() : '',
      Addresses: (customer.addresses || []).join(' | '),
      Created_At: customer.createdAt ? new Date(customer.createdAt).toLocaleString() : '',
    }));

    this.downloadCsv(rows, `kahve_customers_report_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  private downloadCsv(rows: any[], filename: string): void {
    const headers = Object.keys(rows[0] || {
      Name: '', Email: '', Phone: '', Role: '', Status: '', Orders_Count: '', Total_Spent_EGP: ''
    });
    const escape = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

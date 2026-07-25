import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '../../guards/admin.guard';
import { AddProductComponent } from './add-product/add-product.component';
import { CategorySettingsComponent } from './category-settings/category-settings.component';
import { CouponSettingsComponent } from './coupon-settings/coupon-settings.component';
import { CustomerManagementComponent } from './customer-management/customer-management.component';
import { DashboardComponent } from './dashboard.component';
import { DeliverySettingsComponent } from './delivery-settings/delivery-settings.component';
import { ManageOrdersComponent } from './manage-orders/manage-orders.component';
import { SiteContentManagementComponent } from './site-content-management/site-content-management.component';
import { ViewProductsComponent } from './view-products/view-products.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivateChild: [AdminGuard],
    data: { title: 'Admin Dashboard | KAHVE', noindex: true },
    children: [
      { path: 'addproduct', component: AddProductComponent, data: { title: 'Add Product | KAHVE', noindex: true } },
      { path: 'manageorder', component: ManageOrdersComponent, data: { title: 'Manage Orders | KAHVE', noindex: true } },
      { path: 'view', component: ViewProductsComponent, data: { title: 'Manage Products | KAHVE', noindex: true } },
      { path: 'delivery-settings', component: DeliverySettingsComponent, data: { title: 'Delivery Settings | KAHVE', noindex: true } },
      { path: 'coupons', component: CouponSettingsComponent, data: { title: 'Coupons | KAHVE', noindex: true } },
      { path: 'categories', component: CategorySettingsComponent, data: { title: 'Categories | KAHVE', noindex: true } },
      { path: 'site-content', component: SiteContentManagementComponent, data: { title: 'Site Content | KAHVE', noindex: true } },
      { path: 'customers', component: CustomerManagementComponent, data: { title: 'Customers | KAHVE', noindex: true } },
      { path: '', redirectTo: 'addproduct', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}

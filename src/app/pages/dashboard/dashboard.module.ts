import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../shared/shared.module';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { AddProductComponent } from './add-product/add-product.component';
import { CategorySettingsComponent } from './category-settings/category-settings.component';
import { CouponSettingsComponent } from './coupon-settings/coupon-settings.component';
import { CustomerManagementComponent } from './customer-management/customer-management.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { DeliverySettingsComponent } from './delivery-settings/delivery-settings.component';
import { ManageOrdersComponent } from './manage-orders/manage-orders.component';
import { SiteContentManagementComponent } from './site-content-management/site-content-management.component';
import { ViewProductsComponent } from './view-products/view-products.component';

@NgModule({
  declarations: [
    DashboardComponent,
    SidebarComponent,
    AddProductComponent,
    ManageOrdersComponent,
    ViewProductsComponent,
    DeliverySettingsComponent,
    CouponSettingsComponent,
    CategorySettingsComponent,
    SiteContentManagementComponent,
    CustomerManagementComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    SharedModule,
    DashboardRoutingModule,
  ],
})
export class DashboardModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes, ExtraOptions } from '@angular/router'; 

import { WelcomeComponent } from './pages/welcome/welcome.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { HomeComponent } from './pages/home/home.component';
import { AboutusComponent } from './pages/aboutus/aboutus.component';
import { CartComponent } from './pages/cart/cart.component';
import { OrderComponent } from './pages/order/order.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AddProductComponent } from './pages/dashboard/add-product/add-product.component';
import { ManageOrdersComponent } from './pages/dashboard/manage-orders/manage-orders.component';
import { ViewProductsComponent } from './pages/dashboard/view-products/view-products.component';
import { ErrorComponent } from './pages/error/error.component';
import { BestStyleComponent } from './pages/best-style/best-style.component';
import { VirtualTryOnComponent } from './pages/virtual-try-on/virtual-try-on.component';
import { DeliveryDetailsComponent } from './pages/delivery-details/delivery-details.component';
import { ContactusComponent } from './pages/contactus/contactus.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { ModelErrorComponent } from './pages/model-error/model-error.component';
import { LiveSessionComponent } from './pages/live-session/live-session.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { DeliverySettingsComponent } from './pages/dashboard/delivery-settings/delivery-settings.component';
import { CouponSettingsComponent } from './pages/dashboard/coupon-settings/coupon-settings.component';
import { CategorySettingsComponent } from './pages/dashboard/category-settings/category-settings.component';
import { SiteContentManagementComponent } from './pages/dashboard/site-content-management/site-content-management.component';
import { CustomerManagementComponent } from './pages/dashboard/customer-management/customer-management.component';

const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'welcome', component: WelcomeComponent, data: { title: 'KAHVE' } },
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard], data: { title: 'KAHVE' } },
  { path: 'signup', component: SignupComponent, canActivate: [AuthGuard], data: { title: 'KAHVE' } },
  { path: 'forgot-password', component: ForgotPasswordComponent, data: { title: 'KAHVE' } },
  { path: 'verify-email', component: VerifyEmailComponent, data: { title: 'KAHVE' } },
  { path: 'home', component: HomeComponent, data: { title: 'KAHVE' } },
  { path: 'aboutUs', component: AboutusComponent, data: { title: 'KAHVE' } },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard], data: { title: 'KAHVE' } },
  { path: 'orders', component: OrderComponent, canActivate: [AuthGuard], data: { title: 'KAHVE' } },
  { path: 'logout', component: LogoutComponent, canActivate: [AuthGuard], data: { title: 'KAHVE' } },
  { path: 'deliveryDetails', component: DeliveryDetailsComponent, canActivate: [AuthGuard], data: { title: 'KAHVE' } },
  { path: 'bestStyle', component: BestStyleComponent, canActivate: [AuthGuard], data: { title: 'KAHVE' } },
  { path: 'virtualTryOn', component: VirtualTryOnComponent, canActivate: [AuthGuard], data: { title: 'KAHVE' } },
  { path: 'contactUs', component: ContactusComponent, canActivate: [AuthGuard], data: { title: 'KAHVE' } },
  { path: 'liveSession', component: LiveSessionComponent, data: { title: 'KAHVE' } },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, AdminGuard],
    canActivateChild: [AdminGuard],
    data: { title: 'KAHVE' },
    children: [
      { path: 'addproduct', component: AddProductComponent, data: { title: 'KAHVE' } },
      { path: 'manageorder', component: ManageOrdersComponent, data: { title: 'KAHVE' } },
      { path: 'view', component: ViewProductsComponent, data: { title: 'KAHVE' } },
      { path: 'delivery-settings', component: DeliverySettingsComponent, data: { title: 'KAHVE' } },
      { path: 'coupons', component: CouponSettingsComponent, data: { title: 'KAHVE' } },
      { path: 'categories', component: CategorySettingsComponent, data: { title: 'KAHVE' } },
      { path: 'site-content', component: SiteContentManagementComponent, data: { title: 'KAHVE' } },
      { path: 'customers', component: CustomerManagementComponent, data: { title: 'KAHVE' } },
      { path: '', redirectTo: 'addproduct', pathMatch: 'full' }
    ],
  },
  { path: 'error', component: ErrorComponent, data: { title: 'KAHVE' } },
  { path: 'model-error', component: ModelErrorComponent, data: { title: 'KAHVE' } },
  { path: '**', redirectTo: '/error' },
];

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled',
  
    scrollOffset: [0, 100],

};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

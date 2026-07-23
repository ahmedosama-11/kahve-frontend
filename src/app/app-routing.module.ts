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
  {
    path: '',
    component: WelcomeComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'KAHVE Coffee Egypt | Premium Coffee Online',
      description: 'Discover premium KAHVE coffee in Egypt. Shop fresh Turkish coffee, coffee blends and carefully selected coffee products online.',
      canonical: '/',
    },
  },
  { path: 'welcome', redirectTo: '', pathMatch: 'full' },
  {
    path: 'home',
    component: HomeComponent,
    data: {
      title: 'Shop Premium Coffee Online | KAHVE Egypt',
      description: 'Shop KAHVE coffee online in Egypt. Explore Turkish coffee, light and dark roasts, coffee mixes and fresh selections.',
      canonical: '/home',
    },
  },
  {
    path: 'aboutUs',
    component: AboutusComponent,
    data: {
      title: 'About KAHVE | Premium Coffee in Egypt',
      description: 'Learn about KAHVE, our passion for quality coffee and the story behind our carefully selected coffee products in Egypt.',
      canonical: '/aboutUs',
    },
  },
  {
    path: 'contactUs',
    component: ContactusComponent,
    data: {
      title: 'Contact KAHVE Egypt | Coffee Orders & Support',
      description: 'Contact KAHVE Egypt for coffee orders, product questions and customer support.',
      canonical: '/contactUs',
    },
  },
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard], data: { title: 'Login | KAHVE', noindex: true } },
  { path: 'signup', component: SignupComponent, canActivate: [AuthGuard], data: { title: 'Create Account | KAHVE', noindex: true } },
  { path: 'forgot-password', component: ForgotPasswordComponent, data: { title: 'Reset Password | KAHVE', noindex: true } },
  { path: 'verify-email', component: VerifyEmailComponent, data: { title: 'Verify Email | KAHVE', noindex: true } },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard], data: { title: 'Shopping Cart | KAHVE', noindex: true } },
  { path: 'orders', component: OrderComponent, canActivate: [AuthGuard], data: { title: 'My Orders | KAHVE', noindex: true } },
  { path: 'logout', component: LogoutComponent, canActivate: [AuthGuard], data: { title: 'Logout | KAHVE', noindex: true } },
  { path: 'deliveryDetails', component: DeliveryDetailsComponent, canActivate: [AuthGuard], data: { title: 'Checkout | KAHVE', noindex: true } },
  { path: 'bestStyle', component: BestStyleComponent, canActivate: [AuthGuard], data: { title: 'KAHVE Collection', noindex: true } },
  { path: 'virtualTryOn', component: VirtualTryOnComponent, canActivate: [AuthGuard], data: { title: 'Virtual Try On | KAHVE', noindex: true } },
  { path: 'liveSession', component: LiveSessionComponent, data: { title: 'Live Session | KAHVE', noindex: true } },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, AdminGuard],
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
  { path: 'error', component: ErrorComponent, data: { title: 'Page Not Found | KAHVE', noindex: true } },
  { path: 'model-error', component: ModelErrorComponent, data: { title: 'Error | KAHVE', noindex: true } },
  { path: '**', redirectTo: '/error' },
];

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled',
  scrollOffset: [0, 100],
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

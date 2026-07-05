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

const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'welcome', component: WelcomeComponent, data: { title: 'Welcome' } },
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard], data: { title: 'LogIn' } },
  { path: 'signup', component: SignupComponent, canActivate: [AuthGuard], data: { title: 'SignUp' } },
  { path: 'forgot-password', component: ForgotPasswordComponent, data: { title: 'Reset Password' } },
  { path: 'verify-email', component: VerifyEmailComponent, data: { title: 'Verify Email' } },
  { path: 'home', component: HomeComponent, data: { title: 'Home' } },
  { path: 'aboutUs', component: AboutusComponent, data: { title: 'About us' } },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard], data: { title: 'Cart' } },
  { path: 'orders', component: OrderComponent, canActivate: [AuthGuard], data: { title: 'Orders' } },
  { path: 'logout', component: LogoutComponent, canActivate: [AuthGuard], data: { title: 'Logout' } },
  { path: 'deliveryDetails', component: DeliveryDetailsComponent, canActivate: [AuthGuard], data: { title: 'Delivery Details' } },
  { path: 'bestStyle', component: BestStyleComponent, canActivate: [AuthGuard], data: { title: 'Best Style' } },
  { path: 'virtualTryOn', component: VirtualTryOnComponent, canActivate: [AuthGuard], data: { title: 'Virtual Try On' } },
  { path: 'contactUs', component: ContactusComponent, canActivate: [AuthGuard], data: { title: 'Contact Us' } },
  { path: 'liveSession', component: LiveSessionComponent, data: { title: 'Live Session' } },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, AdminGuard],
    canActivateChild: [AdminGuard],
    data: { title: 'Dashboard' },
    children: [
      { path: 'addproduct', component: AddProductComponent, data: { title: 'Add Product' } },
      { path: 'manageorder', component: ManageOrdersComponent, data: { title: 'Manage Order' } },
      { path: 'view', component: ViewProductsComponent, data: { title: 'View Product' } },
      { path: '', redirectTo: 'addproduct', pathMatch: 'full' }
    ],
  },
  { path: 'error', component: ErrorComponent, data: { title: 'Error' } },
  { path: 'model-error', component: ModelErrorComponent, data: { title: 'Model-Error' } },
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
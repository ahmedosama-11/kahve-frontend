import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HomeComponent } from './pages/home/home.component';
import { AboutusComponent } from './pages/aboutus/aboutus.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { NgSelectModule } from '@ng-select/ng-select';

import { WelcomeComponent } from './pages/welcome/welcome.component';
import { ContactusComponent } from './pages/contactus/contactus.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { LoginComponent } from './pages/login/login.component';
import { HomeNavComponent } from './pages/home/home-nav/home-nav.component';
import { SignupComponent } from './pages/signup/signup.component';
import { CartComponent } from './pages/cart/cart.component';
import { OrderComponent } from './pages/order/order.component';
import { ErrorComponent } from './pages/error/error.component';
import { BestStyleComponent } from './pages/best-style/best-style.component';
import { VirtualTryOnComponent } from './pages/virtual-try-on/virtual-try-on.component';
import { DeliveryDetailsComponent } from './pages/delivery-details/delivery-details.component';
import { ContactNavComponent } from './pages/contactus/contact-nav/contact-nav.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { AddProductComponent } from './pages/dashboard/add-product/add-product.component';
import { ManageOrdersComponent } from './pages/dashboard/manage-orders/manage-orders.component';
import { ViewProductsComponent } from './pages/dashboard/view-products/view-products.component';
import { AuthGuard } from './guards/auth.guard';
import { ModelErrorComponent } from './pages/model-error/model-error.component';
import { LiveSessionComponent } from './pages/live-session/live-session.component';
import { TranslatePipe } from './pipes/translate.pipe';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { DeliverySettingsComponent } from './pages/dashboard/delivery-settings/delivery-settings.component';
import { CouponSettingsComponent } from './pages/dashboard/coupon-settings/coupon-settings.component';
import { CategorySettingsComponent } from './pages/dashboard/category-settings/category-settings.component';
import { SiteContentManagementComponent } from './pages/dashboard/site-content-management/site-content-management.component';
import { CustomerManagementComponent } from './pages/dashboard/customer-management/customer-management.component';

// const routes: Routes = [
//   { path: '', redirectTo: '/welcome', pathMatch: 'full' },
//   { path: 'welcome', component: WelcomeComponent, data: { title: 'Welcome' } },
//   {
//     path: 'login',
//     component: LoginComponent,
//     canActivate: [AuthGuard],
//     data: { title: 'LogIn' },
//   },
//   {
//     path: 'signup',
//     component: SignupComponent,
//     canActivate: [AuthGuard],
//     data: { title: 'SignUp' },
//   },
//   {
//     path: 'logout',
//     component: LogoutComponent,
//     canActivate: [AuthGuard],
//     data: { title: 'Logout' },
//   },
//   { path: 'home', component: HomeComponent, data: { title: 'Home' } },
//   { path: 'aboutUs', component: AboutusComponent, data: { title: 'Aboutus' } },
//   {
//     path: 'cart',
//     component: CartComponent,
//     canActivate: [AuthGuard],
//     data: { title: 'Cart' },
//   },
//   {
//     path: 'orders',
//     component: OrderComponent,
//     canActivate: [AuthGuard],
//     data: { title: 'Orders' },
//   },
//   {
//     path: 'deliveryDetails',
//     component: DeliveryDetailsComponent,
//     canActivate: [AuthGuard], 
//     data: { title: 'Deleviry Details' },
//   },
//   {
//     path: 'bestStyle',
//     component: BestStyleComponent,
//     canActivate: [AuthGuard], 

//     data: { title: 'Best Style' },
//   },
//   { path: 'error', component: ErrorComponent, data: { title: 'Error' } },
//   {
//     path: 'dashboard',
//     component: DashboardComponent,
//     canActivate: [AuthGuard], 

//     data: { title: 'Dashboard' },
//     children: [
//       {
//         path: 'addproduct',
//         component: AddProductComponent,
//         data: { title: 'Add Product' },
//       },
//       {
//         path: 'manageorder',
//         component: ManageOrdersComponent,
//         data: { title: 'Manage Order' },
//       },
//       {
//         path: 'view',
//         component: ViewProductsComponent,
//         data: { title: 'View Product' },
//       },
//       { path: '', redirectTo: 'addproduct', pathMatch: 'full' }

//     ],
//   },
//   {
//     path: 'virtualTryOn',
//     component: VirtualTryOnComponent,
//     canActivate: [AuthGuard], 

//     data: { title: 'Virtual Try On' },
//   },
//   {
//     path: 'contactUs',
//     component: ContactusComponent,
//     canActivate: [AuthGuard], 
//     data: { title: 'Contact Us' },
//   },
//   { path: '**', redirectTo: '/welcome' },
// ];
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AboutusComponent,
    SidebarComponent,
    DashboardComponent,
    LoginComponent,
    NavbarComponent,
    FooterComponent,
    HomeNavComponent,
    SignupComponent,
    CartComponent,
    OrderComponent,
    ErrorComponent,
    BestStyleComponent,
    VirtualTryOnComponent,
    DeliveryDetailsComponent,
    ContactNavComponent,
    LogoutComponent,
    AddProductComponent,
    ManageOrdersComponent,
    ViewProductsComponent,
    ModelErrorComponent,
    LiveSessionComponent,
    TranslatePipe,
    VerifyEmailComponent,
    ForgotPasswordComponent,
    DeliverySettingsComponent,
    CouponSettingsComponent,
    CategorySettingsComponent,
    CustomerManagementComponent,
      SiteContentManagementComponent,
],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
        AppRoutingModule,

    FormsModule,
    CommonModule,
    NgSelectModule,
  ],
  exports: [RouterModule],
  providers: [provideHttpClient(), AuthGuard],
  bootstrap: [AppComponent],
})
export class AppModule {}

import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Providers } from "@/components/Providers";
import { ProtectedRoute, AdminRoute, ManagerRoute, SupportRoute } from "@/components/ProtectedRoute";
import { AutoPageTitle } from "@/components/AutoPageTitle";
import { TopProgressBar } from "@/components/ui/TopProgressBar";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StoreLayout } from "@/layouts/StoreLayout";

// Minimal fallback — TopProgressBar handles visual feedback
const PageLoader = () => <div className="min-h-screen" />;

// Store Pages (lazy)
const StoreHome = lazy(() => import("./pages/store/StoreHome"));
const StoreProducts = lazy(() => import("./pages/store/StoreProducts"));
const ProductDetail = lazy(() => import("./pages/store/ProductDetail"));
const Cart = lazy(() => import("./pages/store/Cart"));
const TrackOrder = lazy(() => import("./pages/store/TrackOrder"));
const Checkout = lazy(() => import("./pages/store/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/store/OrderConfirmation"));
const PaymentProcessing = lazy(() => import("./pages/store/PaymentProcessing"));
const PaymentCallback = lazy(() => import("./pages/store/PaymentCallback"));
const OrderTracking = lazy(() => import("./pages/store/OrderTracking"));
const Wishlist = lazy(() => import("./pages/store/Wishlist"));
const Contact = lazy(() => import("./pages/store/Contact"));
const FAQ = lazy(() => import("./pages/store/FAQ"));
const ShippingInfo = lazy(() => import("./pages/store/ShippingInfo"));
const Returns = lazy(() => import("./pages/store/Returns"));
const SizeGuide = lazy(() => import("./pages/store/SizeGuide"));
const Privacy = lazy(() => import("./pages/store/Privacy"));
const Terms = lazy(() => import("./pages/store/Terms"));

// Customer Account (lazy)
const AccountDashboard = lazy(() => import("./pages/store/account/AccountDashboard"));
const AccountOrders = lazy(() => import("./pages/store/account/AccountOrders"));
const AccountWishlist = lazy(() => import("./pages/store/account/AccountWishlist"));
const AccountShopping = lazy(() => import("./pages/store/account/AccountShopping"));
const AccountRecentlyViewed = lazy(() => import("./pages/store/account/AccountRecentlyViewed"));
const AccountAddresses = lazy(() => import("./pages/store/account/AccountAddresses"));
const AccountSecurity = lazy(() => import("./pages/store/account/AccountSecurity"));
const AccountSupport = lazy(() => import("./pages/store/account/AccountSupport"));
const AccountSettings = lazy(() => import("./pages/store/account/AccountSettings"));
const AccountOrderTracking = lazy(() => import("./pages/store/account/AccountOrderTracking"));
const AccountInvoice = lazy(() => import("./pages/store/account/AccountInvoice"));
const AccountReturns = lazy(() => import("./pages/store/account/AccountReturns"));
const AccountReviews = lazy(() => import("./pages/store/account/AccountReviews"));
const AccountNotifications = lazy(() => import("./pages/store/account/AccountNotifications"));
const AccountNotificationPreferences = lazy(() => import("./pages/store/account/AccountNotificationPreferences"));
const AccountPasswordPage = lazy(() => import("./pages/store/account/AccountPasswordPage"));
const AccountPaymentMethods = lazy(() => import("./pages/store/account/AccountPaymentMethods"));

const AccountChat = lazy(() => import("./pages/store/account/AccountChat"));
import { CustomerAccountLayout } from "./layouts/CustomerAccountLayout";

// Admin Pages (lazy)
const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const Categories = lazy(() => import("./pages/Categories"));
const Orders = lazy(() => import("./pages/Orders"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Customers = lazy(() => import("./pages/Customers"));

const SettingsStore = lazy(() => import("./pages/system-settings/StorePage"));
const SettingsPayments = lazy(() => import("./pages/system-settings/PaymentsPage"));
const SettingsEmails = lazy(() => import("./pages/system-settings/EmailsPage"));
const SettingsNotifications = lazy(() => import("./pages/system-settings/NotificationsPage"));
const SettingsSecurity = lazy(() => import("./pages/system-settings/SecurityPage"));
const SettingsAudit = lazy(() => import("./pages/system-settings/AuditPage"));
const SettingsBackup = lazy(() => import("./pages/system-settings/BackupPage"));
const SettingsIntegrations = lazy(() => import("./pages/system-settings/IntegrationsPage"));

const Shipping = lazy(() => import("./pages/Shipping"));
const Messages = lazy(() => import("./pages/Messages"));
const Reports = lazy(() => import("./pages/Reports"));
const Coupons = lazy(() => import("./pages/Coupons"));
const ProfileLayout = lazy(() => import("./layouts/ProfileLayout"));
const ProfilePersonal = lazy(() => import("./pages/profile/PersonalInfoPage"));
const ProfilePassword = lazy(() => import("./pages/profile/PasswordPage"));
const ProfileSecurity = lazy(() => import("./pages/profile/SecurityPage"));
const ProfileSessions = lazy(() => import("./pages/profile/SessionsPage"));
const Brands = lazy(() => import("./pages/Brands"));
const Login = lazy(() => import("./pages/Login"));

const AbandonedCarts = lazy(() => import("./pages/AbandonedCarts"));
const RoleManagement = lazy(() => import("./pages/RoleManagement"));
const RoleDashboard = lazy(() => import("./pages/RoleDashboard"));
const ManagerSettings = lazy(() => import("./pages/ManagerSettings"));
const GlobalTrash = lazy(() => import("./pages/GlobalTrash"));
const ContentManager = lazy(() => import("./pages/admin/ContentManager"));
const AppearanceManager = lazy(() => import("./pages/admin/AppearanceManager"));
const ReviewsManager = lazy(() => import("./pages/admin/ReviewsManager"));
const AccountDeletionRequests = lazy(() => import("./pages/admin/AccountDeletionRequests"));
const EdgeFunctionHealth = lazy(() => import("./pages/admin/EdgeFunctionHealth"));
const SupportSettings = lazy(() => import("./pages/SupportSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <Providers>
    <BrowserRouter>
      <TopProgressBar />
      <AutoPageTitle />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ====================== */}
          {/* Store Frontend Routes - Nested under StoreLayout */}
          {/* ====================== */}
          <Route element={<StoreLayout />}>
            <Route path="/" element={<StoreHome />} />
            <Route path="/products" element={<StoreProducts />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/payment-processing" element={<PaymentProcessing />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />
            <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/shipping-info" element={<ShippingInfo />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/size-guide" element={<SizeGuide />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Customer Account Routes */}
          <Route path="/myaccount" element={<ProtectedRoute><CustomerAccountLayout /></ProtectedRoute>}>
            <Route index element={<AccountDashboard />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="orders/:orderId" element={<AccountOrderTracking />} />
            <Route path="orders/:orderId/invoice" element={<AccountInvoice />} />
            <Route path="wishlist" element={<AccountWishlist />} />
            <Route path="shopping" element={<AccountShopping />} />
            <Route path="recently-viewed" element={<AccountRecentlyViewed />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="security" element={<AccountSecurity />} />
            <Route path="support" element={<AccountSupport />} />
            <Route path="settings" element={<Navigate to="/myaccount/personal-info" replace />} />
            <Route path="personal-info" element={<AccountSettings />} />
            <Route path="password" element={<AccountPasswordPage />} />
            <Route path="settings/personal-info" element={<Navigate to="/myaccount/personal-info" replace />} />
            <Route path="settings/password" element={<Navigate to="/myaccount/password" replace />} />
            <Route path="returns" element={<AccountReturns />} />
            <Route path="reviews" element={<AccountReviews />} />
            <Route path="notifications" element={<AccountNotifications />} />
            <Route path="notification-preferences" element={<AccountNotificationPreferences />} />
            
            
            <Route path="chat" element={<AccountChat />} />
          </Route>

          {/* ====================== */}
          {/* Admin Routes */}
          {/* ====================== */}
          <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route path="/admin/dashboard" element={<Index />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/brands" element={<Brands />} />
            <Route path="/admin/orders" element={<Orders />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/settings" element={<Navigate to="/admin/system-settings/store" replace />} />
            <Route path="/admin/system-settings" element={<Navigate to="/admin/system-settings/store" replace />} />
            <Route path="/admin/system-settings/store" element={<SettingsStore />} />
            <Route path="/admin/system-settings/payments" element={<SettingsPayments />} />
            <Route path="/admin/system-settings/emails" element={<SettingsEmails />} />
            <Route path="/admin/system-settings/notifications" element={<SettingsNotifications />} />
            <Route path="/admin/system-settings/security" element={<SettingsSecurity />} />
            <Route path="/admin/system-settings/audit" element={<SettingsAudit />} />
            <Route path="/admin/system-settings/backup" element={<SettingsBackup />} />
            <Route path="/admin/system-settings/integrations" element={<SettingsIntegrations />} />
            <Route path="/admin/shipping" element={<Shipping />} />
            <Route path="/admin/messages" element={<Messages />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/coupons" element={<Coupons />} />
            <Route path="/admin/account-settings" element={<ProfileLayout />}>
              <Route index element={<ProfilePersonal />} />
              <Route path="personal-info" element={<ProfilePersonal />} />
              <Route path="password" element={<ProfilePassword />} />
              <Route path="security" element={<ProfileSecurity />} />
              <Route path="login-activity" element={<ProfileSessions />} />
            </Route>
            
            <Route path="/admin/abandoned-carts" element={<AbandonedCarts />} />
            <Route path="/admin/role-management" element={<RoleManagement />} />
            <Route path="/admin/content" element={<ContentManager />} />
            <Route path="/admin/homepage" element={<Navigate to="/admin/content" replace />} />
            <Route path="/admin/page-content" element={<Navigate to="/admin/content" replace />} />
            <Route path="/admin/appearance" element={<AppearanceManager />} />
            <Route path="/admin/reviews" element={<ReviewsManager />} />
            <Route path="/admin/trash" element={<GlobalTrash />} />
            <Route path="/admin/account-deletion-requests" element={<AccountDeletionRequests />} />
            <Route path="/admin/system-settings/edge-functions" element={<EdgeFunctionHealth />} />
            <Route path="/admin/support-settings" element={<SupportSettings />} />
          </Route>

          {/* Manager Routes */}
          <Route element={<ManagerRoute><AdminLayout /></ManagerRoute>}>
            <Route path="/manager/dashboard" element={<RoleDashboard />} />
            <Route path="/manager/orders" element={<Orders />} />
            <Route path="/manager/products" element={<Products />} />
            <Route path="/manager/customers" element={<Customers />} />
            <Route path="/manager/analytics" element={<Analytics />} />
            <Route path="/manager/shipping" element={<Shipping />} />
            <Route path="/manager/coupons" element={<Coupons />} />
            <Route path="/manager/reports" element={<Reports />} />
            <Route path="/manager/trash" element={<GlobalTrash />} />
            <Route path="/manager/settings" element={<ManagerSettings />} />
            <Route path="/manager/messages" element={<Messages />} />
            <Route path="/manager/account-settings" element={<ProfileLayout />}>
              <Route index element={<ProfilePersonal />} />
              <Route path="personal-info" element={<ProfilePersonal />} />
              <Route path="password" element={<ProfilePassword />} />
              <Route path="security" element={<ProfileSecurity />} />
              <Route path="login-activity" element={<ProfileSessions />} />
            </Route>
          </Route>

          {/* Support Routes */}
          <Route element={<SupportRoute><AdminLayout /></SupportRoute>}>
            <Route path="/support/dashboard" element={<RoleDashboard />} />
            <Route path="/support/orders" element={<Orders />} />
            <Route path="/support/customers" element={<Customers />} />
            <Route path="/support/messages" element={<Messages />} />
            <Route path="/support/settings" element={<SupportSettings />} />
            <Route path="/support/account-settings" element={<ProfileLayout />}>
              <Route index element={<ProfilePersonal />} />
              <Route path="personal-info" element={<ProfilePersonal />} />
              <Route path="password" element={<ProfilePassword />} />
              <Route path="security" element={<ProfileSecurity />} />
              <Route path="login-activity" element={<ProfileSessions />} />
            </Route>
          </Route>

          <Route element={<StoreLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </Providers>
);

export default App;

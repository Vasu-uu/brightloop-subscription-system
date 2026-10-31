import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/dashboard/Dashboard";
import { PortalShell } from "./pages/portal/PortalShell";
import MySubscriptions from "./pages/portal/MySubscriptions";
import MySubscriptionDetail from "./pages/portal/MySubscriptionDetail";
import MyInvoices from "./pages/portal/MyInvoices";
import MyInvoiceDetail from "./pages/portal/MyInvoiceDetail";
import TemplatesList from "./pages/templates/TemplatesList";
import TemplateForm from "./pages/templates/TemplateForm";
import SubscriptionsList from "./pages/subscriptions/SubscriptionsList";
import SubscriptionDetail from "./pages/subscriptions/SubscriptionDetail";
import InvoicesList from "./pages/invoices/InvoicesList";
import InvoiceDetail from "./pages/invoices/InvoiceDetail";
import PaymentsList from "./pages/payments/PaymentsList";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/403" element={<Forbidden />} />

      <Route element={<ProtectedRoute roles={["ADMIN", "STAFF"]} />}>
        <Route element={<AppShell />}>
          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/templates" element={<TemplatesList />} />
          <Route path="/app/templates/new" element={<TemplateForm />} />
          <Route path="/app/templates/:id" element={<TemplateForm />} />
          <Route path="/app/subscriptions" element={<SubscriptionsList />} />
          <Route path="/app/subscriptions/new" element={<SubscriptionDetail />} />
          <Route path="/app/subscriptions/:id" element={<SubscriptionDetail />} />
          <Route path="/app/invoices" element={<InvoicesList />} />
          <Route path="/app/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/app/payments" element={<PaymentsList />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["CUSTOMER"]} />}>
        <Route element={<PortalShell />}>
          <Route path="/portal/subscriptions" element={<MySubscriptions />} />
          <Route path="/portal/subscriptions/:id" element={<MySubscriptionDetail />} />
          <Route path="/portal/invoices" element={<MyInvoices />} />
          <Route path="/portal/invoices/:id" element={<MyInvoiceDetail />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

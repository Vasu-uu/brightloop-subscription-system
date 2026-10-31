import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/dashboard/Dashboard";
import Portal from "./pages/portal/Portal";
import TemplatesList from "./pages/templates/TemplatesList";
import TemplateForm from "./pages/templates/TemplateForm";
import SubscriptionsList from "./pages/subscriptions/SubscriptionsList";
import SubscriptionDetail from "./pages/subscriptions/SubscriptionDetail";
import InvoicesList from "./pages/invoices/InvoicesList";
import InvoiceDetail from "./pages/invoices/InvoiceDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["CUSTOMER"]} />}>
        <Route path="/portal/*" element={<Portal />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

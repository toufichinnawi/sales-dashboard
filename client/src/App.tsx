import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import PortalLayout from "./components/PortalLayout";
import Home from "./pages/Home";
import Pipeline from "./pages/Pipeline";
import Deals from "./pages/Deals";
import Team from "./pages/Team";
import Analytics from "./pages/Analytics";
import Prospects from "./pages/Prospects";
import Leads from "./pages/Leads";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import RecurringOrders from "./pages/RecurringOrders";
import QuickBooksSettings from "./pages/QuickBooksSettings";
import WholesaleLanding from "./pages/WholesaleLanding";
import TastingRequest from "./pages/TastingRequest";
import PortalOrders from "./pages/portal/PortalOrders";
import PortalStandingOrders from "./pages/portal/PortalStandingOrders";
import PortalQuickOrder from "./pages/portal/PortalQuickOrder";
import PortalProfile from "./pages/portal/PortalProfile";
import PortalAcceptInvite from "./pages/portal/PortalAcceptInvite";

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/pipeline"} component={Pipeline} />
        <Route path={"/deals"} component={Deals} />
        <Route path={"/team"} component={Team} />
        <Route path={"/analytics"} component={Analytics} />
        <Route path={"/prospects"} component={Prospects} />
        <Route path={"/leads"} component={Leads} />
        <Route path={"/customers"} component={Customers} />
        <Route path={"/orders"} component={Orders} />
        <Route path={"/recurring"} component={RecurringOrders} />
        <Route path={"/quickbooks"} component={QuickBooksSettings} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function PortalRouter() {
  return (
    <PortalLayout>
      <Switch>
        <Route path={"/portal"} component={PortalOrders} />
        <Route path={"/portal/standing"} component={PortalStandingOrders} />
        <Route path={"/portal/order"} component={PortalQuickOrder} />
        <Route path={"/portal/profile"} component={PortalProfile} />
        <Route component={NotFound} />
      </Switch>
    </PortalLayout>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/wholesale"} component={WholesaleLanding} />
      <Route path={"/tasting"} component={TastingRequest} />
      <Route path={"/portal/accept-invite"} component={PortalAcceptInvite} />
      <Route path="/portal/:rest*">
        <PortalRouter />
      </Route>
      <Route>
        <DashboardRouter />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Pipeline from "./pages/Pipeline";
import Deals from "./pages/Deals";
import Team from "./pages/Team";
import Analytics from "./pages/Analytics";
import Prospects from "./pages/Prospects";
import WholesaleLanding from "./pages/WholesaleLanding";

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
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/wholesale"} component={WholesaleLanding} />
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

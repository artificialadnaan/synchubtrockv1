import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Connections from "./pages/Connections";
import SettingsEmail from "./pages/SettingsEmail";
import AdminCredentials from "./pages/AdminCredentials";
import AdminStageMapping from "./pages/AdminStageMapping";
import Logs from "./pages/Logs";
import Layout from "./components/Layout";

function Router() {
  const { user, isLoading } = useAuth();
  const [loc] = useLocation();
  const isPublic = loc === "/login" || loc === "/signup";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user && !isPublic) {
    return <Redirect to="/login" />;
  }

  if (user && isPublic) {
    return <Dashboard />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/connections" component={Connections} />
      <Route path="/settings/email" component={SettingsEmail} />
      <Route path="/admin/credentials" component={AdminCredentials} />
      <Route path="/admin/stage-mapping" component={AdminStageMapping} />
      <Route path="/logs" component={Logs} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route component={Dashboard} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Router />
      </Layout>
    </QueryClientProvider>
  );
}

export default App;

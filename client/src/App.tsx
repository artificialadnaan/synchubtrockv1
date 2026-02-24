import { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import Dashboard from "./pages/Dashboard";
import Connections from "./pages/Connections";
import SettingsEmail from "./pages/SettingsEmail";
import AdminCredentials from "./pages/AdminCredentials";
import AdminStageMapping from "./pages/AdminStageMapping";
import Logs from "./pages/Logs";
import Layout from "./components/Layout";

function RedirectFromAuth() {
  const [loc, setLoc] = useLocation();
  useEffect(() => {
    if (loc === "/login" || loc === "/signup") setLoc("/", { replace: true });
  }, [loc, setLoc]);
  return null;
}

function Router() {
  return (
    <>
      <RedirectFromAuth />
      <Switch>
        <Route path="/login" component={() => <Redirect to="/" />} />
        <Route path="/signup" component={() => <Redirect to="/" />} />
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/connections" component={Connections} />
        <Route path="/settings/email" component={SettingsEmail} />
        <Route path="/admin/credentials" component={AdminCredentials} />
        <Route path="/admin/stage-mapping" component={AdminStageMapping} />
        <Route path="/logs" component={Logs} />
        <Route component={Dashboard} />
      </Switch>
    </>
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

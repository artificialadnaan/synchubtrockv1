import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import Dashboard from "./pages/Dashboard";
import Connections from "./pages/Connections";
import SettingsEmail from "./pages/SettingsEmail";
import AdminCredentials from "./pages/AdminCredentials";
import AdminStageMapping from "./pages/AdminStageMapping";
import Logs from "./pages/Logs";
import Layout from "./components/Layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/connections" component={Connections} />
      <Route path="/settings/email" component={SettingsEmail} />
      <Route path="/admin/credentials" component={AdminCredentials} />
      <Route path="/admin/stage-mapping" component={AdminStageMapping} />
      <Route path="/logs" component={Logs} />
      <Route path="/login">
        <Redirect to="/" />
      </Route>
      <Route path="/signup">
        <Redirect to="/" />
      </Route>
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

import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { CourseDetails } from './components/courses/CourseDetails';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/auth-context";

import Login from "./pages/login";
import Dashboard from "./pages/modern-dashboard";
import Courses from "./pages/courses";
import Utilisateurs from "./pages/utilisateurs";
import Notifications from "./pages/notifications";
import Rankings from "./pages/rankings";
import DetailedRankings from "./pages/detailed-rankings";
import AttendanceTracking from "./pages/attendance-tracking";
import Automation from "./pages/automation";
import Settings from "./pages/settings";
import Logs from "./pages/logs";
import NotFound from "./pages/not-found";
import Scenarios from "./pages/scenarios";
import NotificationTemplates from "./pages/notification-templates";
import ZoomLinks from "./pages/zoom-links";
import NotificationSimulator from "./pages/notification-simulator";
import PointRules from "./pages/point-rules";
import Analytics from "./pages/analytics";
import ReminderTemplates from "./pages/reminder-templates";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <main>
            <Router>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/login" component={Login} />
                <Route path="/courses" component={Courses} />
                <Route path="/utilisateurs" component={Utilisateurs} />
                <Route path="/notifications" component={Notifications} />
                <Route path="/rankings" component={Rankings} />
                <Route path="/detailed-rankings" component={DetailedRankings} />
                <Route path="/attendance-tracking" component={AttendanceTracking} />
                <Route path="/automation" component={Automation} />
                <Route path="/settings" component={Settings} />
                <Route path="/logs" component={Logs} />
                <Route path="/courses/:courseId" component={CourseDetails} />
                <Route path="/scenarios" component={Scenarios} />
                <Route path="/notification-templates" component={NotificationTemplates} />
                <Route path="/zoom-links" component={ZoomLinks} />
                <Route path="/notification-simulator" component={NotificationSimulator} />
                <Route path="/point-rules" component={PointRules} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/reminder-templates" component={ReminderTemplates} />
                <Route component={NotFound} />
              </Switch>
            </Router>
          </main>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

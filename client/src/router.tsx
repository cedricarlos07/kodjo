import React from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { Dashboard } from './pages/dashboard';
import { Courses } from './pages/courses';
import { CourseDetails } from './components/courses/CourseDetails';
import NotFound from './pages/not-found';
import Login from './pages/login';
import Settings from './pages/settings';
import ReminderTemplatesPage from './pages/reminder-templates';
import AnalyticsPage from './pages/analytics';
import NotificationSimulatorPage from './pages/notification-simulator';

// Définir les routes de l'application
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'courses',
        element: <Courses />,
      },
      {
        path: 'courses/:courseId',
        element: <CourseDetails />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'reminder-templates',
        element: <ReminderTemplatesPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'notification-simulator',
        element: <NotificationSimulatorPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}

export default Router;

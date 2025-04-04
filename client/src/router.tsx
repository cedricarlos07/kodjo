import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { Dashboard } from './pages/dashboard';
import { Courses } from './pages/courses';
import { CourseDetails } from './components/courses/CourseDetails';
import NotFound from './pages/not-found';
import { Login } from './pages/login';
import { Settings } from './pages/settings';
import { ReminderTemplates } from './pages/reminder-templates';
import { Analytics } from './pages/analytics';
import { NotificationSimulator } from './pages/notification-simulator';

// Définir les routes de l'application
const router = createBrowserRouter([
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
        element: <ReminderTemplates />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
      {
        path: 'notification-simulator',
        element: <NotificationSimulator />,
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

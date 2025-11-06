'use client';

import { AuthProvider } from './AuthContext';
import { CycleProvider } from './CycleContext';
import { MealProvider } from './MealContext';
import { AppointmentProvider } from './AppointmentContext';
import { NotificationProvider } from './NotificationContext';
import { ContentProvider } from './ContentContext';
import { ParentProvider } from './ParentContext';
import { ChildAccessProvider } from './ChildAccessContext';

// Root provider that combines all context providers
export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CycleProvider>
          <MealProvider>
            <AppointmentProvider>
              <ContentProvider>
                <ParentProvider>
                  <ChildAccessProvider>
                    {children}
                  </ChildAccessProvider>
                </ParentProvider>
              </ContentProvider>
            </AppointmentProvider>
          </MealProvider>
        </CycleProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

// Export all context hooks for easy access
export { useAuth } from './AuthContext';
export { useCycle } from './CycleContext';
export { useMeal } from './MealContext';
export { useAppointment } from './AppointmentContext';
export { useNotification } from './NotificationContext';
export { useContent } from './ContentContext';
export { useParent } from './ParentContext';
export { useChildAccess } from './ChildAccessContext';
